/**
 * Prompt cache backed by gear_log.ai_log in MySQL.
 *
 * Schema (new columns added):
 *   gear_log.ai_log (
 *     id            INT AUTO_INCREMENT,
 *     DTG           TIMESTAMP,
 *     event         LONGTEXT,      -- JSON metadata (type, prompt_hash, tool_calls)
 *     Prompt        LONGTEXT,      -- raw normalized prompt text
 *     Response      LONGTEXT,      -- AI reply text
 *     Response_Time VARCHAR(64),   -- e.g. "1234ms"
 *     Tokens_Used   VARCHAR(64)    -- e.g. "512"
 *   )
 *
 * Cache TTL: 7 days. Entries older than 7 days are ignored and replaced.
 * Similarity lookup: exact hash match first; new rows also stored in Prompt
 * column so a future FULLTEXT index can do fuzzy matching.
 */

const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const asyncMysql = require('mysql2/promise');
const fs = require('fs');

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
 * Returns { reply, toolCalls } on a cache hit, or null on a miss.
 *
 * @param {string} prompt  Raw user prompt or search keyword.
 * @param {'chat'|'overview'} type
 * @returns {Promise<{reply:string, toolCalls:Array}|null>}
 */
async function lookup(prompt, type) {
  try {
    const normalized = normalize(prompt);
    const hash = hashPrompt(normalized);
    const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const db = getPool();
    const [rows] = await db.execute(
      `SELECT id, event, Response FROM gear_log.ai_log
       WHERE JSON_UNQUOTE(JSON_EXTRACT(event, '$.prompt_hash')) = ?
         AND JSON_UNQUOTE(JSON_EXTRACT(event, '$.type')) = ?
         AND DTG >= ?
         AND Response IS NOT NULL
       ORDER BY DTG DESC
       LIMIT 1`,
      [hash, type, cutoff]
    );

    if (!rows || rows.length === 0) return null;

    // Prefer the dedicated Response column; fall back to event JSON for
    // rows written before the schema migration.
    let reply = rows[0].Response || null;
    let toolCalls = [];

    if (!reply) {
      try {
        const entry = JSON.parse(rows[0].event);
        reply = entry && entry.reply ? entry.reply : null;
        toolCalls = entry && entry.tool_calls ? entry.tool_calls : [];
      } catch (_) {
        return null;
      }
    } else {
      try {
        const entry = JSON.parse(rows[0].event);
        toolCalls = entry && entry.tool_calls ? entry.tool_calls : [];
      } catch (_) {}
    }

    if (!reply) return null;

    console.error('[prompt-cache] HIT type=%s hash=%s', type, hash.slice(0, 16));
    return { reply, toolCalls };
  } catch (err) {
    console.error('[prompt-cache] lookup error:', err.message);
    return null;
  }
}

/**
 * Save a prompt + reply to the cache, including perf metrics.
 *
 * @param {string} prompt
 * @param {'chat'|'overview'} type
 * @param {string} reply
 * @param {Array}  toolCalls
 * @param {object} [metrics]
 * @param {number} [metrics.responseTimeMs]  Wall-clock ms for the full AI call
 * @param {number} [metrics.tokensUsed]      Total tokens from usage.total_tokens
 */
async function save(prompt, type, reply, toolCalls, metrics = {}) {
  try {
    const normalized = normalize(prompt);
    const hash = hashPrompt(normalized);
    const db = getPool();

    const event = JSON.stringify({
      type,
      prompt_hash: hash,
      tool_calls: toolCalls || [],
    });

    const responseTime = metrics.responseTimeMs != null
      ? `${metrics.responseTimeMs}ms`
      : null;

    const tokensUsed = metrics.tokensUsed != null
      ? String(metrics.tokensUsed)
      : null;

    await db.execute(
      `INSERT INTO gear_log.ai_log (DTG, event, Prompt, Response, Response_Time, Tokens_Used)
       VALUES (NOW(), ?, ?, ?, ?, ?)`,
      [event, normalized, reply, responseTime, tokensUsed]
    );

    console.error(
      '[prompt-cache] SAVED type=%s hash=%s time=%s tokens=%s',
      type, hash.slice(0, 16), responseTime, tokensUsed
    );
  } catch (err) {
    console.error('[prompt-cache] save error:', err.message);
  }
}

module.exports = { lookup, save, normalize };

