/**
 * Thin client for the USAi Chat Completions API (OpenAI-compatible).
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

/**
 * @param {Array<{role:string,content:string}>} messages
 * @param {object} opts
 * @param {string} opts.model
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<string>} assistant message content
 */
async function chatCompletion(messages, opts = {}) {
  const apiKey = process.env.AI_CERT;
  if (!apiKey) {
    throw new Error('USAi API key missing: set AI_CERT in the environment.');
  }

  const body = {
    model: opts.model,
    messages,
  };
  if (typeof opts.temperature === 'number') body.temperature = opts.temperature;
  if (typeof opts.maxTokens === 'number') body.max_tokens = opts.maxTokens;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs || 60000);

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
    const content = extractContent(data);
    if (typeof content !== 'string') {
      console.error(
        '[usai] unexpected response shape:',
        JSON.stringify(data).slice(0, 800)
      );
      throw new Error('USAi API returned an unexpected response shape.');
    }
    return content;
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

module.exports = { chatCompletion, USAI_API_BASE };
