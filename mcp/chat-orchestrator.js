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
 * The model + system prompts are read from chat-config.json and hot-reloaded on
 * every request (cheap file read) so they can be tweaked without a restart.
 */

const fs = require('fs');
const path = require('path');

const { tools, runTool } = require('./gear-tools');
const { chatCompletion } = require('./usai-client');
const promptCache = require('./prompt-cache');

const CONFIG_PATH = path.join(__dirname, 'chat-config.json');

/** Read (and lightly validate) the chat config on each call. */
function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  const cfg = JSON.parse(raw);
  return {
    model: cfg.model || 'gemini-2.5-flash-lite',
    temperature: typeof cfg.temperature === 'number' ? cfg.temperature : 0.2,
    maxTokens: typeof cfg.maxTokens === 'number' ? cfg.maxTokens : 1024,
    maxToolIterations:
      typeof cfg.maxToolIterations === 'number' ? cfg.maxToolIterations : 5,
    systemPrompts: Array.isArray(cfg.systemPrompts) ? cfg.systemPrompts : [],
  };
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
  return text.trim();
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
 * Run a full chat turn.
 * @param {Array<{role:string,content:string}>} history Prior user/assistant messages.
 * @param {string} userMessage The new user message.
 * @returns {Promise<{reply:string, toolCalls:Array}>}
 */
async function runChat(history, userMessage) {
  const cfg = loadConfig();

  // Cache lookup: only cache single-turn questions (no prior history) since
  // follow-up questions depend on context and should not be cached.
  const isFirstTurn = !history || history.length === 0;
  if (isFirstTurn) {
    const cached = await promptCache.lookup(userMessage, 'chat');
    if (cached) {
      console.error('[chat] cache HIT — skipping USAi call');
      return cached;
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
        const reply = await chatCompletion(messages, {
          model: cfg.model,
          temperature: cfg.temperature,
          maxTokens: cfg.maxTokens,
        });
        const result = {
          reply: cleanFinalAnswer(reply),
          toolCalls: [
            { name: 'find_system', arguments: { name: softwareIntent } },
            { name: 'get_system_software', arguments: { id: best.Id } },
          ],
        };
        if (isFirstTurn) {
          promptCache.save(userMessage, 'chat', result.reply, result.toolCalls).catch(() => {});
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
        const reply = await chatCompletion(messages, {
          model: cfg.model,
          temperature: cfg.temperature,
          maxTokens: cfg.maxTokens,
        });
        const result = {
          reply: cleanFinalAnswer(reply),
          toolCalls: [
            { name: 'find_system', arguments: { name: recordsIntent } },
            { name: 'get_system_records_schedules', arguments: { id: best.Id } },
          ],
        };
        if (isFirstTurn) {
          promptCache.save(userMessage, 'chat', result.reply, result.toolCalls).catch(() => {});
        }
        return result;
      }
    } catch (err) {
      console.error('[chat] records fast-path error, falling back to tool loop:', err.message);
      // Fall through to the normal loop below.
    }
  }

  const toolCalls = [];

  for (let i = 0; i < cfg.maxToolIterations; i++) {
    const content = await chatCompletion(messages, {
      model: cfg.model,
      temperature: cfg.temperature,
      maxTokens: cfg.maxTokens,
    });

    const call = parseToolCall(content);
    if (!call) {
      console.error('[chat] final answer (no tool call). iter=%d', i);
      const finalReply = cleanFinalAnswer(content);
      if (isFirstTurn) {
        promptCache.save(userMessage, 'chat', finalReply, toolCalls).catch(() => {});
      }
      return { reply: finalReply, toolCalls };
    }

    console.error('[chat] tool_call:', call.name, JSON.stringify(call.arguments));

    // Execute the requested tool.
    messages.push({ role: 'assistant', content });
    let toolResult;
    try {
      toolResult = await runTool(call.name, call.arguments);
    } catch (err) {
      toolResult = { error: err.message };
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
  const finalContent = await chatCompletion(
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
  const finalReply = cleanFinalAnswer(finalContent);
  if (isFirstTurn) {
    promptCache.save(userMessage, 'chat', finalReply, toolCalls).catch(() => {});
  }
  return { reply: finalReply, toolCalls };
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

module.exports = { runChat, loadConfig };

