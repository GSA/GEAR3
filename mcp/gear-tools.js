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
 */

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
  const data = await gearApiGet(`/search/${encodeURIComponent(keyword)}`);
  return capResults(data, limit || DEFAULT_RESULT_LIMIT);
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
      'Full-text search across all GEAR entities (systems, subsystems, FISMA systems, technologies/IT standards, capabilities, organizations, investments, websites, and TRM). Returns matching items with their name, description, status, and GEAR_Type. Use this first when the user asks about anything by name or keyword.',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description:
            'The search term(s). Supports MySQL boolean full-text syntax (e.g. +cloud -legacy).',
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
];

const toolsByName = Object.fromEntries(tools.map((t) => [t.name, t]));

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
  GEAR_API_BASE,
};
