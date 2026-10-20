/**
 * Hybrid retrieval for the GEAR Assistant.
 *
 * Combines three signals, in priority order:
 *
 *   1. Exact identifier match — a query that is just a GEAR ID resolves to that
 *      record directly. Keyword FULLTEXT cannot do this at all (numeric IDs are
 *      not in any FULLTEXT index), so ID lookups previously returned nothing.
 *
 *   2. Exact / prefix / whole-word / parenthesized-acronym name match, computed
 *      in JS over stored record names. These are pinned above semantic results:
 *      if a user types a record's actual name or acronym, that record wins.
 *
 *   3. Semantic + keyword blend for everything else. Scores from each side are
 *      min-max normalized and blended with a configurable semantic weight
 *      (default 0.85), rather than fused by rank.
 *
 * Why score blending and not reciprocal rank fusion: GEAR's FULLTEXT query runs
 * in BOOLEAN MODE without operators, so it is effectively an OR over query
 * terms and returns many weakly-related rows for a natural-language question.
 * Rank-based fusion treats its top rows as equal in authority to the semantic
 * top rows, which measurably degrades results below semantic-only. Min-max
 * normalization preserves the magnitude information that distinguishes a strong
 * keyword hit from a long tail of incidental ones.
 *
 * Fallback behavior: if the vector index is empty or USAi is unreachable, this
 * degrades to the existing keyword-only ordering rather than failing.
 */

const { embed } = require('./usai-client');
const vectorStore = require('./vector-store');

/** Weight given to the semantic signal; the remainder goes to keyword score. */
const SEMANTIC_WEIGHT = clamp01(Number(process.env.GEAR_SEMANTIC_WEIGHT || 0.85));

/** Candidate depth taken from each retrieval arm before blending. */
const CANDIDATE_DEPTH = Number(process.env.GEAR_SEARCH_CANDIDATE_DEPTH || 50);

/** Minimum cosine similarity for a semantic candidate to be considered. */
const MIN_SEMANTIC_SCORE = Number(process.env.GEAR_MIN_SEMANTIC_SCORE || 0.2);

/** In-process cache of query embeddings, keyed by normalized query text. */
const QUERY_CACHE_MAX = 500;
const queryCache = new Map();

function clamp01(value) {
  if (!Number.isFinite(value)) return 0.85;
  return Math.min(1, Math.max(0, value));
}

/** True when semantic search is enabled by configuration. */
function isSemanticEnabled() {
  return String(process.env.GEAR_SEMANTIC_SEARCH || '').toLowerCase() === 'true';
}

function normalizeQuery(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Embed a query, reusing a cached vector when the same text repeats. */
async function embedQueryCached(query) {
  const key = normalizeQuery(query);
  if (queryCache.has(key)) {
    const hit = queryCache.get(key);
    // Refresh LRU position.
    queryCache.delete(key);
    queryCache.set(key, hit);
    return hit;
  }
  const { vectors } = await embed([query], { inputType: 'search_query' });
  const vector = vectors[0];
  queryCache.set(key, vector);
  if (queryCache.size > QUERY_CACHE_MAX) {
    queryCache.delete(queryCache.keys().next().value);
  }
  return vector;
}

/** Min-max normalize a list of [key, score] pairs onto 0..1. */
function minMaxNormalize(pairs) {
  const out = new Map();
  if (!pairs.length) return out;
  const scores = pairs.map(([, s]) => s);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const span = max - min;
  for (const [key, score] of pairs) {
    // With a single candidate, or all-equal scores, treat it as a full match.
    out.set(key, span > 0 ? (score - min) / span : 1);
  }
  return out;
}

const rowKey = (type, id) => `${type}|${id}`;

/**
 * Score a record name against a query for lexical exactness.
 * Returns 0 when there is no decisive name match.
 */
function nameMatchScore(name, query) {
  const n = String(name || '').toLowerCase().trim();
  const q = normalizeQuery(query);
  if (!n || !q || q.length < 2 || n === 'null') return 0;

  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (n === q) return 5;
  if (new RegExp(`\\(${esc}\\)`, 'i').test(n)) return 4.5; // acronym, e.g. "... (GEAR)"
  if (n.startsWith(q)) return 4;
  if (new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, 'i').test(n)) return 3;
  return 0;
}

/**
 * Hybrid search over GEAR records.
 *
 * @param {object} params
 * @param {string} params.keyword
 * @param {number} [params.limit]
 * @param {Array<object>} params.keywordRows Rows from /api/search/:kw.
 * @param {string[]} [params.entityTypes] Restrict semantic arm to these types.
 * @returns {Promise<{rows:Array<object>, strategy:string, semanticUsed:boolean}>}
 */
async function hybridSearch({ keyword, limit = 25, keywordRows = [], entityTypes }) {
  const rows = Array.isArray(keywordRows) ? keywordRows : [];

  // Index keyword rows so blended results can carry their full payload.
  const byKey = new Map();
  for (const row of rows) {
    byKey.set(rowKey(row.GEAR_Type, String(row.Id)), row);
  }

  const keywordPairs = rows
    .map((row) => [rowKey(row.GEAR_Type, String(row.Id)), Number(row.relevance) || 0])
    .slice(0, CANDIDATE_DEPTH);

  let semanticResults = [];
  let semanticUsed = false;

  if (isSemanticEnabled()) {
    try {
      const vector = await embedQueryCached(keyword);
      semanticResults = await vectorStore.search(vector, {
        limit: CANDIDATE_DEPTH,
        minScore: MIN_SEMANTIC_SCORE,
        entityTypes,
      });
      semanticUsed = semanticResults.length > 0;
    } catch (err) {
      // Semantic search is an enhancement; never let it break retrieval.
      console.error('[hybrid-search] semantic arm unavailable:', err.message);
    }
  }

  if (!semanticUsed) {
    return {
      rows: rows.slice(0, limit),
      strategy: 'keyword_only',
      semanticUsed: false,
    };
  }

  // Record metadata for semantic-only hits, which have no keyword row.
  const semanticMeta = new Map();
  for (const r of semanticResults) {
    semanticMeta.set(rowKey(r.entityType, r.entityId), r);
  }

  const normKeyword = minMaxNormalize(keywordPairs);
  const normSemantic = minMaxNormalize(
    semanticResults.map((r) => [rowKey(r.entityType, r.entityId), r.score])
  );

  const blended = new Map();
  for (const [key, score] of normKeyword) {
    blended.set(key, (blended.get(key) || 0) + (1 - SEMANTIC_WEIGHT) * score);
  }
  for (const [key, score] of normSemantic) {
    blended.set(key, (blended.get(key) || 0) + SEMANTIC_WEIGHT * score);
  }

  // Pin decisive name matches above the blend, ordered by match strength.
  const pinned = [];
  const seen = new Set();
  const nameCandidates = [...new Set([...byKey.keys(), ...semanticMeta.keys()])];
  for (const key of nameCandidates) {
    const meta = byKey.get(key) || semanticMeta.get(key);
    const name = meta.Name != null ? meta.Name : meta.name;
    const score = nameMatchScore(name, keyword);
    if (score > 0) pinned.push([key, score]);
  }
  pinned.sort((a, b) => b[1] - a[1]);

  const ordered = [];
  for (const [key] of pinned) {
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(key);
  }
  for (const [key] of [...blended.entries()].sort((a, b) => b[1] - a[1])) {
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(key);
  }

  const result = ordered.slice(0, limit).map((key) => {
    const kwRow = byKey.get(key);
    if (kwRow) return kwRow;
    // Semantic-only hit: project stored metadata into the shape the keyword
    // endpoint returns, so downstream consumers see one consistent schema.
    const meta = semanticMeta.get(key);
    return {
      Id: meta.entityId,
      Name: meta.name,
      Description: meta.description || '',
      Status: meta.status || '',
      GEAR_Type: meta.entityType,
      GEAR_Type_Display: meta.typeDisplay || '',
      Other: '{}',
      relevance: 0,
      matchedBy: 'semantic',
    };
  });

  return {
    rows: result,
    strategy: pinned.length ? 'exact_name_gate+blend' : 'blend',
    semanticUsed: true,
  };
}

/**
 * Resolve a query that is a bare GEAR identifier to its record.
 *
 * GEAR IDs are numeric and absent from every FULLTEXT index, so a query like
 * "824" matched nothing before. Resolved against stored record identities,
 * which covers all searchable entity types without new SQL.
 *
 * @param {string} keyword
 * @returns {Promise<Array<object>>} Matching rows, or [] when not an ID query.
 */
async function lookupByIdentifier(keyword) {
  const term = String(keyword || '').trim();
  if (!/^\d{1,12}$/.test(term)) return [];

  try {
    const index = await vectorStore.loadIndex();
    return index.meta
      .filter((m) => m.entityId === term)
      .map((m) => ({
        Id: m.entityId,
        Name: m.name,
        Description: m.description || '',
        Status: m.status || '',
        GEAR_Type: m.entityType,
        GEAR_Type_Display: m.typeDisplay || '',
        Other: '{}',
        relevance: 0,
        matchedBy: 'exact_id',
      }));
  } catch (err) {
    console.error('[hybrid-search] identifier lookup failed:', err.message);
    return [];
  }
}

module.exports = {
  hybridSearch,
  lookupByIdentifier,
  nameMatchScore,
  isSemanticEnabled,
  SEMANTIC_WEIGHT,
  CANDIDATE_DEPTH,
};
