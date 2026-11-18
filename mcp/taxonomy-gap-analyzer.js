/**
 * Nightly taxonomy-gap analyzer.
 *
 * This is where ALL the "thinking" for taxonomy-gap recommendations happens -
 * deliberately decoupled from any user request so it adds zero latency to the
 * chatbot. It:
 *
 *   1. Reads unprocessed rows from gear_log.taxonomy_gap_signal (the
 *      zero-latency observations fired inline by mcp/chat-orchestrator.js via
 *      ./taxonomy-gap-signals.js).
 *   2. Runs its own broader structural scan directly against gear_schema
 *      (read-only - see ./db-guard.js's readOnlyPool): Approved IT standards
 *      with no TRM mapping, active business-application systems with no
 *      Business Capability mapping, and exact-duplicate-named TRM categories
 *      / Business Capabilities (candidates for a remove_node merge).
 *      Unmapped Approved standards are picked AFTER filtering out those with
 *      an open recommendation (any gap type) or a review within
 *      GEAR_TAXONOMY_REALIGN_INTERVAL_DAYS, using the same
 *      gear_log.taxonomy_mapping_review rotation as step 3b, so runs never
 *      stall on the same Ids and rejected suggestions are not re-raised.
 *   3. For mapping-gap candidates, asks USAi to choose which EXISTING TRM
 *      category / Business Capability best fits, or - only when nothing
 *      existing fits - to nominate a new node and an existing parent for it.
 *      The model never writes SQL itself: it only returns a small structured
 *      decision (a target id, or a new node name + an existing parent id),
 *      which this file turns into Proposed_SQL deterministically using the
 *      verified gear_schema column names below. This keeps every proposal
 *      syntactically correct and groundable against real GEAR data, and
 *      removes any chance of the model hallucinating table/column names.
 *   3b. Re-alignment review: re-checks IT standards that ALREADY have TRM
 *      mappings, a bounded batch per run, rotating via
 *      gear_log.taxonomy_mapping_review (never-reviewed first, then changed
 *      mapping sets, then reviews older than
 *      GEAR_TAXONOMY_REALIGN_INTERVAL_DAYS). USAi returns keep, or the complete
 *      set of TRM ids the standard should map to; every id is validated, and
 *      the difference becomes add_mapping / remove_mapping / remap_mapping
 *      Proposed_SQL. Mappings to TRM ids that no longer exist are always
 *      proposed for removal.
 *   4. Writes finished rows to gear_log.taxonomy_gap_recommendation and marks
 *      the originating signals Processed.
 *
 * Every recommendation is Status='pending': nothing here is ever applied to
 * gear_schema. A GEAR Manager admin must review Proposed_SQL and run it
 * through GEAR's authenticated, audited path. db-guard.js enforces this even
 * if a bug in this file tried to write to gear_schema directly.
 *
 * Verified gear_schema shapes this file relies on (see api/queries/GET/*.sql):
 *   obj_TRM:         Technology_Category_Id (PK), TRM_Name, TRM_Level,
 *                     TRM_Type, obj_technology_category_Parent_Id, Description
 *   obj_capability:  capability_Id (PK), Capability_Name, Capability_Level,
 *                     Parent_Id, Description
 *   obj_technology:  Id (PK), softwareReleaseName/Keyname, Description,
 *                     obj_technology_status_Id -> obj_technology_status.Keyname
 *   zk_technology_TRM: obj_TRM_Id, obj_technology_Id
 *   obj_fisma_archer: `ex:GEAR_ID` (PK), `ex:System_Name`, `ex:Description`,
 *                     `ex:Status`, `ex:BusinessApplication`, `ex:SystemLevel`
 *   zk_systems_subsystems_capabilities: obj_capability_Id, obj_systems_subsystems_Id
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('../api/db');
const { readOnlyPool } = require('./db-guard');
const { chatCompletion } = require('./usai-client');
const { loadConfig } = require('./chat-orchestrator');
const { recordSignal, getPool: getSignalsPool } = require('./taxonomy-gap-signals');

/** Read-only access to gear_schema, mirroring embedding-pipeline.js's corpusPool. */
const schemaPool = readOnlyPool(db.promisePool, 'taxonomy-gap-analyzer');

/** Caps so one run cannot blow the USAi budget or run unbounded. */
const MAX_SIGNALS_PER_RUN = Number(process.env.GEAR_TAXONOMY_MAX_SIGNALS || 200);
const MAX_STRUCTURAL_TECH_PER_RUN = Number(process.env.GEAR_TAXONOMY_MAX_TECH || 50);
const MAX_STRUCTURAL_SYSTEMS_PER_RUN = Number(process.env.GEAR_TAXONOMY_MAX_SYSTEMS || 50);
/** Re-alignment review of EXISTING technology<->TRM mappings: per-run cap and re-review interval. */
const MAX_REALIGN_PER_RUN = Number(process.env.GEAR_TAXONOMY_MAX_REALIGN || 25);
const REALIGN_INTERVAL_DAYS = Number(process.env.GEAR_TAXONOMY_REALIGN_INTERVAL_DAYS || 90);
/** Upper bound on TRM categories a single technology may be proposed to map to. */
const MAX_TARGETS_PER_TECH = 5;
/** Cap on how many existing TRM categories / Capabilities are listed in a prompt. */
const MAX_CANDIDATES_IN_PROMPT = 400;

let analysisRunning = false;

/* ------------------------------------------------------------------ *
 * gear_schema reads (read-only)
 * ------------------------------------------------------------------ */

async function fetchTrmCategories() {
  const [rows] = await schemaPool.query(
    `SELECT Technology_Category_Id AS Id,
            TRM_Name AS Name,
            TRM_Level AS Level,
            TRM_Type AS Type,
            obj_technology_category_Parent_Id AS ParentId,
            Description
     FROM gear_schema.obj_TRM`
  );
  return rows;
}

async function fetchCapabilities() {
  const [rows] = await schemaPool.query(
    `SELECT capability_Id AS Id,
            Capability_Name AS Name,
            Capability_Level AS Level,
            Parent_Id AS ParentId,
            Description
     FROM gear_schema.obj_capability`
  );
  return rows;
}

/**
 * Every Approved IT standard with zero TRM category mapping. Which ones are
 * reviewed this run is decided in JS (see selectDueForReview) because the
 * rotation and open-recommendation state live in gear_log.
 */
async function fetchUnmappedApprovedTechnologies() {
  const [rows] = await schemaPool.query(
    `SELECT tech.Id AS Id,
            IFNULL(tech.softwareReleaseName, tech.Keyname) AS Name,
            tech.Description AS Description
     FROM gear_schema.obj_technology AS tech
     LEFT JOIN gear_schema.obj_technology_status AS status
            ON tech.obj_technology_status_Id = status.Id
     LEFT JOIN gear_schema.zk_technology_TRM AS ztt
            ON tech.Id = ztt.obj_technology_Id
     WHERE ztt.obj_TRM_Id IS NULL
       AND status.Keyname = 'Approved'
     ORDER BY tech.Id ASC`
  );
  return rows.map((r) => ({ ...r, TrmIds: [] }));
}

/**
 * Look up the IT standard a chat signal refers to, by Id when the signal has
 * one, otherwise by exact name (older signals carried only a name). Returns
 * null when no single standard matches.
 */
async function fetchTechnologyForSignal({ id, name }) {
  const byId = id != null && String(id).trim() !== '';
  const [rows] = await schemaPool.query(
    `SELECT tech.Id AS Id,
            IFNULL(tech.softwareReleaseName, tech.Keyname) AS Name,
            tech.Description AS Description,
            status.Keyname AS Status,
            COUNT(ztt.obj_TRM_Id) AS MappedCount
     FROM gear_schema.obj_technology AS tech
     LEFT JOIN gear_schema.obj_technology_status AS status
            ON tech.obj_technology_status_Id = status.Id
     LEFT JOIN gear_schema.zk_technology_TRM AS ztt
            ON tech.Id = ztt.obj_technology_Id
     WHERE ${byId ? 'tech.Id = ?' : 'IFNULL(tech.softwareReleaseName, tech.Keyname) = ?'}
     GROUP BY tech.Id, tech.softwareReleaseName, tech.Keyname, tech.Description, status.Keyname
     LIMIT 2`,
    [byId ? Number(id) : String(name || '')]
  );
  if (rows.length !== 1) return null;
  return { ...rows[0], MappedCount: Number(rows[0].MappedCount) || 0, TrmIds: [] };
}

/**
 * Every IT standard that already has at least one TRM mapping, with its
 * current mapped TRM ids. Re-alignment candidates are chosen from this in JS
 * (see selectDueForReview) because rotation state lives in gear_log.
 */
async function fetchMappedTechnologies() {
  const [rows] = await schemaPool.query(
    `SELECT tech.Id AS Id,
            IFNULL(tech.softwareReleaseName, tech.Keyname) AS Name,
            tech.Description AS Description,
            status.Keyname AS Status,
            GROUP_CONCAT(DISTINCT ztt.obj_TRM_Id ORDER BY ztt.obj_TRM_Id SEPARATOR ',') AS TrmIds
     FROM gear_schema.obj_technology AS tech
     INNER JOIN gear_schema.zk_technology_TRM AS ztt
            ON tech.Id = ztt.obj_technology_Id
     LEFT JOIN gear_schema.obj_technology_status AS status
            ON tech.obj_technology_status_Id = status.Id
     GROUP BY tech.Id, tech.softwareReleaseName, tech.Keyname, tech.Description, status.Keyname`
  );
  return rows.map((r) => ({
    ...r,
    TrmIds: String(r.TrmIds || '')
      .split(',')
      .filter(Boolean)
      .map(Number),
  }));
}

/** Active, business-application systems with zero Business Capability mapping. */
async function fetchUnmappedActiveSystems(limit) {
  const [rows] = await schemaPool.query(
    `SELECT systems.\`ex:GEAR_ID\` AS Id,
            CASE
              WHEN systems_ext.Normalized_Name IS NULL THEN systems.\`ex:System_Name\`
              ELSE systems_ext.Normalized_Name
            END AS Name,
            systems.\`ex:Description\` AS Description
     FROM gear_schema.obj_fisma_archer AS systems
     LEFT JOIN gear_schema.obj_systems_subsystems AS systems_ext
            ON systems.\`ex:GEAR_ID\` = systems_ext.GEAR_ID
     LEFT JOIN gear_schema.zk_systems_subsystems_capabilities AS cap_map
            ON systems.\`ex:GEAR_ID\` = cap_map.obj_systems_subsystems_Id
     WHERE cap_map.obj_capability_Id IS NULL
       AND systems.\`ex:Status\` = 'Active'
       AND systems.\`ex:BusinessApplication\` = 'Yes'
     ORDER BY systems.\`ex:GEAR_ID\` ASC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

/** Exact-name-collision TRM categories: candidates for a remove_node merge. */
async function fetchDuplicateTrmCategories() {
  const [rows] = await schemaPool.query(
    `SELECT a.Technology_Category_Id AS IdA, a.TRM_Name AS NameA,
            b.Technology_Category_Id AS IdB, b.TRM_Name AS NameB
     FROM gear_schema.obj_TRM AS a
     JOIN gear_schema.obj_TRM AS b
       ON LOWER(TRIM(a.TRM_Name)) = LOWER(TRIM(b.TRM_Name))
      AND a.Technology_Category_Id < b.Technology_Category_Id`
  );
  return rows;
}

/** Exact-name-collision Business Capabilities: candidates for a remove_node merge. */
async function fetchDuplicateCapabilities() {
  const [rows] = await schemaPool.query(
    `SELECT a.capability_Id AS IdA, a.Capability_Name AS NameA,
            b.capability_Id AS IdB, b.Capability_Name AS NameB
     FROM gear_schema.obj_capability AS a
     JOIN gear_schema.obj_capability AS b
       ON LOWER(TRIM(a.Capability_Name)) = LOWER(TRIM(b.Capability_Name))
      AND a.capability_Id < b.capability_Id`
  );
  return rows;
}

/* ------------------------------------------------------------------ *
 * gear_log reads/writes (the only schema this file may write to)
 * ------------------------------------------------------------------ */

async function fetchPendingSignals(limit) {
  const pool = getSignalsPool();
  const [rows] = await pool.query(
    `SELECT Id, Signal_Type, Source, Query_Text, Entity_Type, Entity_Id, Entity_Name, Context_Json
     FROM gear_log.taxonomy_gap_signal
     WHERE Processed = 0
     ORDER BY Created_DTG ASC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

/** Re-alignment rotation state, keyed by obj_technology.Id (as a string). */
async function fetchTechnologyReviewState() {
  const pool = getSignalsPool();
  const [rows] = await pool.query(
    `SELECT Entity_Id, Mapping_Fingerprint, Reviewed_DTG
     FROM gear_log.taxonomy_mapping_review
     WHERE Entity_Type = 'Technology'`
  );
  const state = new Map();
  for (const r of rows) {
    state.set(String(r.Entity_Id), {
      fingerprint: r.Mapping_Fingerprint,
      reviewedMs: new Date(r.Reviewed_DTG).getTime(),
    });
  }
  return state;
}

async function recordTechnologyReview({ entityId, fingerprint, verdict, confidence, reasoning, recommendationId }) {
  const pool = getSignalsPool();
  await pool.execute(
    `INSERT INTO gear_log.taxonomy_mapping_review
       (Entity_Type, Entity_Id, Mapping_Fingerprint, Verdict, Confidence, Reasoning, Recommendation_Id, Reviewed_DTG)
     VALUES ('Technology', ?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       Mapping_Fingerprint = VALUES(Mapping_Fingerprint),
       Verdict = VALUES(Verdict),
       Confidence = VALUES(Confidence),
       Reasoning = VALUES(Reasoning),
       Recommendation_Id = VALUES(Recommendation_Id),
       Reviewed_DTG = NOW()`,
    [
      String(entityId),
      fingerprint,
      verdict,
      confidence ?? null,
      reasoning ? String(reasoning).slice(0, 2000) : null,
      recommendationId ?? null,
    ]
  );
}

/** Ids of entities of this type that already have a pending/approved recommendation of any gap type. */
async function fetchOpenRecommendationEntityIds(entityType) {
  const pool = getSignalsPool();
  const [rows] = await pool.query(
    `SELECT DISTINCT Affected_Entity_Id AS Id
     FROM gear_log.taxonomy_gap_recommendation
     WHERE Affected_Entity_Type = ? AND Affected_Entity_Id IS NOT NULL
       AND Status IN ('pending', 'approved')`,
    [entityType]
  );
  return new Set(rows.map((r) => String(r.Id)));
}

/** True when a pending/approved recommendation already covers this exact entity+gap. */
async function hasExistingRecommendation(gapType, entityType, entityId) {
  if (entityId == null) return false;
  const pool = getSignalsPool();
  const [rows] = await pool.query(
    `SELECT 1 FROM gear_log.taxonomy_gap_recommendation
     WHERE Gap_Type = ? AND Affected_Entity_Type = ? AND Affected_Entity_Id = ?
       AND Status IN ('pending', 'approved')
     LIMIT 1`,
    [gapType, entityType, String(entityId)]
  );
  return rows.length > 0;
}

async function insertRecommendation(rec) {
  const pool = getSignalsPool();
  const [result] = await pool.execute(
    `INSERT INTO gear_log.taxonomy_gap_recommendation
       (Source, Related_Ai_Log_Id, Gap_Type, Recommended_Action, Situation_Analyzed,
        Gap_Description, Recommended_Addition, Affected_Entity_Type, Affected_Entity_Id,
        Affected_Entity_Name, Proposed_Parent_Name, Proposed_Parent_Exists,
        Child_Node_Handling, Proposed_SQL, Confidence)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rec.source || 'test',
      rec.relatedAiLogId ?? null,
      rec.gapType,
      rec.recommendedAction,
      rec.situationAnalyzed,
      rec.gapDescription,
      rec.recommendedAddition,
      rec.affectedEntityType ?? null,
      rec.affectedEntityId != null ? String(rec.affectedEntityId) : null,
      rec.affectedEntityName ?? null,
      rec.proposedParentName ?? null,
      rec.proposedParentExists != null ? (rec.proposedParentExists ? 1 : 0) : null,
      rec.childNodeHandling ?? null,
      rec.proposedSql,
      rec.confidence || 'medium',
    ]
  );
  return result ? result.insertId : null;
}

async function markSignalsProcessed(signalIds, recommendationId) {
  if (!signalIds.length) return;
  const pool = getSignalsPool();
  await pool.query(
    `UPDATE gear_log.taxonomy_gap_signal
     SET Processed = 1, Processed_DTG = NOW(), Recommendation_Id = ?
     WHERE Id IN (?)`,
    [recommendationId, signalIds]
  );
}

/* ------------------------------------------------------------------ *
 * Deterministic Proposed_SQL builders.
 *
 * The model is only ever asked to pick a target id or nominate a new node +
 * parent; it never writes SQL text itself. These builders are pure functions
 * (no I/O) so they are straightforward to unit test.
 * ------------------------------------------------------------------ */

/** Escape a value for interpolation into a single-quoted SQL string literal. */
function sqlString(value) {
  return `'${String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function buildAddMappingSql(gapType, targetId, entityId) {
  if (gapType === 'technology_trm_mapping') {
    return (
      `INSERT INTO gear_schema.zk_technology_TRM (obj_TRM_Id, obj_technology_Id) ` +
      `VALUES (${Number(targetId)}, ${Number(entityId)});`
    );
  }
  return (
    `INSERT INTO gear_schema.zk_systems_subsystems_capabilities (obj_capability_Id, obj_systems_subsystems_Id) ` +
    `VALUES (${Number(targetId)}, ${Number(entityId)});`
  );
}

function buildAddNodeSql({ gapType, name, description, level, parentId, entityId }) {
  if (gapType === 'technology_trm_mapping') {
    return (
      `INSERT INTO gear_schema.obj_TRM (TRM_Name, Description, TRM_Level, obj_technology_category_Parent_Id) ` +
      `VALUES (${sqlString(name)}, ${sqlString(description || '')}, ${Number(level) || 3}, ${Number(parentId)}); ` +
      `INSERT INTO gear_schema.zk_technology_TRM (obj_TRM_Id, obj_technology_Id) ` +
      `VALUES (LAST_INSERT_ID(), ${Number(entityId)});`
    );
  }
  return (
    `INSERT INTO gear_schema.obj_capability (Capability_Name, Description, Capability_Level, Parent_Id) ` +
    `VALUES (${sqlString(name)}, ${sqlString(description || '')}, ${Number(level) || 2}, ${Number(parentId)}); ` +
    `INSERT INTO gear_schema.zk_systems_subsystems_capabilities (obj_capability_Id, obj_systems_subsystems_Id) ` +
    `VALUES (LAST_INSERT_ID(), ${Number(entityId)});`
  );
}

function buildRemoveNodeMergeSql(gapType, survivingId, duplicateId) {
  if (gapType === 'trm_category') {
    return [
      `UPDATE gear_schema.obj_TRM SET obj_technology_category_Parent_Id = ${Number(survivingId)} ` +
        `WHERE obj_technology_category_Parent_Id = ${Number(duplicateId)};`,
      `UPDATE gear_schema.zk_technology_TRM SET obj_TRM_Id = ${Number(survivingId)} ` +
        `WHERE obj_TRM_Id = ${Number(duplicateId)};`,
      `DELETE FROM gear_schema.obj_TRM WHERE Technology_Category_Id = ${Number(duplicateId)};`,
    ].join(' ');
  }
  return [
    `UPDATE gear_schema.obj_capability SET Parent_Id = ${Number(survivingId)} ` +
      `WHERE Parent_Id = ${Number(duplicateId)};`,
    `UPDATE gear_schema.zk_systems_subsystems_capabilities SET obj_capability_Id = ${Number(survivingId)} ` +
      `WHERE obj_capability_Id = ${Number(duplicateId)};`,
    `DELETE FROM gear_schema.obj_capability WHERE capability_Id = ${Number(duplicateId)};`,
  ].join(' ');
}

/** No-op advisory text used when the analyzer cannot safely resolve a concrete target. */
function buildManualReviewPlaceholderSql(reason) {
  return `-- MANUAL REVIEW REQUIRED: ${reason.replace(/\*\//g, '* /')} -- no SQL drafted.`;
}

/** Stable identity for a technology's current mapping set, so a changed set re-triggers review. */
function mappingFingerprint(ids) {
  return [...new Set((ids || []).map(Number).filter(Number.isFinite))].sort((a, b) => a - b).join(',');
}

/**
 * Review tier for one technology: 0 = never reviewed, 1 = mapping set changed
 * since its last review, 2 = last review older than the interval, null = not
 * due. Entities with an open recommendation are never due, so a pending
 * admin decision is never duplicated.
 */
function reviewTier(tech, prior, openEntityIds, cutoffMs) {
  if (openEntityIds.has(String(tech.Id))) return null;
  if (!prior) return 0;
  if (prior.fingerprint !== mappingFingerprint(tech.TrmIds)) return 1;
  if (prior.reviewedMs < cutoffMs) return 2;
  return null;
}

function reviewCutoffMs(nowMs, intervalDays) {
  return nowMs - intervalDays * 24 * 60 * 60 * 1000;
}

/**
 * Pick which technologies to review this run, in priority order: never
 * reviewed, then mapping set changed since last review, then the oldest
 * reviews past the interval. Used for both the unmapped scan (TrmIds = [])
 * and the re-alignment review of existing mappings. Filtering happens before
 * the cap, so already-covered entities never use up a run's slots.
 */
function selectDueForReview(technologies, reviewState, openEntityIds, { limit, intervalDays, nowMs }) {
  const cutoffMs = reviewCutoffMs(nowMs, intervalDays);
  const tiers = [[], [], []];
  for (const tech of technologies) {
    const prior = reviewState.get(String(tech.Id));
    const tier = reviewTier(tech, prior, openEntityIds, cutoffMs);
    if (tier !== null) tiers[tier].push({ tech, reviewedMs: prior ? prior.reviewedMs : 0 });
  }
  tiers[2].sort((a, b) => a.reviewedMs - b.reviewedMs);
  return tiers.flat().slice(0, limit).map((t) => t.tech);
}

/**
 * Draft SQL that moves a technology from its current TRM mappings to the
 * desired set. New links are inserted before old ones are deleted, so the
 * technology is never left unmapped if the script is run part-way.
 */
function buildRealignMappingSql(technologyId, currentIds, desiredIds) {
  const current = new Set(currentIds.map(Number));
  const desired = new Set(desiredIds.map(Number));
  const toAdd = [...desired].filter((id) => !current.has(id)).sort((a, b) => a - b);
  const toRemove = [...current].filter((id) => !desired.has(id)).sort((a, b) => a - b);
  const techId = Number(technologyId);
  const statements = [
    ...toAdd.map((id) => buildAddMappingSql('technology_trm_mapping', id, techId)),
    ...toRemove.map(
      (id) => `DELETE FROM gear_schema.zk_technology_TRM WHERE obj_TRM_Id = ${id} AND obj_technology_Id = ${techId};`
    ),
  ];
  return { toAdd, toRemove, sql: statements.join(' ') };
}

/**
 * Validate a model's re-alignment answer against real GEAR data. Returns
 * {verdict:'keep'|'change', desiredIds, confidence, reasoning} or null when
 * the answer cannot be trusted (unknown ids, empty result, or no real change).
 * Any current mapping pointing at a TRM id that no longer exists is always
 * dropped, whatever the model says.
 */
function validateRealignmentDecision(parsed, currentIds, knownTrmIds) {
  if (!parsed || typeof parsed.verdict !== 'string') return null;
  const confidence = ['low', 'medium', 'high'].includes(parsed.confidence) ? parsed.confidence : 'medium';
  const reasoning = String(parsed.reasoning || '').slice(0, 1000);
  const validCurrent = currentIds.filter((id) => knownTrmIds.has(Number(id)));
  const hasDangling = validCurrent.length !== currentIds.length;

  if (parsed.verdict === 'keep') {
    if (!hasDangling) return { verdict: 'keep', desiredIds: currentIds.map(Number), confidence, reasoning };
    if (!validCurrent.length) return null;
    return { verdict: 'change', desiredIds: validCurrent.map(Number), confidence: 'high', reasoning };
  }

  if (parsed.verdict !== 'change' || !Array.isArray(parsed.target_ids)) return null;
  const ids = parsed.target_ids.map(Number);
  if (!ids.length || ids.some((id) => !knownTrmIds.has(id))) return null;
  const desiredIds = [...new Set(ids)].slice(0, MAX_TARGETS_PER_TECH);
  if (mappingFingerprint(desiredIds) === mappingFingerprint(currentIds)) {
    return { verdict: 'keep', desiredIds, confidence, reasoning };
  }
  return { verdict: 'change', desiredIds, confidence, reasoning };
}

/* ------------------------------------------------------------------ *
 * USAi-backed decision step for mapping gaps.
 *
 * The model returns ONLY a structured decision (never SQL). We validate every
 * id it returns against the real candidate list before trusting it.
 * ------------------------------------------------------------------ */

/** Balanced-brace JSON object extractor, mirroring chat-orchestrator.js's parseToolCall. */
function extractJsonObject(text) {
  const start = String(text || '').indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (_) {
    return null;
  }
}

/**
 * Ask USAi which existing node a Technology/System best maps to, or whether a
 * new node is warranted. Returns a validated decision object or null if the
 * model's answer could not be grounded against the provided candidates.
 */
async function decideMappingTarget({ cfg, kind, entityName, entityDescription, allNodes, topLevelNodes }) {
  const nodeLabel = kind === 'technology_trm_mapping' ? 'Technology Reference Model category' : 'Business Capability';
  const listed = allNodes
    .slice(0, MAX_CANDIDATES_IN_PROMPT)
    .map((n) => `${n.Id}|${n.Name}|Level ${n.Level}`)
    .join('\n');
  const parentListed = topLevelNodes.map((n) => `${n.Id}|${n.Name}|Level ${n.Level}`).join('\n');

  const prompt = [
    `You are helping classify a GEAR inventory item against GEAR's existing ${nodeLabel} taxonomy.`,
    `Item name: ${entityName}`,
    `Item description: ${entityDescription || '(none provided)'}`,
    '',
    `Existing ${nodeLabel} nodes (Id|Name|Level), choose the single best fit if one genuinely fits:`,
    listed,
    '',
    `If NONE of the above genuinely fit, instead nominate a NEW node and an existing PARENT for it from this list only:`,
    parentListed,
    '',
    'Respond with ONLY a single JSON object, no prose, no markdown fences, in exactly this shape:',
    '{"decision":"map_existing","target_id":"<id from the list above>","confidence":"low|medium|high","reasoning":"..."}',
    'OR',
    '{"decision":"no_fit","new_node_name":"...","new_node_description":"...","new_node_parent_id":"<id from the parent list>","confidence":"low|medium|high","reasoning":"..."}',
  ].join('\n');

  const { content } = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { model: cfg.model, temperature: cfg.temperature, maxTokens: 500 }
  );
  const parsed = extractJsonObject(content);
  if (!parsed || typeof parsed.decision !== 'string') return null;

  if (parsed.decision === 'map_existing') {
    const match = allNodes.find((n) => String(n.Id) === String(parsed.target_id));
    if (!match) return null; // Ungrounded reference - caller falls back to manual-review placeholder.
    return {
      decision: 'map_existing',
      targetId: match.Id,
      targetName: match.Name,
      confidence: ['low', 'medium', 'high'].includes(parsed.confidence) ? parsed.confidence : 'medium',
      reasoning: String(parsed.reasoning || '').slice(0, 1000),
    };
  }

  if (parsed.decision === 'no_fit') {
    const parent = topLevelNodes.find((n) => String(n.Id) === String(parsed.new_node_parent_id));
    if (!parent || !parsed.new_node_name) return null;
    return {
      decision: 'no_fit',
      newNodeName: String(parsed.new_node_name).slice(0, 255),
      newNodeDescription: String(parsed.new_node_description || '').slice(0, 2000),
      parentId: parent.Id,
      parentName: parent.Name,
      confidence: ['low', 'medium', 'high'].includes(parsed.confidence) ? parsed.confidence : 'low',
      reasoning: String(parsed.reasoning || '').slice(0, 1000),
    };
  }

  return null;
}

/**
 * Ask USAi whether a technology's EXISTING TRM mappings still fit, returning
 * the parsed (unvalidated) JSON. Callers must run validateRealignmentDecision.
 */
async function decideRealignment({ cfg, tech, currentNodes, allNodes }) {
  const currentIdSet = new Set(currentNodes.map((n) => String(n.Id)));
  // Always list the current mappings, even if they fall past the prompt cap.
  const listedNodes = [
    ...currentNodes,
    ...allNodes.filter((n) => !currentIdSet.has(String(n.Id))),
  ].slice(0, Math.max(MAX_CANDIDATES_IN_PROMPT, currentNodes.length));
  const listed = listedNodes.map((n) => `${n.Id}|${n.Name}|Level ${n.Level}`).join('\n');
  const current = currentNodes
    .map((n) => `${n.Id}|${n.Name}|Level ${n.Level}|${String(n.Description || '').slice(0, 200)}`)
    .join('\n');

  const prompt = [
    "You are auditing how a GEAR IT standard is classified in GEAR's Technology Reference Model (TRM).",
    `IT standard name: ${tech.Name}`,
    `IT standard description: ${tech.Description || '(none provided)'}`,
    `IT standard status: ${tech.Status || '(unknown)'}`,
    '',
    'It is CURRENTLY mapped to these TRM categories (Id|Name|Level|Description):',
    current || '(none that still exist)',
    '',
    'All TRM categories (Id|Name|Level):',
    listed,
    '',
    'Decide whether the current mappings are the right ones. Keep a mapping unless it is clearly wrong or a',
    'clearly more specific category exists. Add a category only if the standard plainly belongs in it too.',
    `Never return more than ${MAX_TARGETS_PER_TECH} categories.`,
    '',
    'Respond with ONLY a single JSON object, no prose, no markdown fences, in exactly this shape:',
    '{"verdict":"keep","confidence":"low|medium|high","reasoning":"..."}',
    'OR',
    '{"verdict":"change","target_ids":["<the COMPLETE set of TRM ids it should be mapped to, from the list above>"],"confidence":"low|medium|high","reasoning":"..."}',
  ].join('\n');

  const { content } = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { model: cfg.model, temperature: cfg.temperature, maxTokens: 500 }
  );
  return extractJsonObject(content);
}

/* ------------------------------------------------------------------ *
 * Candidate processors - one per gap shape. Each returns a recommendation
 * object ready for insertRecommendation(), or null to skip.
 * ------------------------------------------------------------------ */

/**
 * Turn a validated 'change' decision into a recommendation row. Pure, so it
 * can be unit-tested without a database or USAi call.
 */
function buildRealignmentRecommendation(tech, decision, trmById, situationAnalyzed, source) {
  const { toAdd, toRemove, sql } = buildRealignMappingSql(tech.Id, tech.TrmIds, decision.desiredIds);
  if (!toAdd.length && !toRemove.length) return null;
  const label = (id) => {
    const node = trmById.get(Number(id));
    return node ? `"${node.Name}" (Id ${id})` : `missing TRM category (Id ${id})`;
  };
  let recommendedAction = 'remap_mapping';
  if (!toRemove.length) recommendedAction = 'add_mapping';
  else if (!toAdd.length) recommendedAction = 'remove_mapping';

  const parts = [];
  if (toAdd.length) parts.push(`map it to ${toAdd.map(label).join(', ')}`);
  if (toRemove.length) parts.push(`remove its mapping to ${toRemove.map(label).join(', ')}`);

  return {
    source,
    gapType: 'technology_trm_mapping',
    recommendedAction,
    situationAnalyzed,
    gapDescription:
      `IT standard "${tech.Name}" (Id ${tech.Id}, status ${tech.Status || 'unknown'}) is currently mapped to ` +
      `${tech.TrmIds.map(label).join(', ')}, which may not be the best TRM alignment.`,
    recommendedAddition: `Re-align "${tech.Name}": ${parts.join('; ')}. ${decision.reasoning}`.trim(),
    affectedEntityType: 'Technology',
    affectedEntityId: tech.Id,
    affectedEntityName: tech.Name,
    proposedSql: sql,
    confidence: decision.confidence,
  };
}

/**
 * Re-check one already-mapped technology. Always records a review row (so the
 * rotation advances) and returns 1 when a recommendation was written.
 */
async function processRealignTechnology(tech, trmCategories, trmById, cfg) {
  const fingerprint = mappingFingerprint(tech.TrmIds);
  const knownTrmIds = new Set(trmById.keys());
  const currentNodes = tech.TrmIds.map((id) => trmById.get(Number(id))).filter(Boolean);

  const parsed = await decideRealignment({ cfg, tech, currentNodes, allNodes: trmCategories }).catch((err) => {
    console.error('[taxonomy-gap-analyzer] USAi re-alignment failed for technology %s: %s', tech.Id, err.message);
    return undefined;
  });
  // A transport failure is not a verdict: leave the rotation untouched so it is retried next run.
  if (parsed === undefined) return 0;

  const decision = validateRealignmentDecision(parsed, tech.TrmIds, knownTrmIds);
  if (!decision) {
    await recordTechnologyReview({ entityId: tech.Id, fingerprint, verdict: 'undetermined' });
    return 0;
  }
  if (decision.verdict === 'keep') {
    await recordTechnologyReview({
      entityId: tech.Id, fingerprint, verdict: 'keep',
      confidence: decision.confidence, reasoning: decision.reasoning,
    });
    return 0;
  }

  const rec = buildRealignmentRecommendation(
    tech, decision, trmById,
    'Re-alignment review: existing IT standard <-> TRM category mappings (zk_technology_TRM).',
    'test'
  );
  const recommendationId = rec ? await insertRecommendation(rec) : null;
  await recordTechnologyReview({
    entityId: tech.Id, fingerprint, verdict: rec ? 'change' : 'keep',
    confidence: decision.confidence, reasoning: decision.reasoning, recommendationId,
  });
  return rec ? 1 : 0;
}

/**
 * Review one Approved, unmapped technology: skip it when it already has an
 * open recommendation (of any gap type) or was reviewed recently, otherwise
 * write a recommendation and record the review so the rotation advances and
 * a rejected suggestion is not raised again until the interval elapses.
 * `ctx` holds this run's in-memory review state and open-recommendation ids,
 * updated here so later candidates in the same run see this review.
 * Returns the new recommendation Id, or null when skipped.
 */
async function reviewUnmappedTechnology(tech, trmCategories, trmTopLevel, cfg, situationAnalyzed, source, ctx) {
  const id = String(tech.Id);
  const cutoffMs = reviewCutoffMs(Date.now(), REALIGN_INTERVAL_DAYS);
  if (reviewTier(tech, ctx.reviewState.get(id), ctx.openIds, cutoffMs) === null) return null;

  const rec = await processUnmappedTechnology(tech, trmCategories, trmTopLevel, cfg, situationAnalyzed, source);
  const recommendationId = await insertRecommendation(rec);
  ctx.openIds.add(id);
  const fingerprint = mappingFingerprint([]);
  await recordTechnologyReview({
    entityId: tech.Id,
    fingerprint,
    verdict: rec.proposedSql.startsWith('-- MANUAL REVIEW') ? 'undetermined' : 'change',
    confidence: rec.confidence,
    reasoning: rec.recommendedAddition,
    recommendationId,
  });
  ctx.reviewState.set(id, { fingerprint, reviewedMs: Date.now() });
  return recommendationId;
}

async function processUnmappedTechnology(tech, trmCategories, trmTopLevel, cfg, situationAnalyzed, source) {
  const decision = await decideMappingTarget({
    cfg,
    kind: 'technology_trm_mapping',
    entityName: tech.Name,
    entityDescription: tech.Description,
    allNodes: trmCategories,
    topLevelNodes: trmTopLevel,
  }).catch((err) => {
    console.error('[taxonomy-gap-analyzer] USAi decision failed for technology %s: %s', tech.Id, err.message);
    return null;
  });

  if (!decision) {
    return {
      source,
      gapType: 'technology_trm_mapping',
      recommendedAction: 'add_mapping',
      situationAnalyzed,
      gapDescription: `Approved IT standard "${tech.Name}" (Id ${tech.Id}) has no Technology Reference Model category mapping.`,
      recommendedAddition: 'Could not confidently determine a fitting TRM category or new-category parent; needs manual research.',
      affectedEntityType: 'Technology',
      affectedEntityId: tech.Id,
      affectedEntityName: tech.Name,
      proposedSql: buildManualReviewPlaceholderSql(`Unable to ground a TRM category match for "${tech.Name}".`),
      confidence: 'low',
    };
  }

  if (decision.decision === 'map_existing') {
    return {
      source,
      gapType: 'technology_trm_mapping',
      recommendedAction: 'add_mapping',
      situationAnalyzed,
      gapDescription: `Approved IT standard "${tech.Name}" (Id ${tech.Id}) has no Technology Reference Model category mapping.`,
      recommendedAddition:
        `Map "${tech.Name}" to the existing TRM category "${decision.targetName}" (Id ${decision.targetId}). ${decision.reasoning}`,
      affectedEntityType: 'Technology',
      affectedEntityId: tech.Id,
      affectedEntityName: tech.Name,
      proposedSql: buildAddMappingSql('technology_trm_mapping', decision.targetId, tech.Id),
      confidence: decision.confidence,
    };
  }

  return {
    source,
    gapType: 'trm_category',
    recommendedAction: 'add_node',
    situationAnalyzed,
    gapDescription:
      `Approved IT standard "${tech.Name}" (Id ${tech.Id}) has no Technology Reference Model category mapping, ` +
      `and no existing TRM category fits it.`,
    recommendedAddition:
      `Create a new TRM category "${decision.newNodeName}" under existing parent "${decision.parentName}" ` +
      `(Id ${decision.parentId}), then map "${tech.Name}" to it. ${decision.reasoning}`,
    affectedEntityType: 'Technology',
    affectedEntityId: tech.Id,
    affectedEntityName: tech.Name,
    proposedParentName: decision.parentName,
    proposedParentExists: 1,
    proposedSql: buildAddNodeSql({
      gapType: 'technology_trm_mapping',
      name: decision.newNodeName,
      description: decision.newNodeDescription,
      level: 3,
      parentId: decision.parentId,
      entityId: tech.Id,
    }),
    confidence: decision.confidence,
  };
}

async function processUnmappedSystem(system, capabilities, capTopLevel, cfg, situationAnalyzed, source) {
  if (await hasExistingRecommendation('system_capability_mapping', 'System', system.Id)) return null;

  const decision = await decideMappingTarget({
    cfg,
    kind: 'system_capability_mapping',
    entityName: system.Name,
    entityDescription: system.Description,
    allNodes: capabilities,
    topLevelNodes: capTopLevel,
  }).catch((err) => {
    console.error('[taxonomy-gap-analyzer] USAi decision failed for system %s: %s', system.Id, err.message);
    return null;
  });

  if (!decision) {
    return {
      source,
      gapType: 'system_capability_mapping',
      recommendedAction: 'add_mapping',
      situationAnalyzed,
      gapDescription: `Active business system "${system.Name}" (Id ${system.Id}) has no Business Capability mapping.`,
      recommendedAddition: 'Could not confidently determine a fitting Business Capability or new-capability parent; needs manual research.',
      affectedEntityType: 'System',
      affectedEntityId: system.Id,
      affectedEntityName: system.Name,
      proposedSql: buildManualReviewPlaceholderSql(`Unable to ground a Business Capability match for "${system.Name}".`),
      confidence: 'low',
    };
  }

  if (decision.decision === 'map_existing') {
    return {
      source,
      gapType: 'system_capability_mapping',
      recommendedAction: 'add_mapping',
      situationAnalyzed,
      gapDescription: `Active business system "${system.Name}" (Id ${system.Id}) has no Business Capability mapping.`,
      recommendedAddition:
        `Map "${system.Name}" to the existing Business Capability "${decision.targetName}" (Id ${decision.targetId}). ${decision.reasoning}`,
      affectedEntityType: 'System',
      affectedEntityId: system.Id,
      affectedEntityName: system.Name,
      proposedSql: buildAddMappingSql('system_capability_mapping', decision.targetId, system.Id),
      confidence: decision.confidence,
    };
  }

  return {
    source,
    gapType: 'business_capability',
    recommendedAction: 'add_node',
    situationAnalyzed,
    gapDescription:
      `Active business system "${system.Name}" (Id ${system.Id}) has no Business Capability mapping, ` +
      `and no existing Business Capability fits it.`,
    recommendedAddition:
      `Create a new Business Capability "${decision.newNodeName}" under existing parent "${decision.parentName}" ` +
      `(Id ${decision.parentId}), then map "${system.Name}" to it. ${decision.reasoning}`,
    affectedEntityType: 'System',
    affectedEntityId: system.Id,
    affectedEntityName: system.Name,
    proposedParentName: decision.parentName,
    proposedParentExists: 1,
    proposedSql: buildAddNodeSql({
      gapType: 'system_capability_mapping',
      name: decision.newNodeName,
      description: decision.newNodeDescription,
      level: 2,
      parentId: decision.parentId,
      entityId: system.Id,
    }),
    confidence: decision.confidence,
  };
}

/** Exact-name duplicates never need an LLM call: the gap is structurally certain. */
function processDuplicateTrmPair(pair, situationAnalyzed, source) {
  return {
    source,
    gapType: 'trm_category',
    recommendedAction: 'remove_node',
    situationAnalyzed,
    gapDescription: `Two TRM categories share the exact same name "${pair.NameA}": Id ${pair.IdA} and Id ${pair.IdB}.`,
    recommendedAddition:
      `Merge the duplicate (Id ${pair.IdB}) into the older node (Id ${pair.IdA}): re-parent any children of ` +
      `Id ${pair.IdB} onto Id ${pair.IdA}, re-map any technologies currently mapped to Id ${pair.IdB} onto ` +
      `Id ${pair.IdA}, then delete Id ${pair.IdB}. Review both records first to confirm Id ${pair.IdA} should ` +
      `be the survivor, not Id ${pair.IdB}.`,
    affectedEntityType: 'TRM',
    affectedEntityId: pair.IdB,
    affectedEntityName: pair.NameB,
    childNodeHandling:
      `Any child category whose obj_technology_category_Parent_Id = ${pair.IdB} is re-parented to ${pair.IdA}; ` +
      `any technology mapped to ${pair.IdB} via zk_technology_TRM is re-mapped to ${pair.IdA}.`,
    proposedSql: buildRemoveNodeMergeSql('trm_category', pair.IdA, pair.IdB),
    confidence: 'medium',
  };
}

function processDuplicateCapabilityPair(pair, situationAnalyzed, source) {
  return {
    source,
    gapType: 'business_capability',
    recommendedAction: 'remove_node',
    situationAnalyzed,
    gapDescription: `Two Business Capabilities share the exact same name "${pair.NameA}": Id ${pair.IdA} and Id ${pair.IdB}.`,
    recommendedAddition:
      `Merge the duplicate (Id ${pair.IdB}) into the older node (Id ${pair.IdA}): re-parent any children of ` +
      `Id ${pair.IdB} onto Id ${pair.IdA}, re-map any systems currently mapped to Id ${pair.IdB} onto Id ${pair.IdA}, ` +
      `then delete Id ${pair.IdB}. Review both records first to confirm Id ${pair.IdA} should be the survivor.`,
    affectedEntityType: 'Capability',
    affectedEntityId: pair.IdB,
    affectedEntityName: pair.NameB,
    childNodeHandling:
      `Any child capability whose Parent_Id = ${pair.IdB} is re-parented to ${pair.IdA}; any system mapped to ` +
      `${pair.IdB} via zk_systems_subsystems_capabilities is re-mapped to ${pair.IdA}.`,
    proposedSql: buildRemoveNodeMergeSql('business_capability', pair.IdA, pair.IdB),
    confidence: 'medium',
  };
}

/* ------------------------------------------------------------------ *
 * Signal dispatch: turn a captured gear_log.taxonomy_gap_signal row into a
 * recommendation using the same processors as the structural scan.
 * ------------------------------------------------------------------ */

async function processSignal(signal, trmCategories, trmTopLevel, capabilities, capTopLevel, cfg, ctx) {
  const situationAnalyzed = `Chat question: "${signal.Query_Text || '(not recorded)'}"`;

  if (
    signal.Signal_Type === 'technology_incomplete_trm_mapping' &&
    (signal.Entity_Name || signal.Entity_Id != null)
  ) {
    // Resolve the signal to a real record so it is deduplicated against the
    // structural scan by Id. Only Approved, still-unmapped standards are in
    // scope; mapped ones are covered by the re-alignment review instead.
    // Throwing leaves the signal unprocessed so it is retried next run.
    if (!ctx) throw new Error('technology review state unavailable');
    const tech = await fetchTechnologyForSignal({ id: signal.Entity_Id, name: signal.Entity_Name });
    if (!tech || tech.MappedCount > 0 || String(tech.Status || '').toLowerCase() !== 'approved') return null;
    // reviewUnmappedTechnology inserts the row itself (or skips when already covered).
    return {
      alreadyInserted: true,
      recommendationId: await reviewUnmappedTechnology(
        tech, trmCategories, trmTopLevel, cfg, situationAnalyzed, signal.Source, ctx
      ),
    };
  }

  if (signal.Signal_Type === 'system_no_capability_mapping' && signal.Entity_Id != null) {
    return processUnmappedSystem(
      { Id: signal.Entity_Id, Name: signal.Entity_Name || `System ${signal.Entity_Id}`, Description: null },
      capabilities,
      capTopLevel,
      cfg,
      situationAnalyzed,
      signal.Source
    );
  }

  if (signal.Signal_Type === 'trm_category_not_found_for_query' && signal.Entity_Name) {
    // The user asked about a technology TYPE with no matching TRM category at
    // all - this is a candidate add_node without a specific item to attach,
    // so it is recorded for human judgment rather than auto-decided.
    return {
      source: signal.Source,
      gapType: 'trm_category',
      recommendedAction: 'add_node',
      situationAnalyzed,
      gapDescription: `A user asked about "${signal.Entity_Name}" as a technology type, and GEAR has no matching TRM category.`,
      recommendedAddition:
        `Consider whether GEAR's TRM taxonomy should gain a category for "${signal.Entity_Name}". Repeated ` +
        `occurrences of this signal for the same term strengthen the case; review before creating.`,
      affectedEntityType: 'TRM',
      affectedEntityName: signal.Entity_Name,
      proposedSql: buildManualReviewPlaceholderSql(
        `No specific technology item to attach; human must decide the right parent/level for a new ` +
          `"${signal.Entity_Name}" TRM category, if warranted.`
      ),
      confidence: 'low',
    };
  }

  // technology_not_in_inventory: an SRR/intake gap, not a taxonomy gap - no
  // recommendation row is produced, but the signal is still marked processed
  // below so it does not accumulate forever.
  return null;
}

/* ------------------------------------------------------------------ *
 * Orchestration
 * ------------------------------------------------------------------ */

/**
 * Run the full nightly analysis: structural scan + pending signals.
 * Safe to call from a cron schedule or the CLI. Tolerates individual
 * candidate failures so one bad row cannot abort the whole run.
 *
 * @returns {Promise<object>} Summary counters.
 */
async function runNightlyAnalysis() {
  if (analysisRunning) {
    console.error('[taxonomy-gap-analyzer] already running; skipping this trigger');
    return { skipped: true, reason: 'already_running' };
  }
  analysisRunning = true;
  const startedAt = Date.now();
  const summary = { recommendations: 0, signalsProcessed: 0, errors: [] };

  try {
    const cfg = loadConfig();

    const [trmCategories, capabilities] = await Promise.all([
      fetchTrmCategories(),
      fetchCapabilities(),
    ]);
    const trmTopLevel = trmCategories.filter((n) => Number(n.Level) <= 2);
    const capTopLevel = capabilities.filter((n) => Number(n.Level) <= 1);

    // 1. Structural scan: Approved technologies with no TRM mapping. Already
    // covered or recently reviewed ones are filtered out BEFORE the cap, so
    // each run moves on to standards that have not been looked at yet.
    let techCtx = null;
    try {
      const [techReviewState, techOpenIds] = await Promise.all([
        fetchTechnologyReviewState(),
        fetchOpenRecommendationEntityIds('Technology'),
      ]);
      techCtx = { reviewState: techReviewState, openIds: techOpenIds };
    } catch (err) {
      // Without rotation state every technology would look never-reviewed and
      // be re-recommended, so technology steps are skipped rather than guessed.
      summary.errors.push({ stage: 'technology_review_state', error: err.message });
    }
    const unmappedTech = techCtx ? await fetchUnmappedApprovedTechnologies() : [];
    const dueUnmapped = techCtx
      ? selectDueForReview(unmappedTech, techCtx.reviewState, techCtx.openIds, {
          limit: MAX_STRUCTURAL_TECH_PER_RUN,
          intervalDays: REALIGN_INTERVAL_DAYS,
          nowMs: Date.now(),
        })
      : [];
    summary.unmappedReviewed = 0;
    for (const tech of dueUnmapped) {
      try {
        const recommendationId = await reviewUnmappedTechnology(
          tech, trmCategories, trmTopLevel, cfg,
          'Nightly structural scan: Approved IT standards with zero TRM category mapping.',
          'test', techCtx
        );
        if (recommendationId != null) summary.recommendations++;
        summary.unmappedReviewed++;
      } catch (err) {
        summary.errors.push({ stage: 'unmapped_technology', id: tech.Id, error: err.message });
      }
    }

    // 1b. Re-alignment review: re-check EXISTING technology<->TRM mappings in rotation.
    if (techCtx && MAX_REALIGN_PER_RUN > 0) {
      try {
        const trmById = new Map(trmCategories.map((n) => [Number(n.Id), n]));
        const mappedTech = await fetchMappedTechnologies();
        const due = selectDueForReview(mappedTech, techCtx.reviewState, techCtx.openIds, {
          limit: MAX_REALIGN_PER_RUN,
          intervalDays: REALIGN_INTERVAL_DAYS,
          nowMs: Date.now(),
        });
        summary.realignmentReviewed = 0;
        for (const tech of due) {
          try {
            summary.recommendations += await processRealignTechnology(tech, trmCategories, trmById, cfg);
            summary.realignmentReviewed++;
          } catch (err) {
            summary.errors.push({ stage: 'realign_technology', id: tech.Id, error: err.message });
          }
        }
      } catch (err) {
        summary.errors.push({ stage: 'realign_technology_setup', error: err.message });
      }
    }

    // 2. Structural scan: active business systems with no Capability mapping.
    const unmappedSystems = await fetchUnmappedActiveSystems(MAX_STRUCTURAL_SYSTEMS_PER_RUN);
    for (const system of unmappedSystems) {
      try {
        const rec = await processUnmappedSystem(
          system, capabilities, capTopLevel, cfg,
          'Nightly structural scan: active business-application systems with zero Business Capability mapping.',
          'test'
        );
        if (rec) {
          await insertRecommendation(rec);
          summary.recommendations++;
        }
      } catch (err) {
        summary.errors.push({ stage: 'unmapped_system', id: system.Id, error: err.message });
      }
    }

    // 3. Structural scan: exact-duplicate-named TRM categories / Capabilities.
    // No LLM call needed - the gap is structurally certain.
    const dupTrm = await fetchDuplicateTrmCategories();
    for (const pair of dupTrm) {
      try {
        if (await hasExistingRecommendation('trm_category', 'TRM', pair.IdB)) continue;
        const rec = processDuplicateTrmPair(
          pair, 'Nightly structural scan: TRM categories with identical names.', 'test'
        );
        await insertRecommendation(rec);
        summary.recommendations++;
      } catch (err) {
        summary.errors.push({ stage: 'duplicate_trm', ids: [pair.IdA, pair.IdB], error: err.message });
      }
    }

    const dupCap = await fetchDuplicateCapabilities();
    for (const pair of dupCap) {
      try {
        if (await hasExistingRecommendation('business_capability', 'Capability', pair.IdB)) continue;
        const rec = processDuplicateCapabilityPair(
          pair, 'Nightly structural scan: Business Capabilities with identical names.', 'test'
        );
        await insertRecommendation(rec);
        summary.recommendations++;
      } catch (err) {
        summary.errors.push({ stage: 'duplicate_capability', ids: [pair.IdA, pair.IdB], error: err.message });
      }
    }

    // 4. Pending signals captured inline by the chatbot during the day.
    const signals = await fetchPendingSignals(MAX_SIGNALS_PER_RUN);
    // Group by (Signal_Type, Entity_Type, Entity_Id, Entity_Name) so repeated
    // chat questions about the same gap produce one recommendation, not many.
    const groups = new Map();
    for (const s of signals) {
      const key = `${s.Signal_Type}|${s.Entity_Type || ''}|${s.Entity_Id || ''}|${s.Entity_Name || ''}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    }

    for (const [, group] of groups) {
      const representative = group[0];
      try {
        const rec = await processSignal(representative, trmCategories, trmTopLevel, capabilities, capTopLevel, cfg, techCtx);
        let recommendationId = null;
        if (rec && rec.alreadyInserted) {
          recommendationId = rec.recommendationId;
          if (recommendationId != null) summary.recommendations++;
        } else if (rec) {
          recommendationId = await insertRecommendation(rec);
          summary.recommendations++;
        }
        await markSignalsProcessed(group.map((s) => s.Id), recommendationId);
        summary.signalsProcessed += group.length;
      } catch (err) {
        summary.errors.push({ stage: 'signal_group', entityName: representative.Entity_Name, error: err.message });
      }
    }

    summary.durationMs = Date.now() - startedAt;
    console.error('[taxonomy-gap-analyzer] run complete %j', summary);
    return summary;
  } finally {
    analysisRunning = false;
  }
}

module.exports = {
  runNightlyAnalysis,
  // Exported for unit testing - pure functions, no I/O.
  extractJsonObject,
  buildAddMappingSql,
  buildAddNodeSql,
  buildRemoveNodeMergeSql,
  buildManualReviewPlaceholderSql,
  sqlString,
  mappingFingerprint,
  selectDueForReview,
  reviewTier,
  buildRealignMappingSql,
  validateRealignmentDecision,
  buildRealignmentRecommendation,
};
