/**
 * Embedding pipeline for GEAR semantic search.
 *
 * Two jobs, with deliberately different responsibilities:
 *
 *   runDeltaRefresh()  — the freshness mechanism. Runs every few minutes.
 *     Hashes all searchable text (~1s, no embedding calls) and re-embeds only
 *     records whose text changed, so an edit made through the GEAR Manager UI
 *     is searchable within minutes. Detection is by content hash rather than
 *     write hooks, because that catches changes from every source (API edits,
 *     cron loaders, direct SQL) and cannot make a user's save fail when USAi
 *     is unavailable.
 *
 *   runFullRebuild()   — the reconciliation mechanism. Runs nightly.
 *     Re-embeds everything into a staging table and swaps it in atomically.
 *     This is the backstop for what a hash diff cannot see: rows skipped due
 *     to USAi errors, changes to how document text is built, and embedding
 *     model changes. It is cheap enough (~2-3 minutes) to run unconditionally.
 *
 * Both jobs are safe to run concurrently with live searches.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('../api/db');
const { loadCorpus } = require('./search-corpus');
const { embed, EMBEDDING_MODEL } = require('./usai-client');
const vectorStore = require('./vector-store');
const { readOnlyPool } = require('./db-guard');

/**
 * The corpus loader reads GEAR's system of record (`gear_schema`) through the
 * application's shared pool. That pool can write, so it is wrapped read-only
 * here: the AI layer must never modify gear_schema, only read from it.
 */
const corpusPool = readOnlyPool(db.promisePool, 'search-corpus');

/** Documents per embeddings request. Measured safe and efficient at 96. */
const BATCH_SIZE = Number(process.env.GEAR_EMBED_BATCH_SIZE || 96);

/** Pause between batches, to stay friendly to the shared USAi budget. */
const BATCH_DELAY_MS = Number(process.env.GEAR_EMBED_BATCH_DELAY_MS || 120);

/** Upper bound on documents re-embedded per delta run. */
const DELTA_MAX_DOCS = Number(process.env.GEAR_EMBED_DELTA_MAX || 600);

let deltaRunning = false;
let fullRunning = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Embed a list of documents, tolerating individual poison rows.
 *
 * A single malformed input makes Cohere reject the entire batch with HTTP 400,
 * which would otherwise lose up to BATCH_SIZE good documents. On a non-retryable
 * batch failure we retry the batch one document at a time so only the genuinely
 * bad row is dropped.
 *
 * @returns {Promise<{entries:Array<object>, tokensUsed:number, failures:Array<{entityType:string,entityId:string,error:string}>}>}
 */
async function embedDocuments(documents, { label = 'embed' } = {}) {
  const entries = [];
  const failures = [];
  let tokensUsed = 0;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    try {
      const { vectors, tokensUsed: batchTokens } = await embed(
        batch.map((d) => d.text),
        { inputType: 'search_document' }
      );
      tokensUsed += batchTokens;
      batch.forEach((doc, j) => entries.push({ ...doc, vector: vectors[j] }));
    } catch (err) {
      console.error(
        '[embedding-pipeline] %s batch at offset %d failed (%s); retrying individually',
        label, i, err.message
      );
      for (const doc of batch) {
        try {
          const single = await embed([doc.text], { inputType: 'search_document' });
          tokensUsed += single.tokensUsed;
          entries.push({ ...doc, vector: single.vectors[0] });
        } catch (singleErr) {
          failures.push({
            entityType: doc.entityType,
            entityId: doc.entityId,
            error: singleErr.message,
          });
        }
        await sleep(BATCH_DELAY_MS);
      }
    }
    await sleep(BATCH_DELAY_MS);
  }

  return { entries, tokensUsed, failures };
}

/**
 * Nightly reconciliation: re-embed the entire corpus into staging, then swap.
 *
 * If anything fails before the swap, staging is discarded and the previous
 * vectors keep serving — stale-by-a-day beats an empty index.
 *
 * @returns {Promise<object>} Summary counters.
 */
async function runFullRebuild() {
  if (fullRunning) {
    console.error('[embedding-pipeline] full rebuild already running; skipping');
    return { skipped: true, reason: 'already_running' };
  }
  fullRunning = true;
  const startedAt = Date.now();

  try {
    const { documents, skipped, errors } = await loadCorpus(corpusPool);
    if (errors.length) {
      console.error('[embedding-pipeline] corpus source errors:', JSON.stringify(errors));
    }
    if (!documents.length) {
      // Refuse to replace a working index with nothing.
      throw new Error('corpus returned no documents; aborting rebuild');
    }

    await vectorStore.beginFullRebuild();

    let written = 0;
    let tokensUsed = 0;
    const failures = [];

    for (let i = 0; i < documents.length; i += BATCH_SIZE * 5) {
      const slice = documents.slice(i, i + BATCH_SIZE * 5);
      const result = await embedDocuments(slice, { label: 'full-rebuild' });
      tokensUsed += result.tokensUsed;
      failures.push(...result.failures);
      written += await vectorStore.upsertVectors(result.entries, {
        staging: true,
        model: EMBEDDING_MODEL,
      });
      console.error(
        '[embedding-pipeline] full rebuild progress %d/%d docs',
        Math.min(i + slice.length, documents.length), documents.length
      );
    }

    // A rebuild that lost most of the corpus is a failure, not a success.
    if (written < documents.length * 0.9) {
      throw new Error(
        `only ${written}/${documents.length} documents embedded; keeping previous vectors`
      );
    }

    await vectorStore.commitFullRebuild();

    const summary = {
      job: 'full_rebuild',
      documents: documents.length,
      written,
      skipped,
      failed: failures.length,
      tokensUsed,
      durationMs: Date.now() - startedAt,
      model: EMBEDDING_MODEL,
    };
    console.error('[embedding-pipeline] full rebuild complete %j', summary);
    if (failures.length) {
      console.error('[embedding-pipeline] failed documents:', JSON.stringify(failures.slice(0, 20)));
    }
    return summary;
  } catch (err) {
    await vectorStore.abortFullRebuild().catch(() => {});
    console.error('[embedding-pipeline] full rebuild FAILED (previous vectors retained):', err.message);
    return {
      job: 'full_rebuild',
      error: err.message,
      durationMs: Date.now() - startedAt,
    };
  } finally {
    fullRunning = false;
  }
}

/**
 * Intra-day refresh: embed only what changed since the last run.
 *
 * @returns {Promise<object>} Summary counters.
 */
async function runDeltaRefresh() {
  if (fullRunning || deltaRunning) {
    return { skipped: true, reason: fullRunning ? 'full_rebuild_running' : 'already_running' };
  }
  deltaRunning = true;
  const startedAt = Date.now();

  try {
    const [{ documents, errors }, stored] = await Promise.all([
      loadCorpus(corpusPool),
      vectorStore.loadStoredHashes(),
    ]);
    if (errors.length) {
      console.error('[embedding-pipeline] corpus source errors:', JSON.stringify(errors));
    }

    // An empty store means no rebuild has run yet; a delta sweep is the wrong
    // tool for that, so hand off to the full rebuild instead.
    if (stored.size === 0) {
      console.error('[embedding-pipeline] vector store empty; running full rebuild instead');
      deltaRunning = false;
      return runFullRebuild();
    }

    const changed = [];
    const seen = new Set();
    for (const doc of documents) {
      const key = `${doc.entityType}|${doc.entityId}`;
      seen.add(key);
      const existing = stored.get(key);
      // Re-embed when new, when text changed, or when stored under another model.
      if (!existing || existing.contentHash !== doc.contentHash || existing.model !== EMBEDDING_MODEL) {
        changed.push(doc);
      }
    }

    const removed = [];
    for (const key of stored.keys()) {
      if (!seen.has(key)) {
        const [entityType, ...rest] = key.split('|');
        removed.push({ entityType, entityId: rest.join('|') });
      }
    }

    let deleted = 0;
    if (removed.length) deleted = await vectorStore.deleteVectors(removed);

    if (!changed.length) {
      const summary = {
        job: 'delta_refresh',
        changed: 0,
        deleted,
        durationMs: Date.now() - startedAt,
      };
      console.error('[embedding-pipeline] delta refresh: no changes %j', summary);
      return summary;
    }

    // A huge delta means a bulk load rewrote the corpus; let the nightly
    // rebuild absorb it rather than spending the whole USAi budget at once.
    const batch = changed.slice(0, DELTA_MAX_DOCS);
    const deferred = changed.length - batch.length;

    const { entries, tokensUsed, failures } = await embedDocuments(batch, {
      label: 'delta-refresh',
    });
    const written = await vectorStore.upsertVectors(entries, { model: EMBEDDING_MODEL });

    const summary = {
      job: 'delta_refresh',
      changed: changed.length,
      written,
      deleted,
      deferred,
      failed: failures.length,
      tokensUsed,
      durationMs: Date.now() - startedAt,
    };
    console.error('[embedding-pipeline] delta refresh complete %j', summary);
    if (failures.length) {
      console.error('[embedding-pipeline] failed documents:', JSON.stringify(failures.slice(0, 20)));
    }
    return summary;
  } catch (err) {
    console.error('[embedding-pipeline] delta refresh FAILED:', err.message);
    return { job: 'delta_refresh', error: err.message, durationMs: Date.now() - startedAt };
  } finally {
    deltaRunning = false;
  }
}

module.exports = {
  runFullRebuild,
  runDeltaRefresh,
  embedDocuments,
  BATCH_SIZE,
};
