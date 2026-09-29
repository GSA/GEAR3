# GEAR Assistant: MCP Server + USAi Chatbot

This adds an AI assistant that answers questions using GEAR's own data (via its
`/api` endpoints and, through them, the MySQL database) combined with the
**USAi** LLM API. It ships in two reusable parts that share one tool layer:

1. **MCP server** (`mcp/gear-mcp-server.js`) — exposes GEAR data tools over the
   Model Context Protocol for AI clients like VS Code agent mode or Claude
   Desktop.
2. **Web chatbot** — a backend orchestrator (`POST /api/chat`) plus an Angular
   widget that replaces the old global search box in the top navbar.

USAi is OpenAI-compatible but does **not** currently support function/tool
calling, so the browser can't speak MCP and the LLM can't call tools natively.
The orchestrator therefore drives tool use with a small prompted JSON protocol
while reusing the exact same tool functions as the MCP server.

```
Browser (Angular chatbot)
        │  POST /api/chat { message, history }
        ▼
Express  api/controllers/chat.controller.js
        ▼
mcp/chat-orchestrator.js ──► usai-client.js ──► USAi Chat Completions
        │                        (AI_CERT bearer)
        ▼ tool calls
mcp/gear-tools.js ──► GEAR /api/* endpoints ──► MySQL
        ▲
        └── also used by mcp/gear-mcp-server.js (stdio) for VS Code / desktop clients
```

## Files added

| File | Purpose |
| --- | --- |
| `mcp/gear-tools.js` | Shared tool definitions + handlers (call GEAR `/api`). Single source of truth. |
| `mcp/gear-mcp-server.js` | MCP stdio server that registers those tools. |
| `mcp/usai-client.js` | USAi Chat Completions client (Bearer `AI_CERT`). |
| `mcp/chat-orchestrator.js` | Prompted tool-use loop; reads `chat-config.json`. |
| `mcp/chat-config.json` | **Editable** model id + system prompts (hot-reloaded per request). |
| `api/routes/chat.routes.js`, `api/controllers/chat.controller.js` | `POST /api/chat`. |
| `src/app/services/chatbot/chatbot.service.ts` | Angular client for `/api/chat`. |
| `src/app/components/chatbot/*` | Chat widget (replaces global search). |
| `.vscode/mcp.json` | Registers the MCP server in VS Code. |

## Configuration

- **USAi key**: `AI_CERT` in `.env` (already set). Sent as `Authorization: Bearer`.
- **Model & prompts**: edit `mcp/chat-config.json`. Change `"model"` to compare
  models (e.g. `claude_sonnet_4_5`, `gpt_5_2`). Add/edit entries in
  `"systemPrompts"` to tweak behavior. Changes take effect on the next request
  (no restart).
- **Optional overrides** (`.env`): `USAI_API_BASE`, `GEAR_API_BASE`.

To confirm exact model ids, call the USAi models endpoint:

```
GET https://api.gsa.usai.gov/api/v1/models   (Authorization: Bearer <AI_CERT>)
```

## Run

1. Start the GEAR API + Angular dev server as usual:
   ```
   npm start
   ```
   (The chatbot calls `/api/chat`, which the dev proxy already forwards to
   `localhost:3000`.)
2. Open the app; the top navbar now shows an **Ask GEAR** button instead of the
   global search box.

### Use the MCP server from VS Code

1. Ensure the GEAR API is running (`npm run serve-api`) so tools can reach
   `/api`.
2. Open the Command Palette → **MCP: List Servers** → start **gear** (defined in
   `.vscode/mcp.json`). Its tools then appear in agent mode's tool picker.
3. Or run standalone: `npm run mcp`.

## Available tools

`search_gear`, `get_system`, `get_system_related`, `list_capabilities`,
`list_investments`, `list_organizations`, `list_it_standards`, `list_websites`.
All are read-only and call the existing GEAR controllers.

## Security notes

- The chatbot/MCP tools **never** run model-generated SQL; they only call
  existing GEAR `/api` endpoints.
- `/api/chat` has its own rate limiter (20/min) to protect the USAi budget
  (USAi enforces 3 chat calls/sec/key plus a weekly cost cap → HTTP 429).
- Separately, note that the existing global-search controller and several other
  controllers interpolate user input directly into SQL strings (SQL injection
  risk, OWASP A03). That predates this work and was left unchanged, but it is
  worth remediating with parameterized queries.
