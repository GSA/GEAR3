/**
 * Prompt cache backed by gear_log.ai_log in MySQL.
 *
 * Two-level cache architecture:
 *   L1 — in-process LRU (lru-cache v5): up to 200 entries, 10-min TTL.
 *        Zero DB round-trips for hot/repeated prompts.
 *   L2 — MySQL gear_log.ai_log: persistent, 7-day TTL.
 *        FULLTEXT index on Prompt column enables similarity search so
 *        near-duplicate questions can hit the cache too.
 *
 * Schema (gear_log.ai_log):
 *   Id            INT AUTO_INCREMENT
 *   DTG           TIMESTAMP
 *   Event         LONGTEXT    -- JSON: type, prompt_hash, tool_calls, follow_up, turn_index
 *   Prompt        LONGTEXT    -- normalized prompt text (FULLTEXT indexed as ft_prompt)
 *   Response      LONGTEXT    -- AI reply text
 *   Response_Time VARCHAR(100)
 *   Tokens_Used   VARCHAR(100)
 *   Source        ENUM('user','developer','test')      -- where the prompt came from
 *   Correct       ENUM('correct','partial','incorrect') -- human review verdict, NULL until reviewed
 *   Review_Notes  VARCHAR(500)
 *   Reviewed_DTG  TIMESTAMP
 *
 * Source tagging keeps production analytics separable from development noise.
 * It is resolved per write by resolveSource(): a per-message override wins
 * (the "dev!" chat prefix), then an explicit GEAR_AI_LOG_SOURCE, then
 * ENVIRONMENT/NODE_ENV=development implies 'developer', and the default is
 * 'user'. Defaulting to 'user' means a misconfigured server keeps real traffic
 * rather than silently discarding it.
 *
 * Cache lookups are scoped to the same Source so a benchmark or local-dev reply
 * is never served to a production user, and so local prompt-tuning gets a fresh
 * model call instead of a stale cached answer.
 */

const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const asyncMysql = require('mysql2/promise');
const LRU = require('lru-cache');
const fs = require('fs');

// ─── L1: in-process LRU cache ────────────────────────────────────────────────
// Key: "<type>:<hash>", Value: { reply, toolCalls }
const L1_MAX = 200;           // max entries
const L1_TTL_MS = 10 * 60 * 1000; // 10 minutes

const l1 = new LRU({ max: L1_MAX, maxAge: L1_TTL_MS });

// ─── L2: MySQL connection pool ───────────────────────────────────────────────

// Re-use the same SSL certs as the main app.
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: 'gear_log',
  port: 3306,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, '..', 'certs', 'ca.pem')),
    key: fs.readFileSync(path.join(__dirname, '..', 'certs', 'client-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '..', 'certs', 'client-cert.pem')),
  },
};

let pool = null;

function getPool() {
  if (!pool) {
    pool = asyncMysql.createPool(dbConfig);
  }
  return pool;
}

const CACHE_TTL_DAYS = 7;

/**
 * Prefix a developer can type into the chatbot to tag their prompt as
 * development testing, even when running against a production deployment.
 * Stripped from the message before it reaches the model, and never stored.
 */
const DEV_PREFIX_PATTERN = /^\s*dev!\s*/i;

/**
 * True when a chat message carries the explicit developer prefix.
 * @param {string} text
 */
function hasDevPrefix(text) {
  return DEV_PREFIX_PATTERN.test(String(text || ''));
}

/**
 * Remove the developer prefix so the model sees only the real question.
 * @param {string} text
 */
function stripDevPrefix(text) {
  return String(text || '').replace(DEV_PREFIX_PATTERN, '');
}

/**
 * Where the current process's prompts come from.
 *
 * Resolution order:
 *   1. A per-message override (the "dev!" chat prefix) — set by the caller.
 *   2. Explicit GEAR_AI_LOG_SOURCE (benchmarks and scripts set 'test').
 *   3. A development ENVIRONMENT/NODE_ENV implies 'developer'.
 *   4. Default 'user', so an unconfigured production server still records real
 *      traffic rather than silently discarding it.
 *
 * @param {'user'|'developer'|'test'} [override] Per-message source.
 * @returns {'user'|'developer'|'test'}
 */
function resolveSource(override) {
  const forced = String(override || '').toLowerCase().trim();
  if (forced === 'user' || forced === 'developer' || forced === 'test') {
    return forced;
  }
  const explicit = String(process.env.GEAR_AI_LOG_SOURCE || '').toLowerCase().trim();
  if (explicit === 'user' || explicit === 'developer' || explicit === 'test') {
    return explicit;
  }
  const env = String(process.env.ENVIRONMENT || process.env.NODE_ENV || '').toLowerCase();
  if (env === 'development' || env === 'dev' || env === 'local' || env === 'test') {
    return 'developer';
  }
  return 'user';
}

/**
 * Normalize a prompt so minor variations (case, extra spaces, punctuation)
 * map to the same cache key.
 * @param {string} text
 * @returns {string}
 */
function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')   // strip punctuation
    .replace(/\s+/g, ' ')      // collapse whitespace
    .trim();
}

/**
 * SHA-256 hex hash of a normalized prompt — used as a fast indexed lookup.
 * @param {string} normalized
 * @returns {string}
 */
function hashPrompt(normalized) {
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Words carrying no topic information. Removed before similarity scoring so
 * two questions are compared on their SUBJECT, not on shared phrasing.
 */
const STOPWORDS = new Set([
  'a', 'about', 'all', 'am', 'an', 'and', 'any', 'approved', 'are', 'as', 'at',
  'available', 'be', 'been', 'but', 'by', 'can', 'could', 'did', 'do', 'does',
  'for', 'from', 'get', 'give', 'gsa', 'has', 'have', 'how', 'i', 'if', 'in',
  'is', 'it', 'its', 'know', 'list', 'many', 'me', 'much', 'my', 'need', 'of',
  'on', 'or', 'our', 'out', 'please', 'show', 'so', 'some', 'tell', 'that',
  'the', 'their', 'them', 'there', 'these', 'they', 'this', 'those', 'to',
  'us', 'use', 'used', 'using', 'was', 'we', 'were', 'what', 'when', 'where',
  'which', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
]);

/**
 * Minimum share of topic words two prompts must have in common for a cached
 * reply to be reused. Tunable, but do not lower it casually — see below.
 */
const MIN_PROMPT_SIMILARITY = Number(process.env.GEAR_CACHE_MIN_SIMILARITY || 0.7);

/** Topic words of a normalized prompt, stopwords and 1-char tokens removed. */
function topicTokens(normalized) {
  return new Set(
    String(normalized || '')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w))
  );
}

/**
 * Tokens containing a digit — version numbers, release years, record IDs.
 *
 * These are extracted separately and compared exactly, because they are the
 * difference between two genuinely different questions while being only one
 * token apart. "is red hat openjdk 8 approved" and "...openjdk 11 approved"
 * share three of four topic words (similarity 0.75) yet have different correct
 * answers, so word overlap alone cannot separate them.
 */
function numericTokens(normalized) {
  return new Set(
    String(normalized || '')
      .split(/\s+/)
      .filter((w) => /\d/.test(w))
  );
}

function sameSet(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

/**
 * Jaccard similarity of two prompts' topic words (0..1), or 0 when their
 * numeric tokens differ.
 *
 * This is the guard that decides whether a FULLTEXT candidate is genuinely the
 * same question. MySQL's NATURAL LANGUAGE MODE relevance is NOT a similarity
 * measure: it rewards any shared term, and its magnitude depends on corpus-wide
 * term frequency, so it is not comparable between queries. Accepting any
 * positive score let "is google looker approved" reuse the stored answer for
 * "tell me what version of redhat jdk is approved" (score 0.475) purely because
 * both contain "approved" — the reply then discussed the wrong product entirely.
 *
 * Comparing topic words instead makes the subject of the question decisive:
 *   looker/google vs redhat/jdk/version    -> 0.00  (rejected)
 *   openjdk 8 vs openjdk 11                -> 0.00  (rejected: version differs)
 *   "what are the approved software" vs
 *   "approved software"                    -> 1.00  (reused)
 */
function promptSimilarity(a, b) {
  if (!sameSet(numericTokens(a), numericTokens(b))) return 0;
  const ta = topicTokens(a);
  const tb = topicTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / (ta.size + tb.size - shared);
}

/**
 * Look up a cached reply for a prompt.
 * Checks L1 (LRU) first, then L2 (MySQL exact hash + FULLTEXT similarity).
 * Returns { reply, toolCalls } on a hit, or null on a miss.
 *
 * @param {string} prompt  Raw user prompt or search keyword.
 * @param {'chat'|'overview'} type
 * @param {object} [opts]
 * @param {'user'|'developer'|'test'} [opts.source] Per-message source override.
 * @returns {Promise<{reply:string, toolCalls:Array}|null>}
 */
async function lookup(prompt, type, opts = {}) {
  try {
    const normalized = normalize(prompt);
    const hash = hashPrompt(normalized);
    const source = resolveSource(opts.source);

    // ── L1 check ──────────────────────────────────────────────────────────
    // Source is part of the key so a dev/test reply cannot be served to a user.
    const l1Key = `${source}:${type}:${hash}`;
    const l1Hit = l1.get(l1Key);
    if (l1Hit) {
      console.error('[prompt-cache] L1 HIT source=%s type=%s hash=%s', source, type, hash.slice(0, 16));
      return l1Hit;
    }

    // ── L2 check (MySQL) ───────────────────────────────────────────────────
    const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const db = getPool();

    // 1. Exact hash match (fast path — uses prompt_hash in event JSON).
    //    cache_hit rows are excluded: they are audit records of a prior reuse,
    //    and treating them as cache sources would make every hit renew the
    //    entry's DTG, so a cached answer could never age out or be retired.
    const [exactRows] = await db.execute(
      `SELECT Event AS event, Response FROM gear_log.ai_log
       WHERE JSON_UNQUOTE(JSON_EXTRACT(Event, '$.prompt_hash')) = ?
         AND JSON_UNQUOTE(JSON_EXTRACT(Event, '$.type')) = ?
         AND (JSON_EXTRACT(Event, '$.follow_up') IS NULL OR JSON_EXTRACT(Event, '$.follow_up') = false)
         AND (JSON_EXTRACT(Event, '$.cache_hit') IS NULL OR JSON_EXTRACT(Event, '$.cache_hit') = false)
         AND Source = ?
         AND DTG >= ?
         AND Response IS NOT NULL
       ORDER BY DTG DESC
       LIMIT 1`,
      [hash, type, source, cutoff]
    );

    if (exactRows && exactRows.length > 0) {
      const result = _extractResult(exactRows[0]);
      if (result) {
        l1.set(l1Key, result); // populate L1
        console.error('[prompt-cache] L2 exact HIT source=%s type=%s hash=%s', source, type, hash.slice(0, 16));
        return result;
      }
    }

    // 2. FULLTEXT similarity match (catches near-duplicate phrasing).
    //    Requires: ALTER TABLE gear_log.ai_log ADD FULLTEXT INDEX ft_prompt (Prompt);
    //    Candidates are re-checked with promptSimilarity() below, because
    //    FULLTEXT relevance alone is not a safe reuse signal.
    try {
      const [ftRows] = await db.execute(
        `SELECT Event AS event, Prompt, Response,
                MATCH(Prompt) AGAINST (? IN NATURAL LANGUAGE MODE) AS score
         FROM gear_log.ai_log
         WHERE MATCH(Prompt) AGAINST (? IN NATURAL LANGUAGE MODE)
           AND JSON_UNQUOTE(JSON_EXTRACT(Event, '$.type')) = ?
           AND (JSON_EXTRACT(Event, '$.follow_up') IS NULL OR JSON_EXTRACT(Event, '$.follow_up') = false)
           AND (JSON_EXTRACT(Event, '$.cache_hit') IS NULL OR JSON_EXTRACT(Event, '$.cache_hit') = false)
           AND Source = ?
           AND DTG >= ?
           AND Response IS NOT NULL
         ORDER BY score DESC
         LIMIT 5`,
        [normalized, normalized, type, source, cutoff]
      );

      for (const row of ftRows || []) {
        const similarity = promptSimilarity(normalized, row.Prompt);
        if (similarity < MIN_PROMPT_SIMILARITY) {
          console.error(
            '[prompt-cache] L2 FULLTEXT candidate REJECTED similarity=%s (<%s) candidate=%j',
            similarity.toFixed(2), MIN_PROMPT_SIMILARITY, String(row.Prompt).slice(0, 60)
          );
          continue;
        }
        const result = _extractResult(row);
        if (result) {
          l1.set(l1Key, result); // populate L1
          console.error(
            '[prompt-cache] L2 FULLTEXT HIT source=%s type=%s hash=%s score=%s similarity=%s',
            source, type, hash.slice(0, 16), row.score.toFixed(3), similarity.toFixed(2)
          );
          return result;
        }
      }
    } catch (ftErr) {
      // FULLTEXT index may not exist yet — silently skip similarity search.
      if (!ftErr.message.includes('FULLTEXT')) {
        console.error('[prompt-cache] fulltext error:', ftErr.message);
      }
    }

    return null;
  } catch (err) {
    console.error('[prompt-cache] lookup error:', err.message);
    return null;
  }
}

/** Extract { reply, toolCalls } from a DB row. */
function _extractResult(row) {
  let reply = row.Response || null;
  let toolCalls = [];
  try {
    const entry = JSON.parse(row.event);
    if (!reply && entry && entry.reply) reply = entry.reply;
    if (entry && entry.tool_calls) toolCalls = entry.tool_calls;
  } catch (_) {}
  return reply ? { reply, toolCalls } : null;
}

/**
 * Save a prompt + reply to the cache (first-turn, reusable entries).
 *
 * @param {string} prompt
 * @param {'chat'|'overview'} type
 * @param {string} reply
 * @param {Array}  toolCalls
 * @param {object} [metrics]
 * @param {number} [metrics.responseTimeMs]
 * @param {number} [metrics.tokensUsed]
 * @param {'user'|'developer'|'test'} [metrics.source] Per-message source override.
 */
async function save(prompt, type, reply, toolCalls, metrics = {}) {
  return _write(prompt, type, reply, toolCalls, metrics, false);
}

/**
 * Log a prompt + reply for audit purposes (follow-up turns).
 * Identical to save() but marks the entry as a follow-up so it is not
 * returned by cache lookups (follow-ups depend on prior context).
 *
 * @param {string} prompt
 * @param {'chat'|'overview'} type
 * @param {string} reply
 * @param {Array}  toolCalls
 * @param {object} [metrics]
 * @param {number} [metrics.responseTimeMs]
 * @param {number} [metrics.tokensUsed]
 * @param {number} [metrics.turnIndex]  0-based index in conversation
 * @param {'user'|'developer'|'test'} [metrics.source] Per-message source override.
 */
async function log(prompt, type, reply, toolCalls, metrics = {}) {
  return _write(prompt, type, reply, toolCalls, metrics, true);
}

/**
 * Internal writer used by both save() and log().
 */
async function _write(prompt, type, reply, toolCalls, metrics, isFollowUp) {
  try {
    const normalized = normalize(prompt);
    const hash = hashPrompt(normalized);
    const source = resolveSource(metrics.source);
    const db = getPool();

    const event = JSON.stringify({
      type,
      prompt_hash: hash,
      tool_calls: toolCalls || [],
      follow_up: isFollowUp || false,
      turn_index: metrics.turnIndex ?? null,
      cache_hit: metrics.cacheHit || false,
    });

    const responseTime = metrics.responseTimeMs != null
      ? `${metrics.responseTimeMs}ms`
      : null;

    const tokensUsed = metrics.tokensUsed != null
      ? String(metrics.tokensUsed)
      : null;

    await db.execute(
      `INSERT INTO gear_log.ai_log
         (DTG, Event, Prompt, Response, Response_Time, Tokens_Used, Source)
       VALUES (NOW(), ?, ?, ?, ?, ?, ?)`,
      [event, normalized, reply, responseTime, tokensUsed, source]
    );

    // Populate L1 for first-turn entries so the very next identical request
    // is served from memory without touching MySQL.
    if (!isFollowUp) {
      const l1Key = `${source}:${type}:${hash}`;
      l1.set(l1Key, { reply, toolCalls: toolCalls || [] });
    }

    console.error(
      '[prompt-cache] %s source=%s type=%s hash=%s time=%s tokens=%s',
      isFollowUp ? 'LOGGED' : 'SAVED',
      source, type, hash.slice(0, 16), responseTime, tokensUsed
    );
  } catch (err) {
    console.error('[prompt-cache] write error:', err.message);
  }
}

/**
 * Record that a prompt was answered from cache.
 *
 * Cache hits previously returned without logging, so repeat questions — the
 * best signal of what users actually care about — were invisible in analytics
 * and real engagement was undercounted. These rows carry cache_hit=true in
 * Event and no token cost.
 *
 * @param {string} prompt
 * @param {'chat'|'overview'} type
 * @param {string} reply
 * @param {Array}  toolCalls
 * @param {object} [metrics]
 */
async function logCacheHit(prompt, type, reply, toolCalls, metrics = {}) {
  return _write(prompt, type, reply, toolCalls, { ...metrics, cacheHit: true }, true);
}

module.exports = {
  lookup,
  save,
  log,
  logCacheHit,
  normalize,
  resolveSource,
  hasDevPrefix,
  stripDevPrefix,
  promptSimilarity,
};

