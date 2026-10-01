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
 * Run a full chat turn.
 * @param {Array<{role:string,content:string}>} history Prior user/assistant messages.
 * @param {string} userMessage The new user message.
 * @returns {Promise<{reply:string, toolCalls:Array}>}
 */
async function runChat(history, userMessage) {
  const cfg = loadConfig();

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
        return {
          reply: cleanFinalAnswer(reply),
          toolCalls: [
            { name: 'find_system', arguments: { name: softwareIntent } },
            { name: 'get_system_software', arguments: { id: best.Id } },
          ],
        };
      }
    } catch (err) {
      console.error('[chat] fast-path error, falling back to tool loop:', err.message);
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
      return { reply: cleanFinalAnswer(content), toolCalls };
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
  return { reply: cleanFinalAnswer(finalContent), toolCalls };
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

/**
 * Produce a short AI overview of a global-search term in the context of the
 * results already returned by GEAR's search. The search results are passed in
 * directly (from the same query the results table uses) so we do not spend an
 * extra tool round-trip. Returns a concise natural-language summary.
 *
 * @param {string} searchKW The user's search term.
 * @param {Array} results The GEAR global-search result rows.
 * @returns {Promise<{reply:string}>}
 */
async function runSearchOverview(searchKW, results) {
  const cfg = loadConfig();

  // If the search term is actually a "what software does <X> use" question,
  // answer it authoritatively (find_system -> get_system_software) instead of
  // just summarizing the raw search rows (which are website-biased and lead the
  // model to say "I will need to query the system's inventory"). This makes the
  // first overview match what the user wanted without a second prompt.
  const softwareIntent = detectSystemSoftwareQuestion(searchKW);
  if (softwareIntent) {
    try {
      const found = await runTool('find_system', { name: softwareIntent });
      const best = found && found.bestMatch;
      if (best && best.Id) {
        const software = await runTool('get_system_software', { id: best.Id });
        console.error(
          '[overview] fast-path software: system=%s(%s) rows=%s',
          best.Name,
          best.Id,
          software && software.total
        );
        const sysContent = [
          ...cfg.systemPrompts,
          '',
          'You are generating a brief overview to display above a search results table.',
        ].join('\n');
        const reply = await chatCompletion(
          [
            { role: 'system', content: sysContent },
            {
              role: 'user',
              content:
                `AUTHORITATIVE DATA (use this to answer; do not say you need to query anything):\n` +
                `The business system matching "${softwareIntent}" is "${best.Name}" (${best.Type}).\n` +
                `Its IT standards (software products) recorded in GEAR are:\n` +
                `${JSON.stringify(software, null, 2)}\n` +
                `Answer the question "What software does ${softwareIntent} use?" using ONLY this data: state the system name, then list each software product by Name (include Status/compliance if present) as a bulleted list. If the list is empty, say no software is recorded for that system. Keep it concise. Do not mention websites or search results.`,
            },
          ],
          { model: cfg.model, temperature: cfg.temperature, maxTokens: cfg.maxTokens }
        );
        return { reply: cleanFinalAnswer(reply) };
      }
    } catch (err) {
      console.error(
        '[overview] fast-path error, falling back to summary:',
        err.message
      );
      // Fall through to the generic summary below.
    }
  }

  const rows = Array.isArray(results) ? results.slice(0, 30) : [];
  const compact = rows.map((r) => ({
    Name: r.Name,
    Type: r.GEAR_Type_Display || r.GEAR_Type,
    Status: r.Status,
    Description:
      typeof r.Description === 'string' ? r.Description.slice(0, 300) : r.Description,
  }));

  const systemContent = [
    ...cfg.systemPrompts,
    '',
    'You are generating a brief overview to display above a search results table.',
    'Summarize what the search term appears to refer to within GEAR, and characterize the results (how many, what kinds of entities, notable items). Be concise: 2-4 short sentences or a few bullet points.',
    'Only use the provided results data; do not invent entities. If there are no results, say the search returned no matches and suggest refining the term.',
  ].join('\n');

  const userContent =
    `Search term: "${searchKW}"\n\n` +
    `GEAR search results (JSON, up to 30 rows of ${rows.length} shown):\n` +
    JSON.stringify(compact);

  const reply = await chatCompletion(
    [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent.slice(0, 12000) },
    ],
    { model: cfg.model, temperature: cfg.temperature, maxTokens: cfg.maxTokens }
  );

  return { reply };
}

module.exports = { runChat, runSearchOverview, loadConfig };

