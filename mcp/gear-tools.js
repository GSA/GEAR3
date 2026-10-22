/**
 * Shared GEAR tool layer.
 *
 * These tool functions are the single source of truth for how AI features
 * (both the MCP server and the /api/chat orchestrator) read GEAR data.
 *
 * READ-ONLY BY DESIGN. Every tool here is a data-retrieval tool, and no tool
 * may ever mutate GEAR data in response to a user prompt. Writes performed
 * anywhere in the AI layer are confined to the `gear_log` schema (AI
 * interaction logs and the search-vector index) and are enforced at runtime by
 * ./db-guard.js. `gear_acl` (authentication/authorization) and `gear_schema`
 * (GEAR's system of record) must never be written to by this layer. If a new
 * tool ever needs to change GEAR data, it belongs behind GEAR Manager's
 * authenticated, audited endpoints — not here.
 *
 * Design decisions:
 *  - Tools call the existing GEAR /api HTTP endpoints (never raw model-generated
 *    SQL) so all existing controller logic, caching, and business rules apply.
 *  - Only HTTP GET is used (see gearApiGet below); there is deliberately no
 *    POST/PUT/DELETE helper in this module.
 *  - Each tool has a JSON-schema-style definition compatible with the OpenAI
 *    Chat Completions "tools" format, which is also what MCP tool inputSchemas use.
 *  - Results are trimmed/capped to keep token usage reasonable.
 *  - Retrieval is hybrid: keyword FULLTEXT results from /api/search/:kw are
 *    combined with semantic (vector) results and exact identifier/name matching
 *    by ./hybrid-search.js. Set GEAR_SEMANTIC_SEARCH=true to enable the
 *    semantic arm; when disabled or unavailable, behavior falls back to the
 *    keyword-only ordering this layer has always used.
 */

const {
  hybridSearch,
  lookupByIdentifier,
  isSemanticEnabled,
} = require('./hybrid-search');

const GEAR_API_BASE =
  process.env.GEAR_API_BASE || `http://localhost:${process.env.PORT || 3000}/api`;

const DEFAULT_RESULT_LIMIT = 25;

/**
 * Small fetch wrapper with a timeout. Uses the global fetch available in
 * Node.js >= 18 (this project requires >= 20).
 *
 * GET-only on purpose: this is the AI layer's single door to GEAR's API, so
 * hard-coding the method keeps every tool read-only. Do not add a mutating
 * counterpart here.
 *
 * @param {string} path API path beginning with "/"
 * @param {number} timeoutMs
 */
async function gearApiGet(path, timeoutMs = 15000) {
  const url = `${GEAR_API_BASE}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`GEAR API ${path} returned HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Cap an array and note truncation so the model knows there is more. */
function capResults(rows, limit = DEFAULT_RESULT_LIMIT) {
  if (!Array.isArray(rows)) return { rows, truncated: false, total: rows ? 1 : 0 };
  const total = rows.length;
  const capped = rows.slice(0, limit);
  return { rows: capped, truncated: total > limit, total };
}

/**
 * Angular route segment for each GEAR entity type, used to build in-app deep
 * links. Routes are hash-based (see app-routing.module.ts useHash), so links
 * are relative and resolve in any environment while opening in the same tab.
 */
const GEAR_ROUTE_BY_TYPE = {
  System: 'systems',
  FISMA: 'FISMA',
  Technology: 'it_standards',
  Capability: 'capabilities',
  Organization: 'organizations',
  Investment: 'investments',
  Website: 'websites',
  Record: 'records_mgmt',
};

/** Build an in-app GEAR deep link for an entity, or null if the type has none. */
function gearUrlFor(entityType, id) {
  const route = GEAR_ROUTE_BY_TYPE[entityType];
  if (!route || id == null || id === '') return null;
  return `#/${route}/${encodeURIComponent(id)}`;
}

/* ------------------------------------------------------------------ *
 * Tool implementations
 * ------------------------------------------------------------------ */

async function searchGear({ keyword, limit }) {
  if (!keyword || typeof keyword !== 'string') {
    throw new Error('keyword is required');
  }
  const max = limit || DEFAULT_RESULT_LIMIT;

  // Attach an in-app deep link to every hit so answers can cite records the
  // user can click through to, instead of describing how to navigate there.
  const withLinks = (rows) =>
    rows.map((r) => ({ ...r, GearUrl: gearUrlFor(r.GEAR_Type, r.Id) }));

  // A bare GEAR ID is answered deterministically; FULLTEXT cannot match
  // numeric identifiers at all.
  const byId = await lookupByIdentifier(keyword);
  if (byId.length) {
    return { ...capResults(withLinks(byId), max), strategy: 'exact_id' };
  }

  const data = await gearApiGet(`/search/${encodeURIComponent(keyword)}`);
  const keywordRows = Array.isArray(data) ? data : [];

  const { rows, strategy, semanticUsed } = await hybridSearch({
    keyword,
    limit: max,
    keywordRows,
  });

  const capped = capResults(withLinks(rows), max);
  return {
    ...capped,
    strategy,
    semanticUsed,
    // Approval questions need get_software_approval: it reports the exact
    // status and attaches the complete set of approved alternatives, which a
    // search result cannot.
    note:
      'Link each record you cite using its GearUrl in markdown link form. ' +
      'If the user asked whether a software product is approved, call ' +
      'get_software_approval for that product rather than answering from these ' +
      'search results.',
  };
}

/**
 * Find the single business system (GEAR_Type System or FISMA) that best matches
 * a name, using name-aware ranking rather than the DB's loose full-text
 * relevance (which can surface unrelated systems for multi-word queries).
 *
 * When semantic search is enabled, the candidate pool is widened with vector
 * matches so a system can still be found from a description-style phrase
 * ("the system for lease proposals") rather than only its literal name. The
 * name-aware score below always takes precedence over semantic rank.
 *
 * Returns the best match plus a few alternates so the model can disambiguate.
 */
async function findSystem({ name }) {
  if (!name || typeof name !== 'string') {
    throw new Error('name is required');
  }
  const term = name.toLowerCase().trim();
  const data = await gearApiGet(`/search/${encodeURIComponent(name)}`);
  const keywordRows = Array.isArray(data) ? data : [];

  let rows = keywordRows;
  if (isSemanticEnabled()) {
    const hybrid = await hybridSearch({
      keyword: name,
      limit: 50,
      keywordRows,
      entityTypes: ['System', 'FISMA'],
    });
    rows = hybrid.rows;
  }

  const systems = rows.filter(
    (r) => r.GEAR_Type === 'System' || r.GEAR_Type === 'FISMA'
  );

  const score = (r) => {
    const n = String(r.Name || '').toLowerCase();
    if (!n) return 0;
    if (n === term) return 5;
    if (n.startsWith(term)) return 4;
    // whole-word match
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, 'i').test(n)) return 3;
    if (n.includes(term)) return 2;
    // term may be an acronym inside parentheses, e.g. "... (GEAR)"
    if (new RegExp(`\\(${esc}\\)`, 'i').test(n)) return 4;
    return 1;
  };

  const ranked = systems
    .map((r, i) => ({ r, i, s: score(r) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((e) => ({
      Id: e.r.Id,
      Name: e.r.Name,
      Type: e.r.GEAR_Type,
      Status: e.r.Status,
    }));

  return {
    bestMatch: ranked[0] || null,
    alternates: ranked.slice(1, 5),
    totalSystemMatches: ranked.length,
  };
}

async function getSystem({ id }) {
  if (!id) throw new Error('id is required');
  const data = await gearApiGet(`/systems/get/${encodeURIComponent(id)}`);
  return data;
}

async function getSystemRelated({ id, relation }) {
  if (!id) throw new Error('id is required');
  const allowed = [
    'subsystems',
    'capabilities',
    'investments',
    'records',
    'websites',
    'technologies',
    'time',
  ];
  if (!allowed.includes(relation)) {
    throw new Error(`relation must be one of: ${allowed.join(', ')}`);
  }
  const data = await gearApiGet(
    `/systems/get/${encodeURIComponent(id)}/${relation}`
  );

  // The technologies endpoint returns ~40 fields per row, which is noisy and
  // pushes weak models toward hallucinating. Project to just the fields that
  // matter for answering "what software does this system use".
  if (relation === 'technologies' && Array.isArray(data)) {
    const slim = data.map((t) => ({
      Name: t.SoftwareReleaseName || t.Name,
      Status: t.Status,
      StandardType: t.StandardType,
      DeploymentType: t.DeploymentType,
      Category: t.Category,
      ComplianceStatus: t.ComplianceStatus,
    }));
    return capResults(slim, 100);
  }

  return capResults(data);
}

async function listCapabilities() {
  const data = await gearApiGet('/capabilities');
  return capResults(data, 100);
}

async function listInvestments() {
  const data = await gearApiGet('/investments');
  return capResults(data, 100);
}

async function listOrganizations() {
  const data = await gearApiGet('/organizations');
  return capResults(data, 200);
}

async function listItStandards() {
  const data = await gearApiGet('/it_standards');
  return capResults(data, 100);
}

async function listWebsites() {
  const data = await gearApiGet('/websites');
  return capResults(data, 100);
}

/** Project a records-schedule row down to the fields useful for retention answers. */
function slimRecordSchedule(r) {
  return {
    Record_Item_Title: r.Record_Item_Title,
    Description: r.Description,
    Retention_Instructions: r.Retention_Instructions,
    FY_Retention_Years: r.FY_Retention_Years,
    Type_Disposition: r.Type_Disposition,
    Disposition_Notes: r.Disposition_Notes,
    Legal_Disposition_Authority: r.Legal_Disposition_Authority,
    RG: r.RG,
    GSA_Number: r.GSA_Number,
    Record_Status: r.Record_Status,
    PII: r.PII,
    CUI: r.CUI,
  };
}

/**
 * Get the records schedules a business system must abide by. Looks up the
 * records associated with a system (via /systems/get/:id/records), then fetches
 * each full records-schedule detail (via /records/get/:id) so the result
 * contains the schedule name (Record_Item_Title), Description, and
 * Retention_Instructions. Always obtain the system id from find_system first.
 */
async function getSystemRecordsSchedules({ id, limit }) {
  if (!id) throw new Error('id is required');
  const related = await gearApiGet(
    `/systems/get/${encodeURIComponent(id)}/records`
  );
  const rows = Array.isArray(related) ? related : [];

  // Collect the distinct record-schedule IDs mapped to this system.
  const recordIds = [];
  for (const row of rows) {
    const rid = row.obj_records_Id;
    if (rid != null && !recordIds.includes(rid)) recordIds.push(rid);
  }

  const cap = limit || 50;
  const idsToFetch = recordIds.slice(0, cap);

  // Fetch each schedule's full detail. /records/get/:id returns an array of
  // matching rows (usually one), so we flatten.
  const schedules = [];
  for (const rid of idsToFetch) {
    try {
      const detail = await gearApiGet(`/records/get/${encodeURIComponent(rid)}`);
      const detailRows = Array.isArray(detail) ? detail : detail ? [detail] : [];
      for (const d of detailRows) schedules.push(slimRecordSchedule(d));
    } catch (err) {
      schedules.push({ Record_Item_Title: null, error: `Could not load record ${rid}: ${err.message}` });
    }
  }

  return {
    rows: schedules,
    truncated: recordIds.length > idsToFetch.length,
    total: recordIds.length,
  };
}

/** Project an IT standard row down to the fields useful for approval answers. */
function slimItStandard(t) {
  const id = t.ID != null ? t.ID : t.Id;
  return {
    Id: id,
    Name: t.SoftwareReleaseName || t.Name,
    Status: t.Status,
    Category: t.Category,
    StandardType: t.StandardType,
    ManufacturerName: t.ManufacturerName,
    SoftwareProductName: t.SoftwareProductName,
    ComplianceStatus: t.ComplianceStatus,
    ApprovalExpirationDate: t.ApprovalExpirationDate,
    EndOfLifeDate: t.EndOfLifeDate,
    // Deep link to this record in the GEAR portal. Relative + hash-routed so it
    // resolves correctly in every environment and opens in the same tab.
    GearUrl: gearUrlFor('Technology', id),
  };
}

/**
 * Match IT standard rows against a product name query, best match first.
 *
 * Matching is token-based (every word of the query must appear somewhere in the
 * product's name, product name, or manufacturer), not a single substring.
 * Inventory names interleave manufacturer, product, and version — e.g. "Google
 * Google Cloud Platform Looker 22 (22.18)" — so a substring search for "Google
 * Looker" finds nothing even though the product is present. That false negative
 * made the assistant report a Denied product as never submitted for review.
 *
 * Ordering puts rows whose own name matches the query ahead of rows that
 * matched only on manufacturer, then prefers usable statuses. Searching
 * "Tableau" otherwise surfaced "Logshark" — a Tableau Software product whose
 * name lacks the word — as the headline match, which also drove the wrong TRM
 * category when selecting alternatives.
 *
 * @returns {{matches: Array<object>, term: string}}
 */
function matchItStandards(rows, name) {
  const term = String(name).toLowerCase().trim();
  const tokens = term.split(/\s+/).filter((w) => w.length > 1);

  const haystack = (t) =>
    [
      t.SoftwareReleaseName || t.Name || '',
      t.SoftwareProductName || '',
      t.ManufacturerName || '',
    ]
      .join(' ')
      .toLowerCase();

  // Exact substring first (highest confidence), then all-tokens-present.
  const substringMatches = rows.filter((t) => haystack(t).includes(term));
  const matches = substringMatches.length
    ? substringMatches
    : rows.filter((t) => {
        if (!tokens.length) return false;
        const h = haystack(t);
        return tokens.every((w) => h.includes(w));
      });

  const nameHaystack = (t) =>
    [t.SoftwareReleaseName || t.Name || '', t.SoftwareProductName || '']
      .join(' ')
      .toLowerCase();
  const nameMatches = (t) => {
    const h = nameHaystack(t);
    return h.includes(term) || (tokens.length > 0 && tokens.every((w) => h.includes(w)));
  };

  // Prefer non-retired, then Approved first, for readability.
  const rank = (s) => {
    const status = (s.Status || '').toLowerCase();
    if (status === 'approved') return 0;
    if (status === 'pilot' || status === 'proposed') return 1;
    if (status === 'denied' || status === 'exception') return 2;
    if (status === 'retired') return 4;
    return 3;
  };

  const sorted = [...matches].sort((a, b) => {
    const byName = (nameMatches(a) ? 0 : 1) - (nameMatches(b) ? 0 : 1);
    if (byName !== 0) return byName;
    return rank(a) - rank(b);
  });

  return { matches: sorted, term };
}

/**
 * Look up an IT standard (software product) in the IT Standards List and report
 * its approval status at GSA.
 */
async function getSoftwareApproval({ name, limit }) {
  if (!name || typeof name !== 'string') {
    throw new Error('name is required');
  }
  const data = await gearApiGet('/it_standards');
  const rows = Array.isArray(data) ? data : [];

  const { matches } = matchItStandards(rows, name);

  const capped = capResults(matches.map(slimItStandard), limit || 15);

  // When the product exists but is not usable, attach approved alternatives
  // from GEAR itself. Left to its own knowledge the model recommends plausible
  // market leaders that are Denied, Retired, or absent from GEAR entirely
  // (observed for Looker: Power BI = Denied, Qlik = Retired, Sisense = not in
  // inventory), which is worse than giving no alternatives at all.
  const best = capped.rows[0];
  const bestStatus = String((best && best.Status) || '').toLowerCase();
  const notUsable = best && ['denied', 'retired', 'exception'].includes(bestStatus);

  let alternatives = [];
  let alternativesBasis = null;
  if (notUsable) {
    const matchedIds = new Set(matches.map((m) => String(m.ID != null ? m.ID : m.Id)));
    const rawBest = pickCategorizedReference(matches) || best;
    const result = await findApprovedAlternatives(rawBest, rows, matchedIds);
    alternatives = result.alternatives;
    alternativesBasis = result.basis;
  }

  let note;
  if (capped.total === 0) {
    note =
      `No IT standard matching "${name}" was found in the inventory. Tell the user it has not been ` +
      `submitted for review (SRR); do not state an approval status and do not recommend specific ` +
      `alternatives unless you call list_approved_software to get real ones. If the user then asks ` +
      `for product recommendations or an alternatives analysis, refer them to the Enterprise ` +
      `Architecture team at [ea@gsa.gov](mailto:ea@gsa.gov) instead of naming products yourself.`;
  } else if (notUsable) {
    note =
      `"${best.Name}" has Status "${best.Status}" and is NOT approved for use. ` +
      `Link to its GEAR record using the markdown link [${best.Name}](${best.GearUrl}) so the user can ` +
      `review the listing, and point them to the IT Standards team at ` +
      `[it-standards@gsa.gov](mailto:it-standards@gsa.gov) for questions about the decision. ` +
      (alternatives.length
        ? `Then recommend approved alternatives from "approvedAlternatives" below (selected by ` +
          `${alternativesBasis}) - these are ALL the Approved products GEAR classifies in the same ` +
          `TRM categories, so present them all rather than a subset, each linked with its own GearUrl. ` +
          `Do NOT recommend any product that is not in that list; products you may think of from general ` +
          `knowledge are frequently Denied, Retired, or absent from GEAR.`
        : `No Approved product with similar capability was found, so say that no approved alternative exists ` +
          `in the inventory rather than naming products from your own knowledge.`) +
      ` If the user says these alternatives will not meet their needs or asks for options outside the ` +
      `inventory, refer them to the Enterprise Architecture team at [ea@gsa.gov](mailto:ea@gsa.gov) ` +
      `for alternatives analysis; do not name products from general knowledge.`;
  } else {
    note =
      `These are the inventory entries matching "${name}". Report the Status exactly as given, and link ` +
      `each product to its GEAR record using its GearUrl in markdown link form.`;
  }

  return {
    ...capped,
    ...(notUsable ? { approvedAlternatives: alternatives } : {}),
    itStandardsContact: 'it-standards@gsa.gov',
    enterpriseArchitectureContact: 'ea@gsa.gov',
    note,
  };
}

/**
 * Choose which matched row to classify by.
 *
 * Prefer the best match that actually carries a TRM Category: many inventory
 * rows have none (e.g. "Salesforce Tableau Reader 2026.x"), and classifying by
 * an uncategorized row sends alternatives down the semantic fallback, which for
 * that row matched "File Manager and Viewer" and offered WinZip and Acrobat as
 * Tableau alternatives.
 */
function pickCategorizedReference(matches) {
  return (
    matches.find((m) => String(m.Category || '').trim().length > 0) || matches[0]
  );
}

/**
 * Find Approved software in GEAR with capability similar to a named product,
 * whatever that product's own status is.
 *
 * Separate from getSoftwareApproval, which only attaches alternatives when the
 * searched product is unusable. A user asking "what's an alternative to
 * Tableau?" is asking a capability question, not a status question, and
 * Tableau is Approved — so that path returned nothing and the assistant fell
 * back to declining. Peers come from the product's own deepest TRM category,
 * so they are GEAR's classification rather than the model's opinion.
 */
async function findSimilarApprovedSoftware({ name, limit }) {
  if (!name || typeof name !== 'string') {
    throw new Error('name is required');
  }
  const data = await gearApiGet('/it_standards');
  const rows = Array.isArray(data) ? data : [];

  const { matches } = matchItStandards(rows, name);
  if (!matches.length) {
    return {
      rows: [],
      total: 0,
      truncated: false,
      searchedFor: name,
      enterpriseArchitectureContact: 'ea@gsa.gov',
      note:
        `No IT standard matching "${name}" was found in the inventory, so GEAR has no classification ` +
        `to find peers from. Say the product is not in the inventory and do not name alternatives from ` +
        `your own knowledge. Offer to look up a different product, and refer the user to the Enterprise ` +
        `Architecture team at [ea@gsa.gov](mailto:ea@gsa.gov) for an alternatives analysis.`,
    };
  }

  const reference = pickCategorizedReference(matches);
  const referenceName = reference.SoftwareReleaseName || reference.Name || name;
  const referenceStatus = reference.Status || 'Unknown';

  // Exclude every row that matched the user's product so its own versions are
  // not offered back as alternatives to itself.
  const matchedIds = new Set(
    matches.map((m) => String(m.ID != null ? m.ID : m.Id))
  );
  const { alternatives, basis } = await findApprovedAlternatives(
    reference,
    rows,
    matchedIds
  );

  const capped = capResults(alternatives, limit || 40);

  // The note must not claim completeness when the list was capped: the model
  // is told elsewhere that authoritative lists are exhaustive, and saying so
  // about a truncated list would make it assert something false.
  const completeness = capped.truncated
    ? `These are ${capped.rows.length} of the ${capped.total} Approved products GEAR classifies ` +
      `alongside "${referenceName}" (by ${basis}). Say that more exist than you are listing.`
    : `These are ALL the Approved products GEAR classifies alongside "${referenceName}" (by ${basis}). ` +
      `This is the complete, authoritative peer set - present every row.`;

  return {
    ...capped,
    searchedFor: name,
    referenceProduct: { Name: referenceName, Status: referenceStatus },
    basis,
    enterpriseArchitectureContact: 'ea@gsa.gov',
    note: capped.total
      ? `${completeness} Link each product with its own GearUrl in markdown link form, and never add ` +
        `a product that is not in "rows", including from your own knowledge of the market. Mention ` +
        `that "${referenceName}" itself is ${referenceStatus} in GEAR. If the user says none of these ` +
        `fit, refer them to the Enterprise Architecture team at [ea@gsa.gov](mailto:ea@gsa.gov) for a ` +
        `formal alternatives analysis.`
      : `GEAR has no other Approved products classified alongside "${referenceName}". Say so plainly ` +
        `rather than naming products from your own knowledge, and refer the user to the Enterprise ` +
        `Architecture team at [ea@gsa.gov](mailto:ea@gsa.gov) for an alternatives analysis.`,
  };
}

/**
 * Cached map of TRM category name (lower-cased) to its hierarchy Level, so
 * alternatives can be drawn from the most specific category a product carries.
 */
let trmLevelsCache = null;

async function getTrmLevels() {
  if (trmLevelsCache) return trmLevelsCache;
  const rows = await gearApiGet('/trm');
  const map = new Map();
  for (const r of Array.isArray(rows) ? rows : []) {
    const name = String(r.Name || '').trim().toLowerCase();
    if (name) map.set(name, Number(r.Level) || 0);
  }
  trmLevelsCache = map;
  return map;
}

/**
 * Find every Approved IT standard that shares a TRM category with the given
 * product, so alternatives are complete rather than a sample.
 *
 * Categories are tried deepest-first. A product typically carries one category
 * per TRM level — Tableau Desktop is in "Business Intelligence Platforms"
 * (Level 3), "Business Intelligence and Data Warehouse Platforms" (Level 2),
 * and "Information Management Technologies" (Level 1) — and matching on all of
 * them at once returns everything in the broad Domain (60 products, including
 * unrelated records and search tools) rather than the product's true peers (14).
 * Broader levels are used only when the deeper one yields nothing.
 *
 * Two paths, in order:
 *  1. The product's own TRM categories, read from its Category field (which
 *     /api/it_standards derives from TRM mappings).
 *  2. When the product has no TRM mapping at all — true for Looker and many
 *     others — the TRM categories whose descriptions are semantically closest
 *     to the product, then every Approved product mapped to those categories.
 *
 * Path 2 matters because the earlier implementation fell back to raw product
 * similarity, which returned an arbitrary top-N of loosely related software and
 * silently omitted genuine peers such as "Strategy One Workstation".
 *
 * @returns {Promise<{alternatives:Array<object>, basis:string|null}>}
 */
async function findApprovedAlternatives(product, allRows, excludeIds) {
  const isApproved = (t) => String(t.Status || '').toLowerCase() === 'approved';
  const idOf = (t) => String(t.ID != null ? t.ID : t.Id);

  // ── Path 1: the product's own TRM categories, most specific first ─────────
  const ownCategories = String(product.Category || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  if (ownCategories.length) {
    let levels = new Map();
    try {
      levels = await getTrmLevels();
    } catch (err) {
      // Without levels, fall back to treating all of the product's categories
      // as one tier rather than failing outright.
      console.error('[gear-tools] TRM level lookup failed:', err.message);
    }

    // Group the product's categories by depth, deepest first.
    const byLevel = new Map();
    for (const c of ownCategories) {
      const level = levels.get(c.toLowerCase()) || 0;
      if (!byLevel.has(level)) byLevel.set(level, []);
      byLevel.get(level).push(c);
    }
    const tiers = [...byLevel.keys()].sort((a, b) => b - a);

    for (const level of tiers) {
      const tierCategories = byLevel.get(level);
      const wanted = tierCategories.map((c) => c.toLowerCase());
      const matched = allRows.filter((t) => {
        if (!isApproved(t) || excludeIds.has(idOf(t))) return false;
        const cats = String(t.Category || '')
          .split(',')
          .map((c) => c.trim().toLowerCase());
        return cats.some((c) => wanted.includes(c));
      });
      if (matched.length) {
        return {
          alternatives: matched.map(slimItStandard),
          basis: `shared TRM categor${tierCategories.length > 1 ? 'ies' : 'y'} (${tierCategories.join(', ')})`,
        };
      }
    }
  }

  // ── Path 2: semantically nearest TRM categories ───────────────────────────
  if (!isSemanticEnabled()) return { alternatives: [], basis: null };
  try {
    const { embed } = require('./usai-client');
    const vectorStore = require('./vector-store');

    // Describe the product's capability, not just its brand name: the
    // description carries the words ("reports and dashboards") that match a
    // TRM category, while a brand name alone matches the same vendor's
    // unrelated products.
    const query = [product.Name, product.SoftwareProductName, product.Description]
      .filter(Boolean)
      .join(' ')
      .slice(0, 1200);
    if (!query.trim()) return { alternatives: [], basis: null };

    const { vectors } = await embed([query], { inputType: 'search_query' });
    const trmHits = await vectorStore.search(vectors[0], {
      limit: 8,
      minScore: 0.3,
      entityTypes: ['TRM'],
    });
    if (!trmHits.length) return { alternatives: [], basis: null };

    // Keep only categories close to the best match. Absolute cosine scores sit
    // in a narrow band here (~0.32-0.39), so a flat floor admits weak matches:
    // for Looker the 7th-ranked category was "Search Engines", which would have
    // offered Google Search and Westlaw as BI alternatives.
    const topScore = trmHits[0].score;
    const nearest = trmHits.filter((h) => h.score >= topScore * 0.95);

    const seen = new Set();
    const alternatives = [];
    const usedCategories = [];
    for (const hit of nearest) {
      let related;
      try {
        related = await gearApiGet(
          `/trm/get/relatedITStandards/${encodeURIComponent(hit.entityId)}`
        );
      } catch (err) {
        continue;
      }
      const relatedRows = Array.isArray(related) ? related : [];
      const approved = relatedRows.filter(
        (t) => isApproved(t) && !excludeIds.has(idOf(t)) && !seen.has(idOf(t))
      );
      if (!approved.length) continue;
      usedCategories.push(hit.name);
      for (const t of approved) {
        seen.add(idOf(t));
        alternatives.push({ ...slimItStandard(t), TrmCategory: hit.name });
      }
    }

    return {
      alternatives,
      basis: usedCategories.length
        ? `the TRM categor${usedCategories.length > 1 ? 'ies' : 'y'} closest to this product (${usedCategories.join(', ')})`
        : null,
    };
  } catch (err) {
    console.error('[gear-tools] alternatives lookup failed:', err.message);
    return { alternatives: [], basis: null };
  }
}

/**
 * List APPROVED software in the IT Standards List, optionally filtered by a
 * category keyword (case-insensitive substring against the Category field).
 * Useful for suggesting approved alternatives with similar capability.
 */
async function listApprovedSoftware({ category, limit }) {
  const data = await gearApiGet('/it_standards');
  const rows = Array.isArray(data) ? data : [];
  const cat = (category || '').toLowerCase().trim();

  const approved = rows.filter((t) => {
    const isApproved = (t.Status || '').toLowerCase() === 'approved';
    if (!isApproved) return false;
    if (!cat) return true;
    return (t.Category || '').toLowerCase().includes(cat);
  });

  return capResults(approved.map(slimItStandard), limit || 40);
}

/* ------------------------------------------------------------------ *
 * Technology Reference Model (TRM)
 * ------------------------------------------------------------------ */

/** Project a TRM category row down to the fields useful for the model. */
function slimTrmCategory(t) {
  return {
    Id: t.Id,
    Name: t.Name,
    Area: t.Area,
    Domain: t.Domain,
    Level: t.Level,
    Type: t.Type,
    ParentId: t.ParentId,
    Description: t.Description,
  };
}

/**
 * Find Technology Reference Model categories matching a technology type or
 * concept (e.g. "low code/no code", "web server", "container orchestration").
 *
 * Ranking prefers exact and acronym-style name matches, then partial name
 * matches, then description matches, so "LCNC" and "low code" both resolve to
 * the "Low-code/no-code (LCNC) Platform" category.
 */
async function findTrmCategory(args = {}) {
  // The orchestrator drives tool use through a prompted JSON protocol with no
  // schema validation, so models sometimes invent a plausible parameter name.
  // Accept the common aliases rather than erroring and falling back to keyword
  // search, which produces wrong category listings.
  const name =
    args.name || args.technology_type || args.technologyType ||
    args.category || args.type || args.keyword;
  if (!name || typeof name !== 'string') {
    throw new Error('name is required');
  }
  const data = await gearApiGet('/trm');
  const rows = Array.isArray(data) ? data : [];

  const term = name.toLowerCase().trim();
  // Compare ignoring separators so "low code", "low-code" and "lowcode" match.
  const loose = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  // TRM category names are singular ("Programming Language"), but users ask in
  // the plural. Without this, "programming languages" misses that category and
  // falls through to a weaker description match on a different one.
  const singular = (s) =>
    String(s || '')
      .split(/\s+/)
      .map((w) => w.replace(/(?:ies)$/, 'y').replace(/(?:sses|shes|ches|xes)$/, (m) => m.slice(0, -2)).replace(/(?<=[a-z]{2})s$/, ''))
      .join(' ');
  const looseTerm = loose(term);
  const looseSingularTerm = loose(singular(term));

  const score = (t) => {
    const n = String(t.Name || '').toLowerCase();
    const ln = loose(n);
    const lsn = loose(singular(n));
    const d = String(t.Description || '').toLowerCase();
    if (!n) return 0;
    if (n === term || ln === looseTerm) return 6;
    if (lsn === looseSingularTerm) return 6;
    // acronym in parentheses, e.g. "Low-code/no-code (LCNC) Platform"
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\(${esc}\\)`, 'i').test(n)) return 5;
    if (ln.startsWith(looseTerm) || lsn.startsWith(looseSingularTerm)) return 4;
    if (looseTerm.length >= 3 && (ln.includes(looseTerm) || lsn.includes(looseSingularTerm))) return 3;
    if (d.includes(term)) return 1;
    return 0;
  };

  const ranked = rows
    .map((t, i) => ({ t, i, s: score(t) }))
    .filter((e) => e.s > 0)
    // Prefer the most specific (deepest) category when scores tie, since
    // Level 3 Categories carry the actual software mappings.
    .sort((a, b) => b.s - a.s || Number(b.t.Level || 0) - Number(a.t.Level || 0) || a.i - b.i)
    .map((e) => slimTrmCategory(e.t));

  return {
    bestMatch: ranked[0] || null,
    alternates: ranked.slice(1, 5),
    totalMatches: ranked.length,
    // The orchestrator's prompted tool protocol gives the model no enforced
    // control flow, so state the required next call in the payload itself.
    nextStep: ranked.length
      ? `Now call get_trm_software with id="${ranked[0].Id}"${
          ranked[0].Type === 'Area' ? ' and includeChildren=true' : ''
        } to get the authoritative software list. Do not use search_gear for this.`
      : 'No TRM category matched. Tell the user GEAR has no TRM category for this technology type; do not substitute keyword search results as a category listing.',
  };
}

/**
 * Answer "what <kind of> software is in the inventory" in a single call.
 *
 * Resolves a technology type to its TRM category and returns that category's
 * authoritative software list together. This is deliberately one tool rather
 * than a find-then-get pair: the orchestrator drives tool use through a
 * prompted JSON protocol with no enforced control flow, so a two-step chain
 * lets the model substitute a keyword search for the second step and report
 * products that GEAR does not actually classify under the category.
 */
async function listSoftwareByCategory(args = {}) {
  const type =
    args.type || args.name || args.technology_type || args.technologyType ||
    args.category || args.keyword;
  if (!type || typeof type !== 'string') {
    throw new Error('type is required (the kind of software, e.g. "low code/no code")');
  }

  const match = await findTrmCategory({ name: type });
  if (!match.bestMatch) {
    return {
      requestedType: type,
      trmCategory: null,
      rows: [],
      total: 0,
      truncated: false,
      note:
        `GEAR has no Technology Reference Model category matching "${type}". ` +
        `Tell the user that GEAR does not classify software under that technology type, ` +
        `and do NOT present keyword search results as if they were an authoritative category listing.`,
    };
  }

  const result = await getTrmSoftware({
    id: match.bestMatch.Id,
    // TRM Areas (Level 2) hold their software on child Categories (Level 3).
    includeChildren: match.bestMatch.Type === 'Area',
    limit: args.limit,
  });

  return {
    requestedType: type,
    ...result,
    alternateCategories: match.alternates,
  };
}

/**
 * Get the software products / IT standards that GEAR authoritatively maps to a
 * Technology Reference Model category, by category id.
 *
 * Reads GEAR's curated technology-to-TRM mappings rather than inferring
 * membership from names or descriptions, so results cannot include products
 * that are not actually classified under that category.
 *
 * TRM categories are hierarchical (Domain > Area > Category). Requesting an
 * Area also returns the software mapped to its child Categories when
 * includeChildren is true.
 */
async function getTrmSoftware(args = {}) {
  const id = args.id != null && args.id !== '' ? args.id : args.trmId;
  const includeChildren = args.includeChildren === true || args.includeChildren === 'true';
  const limit = args.limit;
  if (id == null || id === '') throw new Error('id is required');

  const detail = await gearApiGet(`/trm/get/${encodeURIComponent(id)}`);
  const detailRows = Array.isArray(detail) ? detail : detail ? [detail] : [];
  const category = detailRows.length ? slimTrmCategory(detailRows[0]) : null;
  if (!category) {
    throw new Error(`No TRM category found with id ${id}`);
  }

  const idsToFetch = [{ id: String(id), name: category.Name }];

  if (includeChildren) {
    const all = await gearApiGet('/trm');
    const allRows = Array.isArray(all) ? all : [];
    for (const row of allRows) {
      if (String(row.ParentId) === String(id)) {
        idsToFetch.push({ id: String(row.Id), name: row.Name });
      }
    }
  }

  const seen = new Set();
  const software = [];
  const errors = [];
  for (const entry of idsToFetch) {
    try {
      const related = await gearApiGet(
        `/trm/get/relatedITStandards/${encodeURIComponent(entry.id)}`
      );
      const relatedRows = Array.isArray(related) ? related : [];
      for (const t of relatedRows) {
        const key = String(t.ID != null ? t.ID : t.Id);
        if (seen.has(key)) continue;
        seen.add(key);
        software.push({ ...slimItStandard(t), TrmCategory: entry.name });
      }
    } catch (err) {
      errors.push({ trmCategory: entry.name, error: err.message });
    }
  }

  // Approved first so usable options lead; Retired last.
  const rank = (s) => {
    const status = (s.Status || '').toLowerCase();
    if (status === 'approved') return 0;
    if (status === 'pilot' || status === 'proposed') return 1;
    if (status === 'denied' || status === 'exception') return 2;
    if (status === 'retired') return 4;
    return 3;
  };
  software.sort((a, b) => rank(a) - rank(b));

  const capped = capResults(software, limit || 100);
  return {
    trmCategory: category,
    categoriesSearched: idsToFetch.map((e) => e.name),
    ...capped,
    // State the completeness guarantee explicitly: the model must not pad this
    // list with products it believes are related.
    note:
      `This is the complete and authoritative list of IT standards mapped to the TRM ` +
      `categor${idsToFetch.length > 1 ? 'ies' : 'y'} ${idsToFetch.map((e) => `"${e.name}"`).join(', ')} ` +
      `in GEAR (${software.length} total). Do not add any other products to this list.`,
    ...(errors.length ? { errors } : {}),
  };
}

/* ------------------------------------------------------------------ *
 * Tool registry: definitions + handlers
 * ------------------------------------------------------------------ */

/**
 * Each entry: { name, description, parameters (JSON schema), handler }.
 * `parameters` is used directly as the OpenAI tool "parameters" and as the
 * MCP tool "inputSchema".
 */
const tools = [
  {
    name: 'search_gear',
    description:
      'Search across all GEAR entities (systems, subsystems, FISMA systems, technologies/IT standards, capabilities, organizations, investments, websites, and TRM). Combines keyword matching with semantic (meaning-based) matching, so plain-English descriptions work as well as exact names - e.g. "system for tracking help desk tickets" will find relevant systems even if they do not contain those words. A bare numeric GEAR ID returns that exact record. Returns matching items with their name, description, status, and GEAR_Type. Use this first when the user asks about anything by name, keyword, or description.',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description:
            'The search term(s), a natural-language description of what is wanted, or a GEAR ID.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 25).',
        },
      },
      required: ['keyword'],
    },
    handler: searchGear,
  },
  {
    name: 'find_system',
    description:
      'Find the single BUSINESS SYSTEM (GEAR_Type System or FISMA) that best matches a name, with name-aware ranking. Use this (not search_gear) whenever the user asks about a business system by name - for example to answer what software/technologies a system uses. Returns { bestMatch, alternates, totalSystemMatches }. Use bestMatch.Id for follow-up calls. If bestMatch does not actually match the requested name, pick the correct one from alternates or tell the user it was not found.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The business system name or acronym to find (e.g. "eOffer", "GEAR").',
        },
      },
      required: ['name'],
    },
    handler: findSystem,
  },
  {
    name: 'get_system_software',
    description:
      'Get the list of software products / IT standards (technologies) recorded for a business system, by its GEAR ID. This is the authoritative list of software a system uses. Always obtain the id from find_system first.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The GEAR ID of the business system.' },
      },
      required: ['id'],
    },
    handler: ({ id }) => getSystemRelated({ id, relation: 'technologies' }),
  },
  {
    name: 'get_system',
    description:
      'Get the full detail record for a single GEAR system or FISMA system by its GEAR ID (obtained from search_gear results, field "Id").',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The GEAR ID of the system.' },
      },
      required: ['id'],
    },
    handler: getSystem,
  },
  {
    name: 'get_system_related',
    description:
      'Get records related to a system: subsystems, capabilities, investments, records, websites, technologies, or time (SysTIME).',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The GEAR ID of the system.' },
        relation: {
          type: 'string',
          enum: [
            'subsystems',
            'capabilities',
            'investments',
            'records',
            'websites',
            'technologies',
            'time',
          ],
          description: 'Which related collection to fetch.',
        },
      },
      required: ['id', 'relation'],
    },
    handler: getSystemRelated,
  },
  {
    name: 'get_system_records_schedules',
    description:
      "Get the records schedules a BUSINESS SYSTEM must abide by, by its GEAR ID. Looks up the records associated with the system and returns each records schedule's name (Record_Item_Title), Description, Retention_Instructions, retention period (FY_Retention_Years), and disposition. Use this to answer questions about which records schedules apply to a system, how long a type of record must be retained, and what to do with it afterward. Always obtain the id from find_system first.",
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The GEAR ID of the business system.' },
        limit: {
          type: 'number',
          description: 'Maximum number of records schedules to fetch (default 50).',
        },
      },
      required: ['id'],
    },
    handler: getSystemRecordsSchedules,
  },
  {
    name: 'list_capabilities',
    description:
      'List GSA business capabilities from the Business Capability List.',
    parameters: { type: 'object', properties: {} },
    handler: listCapabilities,
  },
  {
    name: 'list_investments',
    description: 'List IT investments from the IT Strategy area.',
    parameters: { type: 'object', properties: {} },
    handler: listInvestments,
  },
  {
    name: 'list_organizations',
    description: 'List GSA organizations from the Organization List.',
    parameters: { type: 'object', properties: {} },
    handler: listOrganizations,
  },
  {
    name: 'list_it_standards',
    description:
      'List technologies / IT standards from the IT Standards List (TRM technologies).',
    parameters: { type: 'object', properties: {} },
    handler: listItStandards,
  },
  {
    name: 'list_websites',
    description: 'List GSA websites tracked in GEAR.',
    parameters: { type: 'object', properties: {} },
    handler: listWebsites,
  },
  {
    name: 'get_software_approval',
    description:
      "Look up a software product in GSA's IT Standards List and report whether it is approved for use at GSA. Returns matching entries with their approval Status (Approved, Denied, Retired, Pilot, Proposed, Exception), Category, manufacturer, and end-of-life/approval-expiration dates. Use this whenever the user searches for or asks about a specific software/technology's approval status.",
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description:
            'The software product, release, or manufacturer name to look up.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of matches to return (default 15).',
        },
      },
      required: ['name'],
    },
    handler: getSoftwareApproval,
  },
  {
    name: 'list_approved_software',
    description:
      "List software that is currently APPROVED for use at GSA in the IT Standards List, optionally filtered by a category keyword (e.g. 'database', 'browser', 'content management'). Use this to find approved alternatives with similar capability when a searched product is not approved.",
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description:
            'Optional category keyword to filter approved software (matches the Category field).',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 40).',
        },
      },
    },
    handler: listApprovedSoftware,
  },
  {
    name: 'find_similar_approved_software',
    description:
      'Answer "what is a good alternative to <PRODUCT>?", "what else is like <PRODUCT>?", or "what can I use instead of <PRODUCT>?" for a named software product. Looks up the product in the IT Standards List, reads the Technology Reference Model category GEAR classifies it under, and returns the COMPLETE list of Approved products GEAR classifies alongside it. Use this whenever the user wants alternatives or comparable software, whatever the named product\'s own approval status is - it works for Approved products too, not only Denied/Retired ones. The returned list is exhaustive and authoritative: report exactly the products in "rows" and NEVER add a product from your own knowledge of the market.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description:
            'The software product the user wants alternatives to (e.g. "Tableau", "Looker").',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of alternatives to return (default 40).',
        },
      },
      required: ['name'],
    },
    handler: findSimilarApprovedSoftware,
  },
  {
    name: 'list_software_by_category',
    description:
      'Answer "what <KIND of> software is in the inventory?" - e.g. "what low code/no code software do we have", "what web servers are in the inventory", "which programming languages are approved". Resolves the technology TYPE to GEAR\'s Technology Reference Model category and returns the COMPLETE, AUTHORITATIVE list of software GEAR classifies under it. ALWAYS use this tool (never search_gear) for questions about a type/class/category of software. The returned list is exhaustive: report exactly the products in "rows" and NEVER add any other product, however related it seems. If trmCategory is null, GEAR has no such category - say so rather than substituting search results.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description:
            'The kind of software being asked about (e.g. "low code/no code", "LCNC", "web server", "programming language", "defect tracking").',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of software products to return (default 100).',
        },
      },
      required: ['type'],
    },
    handler: listSoftwareByCategory,
  },
  {
    name: 'find_trm_category',
    description:
      'Find the Technology Reference Model (TRM) category matching a TYPE of technology, returning the category record itself (id, name, area, domain, description) without its software list. Use this only when the user asks about the TRM structure or a category definition; to list the software in a category, use list_software_by_category instead.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description:
            'The technology type, category name, or acronym to find (e.g. "low code/no code", "LCNC", "web server").',
        },
      },
      required: ['name'],
    },
    handler: findTrmCategory,
  },
  {
    name: 'get_trm_software',
    description:
      'Get the COMPLETE, AUTHORITATIVE list of software products / IT standards that GEAR classifies under a specific Technology Reference Model category id. Prefer list_software_by_category, which resolves the category from a plain technology type in one step; use this only when you already have a TRM category id. The returned list is exhaustive for that category: report exactly these products and NEVER add other products you believe belong to the category. Set includeChildren=true when the category Type is \'Area\'.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The TRM category id (from find_trm_category bestMatch.Id).',
        },
        includeChildren: {
          type: 'boolean',
          description:
            'Also include software mapped to child categories of this TRM category (useful for Level 2 Areas). Default false.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of software products to return (default 100).',
        },
      },
      required: ['id'],
    },
    handler: getTrmSoftware,
  },
];

const toolsByName = Object.fromEntries(tools.map((t) => [t.name, t]));

/**
 * Tools whose results are a complete, curated list for the question asked.
 * The orchestrator blocks follow-up keyword searches once one of these has
 * answered, so a broad search cannot pad an authoritative list with unrelated
 * products. See chat-orchestrator.js.
 */
const AUTHORITATIVE_TOOLS = new Set([
  'list_software_by_category',
  'get_trm_software',
  'find_similar_approved_software',
]);

/** Broad/lexical lookups that must not be used to extend an authoritative list. */
const BROAD_SEARCH_TOOLS = new Set([
  'search_gear',
  'list_it_standards',
  'list_approved_software',
]);

/**
 * Execute a tool by name with the given arguments.
 * @returns {Promise<any>} JSON-serializable result.
 */
async function runTool(name, args = {}) {
  const tool = toolsByName[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.handler(args || {});
}

/** OpenAI Chat Completions tool definitions (function-calling format). */
function toOpenAiTools() {
  return tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

module.exports = {
  tools,
  toolsByName,
  runTool,
  toOpenAiTools,
  AUTHORITATIVE_TOOLS,
  BROAD_SEARCH_TOOLS,
  GEAR_API_BASE,
  GEAR_ROUTE_BY_TYPE,
};
