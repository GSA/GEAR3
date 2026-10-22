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
 * Schema:
 *   gear_log.ai_log (
 *     id            INT AUTO_INCREMENT,
 *     DTG           TIMESTAMP,
 *     event         LONGTEXT,      -- JSON: type, prompt_hash, tool_calls, follow_up, turn_index
 *     Prompt        LONGTEXT,      -- normalized prompt text  (FULLTEXT indexed)
 *     Response      LONGTEXT,      -- AI reply text
 *     Response_Time VARCHAR(64),   -- e.g. "1234ms"
 *     Tokens_Used   VARCHAR(64)    -- e.g. "512"
 *   )
 *
 * Run once in MySQL to add the FULLTEXT index (if not already present):
 *   ALTER TABLE gear_log.ai_log ADD FULLTEXT INDEX ft_prompt (Prompt);
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
 * Look up a cached reply for a prompt.
 * Checks L1 (LRU) first, then L2 (MySQL exact hash + FULLTEXT similarity).
 * Returns { reply, toolCalls } on a hit, or null on a miss.
 *
 * @param {string} prompt  Raw user prompt or search keyword.
 * @param {'chat'|'overview'} type
 * @returns {Promise<{reply:string, toolCalls:Array}|null>}
 */
async function lookup(prompt, type) {
  try {
    const normalized = normalize(prompt);
    const hash = hashPrompt(normalized);

    // ── L1 check ──────────────────────────────────────────────────────────
    const l1Key = `${type}:${hash}`;
    const l1Hit = l1.get(l1Key);
    if (l1Hit) {
      console.error('[prompt-cache] L1 HIT type=%s hash=%s', type, hash.slice(0, 16));
      return l1Hit;
    }

    // ── L2 check (MySQL) ───────────────────────────────────────────────────
    const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const db = getPool();

    // 1. Exact hash match (fast path — uses prompt_hash in event JSON).
    const [exactRows] = await db.execute(
      `SELECT id, event, Response FROM gear_log.ai_log
       WHERE JSON_UNQUOTE(JSON_EXTRACT(event, '$.prompt_hash')) = ?
         AND JSON_UNQUOTE(JSON_EXTRACT(event, '$.type')) = ?
         AND (JSON_EXTRACT(event, '$.follow_up') IS NULL OR JSON_EXTRACT(event, '$.follow_up') = false)
         AND DTG >= ?
         AND Response IS NOT NULL
         AND (Feedback IS NULL OR Feedback != 'down')
       ORDER BY DTG DESC
       LIMIT 1`,
      [hash, type, cutoff]
    );

    if (exactRows && exactRows.length > 0) {
      const result = _extractResult(exactRows[0]);
      if (result) {
        l1.set(l1Key, result); // populate L1
        console.error('[prompt-cache] L2 exact HIT type=%s hash=%s', type, hash.slice(0, 16));
        return result;
      }
    }

    // 2. FULLTEXT similarity match (catches near-duplicate phrasing).
    //    Requires: ALTER TABLE gear_log.ai_log ADD FULLTEXT INDEX ft_prompt (Prompt);
    try {
      const [ftRows] = await db.execute(
        `SELECT id, event, Response,
                MATCH(Prompt) AGAINST (? IN NATURAL LANGUAGE MODE) AS score
         FROM gear_log.ai_log
         WHERE MATCH(Prompt) AGAINST (? IN NATURAL LANGUAGE MODE)
           AND JSON_UNQUOTE(JSON_EXTRACT(event, '$.type')) = ?
           AND (JSON_EXTRACT(event, '$.follow_up') IS NULL OR JSON_EXTRACT(event, '$.follow_up') = false)
           AND DTG >= ?
           AND Response IS NOT NULL
           AND (Feedback IS NULL OR Feedback != 'down')
         ORDER BY score DESC
         LIMIT 1`,
        [normalized, normalized, type, cutoff]
      );

      if (ftRows && ftRows.length > 0 && ftRows[0].score > 0) {
        const result = _extractResult(ftRows[0]);
        if (result) {
          l1.set(l1Key, result); // populate L1
          console.error('[prompt-cache] L2 FULLTEXT HIT type=%s hash=%s score=%s',
            type, hash.slice(0, 16), ftRows[0].score.toFixed(3));
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

/** Extract { reply, toolCalls, logId } from a DB row. */
function _extractResult(row) {
  let reply = row.Response || null;
  let toolCalls = [];
  try {
    const entry = JSON.parse(row.event);
    if (!reply && entry && entry.reply) reply = entry.reply;
    if (entry && entry.tool_calls) toolCalls = entry.tool_calls;
  } catch (_) {}
  return reply ? { reply, toolCalls, logId: row.id ?? null } : null;
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
    const db = getPool();

    const event = JSON.stringify({
      type,
      prompt_hash: hash,
      tool_calls: toolCalls || [],
      follow_up: isFollowUp || false,
      turn_index: metrics.turnIndex ?? null,
    });

    const responseTime = metrics.responseTimeMs != null
      ? `${metrics.responseTimeMs}ms`
      : null;

    const tokensUsed = metrics.tokensUsed != null
      ? String(metrics.tokensUsed)
      : null;

    const [insertResult] = await db.execute(
      `INSERT INTO gear_log.ai_log (DTG, event, Prompt, Response, Response_Time, Tokens_Used)
       VALUES (NOW(), ?, ?, ?, ?, ?)`,
      [event, normalized, reply, responseTime, tokensUsed]
    );
    const insertedId = insertResult ? insertResult.insertId : null;

    // Populate L1 for first-turn entries so the very next identical request
    // is served from memory without touching MySQL.
    if (!isFollowUp) {
      const l1Key = `${type}:${hash}`;
      l1.set(l1Key, { reply, toolCalls: toolCalls || [], logId: insertedId });
    }

    return insertedId;

    console.error(
      '[prompt-cache] %s type=%s hash=%s time=%s tokens=%s id=%s',
      isFollowUp ? 'LOGGED' : 'SAVED',
      type, hash.slice(0, 16), responseTime, tokensUsed, insertedId
    );
  } catch (err) {
    console.error('[prompt-cache] write error:', err.message);
  }
  return null;
}

/**
 * Record feedback (thumbs up/down) for a logged response.
 * @param {number} id  The ai_log row id.
 * @param {'up'|'down'} feedback
 */
async function saveFeedback(id, feedback) {
  try {
    const db = getPool();
    await db.execute(
      `UPDATE gear_log.ai_log SET Feedback = ? WHERE id = ?`,
      [feedback, id]
    );
    // Invalidate L1 cache for this entry if it was thumbed down
    // (we cannot easily reverse-lookup the key here, but the lookup
    // query already filters Feedback='down' from MySQL, so L1 expiry
    // in 10 min is acceptable.)
    console.error('[prompt-cache] FEEDBACK id=%s feedback=%s', id, feedback);
  } catch (err) {
    console.error('[prompt-cache] saveFeedback error:', err.message);
  }
}

module.exports = { lookup, save, log, normalize, saveFeedback };

