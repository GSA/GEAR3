/**
 * Chat orchestrator for the GEAR web chatbot.
 *
 * USAi is OpenAI-compatible but does NOT currently support function/tool
 * calling. To still let the model use GEAR data tools, we implement a small
 * prompted tool-use loop:
 *
 *   1. We describe the available tools in the system prompt and instruct the
 *      model to respond with a strict JSON object when it wants to call a tool.
 *   2. We parse that JSON, run the tool via the shared gear-tools layer, and
 *      feed the result back to the model.
 *   3. We repeat until the model returns a normal (non-tool) answer or we hit
 *      maxToolIterations.
 *
 * The model-chosen JSON only ever selects a tool from ./gear-tools.js, all of
 * which are read-only. A prompt cannot cause a write to GEAR data: the only
 * writes in this path are this orchestrator's own cache/log rows in
 * `gear_log.ai_log`, and ./db-guard.js blocks any statement aimed at
 * `gear_acl` or `gear_schema`.
 *
 * Taxonomy-gap telemetry: a few fast-paths below also fire a non-blocking
 * signal (see ./taxonomy-gap-signals.js) when they notice something that
 * might indicate a gap in the TRM or Business Capability taxonomies - e.g. a
 * searched product has no TRM mapping. These calls are NEVER awaited on the
 * response path (always `.catch(() => {})` and otherwise ignored) so they add
 * zero latency and cannot fail a user's turn. All the actual reasoning about
 * whether a gap is real happens later, fully decoupled, in the nightly
 * mcp/taxonomy-gap-analyzer.js batch job.
 *
 * The model + system prompts are read from chat-config.json and hot-reloaded on
 * every request (cheap file read) so they can be tweaked without a restart.
 */

const fs = require('fs');
const path = require('path');

const { tools, runTool, AUTHORITATIVE_TOOLS, BROAD_SEARCH_TOOLS, GEAR_ROUTE_BY_TYPE } = require('./gear-tools');
const { chatCompletion } = require('./usai-client');
const promptCache = require('./prompt-cache');
const { lookup: cacheGet, save: cacheSave, log: cacheLog, logCacheHit, hasDevPrefix, stripDevPrefix } = promptCache;
const { recordSignal } = require('./taxonomy-gap-signals');

const CONFIG_PATH = path.join(__dirname, 'chat-config.json');

/** Cached config and the mtime it was loaded from, for hot-reload on change. */
let _configCache = null;
let _configMtime = 0;

/** Read (and lightly validate) the chat config; reloads only when the file changes. */
function loadConfig() {
  try {
    const stat = fs.statSync(CONFIG_PATH);
    const mtime = stat.mtimeMs;
    if (_configCache && mtime === _configMtime) return _configCache;
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const cfg = JSON.parse(raw);
    _configMtime = mtime;
    _configCache = {
      model: cfg.model || 'gemini-2.5-flash-lite',
      temperature: typeof cfg.temperature === 'number' ? cfg.temperature : 0.2,
      maxTokens: typeof cfg.maxTokens === 'number' ? cfg.maxTokens : 1024,
      maxToolIterations:
        typeof cfg.maxToolIterations === 'number' ? cfg.maxToolIterations : 5,
      systemPrompts: Array.isArray(cfg.systemPrompts) ? cfg.systemPrompts : [],
    };
    return _configCache;
  } catch (err) {
    // If the file is temporarily unreadable (mid-write), fall back to the last
    // good config rather than crashing mid-request.
    if (_configCache) {
      console.error('[chat] loadConfig error (using cached config):', err.message);
      return _configCache;
    }
    throw err;
  }
}

/** Build the tool-usage instructions appended to the system prompt. */
function buildToolInstructions() {
  const catalog = tools
    .map((t) => {
      const props = t.parameters?.properties || {};
      const args = Object.entries(props)
        .map(([k, v]) => `${k} (${v.type}${v.enum ? `: ${v.enum.join('|')}` : ''})`)
        .join(', ');
      return `- ${t.name}(${args}): ${t.description}`;
    })
    .join('\n');

  return [
    'You have access to the following GEAR data tools:',
    catalog,
    '',
    'When you need data from a tool, respond with ONLY a single JSON object and nothing else, in this exact form:',
    '{"tool_call": {"name": "<tool_name>", "arguments": { ... }}}',
    'Do not wrap it in markdown or code fences. After you receive the tool result (provided in a message with role "tool"), continue reasoning.',
    'When you have enough information to answer the user, respond with normal prose (NOT JSON).',
    '',
    'CRITICAL RULES:',
    '- Emit AT MOST ONE tool_call per message, then STOP immediately. Do not write anything after the JSON object.',
    '- NEVER write, invent, guess, or simulate a tool result, "tool_code", or "tool_result". You will be given the real result in the next message. Fabricating results is strictly forbidden.',
    '- Only state facts (IDs, names, technologies, statuses, etc.) that appear verbatim in a real TOOL_RESULT you were given. If you have not received a TOOL_RESULT, you do not know the answer yet - call the tool.',
    '- Use the exact "Id" values returned by tools; never make up IDs.',
  ].join('\n');
}

/**
 * Extract the FIRST tool_call JSON object from an assistant message.
 * The model may (incorrectly) append prose or fabricated results after the
 * call; we take only the first balanced JSON object and ignore the rest.
 * Returns { name, arguments } or null.
 */
function parseToolCall(content) {
  let text = content.trim();
  // Strip a single leading code fence if present.
  text = text.replace(/^```(?:json)?\s*/i, '');

  const start = text.indexOf('{');
  if (start === -1) return null;

  // Walk the string to find the matching close brace for the first object,
  // respecting string literals so braces inside strings do not confuse us.
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;

  const candidate = text.slice(start, end + 1);
  try {
    const obj = JSON.parse(candidate);
    if (obj && obj.tool_call && typeof obj.tool_call.name === 'string') {
      return {
        name: obj.tool_call.name,
        arguments: obj.tool_call.arguments || {},
      };
    }
  } catch (_) {
    return null;
  }
  return null;
}

/**
 * Force GEAR record links back to the relative, hash-based form.
 *
 * Tools hand the model relative GearUrls ("#/it_standards/7186") and the
 * prompt forbids adding a hostname, but models still emit absolute URLs such
 * as "https://gear.gsa.gov#/it_standards/7186" some of the time. Those work in
 * production by coincidence and break in every other environment (dev1,
 * staging, localhost), so the hostname is stripped here rather than left to
 * prompt compliance.
 *
 * Two passes, deliberately different in strictness:
 *   1. Any absolute URL containing "#/<route>/<id>" is rewritten. The hash
 *      route is an Angular SPA path that cannot meaningfully appear on a
 *      third-party site, so the host does not matter — this also catches
 *      environment hosts like dev1.ea.gsa.gov.
 *   2. An absolute URL with a plain "/<route>/<id>" path is rewritten only on
 *      a GSA/GEAR host, because a bare path like "/systems/123" is not
 *      distinctive enough to rewrite on an arbitrary domain.
 *
 * Genuine external links (GSA policy pages, USAi docs, mailto:) are untouched.
 */
function normalizeGearLinks(text) {
  const routes = Object.values(GEAR_ROUTE_BY_TYPE).join('|');
  const tail = `(?:${routes})\\/[^\\s)"'\\]]+`;
  // Characters that end a URL in markdown or prose.
  const stop = '[^\\s)"\'\\]]*';

  let out = String(text || '');

  // Pass 1: absolute URL carrying an Angular hash route.
  out = out.replace(
    new RegExp(`https?:\\/\\/${stop}#\\/${tail}`, 'gi'),
    (match) => match.slice(match.indexOf('#/'))
  );

  // Pass 2: absolute URL on a GEAR/GSA host with a plain route path.
  out = out.replace(
    new RegExp(`https?:\\/\\/[^\\s)"'\\]]*(?:gear|\\.gsa\\.gov)[^\\s)"'\\]]*?\\/(${tail})`, 'gi'),
    (match, path) => `#/${path}`
  );

  return out;
}

/** Remove any stray JSON / tool-protocol artifacts from a final prose answer. */
function cleanFinalAnswer(content) {
  let text = String(content || '').trim();
  // Drop code-fenced blocks that contain our protocol keywords.
  text = text.replace(/```[\s\S]*?```/g, (block) =>
    /tool_call|tool_result|tool_code/i.test(block) ? '' : block
  );
  // Drop stray standalone JSON lines mentioning the protocol.
  text = text
    .split('\n')
    .filter((line) => !/^\s*\{.*tool_(call|result|code).*\}\s*$/i.test(line))
    .join('\n');
  return normalizeGearLinks(text.trim());
}

/**
 * Guard against returning a blank answer to the user.
 *
 * `cleanFinalAnswer` strips tool-protocol artifacts, so a model reply that was
 * nothing but a stray protocol fragment can reduce to an empty string. Failing
 * here makes the controller return an error (and log it) instead of handing the
 * frontend an empty `reply`, which it can only render as a generic
 * "could not generate a response" message.
 */
function assertNonEmptyReply(reply, model, stage) {
  if (typeof reply === 'string' && reply.trim().length > 0) return;
  console.error('[chat] EMPTY final reply after cleanup: model=%s stage=%s', model, stage);
  const err = new Error(
    `The model (${model}) produced no usable answer text at the ${stage} stage.`
  );
  err.emptyCompletion = true;
  throw err;
}

/**
 * Detect a "what software / tech stack / IT standards does <X> use" question and
 * extract <X>. Returns the system name string, or null if not that intent.
 * This drives a deterministic fast-path so the model cannot wander to the
 * website/search tools for this common, high-value question.
 */
function detectSystemSoftwareQuestion(userMessage) {
  const msg = String(userMessage || '').trim();
  if (!msg) return null;

  // Must mention software / tech stack / technology / IT standards.
  const mentionsSoftware =
    /\b(software|tech(?:nical)?\s*stack|technolog(?:y|ies)|it\s*standards?|applications?)\b/i.test(
      msg
    );
  if (!mentionsSoftware) return null;

  // Patterns like:
  //   what software does <X> use
  //   what is the tech stack for <X>
  //   which IT standards does the <X> system use
  const patterns = [
    /\bwhat\s+software\s+(?:does|do|is)\s+(?:the\s+)?(.+?)\s+(?:use|using|run|rely on)\b/i,
    /\bwhat\s+(?:tech(?:nical)?\s*stack|technolog(?:y|ies)|it\s*standards?)\s+(?:does|do|is|are)\s+(?:the\s+)?(.+?)\s+(?:use|using|run|rely on|built on)\b/i,
    /\b(?:tech(?:nical)?\s*stack|software|it\s*standards?)\s+(?:for|of|used by)\s+(?:the\s+)?(.+?)(?:\?|$)/i,
    /\bwhat\s+(?:does|do)\s+(?:the\s+)?(.+?)\s+(?:system\s+)?use\s+for\s+software\b/i,
  ];

  for (const re of patterns) {
    const m = msg.match(re);
    if (m && m[1]) {
      return cleanEntityName(m[1]);
    }
  }
  return null;
}

/** Strip trailing qualifiers like "system"/"business system"/punctuation from an extracted name. */
function cleanEntityName(raw) {
  let name = String(raw).trim();
  name = name.replace(/\?+$/, '').trim();
  name = name.replace(/^the\s+/i, '').trim();
  // Remove a trailing "system"/"business system"/"tool" qualifier only if it
  // is an extra descriptor (keep it if it is part of the actual name like
  // "... Pricing Tool"). We only strip a standalone trailing "business system"
  // or "system" word.
  name = name.replace(/\s+business\s+system$/i, '').trim();
  name = name.replace(/\s+system$/i, '').trim();
  return name;
}

/**
 * Detect "which records schedules / how long must <X> retain ... " style
 * questions and extract the business-system name. These are answered
 * deterministically by find_system -> get_system_records_schedules.
 * Returns the cleaned entity name or null.
 */
function detectRecordsScheduleQuestion(message) {
  const msg = String(message || '');
  const mentionsRecords = /\brecords?\s+schedule|\brecords?\s+management|\bretain(?:ed|s|ing)?\b|\bretention\b|\bdispos(?:e|al|ition)|\brecords?\b/i.test(
    msg
  );
  if (!mentionsRecords) return null;

  const patterns = [
    // which records schedules does the <X> system have to abide by
    /\bwhich\s+records?\s+schedules?\s+(?:does|do|must)\s+(?:the\s+)?(.+?)\s+(?:system\s+)?(?:have\s+to\s+)?(?:abide|follow|comply|adhere|use|retain)\b/i,
    /\bwhat\s+records?\s+schedules?\s+(?:does|do|apply\s+to|must)\s+(?:the\s+)?(.+?)(?:\?|$)/i,
    // how long does <X> have to retain / keep a ... record
    /\bhow\s+long\s+(?:does|do|must)\s+(?:the\s+)?(.+?)\s+(?:have\s+to\s+|need\s+to\s+)?(?:retain|keep|hold|store)\b/i,
    // records schedules for/of <X>
    /\brecords?\s+schedules?\s+(?:for|of|that\s+apply\s+to)\s+(?:the\s+)?(.+?)(?:\?|$)/i,
    // retention/disposition requirements for <X>
    /\b(?:retention|records?\s+management|disposition)\s+(?:requirements?|rules?|obligations?)\s+(?:for|of)\s+(?:the\s+)?(.+?)(?:\?|$)/i,
  ];

  for (const re of patterns) {
    const m = msg.match(re);
    if (m && m[1]) {
      const name = cleanEntityName(m[1]);
      if (name) return name;
    }
  }
  return null;
}

/**
 * Detect "what is an alternative/substitute to <PRODUCT>" style questions and
 * extract the product name. These are answered deterministically by
 * find_similar_approved_software, which returns TRM category peers regardless
 * of whether the product itself is in the inventory.
 * Returns the cleaned product name string, or null if not that intent.
 */
function detectAlternativeSoftwareQuestion(userMessage) {
  const msg = String(userMessage || '').trim();
  if (!msg) return null;

  // Must mention alternative / substitute / comparable / replacement.
  const mentionsAlternative =
    /\b(?:alternative|substitute|replacement|comparable|instead|equivalent|like|similar)\b/i.test(msg);
  if (!mentionsAlternative) return null;

  // Patterns like:
  //   what is an approved alternative to <X>
  //   what can I use instead of <X>
  //   what is comparable to <X>
  //   what's a good substitute for <X>
  //   what else is like <X>
  const patterns = [
    // "alternative/substitute/replacement to/for <X>"
    /\b(?:alternative|substitute|replacement|equivalent)\s+(?:to|for)\s+(?:the\s+)?(.+?)(?:\?|$)/i,
    // "what can I use instead of <X>"
    /\bwhat\s+(?:can\s+i\s+)?use\s+(?:instead|in place)\s+of\s+(?:the\s+)?(.+?)(?:\?|$)/i,
    // "what is comparable to/like <X>"
    /\b(?:comparable|like|similar)\s+to\s+(?:the\s+)?(.+?)(?:\?|$)/i,
    // "what else is like <X>"
    /\bwhat\s+else\s+is\s+(?:like|comparable to)\s+(?:the\s+)?(.+?)(?:\?|$)/i,
    // "approved alternative to <X>"
    /\bapproved\s+(?:alternative|substitute|replacement|equivalent)\s+(?:to|for)\s+(?:the\s+)?(.+?)(?:\?|$)/i,
  ];

  for (const re of patterns) {
    const m = msg.match(re);
    if (m && m[1]) {
      return cleanEntityName(m[1]);
    }
  }
  return null;
}

/**
 * Run a full chat turn.
 * @param {Array<{role:string,content:string}>} history Prior user/assistant messages.
 * @param {string} userMessage The new user message.
 * @returns {Promise<{reply:string, toolCalls:Array}>}
 */
async function runChat(history, userMessage) {
  const cfg = loadConfig();
  const t0 = Date.now();

  // A leading "dev!" marks the message as developer testing, even against a
  // production deployment. The prefix is stripped before the model or the log
  // sees it, so the stored prompt stays comparable to the same question asked
  // by a real user.
  const isDevPrompt = hasDevPrefix(userMessage);
  const sourceOverride = isDevPrompt ? 'developer' : undefined;
  if (isDevPrompt) {
    userMessage = stripDevPrefix(userMessage);
    console.error('[chat] dev! prefix detected — logging this turn as source=developer');
  }

  // Cache lookup: only cache single-turn questions (no prior history) since
  // follow-up questions depend on context and should not be cached.
  const isFirstTurn = !history || history.length === 0;
  const turnIndex = isFirstTurn ? 0 : Math.floor((history.length) / 2);
  if (isFirstTurn) {
    const cached = await cacheGet(userMessage, 'chat', { source: sourceOverride });
    if (cached) {
      console.error('[chat] cache HIT — skipping USAi call');
      // Normalize on the way out: entries saved before link normalization
      // existed (or by an older deployment) may hold absolute URLs that break
      // outside production.
      const reply = normalizeGearLinks(cached.reply);
      // Log the hit so repeat questions still appear in analytics; without this
      // the most-asked questions are the ones least visible in the data.
      logCacheHit(userMessage, 'chat', reply, cached.toolCalls, {
        responseTimeMs: Date.now() - t0,
        source: sourceOverride,
      }).catch(() => {});
      return { ...cached, reply };
    }
  }

  const systemContent = [...cfg.systemPrompts, '', buildToolInstructions()].join(
    '\n'
  );

  const messages = [
    { role: 'system', content: systemContent },
    ...sanitizeHistory(history),
    { role: 'user', content: String(userMessage || '').slice(0, 8000) },
  ];

  // Deterministic fast-path: "what software/tech stack/IT standards does <X> use"
  // is answered by find_system -> get_system_software, bypassing the model's
  // (unreliable) tool selection. We still let the model phrase the final answer
  // using the authoritative data we inject.
  const softwareIntent = detectSystemSoftwareQuestion(userMessage);
  if (softwareIntent) {
    try {
      const found = await runTool('find_system', { name: softwareIntent });
      const best = found && found.bestMatch;
      if (best && best.Id) {
        const software = await runTool('get_system_software', { id: best.Id });
        console.error(
          '[chat] fast-path software: system=%s(%s) rows=%s',
          best.Name,
          best.Id,
          software && software.total
        );
        messages.push({
          role: 'user',
          content:
            `AUTHORITATIVE DATA (use this to answer; do not call more tools):\n` +
            `The business system matching "${softwareIntent}" is "${best.Name}" (${best.Type}).\n` +
            `Its IT standards (software products) recorded in GEAR are:\n` +
            `${JSON.stringify(software, null, 2)}\n` +
            `Answer the user's question using ONLY this data: state the system name, then list each software product by Name (include Status/compliance if present) as a bulleted list. If the list is empty, say no software is recorded for that system. Do not mention websites or search results.`,
        });
        const { content: replyRaw, responseTimeMs: rt1, tokensUsed: tok1 } = await chatCompletion(messages, {
          model: cfg.model,
          temperature: cfg.temperature,
          maxTokens: cfg.maxTokens,
        });
        const result = {
          reply: cleanFinalAnswer(replyRaw),
          toolCalls: [
            { name: 'find_system', arguments: { name: softwareIntent } },
            { name: 'get_system_software', arguments: { id: best.Id } },
          ],
        };
        assertNonEmptyReply(result.reply, cfg.model, 'software fast-path');
        if (isFirstTurn) {
          const logId = await cacheSave(userMessage, 'chat', result.reply, result.toolCalls, {
            responseTimeMs: Date.now() - t0,
            tokensUsed: tok1,
            source: sourceOverride,
          }).catch(() => null);
          result.logId = logId;
        } else {
          cacheLog(userMessage, 'chat', result.reply, result.toolCalls, {
            responseTimeMs: Date.now() - t0,
            tokensUsed: tok1,
            turnIndex,
            source: sourceOverride,
          }).catch(() => {});
        }
        return result;
      }
    } catch (err) {
      console.error('[chat] fast-path error, falling back to tool loop:', err.message);
      // Fall through to the normal loop below.
    }
  }

  // Deterministic fast-path: records schedules / retention questions are
  // answered by find_system -> get_system_records_schedules.
  const recordsIntent = detectRecordsScheduleQuestion(userMessage);
  if (recordsIntent) {
    try {
      const found = await runTool('find_system', { name: recordsIntent });
      const best = found && found.bestMatch;
      if (best && best.Id) {
        const schedules = await runTool('get_system_records_schedules', {
          id: best.Id,
        });
        console.error(
          '[chat] fast-path records: system=%s(%s) rows=%s',
          best.Name,
          best.Id,
          schedules && schedules.total
        );
        messages.push({
          role: 'user',
          content:
            `AUTHORITATIVE DATA (use this to answer; do not call more tools):\n` +
            `The business system matching "${recordsIntent}" is "${best.Name}" (${best.Type}).\n` +
            `The records schedules this system must abide by (from GSA's Records Management inventory) are:\n` +
            `${JSON.stringify(schedules, null, 2)}\n` +
            `Answer the user's question using ONLY this data:\n` +
            `- If the user asks WHICH records schedules apply, state the system name and list each schedule by its Record_Item_Title as a bulleted list.\n` +
            `- If the user asks HOW LONG a type of record must be retained (or what to do with it afterward), identify the schedule(s) whose Record_Item_Title/Description best match the record type the user described, and summarize the Retention_Instructions (and FY_Retention_Years / disposition) for those schedule(s) in plain language.\n` +
            `- If the list is empty, say no records schedules are recorded for that system.\n` +
            `ALWAYS end your answer with this exact caveat on its own line: "Note: Do not base any records retention or destruction decisions on this tool without first confirming with GSA's Records Management team (records@gsa.gov)."\n` +
            `Do not mention websites, software, or raw JSON/field names.`,
        });
        const { content: replyRaw2, responseTimeMs: rt2, tokensUsed: tok2 } = await chatCompletion(messages, {
          model: cfg.model,
          temperature: cfg.temperature,
          maxTokens: cfg.maxTokens,
        });
        const result = {
          reply: cleanFinalAnswer(replyRaw2),
          toolCalls: [
            { name: 'find_system', arguments: { name: recordsIntent } },
            { name: 'get_system_records_schedules', arguments: { id: best.Id } },
          ],
        };
        assertNonEmptyReply(result.reply, cfg.model, 'records fast-path');
        if (isFirstTurn) {
          const logId = await cacheSave(userMessage, 'chat', result.reply, result.toolCalls, {
            responseTimeMs: Date.now() - t0,
            tokensUsed: tok2,
            source: sourceOverride,
          }).catch(() => null);
          result.logId = logId;
        } else {
          cacheLog(userMessage, 'chat', result.reply, result.toolCalls, {
            responseTimeMs: Date.now() - t0,
            tokensUsed: tok2,
            turnIndex,
            source: sourceOverride,
          }).catch(() => {});
        }
        return result;
      }
    } catch (err) {
      console.error('[chat] records fast-path error, falling back to tool loop:', err.message);
      // Fall through to the normal loop below.
    }
  }

  // Deterministic fast-path: alternative software questions are answered by
  // find_similar_approved_software, which identifies the TRM categories a
  // product belongs to and returns all approved peers, regardless of whether
  // the product itself is in the inventory.
  const alternativeIntent = detectAlternativeSoftwareQuestion(userMessage);
  if (alternativeIntent) {
    try {
      const alternatives = await runTool('find_similar_approved_software', {
        name: alternativeIntent,
      });
      console.error(
        '[chat] fast-path alternatives: product=%s(%s) rows=%s basis=%s',
        alternatives.referenceProduct?.Name || alternativeIntent,
        alternatives.searchedFor,
        alternatives && alternatives.total,
        alternatives.basis
      );

      // Zero-latency taxonomy-gap telemetry (never awaited): capture a signal
      // using only data this tool call already returned, so the nightly
      // mcp/taxonomy-gap-analyzer.js batch job can later investigate whether
      // the TRM taxonomy is actually missing a category - no extra lookups or
      // reasoning happen here on the response path.
      if (!alternatives.referenceProduct) {
        // The searched product does not exist in the IT Standards inventory
        // at all - a candidate SRR/intake gap, not a taxonomy gap per se, but
        // still useful signal for the nightly job to correlate against
        // repeated searches for the same unlisted product.
        recordSignal({
          signalType: 'technology_not_in_inventory',
          queryText: userMessage,
          entityName: alternativeIntent,
          source: sourceOverride,
        }).catch(() => {});
      } else if (!alternatives.basis) {
        // The product IS in the inventory but carries no TRM category at all
        // (own-category path and semantic-nearest-category path both found
        // nothing) - a strong candidate for "this product should have a TRM
        // mapping, and possibly the TRM taxonomy itself needs a new category
        // to classify it under."
        recordSignal({
          signalType: 'technology_incomplete_trm_mapping',
          queryText: userMessage,
          entityType: 'Technology',
          entityName: alternatives.referenceProduct.Name,
          context: { status: alternatives.referenceProduct.Status },
          source: sourceOverride,
        }).catch(() => {});
      }

      // Build a comprehensive prompt that covers all possible outcomes:
      // 1. Product found + approved alternatives exist
      // 2. Product found + no approved alternatives exist
      // 3. Product not in inventory
      // In all cases, ask clarifying questions about use case and requirements.
      let promptContent = '';

      if (!alternatives.rows || alternatives.rows.length === 0) {
        // No approved alternatives found (product not in inventory or no peers)
        promptContent = `AUTHORITATIVE DATA (use this to answer; do not call more tools):\n` +
          `The product "${alternatives.searchedFor}" was searched in GEAR's IT Standards inventory.\n` +
          `Result: ${alternatives.note}\n\n` +
          `IMPORTANT: The user asked for an alternative/substitute/comparable product. Your job is to:\n` +
          `1. Plainly state that GEAR has no approved alternatives for "${alternatives.searchedFor}" (and explain why if the product isn't in the inventory).\n` +
          `2. Ask clarifying questions to understand the user's specific business problem and requirements:\n` +
          `   - What capabilities or features from "${alternatives.searchedFor}" are they trying to use? (e.g., dashboarding, data integration, ETL, BI, analytics, reporting)\n` +
          `   - What specific business problem are they trying to solve?\n` +
          `   - What data sources or systems do they need to connect to?\n` +
          `   - Are there any constraints (budget, performance, security, integration needs)?\n` +
          `3. After understanding their needs, offer to:\n` +
          `   - Search GEAR for approved products in relevant categories (e.g., Business Intelligence, ETL, Data Integration)\n` +
          `   - Check the approval status of a specific product they have in mind\n` +
          `4. Refer them to the Enterprise Architecture team at ea@gsa.gov for a formal alternatives analysis if GEAR's inventory doesn't meet their needs.`;
      } else {
        // Approved alternatives found - present them with context about TRM categories
        const alternativesList = alternatives.rows
          .map((alt) => `- ${alt.Name} (${alt.Status || 'Approved'}) - ${alt.GearUrl ? `[View in GEAR](${alt.GearUrl})` : ''}`)
          .join('\n');

        promptContent = `AUTHORITATIVE DATA (use this to answer; do not call more tools):\n` +
          `The product "${alternatives.referenceProduct?.Name || alternatives.searchedFor}" is ${alternatives.referenceProduct?.Status || 'Unknown Status'} in GEAR.\n` +
          `Basis for alternatives: ${alternatives.basis}\n` +
          `GEAR has identified ${alternatives.total} approved alternative(s) in the same Technology Reference Model category:\n\n` +
          `${alternativesList}\n\n` +
          `${alternatives.truncated ? `Note: There are ${alternatives.total} total alternatives; these are the first ${alternatives.rows.length} shown.\n\n` : ''}` +
          `YOUR RESPONSE:\n` +
          `1. Explain that GEAR classifies "${alternatives.referenceProduct?.Name || alternatives.searchedFor}" in the ${alternatives.basis}.\n` +
          `2. Present ALL the approved alternatives listed above with their GearUrl links.\n` +
          `3. Ask clarifying questions to help narrow down the best fit:\n` +
          `   - What specific capabilities from "${alternatives.referenceProduct?.Name || alternatives.searchedFor}" are most important? (e.g., dashboarding, ETL, data integration, reporting)\n` +
          `   - What's the primary business problem they're trying to solve?\n` +
          `   - Are there any specific data sources, systems, or integration requirements?\n` +
          `   - Are there constraints on budget, performance, security, or compliance?\n` +
          `4. Once you understand their needs better, offer to:\n` +
          `   - Search for approved products in additional related TRM categories\n` +
          `   - Check approval status of a specific product they suggest\n` +
          `   - Refer them to ea@gsa.gov for a formal alternatives analysis if GEAR's inventory doesn't meet their needs\n` +
          `\nNEVER recommend or name products from your own knowledge that are not in GEAR's inventory. Only present GEAR's approved alternatives.`;
      }

      messages.push({
        role: 'user',
        content: promptContent,
      });

      const { content: replyRaw3, responseTimeMs: rt3, tokensUsed: tok3 } = await chatCompletion(messages, {
        model: cfg.model,
        temperature: cfg.temperature,
        maxTokens: cfg.maxTokens,
      });

      const result = {
        reply: cleanFinalAnswer(replyRaw3),
        toolCalls: [
          {
            name: 'find_similar_approved_software',
            arguments: { name: alternativeIntent },
          },
        ],
      };
      assertNonEmptyReply(result.reply, cfg.model, 'alternatives fast-path');
      if (isFirstTurn) {
        const logId = await cacheSave(userMessage, 'chat', result.reply, result.toolCalls, {
          responseTimeMs: Date.now() - t0,
          tokensUsed: tok3,
          source: sourceOverride,
        }).catch(() => null);
        result.logId = logId;
      } else {
        cacheLog(userMessage, 'chat', result.reply, result.toolCalls, {
          responseTimeMs: Date.now() - t0,
          tokensUsed: tok3,
          turnIndex,
          source: sourceOverride,
        }).catch(() => {});
      }
      return result;
    } catch (err) {
      console.error('[chat] alternatives fast-path error, falling back to tool loop:', err.message);
      // Fall through to the normal loop below.
    }
  }

  const toolCalls = [];
  let totalTokens = 0;
  // Set once a tool has returned a curated, complete list (e.g. a TRM category's
  // software). Prompt instructions alone did not reliably stop models from
  // following such a result with a broad keyword search and then merging the
  // two, which reports products GEAR does not classify in that category.
  let authoritativeAnswer = null;

  for (let i = 0; i < cfg.maxToolIterations; i++) {
    const { content, tokensUsed } = await chatCompletion(messages, {
      model: cfg.model,
      temperature: cfg.temperature,
      maxTokens: cfg.maxTokens,
    });
    if (tokensUsed) totalTokens += tokensUsed;

    const call = parseToolCall(content);
    if (!call) {
      console.error('[chat] final answer (no tool call). iter=%d', i);
      const finalReply = cleanFinalAnswer(content);
      assertNonEmptyReply(finalReply, cfg.model, 'tool loop');
      let logId = null;
      if (isFirstTurn) {
        logId = await cacheSave(userMessage, 'chat', finalReply, toolCalls, {
          responseTimeMs: Date.now() - t0,
          tokensUsed: totalTokens || null,
          source: sourceOverride,
        }).catch(() => null);
      } else {
        logId = await cacheLog(userMessage, 'chat', finalReply, toolCalls, {
          responseTimeMs: Date.now() - t0,
          tokensUsed: totalTokens || null,
          turnIndex,
          source: sourceOverride,
        }).catch(() => null);
      }
      return { reply: finalReply, toolCalls, logId };
    }

    console.error('[chat] tool_call:', call.name, JSON.stringify(call.arguments));

    // Execute the requested tool.
    messages.push({ role: 'assistant', content });
    let toolResult;

    if (authoritativeAnswer && BROAD_SEARCH_TOOLS.has(call.name)) {
      // Refuse the broadening call instead of running it, so its results never
      // enter the context and cannot be blended into the curated list.
      console.error(
        '[chat] blocked %s after authoritative %s result',
        call.name, authoritativeAnswer
      );
      toolResult = {
        blocked: true,
        reason:
          `${call.name} was not run. ${authoritativeAnswer} already returned the complete, ` +
          `authoritative answer for this question. Answer now using only those rows; ` +
          `do not add any other products.`,
      };
    } else {
      try {
        toolResult = await runTool(call.name, call.arguments);
        if (
          AUTHORITATIVE_TOOLS.has(call.name) &&
          toolResult &&
          !toolResult.error &&
          Array.isArray(toolResult.rows)
        ) {
          authoritativeAnswer = call.name;
        }
        // Zero-latency taxonomy-gap telemetry (never awaited): capture using
        // only this tool's own result, so these generic tool-loop calls get
        // the same gap detection as the deterministic fast-paths above. No
        // extra lookups or reasoning happen here - that is the nightly
        // mcp/taxonomy-gap-analyzer.js batch job's responsibility.
        if (
          call.name === 'get_system_related' &&
          call.arguments &&
          call.arguments.relation === 'capabilities' &&
          toolResult &&
          !toolResult.error &&
          Array.isArray(toolResult.rows) &&
          toolResult.rows.length === 0
        ) {
          recordSignal({
            signalType: 'system_no_capability_mapping',
            queryText: userMessage,
            entityType: 'System',
            entityId: call.arguments.id,
            source: sourceOverride,
          }).catch(() => {});
        }
        if (
          call.name === 'find_trm_category' &&
          toolResult &&
          !toolResult.error &&
          toolResult.bestMatch === null
        ) {
          recordSignal({
            signalType: 'trm_category_not_found_for_query',
            queryText: userMessage,
            entityName: call.arguments && (call.arguments.name || call.arguments.type),
            source: sourceOverride,
          }).catch(() => {});
        } else if (
          call.name === 'list_software_by_category' &&
          toolResult &&
          !toolResult.error &&
          toolResult.trmCategory === null
        ) {
          recordSignal({
            signalType: 'trm_category_not_found_for_query',
            queryText: userMessage,
            entityName: call.arguments && (call.arguments.name || call.arguments.type),
            source: sourceOverride,
          }).catch(() => {});
        }
      } catch (err) {
        toolResult = { error: err.message };
      }
    }
    toolCalls.push({ name: call.name, arguments: call.arguments });

    console.error(
      '[chat] tool_result (%s):',
      call.name,
      JSON.stringify(toolResult).slice(0, 600)
    );

    // USAi/OpenAI style: provide the tool output back to the model. Some models
    // do not accept role:"tool" without a tool_call_id, so we use a user turn
    // that clearly labels the tool output.
    messages.push({
      role: 'user',
      content: `TOOL_RESULT for ${call.name}:\n${JSON.stringify(toolResult).slice(0, 12000)}`,
    });
  }

  // Ran out of iterations; ask for a final answer using what we have.
  const { content: finalContent, tokensUsed: tokFinal } = await chatCompletion(
    [
      ...messages,
      {
        role: 'user',
        content:
          'Please give your best final answer to the original question using the tool results above. Do not call any more tools.',
      },
    ],
    { model: cfg.model, temperature: cfg.temperature, maxTokens: cfg.maxTokens }
  );
  if (tokFinal) totalTokens += tokFinal;
  const finalReply = cleanFinalAnswer(finalContent);
  assertNonEmptyReply(finalReply, cfg.model, 'final wrap-up');
  let finalLogId = null;
  if (isFirstTurn) {
    finalLogId = await cacheSave(userMessage, 'chat', finalReply, toolCalls, {
      responseTimeMs: Date.now() - t0,
      tokensUsed: totalTokens || null,
      source: sourceOverride,
    }).catch(() => null);
  } else {
    finalLogId = await cacheLog(userMessage, 'chat', finalReply, toolCalls, {
      responseTimeMs: Date.now() - t0,
      tokensUsed: totalTokens || null,
      turnIndex,
      source: sourceOverride,
    }).catch(() => null);
  }
  return { reply: finalReply, toolCalls, logId: finalLogId };
}

/** Keep only well-formed user/assistant turns and cap length. */
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
    )
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));
}

module.exports = { runChat, loadConfig, normalizeGearLinks };

