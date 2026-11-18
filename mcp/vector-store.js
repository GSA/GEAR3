/**
 * Vector store for GEAR semantic search.
 *
 * Storage: gear_log.search_vectors — one row per searchable GEAR record,
 * holding the embedding as a packed float32 BLOB plus the content hash used for
 * change detection. The app never creates or alters tables: it and
 * search_vectors_staging must be provisioned by a DBA in every environment
 * (see mcp/README.md, "Index storage"). All operations are DML only.
 *
 * Search: the full set of vectors is held in a single Float32Array and scored
 * by brute-force cosine similarity. At GEAR's scale (~7,700 records x 1024
 * dims) that is ~32 MB of memory and a few milliseconds per query, so no
 * approximate-nearest-neighbour index or external vector database is needed.
 * Vectors are L2-normalized on write, which makes cosine similarity a plain
 * dot product at query time. Revisit this approach if the corpus approaches
 * ~100k records.
 *
 * Rebuild safety: a full rebuild writes to a staging table and copies it to
 * the live table in one transaction, so searches never observe a
 * half-populated index.
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const asyncMysql = require('mysql2/promise');

const { EMBEDDING_DIMENSIONS } = require('./usai-client');
const { guardPool } = require('./db-guard');

const VECTOR_SCHEMA = 'gear_log';
const VECTOR_TABLE = 'search_vectors';
const STAGING_TABLE = 'search_vectors_staging';
const QUALIFIED_TABLE = `${VECTOR_SCHEMA}.${VECTOR_TABLE}`;
const QUALIFIED_STAGING = `${VECTOR_SCHEMA}.${STAGING_TABLE}`;

/** How long the in-memory matrix is trusted before reloading from MySQL. */
const CACHE_TTL_MS = Number(process.env.GEAR_VECTOR_CACHE_TTL_MS || 5 * 60 * 1000);

let pool = null;

/**
 * Dedicated pool for gear_log, mirroring prompt-cache.js so the vector store
 * works both inside the API server and in standalone cron/CLI processes.
 *
 * `database: VECTOR_SCHEMA` ('gear_log') is a security boundary: this is the
 * only schema the AI layer may write to. The pool is wrapped by ./db-guard.js,
 * which refuses statements targeting gear_acl or gear_schema, so the vector
 * store cannot reach GEAR's system of record even as this file evolves.
 */
function getPool() {
  if (!pool) {
    pool = guardPool(
      asyncMysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: VECTOR_SCHEMA,
        port: 3306,
        ssl: {
          ca: fs.readFileSync(path.join(__dirname, '..', 'certs', 'ca.pem')),
          key: fs.readFileSync(path.join(__dirname, '..', 'certs', 'client-key.pem')),
          cert: fs.readFileSync(path.join(__dirname, '..', 'certs', 'client-cert.pem')),
        },
      }),
      { defaultSchema: VECTOR_SCHEMA, label: 'vector-store' }
    );
  }
  return pool;
}

/** Columns the live and staging tables must have; a DBA provisions both. */
const REQUIRED_COLUMNS = [
  'entity_type', 'entity_id', 'name', 'description', 'status', 'type_display',
  'content_hash', 'dimensions', 'embedding', 'model', 'updated_at',
];

/** Tables already verified this process, so the check runs once each. */
const verifiedTables = new Set();

/**
 * Confirm a gear_log vector table exists with every required column, or throw.
 *
 * The app never creates or alters tables: in prod its DB user has no DDL
 * rights, so search_vectors and search_vectors_staging must be provisioned by
 * a DBA (see mcp/README.md, "Index storage"). This check is a read against
 * information_schema, which any user can run.
 */
async function assertTableReady(table) {
  if (verifiedTables.has(table)) return;
  const [rows] = await getPool().query(
    `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [VECTOR_SCHEMA, table]
  );
  if (!rows.length) {
    throw new Error(
      `${VECTOR_SCHEMA}.${table} does not exist. The app does not create tables; ` +
        'ask a DBA to provision it (see mcp/README.md, "Index storage").'
    );
  }
  const present = new Set(rows.map((r) => r.c));
  const missing = REQUIRED_COLUMNS.filter((c) => !present.has(c));
  if (missing.length) {
    throw new Error(
      `${VECTOR_SCHEMA}.${table} is missing column(s) ${missing.join(', ')}. ` +
        'The app does not alter tables; ask a DBA to add them (see mcp/README.md, "Index storage").'
    );
  }
  verifiedTables.add(table);
}

async function ensureTable() {
  await assertTableReady(VECTOR_TABLE);
}

/* ------------------------------------------------------------------ *
 * Encoding helpers
 * ------------------------------------------------------------------ */

/** L2-normalize so cosine similarity reduces to a dot product. */
function normalizeVector(vector) {
  const out = new Float32Array(vector.length);
  let sumSquares = 0;
  for (let i = 0; i < vector.length; i++) sumSquares += vector[i] * vector[i];
  const scale = sumSquares > 0 ? 1 / Math.sqrt(sumSquares) : 0;
  for (let i = 0; i < vector.length; i++) out[i] = vector[i] * scale;
  return out;
}

/** Pack a (already normalized) vector into a little-endian float32 Buffer. */
function encodeVector(normalized) {
  const buf = Buffer.allocUnsafe(normalized.length * 4);
  for (let i = 0; i < normalized.length; i++) buf.writeFloatLE(normalized[i], i * 4);
  return buf;
}

/** Unpack a float32 BLOB into a Float32Array. */
function decodeVector(buffer) {
  const count = Math.floor(buffer.length / 4);
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) out[i] = buffer.readFloatLE(i * 4);
  return out;
}

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

/**
 * Insert or update vectors for the given documents.
 *
 * @param {Array<{entityType:string,entityId:string,name:string,status:string,typeDisplay:string,contentHash:string,vector:number[]}>} entries
 * @param {object} [opts]
 * @param {boolean} [opts.staging] Write to the staging table (full rebuild).
 * @param {string}  [opts.model]
 */
async function upsertVectors(entries, opts = {}) {
  if (!entries.length) return 0;
  const db = getPool();
  const target = opts.staging ? QUALIFIED_STAGING : QUALIFIED_TABLE;
  const model = opts.model || 'unknown';

  const CHUNK = 200;
  let written = 0;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    const values = chunk.map((e) => {
      const normalized = normalizeVector(e.vector);
      return [
        e.entityType,
        e.entityId,
        (e.name || '').slice(0, 512),
        e.description || null,
        (e.status || '').slice(0, 128),
        (e.typeDisplay || '').slice(0, 255),
        e.contentHash,
        normalized.length,
        encodeVector(normalized),
        model,
      ];
    });
    await db.query(
      `INSERT INTO ${target}
         (entity_type, entity_id, name, description, status, type_display, content_hash, dimensions, embedding, model)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         status = VALUES(status),
         type_display = VALUES(type_display),
         content_hash = VALUES(content_hash),
         dimensions = VALUES(dimensions),
         embedding = VALUES(embedding),
         model = VALUES(model)`,
      [values]
    );
    written += chunk.length;
  }
  invalidateCache();
  return written;
}

/** Remove vectors for records that no longer exist in GEAR. */
async function deleteVectors(keys) {
  if (!keys.length) return 0;
  const db = getPool();
  let removed = 0;
  const CHUNK = 500;
  for (let i = 0; i < keys.length; i += CHUNK) {
    const chunk = keys.slice(i, i + CHUNK);
    const [res] = await db.query(
      `DELETE FROM ${QUALIFIED_TABLE}
       WHERE (entity_type, entity_id) IN (?)`,
      [chunk.map((k) => [k.entityType, k.entityId])]
    );
    removed += res.affectedRows || 0;
  }
  invalidateCache();
  return removed;
}

/** Content hashes of everything currently stored, keyed "type|id". */
async function loadStoredHashes() {
  await ensureTable();
  const db = getPool();
  const [rows] = await db.query(
    `SELECT entity_type, entity_id, content_hash, model FROM ${QUALIFIED_TABLE}`
  );
  const map = new Map();
  for (const row of rows) {
    map.set(`${row.entity_type}|${row.entity_id}`, {
      contentHash: row.content_hash,
      model: row.model,
    });
  }
  return map;
}

/* ------------------------------------------------------------------ *
 * Full-rebuild staging lifecycle
 *
 * Everything here is DML only (SELECT/INSERT/DELETE). The prod app user has no
 * CREATE, ALTER, or DROP rights, so the original DROP/CREATE/RENAME swap could
 * never run there. gear_log.search_vectors_staging is now a permanent table
 * provisioned by a DBA, and is emptied and refilled rather than recreated.
 * ------------------------------------------------------------------ */

const VECTOR_COLUMNS =
  'entity_type, entity_id, name, description, status, type_display, content_hash, dimensions, embedding, model';

/**
 * Empty the staging table, ready for a full rebuild.
 *
 * DELETE rather than TRUNCATE: MySQL requires the DROP privilege for TRUNCATE.
 */
async function beginFullRebuild() {
  await assertTableReady(VECTOR_TABLE);
  await assertTableReady(STAGING_TABLE);
  await getPool().query(`DELETE FROM ${QUALIFIED_STAGING}`);
}

/**
 * Promote the staging table's contents to live.
 *
 * Replaces the live rows inside one InnoDB transaction instead of an atomic
 * RENAME, which needs ALTER/DROP/CREATE. Readers keep seeing the previous
 * index until COMMIT, and a failure rolls back so the live table is untouched.
 * The staging table is left in place so the next rebuild can reuse it.
 */
async function commitFullRebuild() {
  await ensureTable();
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM ${QUALIFIED_TABLE}`);
    await conn.query(
      `INSERT INTO ${QUALIFIED_TABLE} (${VECTOR_COLUMNS})
       SELECT ${VECTOR_COLUMNS} FROM ${QUALIFIED_STAGING}`
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
  await getPool().query(`DELETE FROM ${QUALIFIED_STAGING}`).catch(() => {});
  invalidateCache();
}

/** Discard a failed rebuild's staged rows, leaving live vectors untouched. */
async function abortFullRebuild() {
  await getPool().query(`DELETE FROM ${QUALIFIED_STAGING}`);
}

/* ------------------------------------------------------------------ *
 * In-memory index + search
 * ------------------------------------------------------------------ */

let cache = null; // { matrix, meta, dims, loadedAt }
let loading = null;

function invalidateCache() {
  cache = null;
}

/** Load all vectors into one contiguous Float32Array for fast scanning. */
async function loadIndex(force = false) {
  if (!force && cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache;
  if (loading) return loading;

  loading = (async () => {
    try {
      await ensureTable();
      const db = getPool();
      const [rows] = await db.query(
        `SELECT entity_type, entity_id, name, description, status, type_display, dimensions, embedding
         FROM ${QUALIFIED_TABLE}`
      );

      const dims = rows.length ? rows[0].dimensions : EMBEDDING_DIMENSIONS;
      const usable = rows.filter((r) => r.dimensions === dims);
      const matrix = new Float32Array(usable.length * dims);
      const meta = new Array(usable.length);

      usable.forEach((row, i) => {
        matrix.set(decodeVector(row.embedding).subarray(0, dims), i * dims);
        meta[i] = {
          entityType: row.entity_type,
          entityId: row.entity_id,
          name: row.name,
          description: row.description,
          status: row.status,
          typeDisplay: row.type_display,
        };
      });

      cache = { matrix, meta, dims, loadedAt: Date.now() };
      return cache;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

/**
 * Cosine-similarity search over the whole corpus.
 *
 * @param {number[]} queryVector Raw (unnormalized) query embedding.
 * @param {object} [opts]
 * @param {number} [opts.limit]        Max results (default 25).
 * @param {number} [opts.minScore]     Drop results below this similarity.
 * @param {string[]} [opts.entityTypes] Restrict to these entity types.
 * @returns {Promise<Array<{score:number, entityType:string, entityId:string, name:string, status:string, typeDisplay:string}>>}
 */
async function search(queryVector, opts = {}) {
  const limit = opts.limit || 25;
  const minScore = opts.minScore != null ? opts.minScore : 0;
  const index = await loadIndex();
  if (!index.meta.length) return [];

  const query = normalizeVector(queryVector);
  if (query.length !== index.dims) {
    throw new Error(
      `Query vector has ${query.length} dimensions but the index stores ${index.dims}. Re-run a full rebuild after changing embedding models.`
    );
  }

  const typeFilter = opts.entityTypes && opts.entityTypes.length
    ? new Set(opts.entityTypes)
    : null;

  const { matrix, meta, dims } = index;
  const scored = [];
  for (let i = 0; i < meta.length; i++) {
    if (typeFilter && !typeFilter.has(meta[i].entityType)) continue;
    let dot = 0;
    const offset = i * dims;
    for (let j = 0; j < dims; j++) dot += matrix[offset + j] * query[j];
    if (dot >= minScore) scored.push([i, dot]);
  }

  scored.sort((a, b) => b[1] - a[1]);
  return scored.slice(0, limit).map(([i, score]) => ({ score, ...meta[i] }));
}

/** Operational counters for logging and health checks. */
async function stats() {
  await ensureTable();
  const db = getPool();
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total,
            MIN(updated_at) AS oldest,
            MAX(updated_at) AS newest,
            COUNT(DISTINCT model) AS models,
            COUNT(DISTINCT entity_type) AS entity_types
     FROM ${QUALIFIED_TABLE}`
  );
  return rows[0];
}

module.exports = {
  ensureTable,
  upsertVectors,
  deleteVectors,
  loadStoredHashes,
  beginFullRebuild,
  commitFullRebuild,
  abortFullRebuild,
  loadIndex,
  invalidateCache,
  search,
  stats,
  getPool,
  QUALIFIED_TABLE,
};
