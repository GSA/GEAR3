/**
 * Shared GEAR tool layer.
 *
 * These tool functions are the single source of truth for how AI features
 * (both the MCP server and the /api/chat orchestrator) read GEAR data.
 *
 * Design decisions:
 *  - Tools call the existing GEAR /api HTTP endpoints (never raw model-generated
 *    SQL) so all existing controller logic, caching, and business rules apply.
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

/* ------------------------------------------------------------------ *
 * Tool implementations
 * ------------------------------------------------------------------ */

async function searchGear({ keyword, limit }) {
  if (!keyword || typeof keyword !== 'string') {
    throw new Error('keyword is required');
  }
  const max = limit || DEFAULT_RESULT_LIMIT;

  // A bare GEAR ID is answered deterministically; FULLTEXT cannot match
  // numeric identifiers at all.
  const byId = await lookupByIdentifier(keyword);
  if (byId.length) {
    return { ...capResults(byId, max), strategy: 'exact_id' };
  }

  const data = await gearApiGet(`/search/${encodeURIComponent(keyword)}`);
  const keywordRows = Array.isArray(data) ? data : [];

  const { rows, strategy, semanticUsed } = await hybridSearch({
    keyword,
    limit: max,
    keywordRows,
  });

  return { ...capResults(rows, max), strategy, semanticUsed };
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
  return {
    Name: t.SoftwareReleaseName || t.Name,
    Status: t.Status,
    Category: t.Category,
    StandardType: t.StandardType,
    ManufacturerName: t.ManufacturerName,
    SoftwareProductName: t.SoftwareProductName,
    ComplianceStatus: t.ComplianceStatus,
    ApprovalExpirationDate: t.ApprovalExpirationDate,
    EndOfLifeDate: t.EndOfLifeDate,
  };
}

/**
 * Look up an IT standard (software product) in the IT Standards List and report
 * its approval status at GSA. Matches on name (case-insensitive substring) and
 * returns the matching entries plus their Status (Approved, Denied, Retired,
 * Pilot, Proposed, Exception, etc.).
 */
async function getSoftwareApproval({ name, limit }) {
  if (!name || typeof name !== 'string') {
    throw new Error('name is required');
  }
  const term = name.toLowerCase().trim();
  const data = await gearApiGet('/it_standards');
  const rows = Array.isArray(data) ? data : [];

  const matches = rows.filter((t) => {
    const n = (t.SoftwareReleaseName || t.Name || '').toLowerCase();
    const p = (t.SoftwareProductName || '').toLowerCase();
    const m = (t.ManufacturerName || '').toLowerCase();
    return n.includes(term) || p.includes(term) || m.includes(term);
  });

  // Prefer non-retired, then Approved first, for readability.
  const rank = (s) => {
    const status = (s.Status || '').toLowerCase();
    if (status === 'approved') return 0;
    if (status === 'pilot' || status === 'proposed') return 1;
    if (status === 'denied' || status === 'exception') return 2;
    if (status === 'retired') return 4;
    return 3;
  };
  matches.sort((a, b) => rank(a) - rank(b));

  return capResults(matches.map(slimItStandard), limit || 15);
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
const AUTHORITATIVE_TOOLS = new Set(['list_software_by_category', 'get_trm_software']);

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
};
