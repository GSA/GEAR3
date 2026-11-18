/**
 * Zero-latency taxonomy-gap signal capture.
 *
 * This module's ONLY job is to fire a non-blocking INSERT into
 * gear_log.taxonomy_gap_signal when the chat orchestrator's fast-paths notice
 * something that might indicate a taxonomy gap - e.g. a searched product has
 * no TRM mapping, or a "what <type> software" question resolved to no TRM
 * category at all. Every exported function:
 *
 *   - Takes only data the caller already has in hand (no extra DB/API calls,
 *     no USAi calls, no reasoning).
 *   - Returns a Promise that the caller MUST NOT await on the response path.
 *     Call it, then immediately `.catch(() => {})` (mirroring the existing
 *     cacheLog()/cacheSave() fire-and-forget pattern in chat-orchestrator.js)
 *     and move on. A slow or failing write here must never delay or fail a
 *     user's chat response.
 *
 * All the actual reasoning - resolving whether a gap is real, drafting
 * Proposed_SQL, deciding Recommended_Action - happens later and entirely out
 * of the request path, in the nightly mcp/taxonomy-gap-analyzer.js batch job,
 * which reads unprocessed rows from this table.
 *
 * Writes only to gear_log.taxonomy_gap_signal, enforced by ./db-guard.js like
 * every other AI-layer write path (prompt-cache.js, vector-store.js).
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const asyncMysql = require('mysql2/promise');
const { guardPool } = require('./db-guard');

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
    pool = guardPool(asyncMysql.createPool(dbConfig), {
      defaultSchema: 'gear_log',
      label: 'taxonomy-gap-signals',
    });
  }
  return pool;
}

/** Valid Signal_Type values, mirrored from the DDL's ENUM for a fast-fail check. */
const SIGNAL_TYPES = new Set([
  'technology_not_in_inventory',
  'technology_incomplete_trm_mapping',
  'trm_category_not_found_for_query',
  'system_no_capability_mapping',
  'system_incomplete_capability_mapping',
]);

/**
 * Record one taxonomy-gap signal. Fire-and-forget: callers must not await
 * this in a way that blocks a response; always chain `.catch(() => {})`.
 *
 * @param {object} signal
 * @param {'technology_not_in_inventory'|'technology_incomplete_trm_mapping'|'trm_category_not_found_for_query'|'system_no_capability_mapping'|'system_incomplete_capability_mapping'} signal.signalType
 * @param {string} [signal.queryText] The user question/search term, capped at 500 chars.
 * @param {string} [signal.entityType] e.g. 'Technology', 'System', 'TRM'.
 * @param {string|number} [signal.entityId]
 * @param {string} [signal.entityName]
 * @param {object} [signal.context] Small plain-object of data already in hand; JSON-stringified as-is.
 * @param {'user'|'developer'|'test'} [signal.source]
 * @returns {Promise<number|null>} The inserted row's Id, or null on failure.
 */
async function recordSignal(signal) {
  try {
    const {
      signalType,
      queryText,
      entityType,
      entityId,
      entityName,
      context,
      source,
    } = signal || {};

    if (!SIGNAL_TYPES.has(signalType)) {
      console.error('[taxonomy-gap-signals] dropped: unknown signalType "%s"', signalType);
      return null;
    }

    const resolvedSource = ['user', 'developer', 'test'].includes(source) ? source : 'user';
    const contextJson = context ? JSON.stringify(context).slice(0, 4000) : null;

    const db = getPool();
    const [result] = await db.execute(
      `INSERT INTO gear_log.taxonomy_gap_signal
         (Signal_Type, Source, Query_Text, Entity_Type, Entity_Id, Entity_Name, Context_Json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        signalType,
        resolvedSource,
        queryText ? String(queryText).slice(0, 500) : null,
        entityType ? String(entityType).slice(0, 64) : null,
        entityId != null ? String(entityId).slice(0, 64) : null,
        entityName ? String(entityName).slice(0, 255) : null,
        contextJson,
      ]
    );
    return result ? result.insertId : null;
  } catch (err) {
    // Never throw into the chat response path - this is best-effort telemetry.
    console.error('[taxonomy-gap-signals] write error (non-fatal):', err.message);
    return null;
  }
}

module.exports = {
  recordSignal,
  SIGNAL_TYPES,
  getPool,
};
