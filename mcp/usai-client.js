/**
 * Thin client for the USAi Chat Completions and Embeddings APIs
 * (OpenAI-compatible).
 *
 * Auth: the API key is read from the AI_CERT environment variable and sent as a
 * Bearer token. The base URL defaults to https://api.gsa.usai.gov and can be
 * overridden with USAI_API_BASE.
 *
 * Note: USAi does not currently support OpenAI-style function/tool calling, so
 * the orchestrator (see chat-orchestrator.js) drives tool use via a prompted
 * JSON protocol rather than the `tools` request field.
 */

const path = require('path');
// Safety net: ensure the project-root .env is loaded so AI_CERT is available
// even when this client is required by a process that didn't call dotenv itself
// (e.g. a standalone script). No-op if the vars are already set.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const USAI_API_BASE = process.env.USAI_API_BASE || 'https://api.gsa.usai.gov';
const USAI_CHAT_PATH = '/api/v1/chat/completions';
const USAI_EMBEDDINGS_PATH = '/api/v1/embeddings';

/** Embedding model and its fixed output dimensionality. */
const EMBEDDING_MODEL = process.env.USAI_EMBEDDING_MODEL || 'cohere_english_v3';
const EMBEDDING_DIMENSIONS = Number(process.env.USAI_EMBEDDING_DIMENSIONS || 1024);

/**
 * @param {Array<{role:string,content:string}>} messages
 * @param {object} opts
 * @param {string} opts.model
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<{content:string, responseTimeMs:number, tokensUsed:number|null}>}
 */
async function chatCompletion(messages, opts = {}) {
  const apiKey = process.env.AI_CERT;
  if (!apiKey) {
    throw new Error('USAi API key missing: set AI_CERT in the environment.');
  }

  const includeTemperature =
    typeof opts.temperature === 'number' && !modelRejectsTemperature(opts.model);

  try {
    return await postChatCompletion(messages, opts, apiKey, includeTemperature);
  } catch (err) {
    // Newer models (GPT 5.6+, Claude Sonnet 5+) reject `temperature` outright
    // with HTTP 400 rather than ignoring it. Remember the model and retry once
    // without it, so changing chat-config.json's model never hard-fails.
    if (includeTemperature && isTemperatureRejection(err)) {
      TEMPERATURE_UNSUPPORTED.add(opts.model);
      console.error(
        '[usai] model %s rejects temperature; retrying without it',
        opts.model
      );
      return postChatCompletion(messages, opts, apiKey, false);
    }
    throw err;
  }
}

/** Models known to reject `temperature`, learned at runtime. */
const TEMPERATURE_UNSUPPORTED = new Set();

function modelRejectsTemperature(model) {
  return TEMPERATURE_UNSUPPORTED.has(model);
}

function isTemperatureRejection(err) {
  return (
    err &&
    err.status === 400 &&
    /temperature/i.test(err.message || '')
  );
}

async function postChatCompletion(messages, opts, apiKey, includeTemperature) {
  const body = {
    model: opts.model,
    messages,
  };
  if (includeTemperature) body.temperature = opts.temperature;
  if (typeof opts.maxTokens === 'number') body.max_tokens = opts.maxTokens;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs || 60000);
  const startTime = Date.now();

  try {
    const res = await fetch(`${USAI_API_BASE}${USAI_CHAT_PATH}`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = '';
      try {
        detail = JSON.stringify(await res.json());
      } catch (_) {
        detail = await res.text().catch(() => '');
      }
      const err = new Error(`USAi API HTTP ${res.status}: ${detail}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const responseTimeMs = Date.now() - startTime;
    const content = extractContent(data);
    if (typeof content !== 'string') {
      console.error(
        '[usai] unexpected response shape:',
        JSON.stringify(data).slice(0, 800)
      );
      throw new Error('USAi API returned an unexpected response shape.');
    }

    const tokensUsed = data && data.usage
      ? (data.usage.total_tokens ?? data.usage.completion_tokens ?? null)
      : null;

    return { content, responseTimeMs, tokensUsed };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extract assistant text from a chat completion response, tolerating the
 * shape variations different USAi-backed models return:
 *  - choices[0].message.content as a string (standard OpenAI)
 *  - choices[0].message.content as an array of parts ({type,text})
 *  - choices[0].text (legacy completion style)
 *  - empty string when the model returned no content (e.g. filtered/stopped)
 * Returns a string, or undefined if nothing usable is present.
 */
function extractContent(data) {
  const choice = data && Array.isArray(data.choices) ? data.choices[0] : null;
  if (!choice) return undefined;

  const msg = choice.message || {};
  let content = msg.content;

  if (typeof content === 'string') return content;

  // Some providers return content as an array of parts.
  if (Array.isArray(content)) {
    const text = content
      .map((p) => (typeof p === 'string' ? p : p && p.text ? p.text : ''))
      .join('')
      .trim();
    return text;
  }

  // Legacy / alternate fields.
  if (typeof choice.text === 'string') return choice.text;

  // Model produced a stop/finish with no textual content.
  if (choice.finish_reason && (content == null || content === '')) {
    return '';
  }

  return undefined;
}

/**
 * Embed one or more texts via the USAi embeddings endpoint.
 *
 * `inputType` matters: Cohere models produce asymmetric embeddings, so corpus
 * text must be embedded as 'search_document' and user queries as
 * 'search_query'. USAi defaults to 'search_document' when the field is omitted,
 * so query-time callers must pass 'search_query' explicitly or retrieval
 * quality silently degrades.
 *
 * Retries on 429 and 5xx with linear backoff. A 4xx other than 429 is a bad
 * request (e.g. an input Cohere refuses) and is thrown immediately so callers
 * can isolate the offending item.
 *
 * @param {string[]} inputs
 * @param {object} opts
 * @param {'search_document'|'search_query'} [opts.inputType]
 * @param {string} [opts.model]
 * @param {number} [opts.timeoutMs]
 * @param {number} [opts.maxRetries]
 * @returns {Promise<{vectors:number[][], tokensUsed:number, responseTimeMs:number}>}
 */
async function embed(inputs, opts = {}) {
  const apiKey = process.env.AI_CERT;
  if (!apiKey) {
    throw new Error('USAi API key missing: set AI_CERT in the environment.');
  }
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new Error('embed() requires a non-empty array of input strings.');
  }

  const body = {
    model: opts.model || EMBEDDING_MODEL,
    input: inputs,
  };
  if (opts.inputType) body.input_type = opts.inputType;

  const maxRetries = opts.maxRetries != null ? opts.maxRetries : 4;
  const startTime = Date.now();
  let lastErr = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs || 60000);
    try {
      const res = await fetch(`${USAI_API_BASE}${USAI_EMBEDDINGS_PATH}`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`USAi embeddings HTTP ${res.status}`);
        lastErr.status = res.status;
        lastErr.retryable = true;
        await sleep(1000 * (attempt + 1));
        continue;
      }

      if (!res.ok) {
        let detail = '';
        try {
          detail = JSON.stringify(await res.json());
        } catch (_) {
          detail = await res.text().catch(() => '');
        }
        const err = new Error(`USAi embeddings HTTP ${res.status}: ${detail}`);
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      if (!data || !Array.isArray(data.data)) {
        throw new Error('USAi embeddings returned an unexpected response shape.');
      }

      // The API may return items out of order; `index` is authoritative.
      const vectors = new Array(inputs.length);
      data.data.forEach((item, i) => {
        const pos = typeof item.index === 'number' ? item.index : i;
        vectors[pos] = item.embedding;
      });
      if (vectors.some((v) => !Array.isArray(v))) {
        throw new Error(
          `USAi embeddings returned ${data.data.length} vectors for ${inputs.length} inputs.`
        );
      }

      return {
        vectors,
        tokensUsed: (data.usage && data.usage.total_tokens) || 0,
        responseTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        lastErr = new Error('USAi embeddings request timed out.');
        lastErr.retryable = true;
        await sleep(1000 * (attempt + 1));
        continue;
      }
      if (err.retryable) {
        lastErr = err;
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastErr || new Error('USAi embeddings failed after retries.');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  chatCompletion,
  embed,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  USAI_API_BASE,
};
