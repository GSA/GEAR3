/**
 * Prompt cache backed by gear_log.ai_log in MySQL.
 *
 * Schema used:
 *   gear_log.ai_log (id INT AUTO_INCREMENT, DTG TIMESTAMP, event LONGTEXT)
 *
 * The `event` column stores a JSON string:
 *   {
 *     "type":        "chat" | "overview",
 *     "prompt_hash": "<sha256 hex>",
 *     "prompt":      "<normalized prompt>",
 *     "reply":       "<cached reply text>",
 *     "tool_calls":  [...]   // only for type=chat
 *   }
 *
 * Cache TTL: 7 days. Entries older than 7 days are ignored and replaced.
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
      `SELECT id, event FROM gear_log.ai_log
       WHERE JSON_UNQUOTE(JSON_EXTRACT(event, '$.prompt_hash')) = ?
         AND JSON_UNQUOTE(JSON_EXTRACT(event, '$.type')) = ?
         AND DTG >= ?
       ORDER BY DTG DESC
       LIMIT 1`,
      [hash, type, cutoff]
    );

    if (!rows || rows.length === 0) return null;

    const entry = JSON.parse(rows[0].event);
    if (!entry || !entry.reply) return null;

    // Fire-and-forget: log this as a cache hit event.
    logEvent(db, `ai_cache_hit:${type}:${hash.slice(0, 16)}`).catch(() => {});

    console.error('[prompt-cache] HIT type=%s hash=%s', type, hash.slice(0, 16));
    return { reply: entry.reply, toolCalls: entry.tool_calls || [] };
  } catch (err) {
    // Cache errors must never break the chat flow.
    console.error('[prompt-cache] lookup error:', err.message);
    return null;
  }
}

/**
 * Save a prompt + reply to the cache.
 *
 * @param {string} prompt
 * @param {'chat'|'overview'} type
 * @param {string} reply
 * @param {Array} toolCalls
 */
async function save(prompt, type, reply, toolCalls) {
  try {
    const normalized = normalize(prompt);
    const hash = hashPrompt(normalized);
    const db = getPool();

    const entry = JSON.stringify({
      type,
      prompt_hash: hash,
      prompt: normalized,
      reply,
      tool_calls: toolCalls || [],
    });

    await db.execute(
      `INSERT INTO gear_log.ai_log (DTG, event) VALUES (NOW(), ?)`,
      [entry]
    );

    console.error('[prompt-cache] SAVED type=%s hash=%s', type, hash.slice(0, 16));
  } catch (err) {
    console.error('[prompt-cache] save error:', err.message);
  }
}

/**
 * Insert a plain audit event into gear_log.event table.
 * Used internally for cache-hit logging.
 */
async function logEvent(db, eventText) {
  await db.execute(
    `INSERT INTO gear_log.event (event, DTG) VALUES (?, NOW())`,
    [eventText]
  );
}

module.exports = { lookup, save, normalize };
