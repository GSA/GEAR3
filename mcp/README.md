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
        │     ▲
        │     └── also used by mcp/gear-mcp-server.js (stdio) for VS Code / desktop clients
        ▼
mcp/hybrid-search.js ──► mcp/vector-store.js  (gear_log.search_vectors)
                    └──► usai-client.js embed() ──► USAi Embeddings
```

## Files added

| File | Purpose |
| --- | --- |
| `mcp/gear-tools.js` | Shared tool definitions + handlers (call GEAR `/api`). Single source of truth. |
| `mcp/gear-mcp-server.js` | MCP stdio server that registers those tools. |
| `mcp/usai-client.js` | USAi Chat Completions + Embeddings client (Bearer `AI_CERT`). |
| `mcp/chat-orchestrator.js` | Prompted tool-use loop; reads `chat-config.json`. |
| `mcp/chat-config.json` | **Editable** model id + system prompts (hot-reloaded per request). |
| `mcp/hybrid-search.js` | Hybrid retrieval: exact ID/name matching + semantic/keyword score blend. |
| `mcp/vector-store.js` | `gear_log.search_vectors` storage + in-memory cosine search. |
| `mcp/search-corpus.js` | Which GEAR records are searchable and how they become embeddable text. |
| `mcp/embedding-pipeline.js` | Delta refresh (every few minutes) + nightly full rebuild. |
| `mcp/embedding-cli.js` | `rebuild` / `refresh` / `stats` / `query` commands. |
| `api/routes/chat.routes.js`, `api/controllers/chat.controller.js` | `POST /api/chat`. |
| `src/app/services/chatbot/chatbot.service.ts` | Angular client for `/api/chat`. |
| `src/app/components/chatbot/*` | Chat widget (replaces global search). |
| `.vscode/mcp.json` | Registers the MCP server in VS Code. |

## Configuration

- **USAi key**: `AI_CERT` in `.env` (already set). Sent as `Authorization: Bearer`.
- **Model & prompts**: edit `mcp/chat-config.json`. Change `"model"` to compare
  models (e.g. `gemini-2.5-flash-lite`, `claude_4_5_sonnet`). Add/edit entries in
  `"systemPrompts"` to tweak behavior. Changes take effect on the next request
  (no restart).
- **Optional overrides** (`.env`): `USAI_API_BASE`, `GEAR_API_BASE`.

The configured model is **`claude_4_5_haiku`** (Haiku 4.5). It was selected by
benchmarking candidate models through the real orchestrator (full system prompt,
real tool loop) against graded questions with known answers from GEAR's own
data: 12 tasks × 2 repeats, covering wrong-entity substitution, multi-hop tool
chains, approval lookups, and refusal of invented systems.

| Model | Passed | p50 latency | Measured $/10k questions |
| --- | --- | --- | --- |
| `gemini-2.5-flash-lite` | 24/24 | 2.7s | $7.25 |
| **`claude_4_5_haiku`** (configured) | **24/24** | **4.2s** | **$85.49** |
| `claude_4_5_sonnet` (previous) | 24/24 | 6.7s | $269.28 |
| `gpt-5.6-terra` | 17/24 | 2.7s | — |
| `claude-sonnet-5` | 8/24 (throttled) | — | — |

Cost is measured, not list price: this app sends ~6,700 input tokens and makes
~1.8 USAi calls per question, because the system prompt is large and each tool
result is replayed as another full-context turn. `gemini-2.5-flash-lite` scored
equally well and is ~12× cheaper again if budget pressure increases.

**Note on `temperature`:** newer models (the GPT 5.6 family, Claude Sonnet 5)
reject the `temperature` parameter with HTTP 400 rather than ignoring it.
`usai-client.js` detects this, remembers the model, and retries without it, so
swapping `"model"` never hard-fails. Some models are listed in USAi's pricing
table but not served by the API — call the models endpoint below to confirm what
is actually selectable.

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

### First-time semantic search setup

Semantic search needs its index built once before it returns anything:

```
npm run embeddings:rebuild    # ~2-3 minutes for the full corpus
```

Set `GEAR_SEMANTIC_SEARCH="true"` in `.env` (plus the two cron schedules) so the
API server keeps the index current. Until the index exists, retrieval
automatically falls back to keyword-only search.

## Available tools

`search_gear`, `find_system`, `get_system`, `get_system_related`,
`get_system_software`, `get_system_records_schedules`, `get_software_approval`,
`list_approved_software`, `list_software_by_category`, `find_trm_category`,
`get_trm_software`, `list_capabilities`, `list_investments`,
`list_organizations`, `list_it_standards`, `list_websites`.
All are read-only and call the existing GEAR controllers.

### Authoritative category listings

Questions of the form "what <kind of> software is in the inventory?" must be
answered from GEAR's curated Technology Reference Model mappings, not from
keyword search. `list_software_by_category` resolves a technology type (e.g.
"low code/no code", "web server", "programming language") to its TRM category
and returns the complete set of IT standards GEAR classifies under it, via
`/api/trm/get/relatedITStandards/:id`.

Keyword search is actively wrong for these questions: searching "low code no
code" returns editors, scanners, and CI tools whose descriptions merely contain
those words, and models then present them as category members.

Two safeguards back this up, because prompt instructions alone did not hold:

- `list_software_by_category` is a **single call** that resolves the category
  and fetches its software together. An earlier find-then-get pair let the model
  skip the second step and substitute a keyword search.
- `chat-orchestrator.js` **blocks** `search_gear`, `list_it_standards`, and
  `list_approved_software` for the rest of the turn once an authoritative tool
  has returned rows (see `AUTHORITATIVE_TOOLS` / `BROAD_SEARCH_TOOLS` in
  `gear-tools.js`). The blocked call returns an explanatory stub instead of
  running, so unrelated products never enter the context to be merged in.

TRM categories are hierarchical (Domain > Area > Category). Software is mapped
at the Category level, so requesting an Area sets `includeChildren` to roll up
its children. Category names are singular in the data ("Programming Language"),
so matching also compares a singularized form of the query.

## Semantic (vector) search

`search_gear` and `find_system` combine GEAR's keyword FULLTEXT search with
semantic search over embeddings of GEAR's records, so plain-English questions
("what do we use for ticketing?") match on meaning rather than only on literal
word overlap.

### How results are ranked

1. **Exact identifier** — a bare numeric GEAR ID returns that record directly.
   FULLTEXT cannot match numeric IDs at all, so these previously returned
   nothing.
2. **Exact / prefix / whole-word / acronym name match** — pinned above semantic
   results, so typing a record's real name or acronym always wins.
3. **Blend** — remaining candidates are ranked by min-max normalized semantic
   and keyword scores, weighted by `GEAR_SEMANTIC_WEIGHT` (default `0.85`).

Score blending is used rather than reciprocal rank fusion deliberately. GEAR's
FULLTEXT query runs in `BOOLEAN MODE` without operators, so it behaves like an
OR over query terms and returns many weakly-related rows for a natural-language
question. Rank-based fusion treats those as equal in authority to strong
semantic matches and measurably ranks *worse* than semantic alone; min-max
normalization keeps the magnitude information that separates a strong keyword
hit from a long incidental tail.

If the vector index is empty or USAi is unreachable, retrieval degrades to the
previous keyword-only ordering rather than failing.

### Index storage

Vectors live in `gear_log.search_vectors` (created automatically on first use),
one row per searchable record, embedding stored as a packed float32 BLOB with a
SHA-256 content hash for change detection. At GEAR's scale (~7,700 records ×
1024 dims ≈ 32 MB) the whole set is held in memory and scanned by brute-force
cosine similarity in a few milliseconds, so no external vector database or
approximate-nearest-neighbour index is needed. Revisit if the corpus approaches
~100k records.

Covered entity types mirror the global search controller: `System`, `FISMA`,
`Technology`, `Capability`, `Organization`, `Investment`, `Website`, `TRM`.

### Keeping the index fresh

Two scheduled jobs, with different responsibilities:

| Job | Schedule | Purpose |
| --- | --- | --- |
| `runDeltaRefresh()` | `EMBEDDING_DELTA_CRON` (default every 5 min) | Hashes all searchable text (~1s, no embedding calls) and re-embeds only changed records, so intra-day edits are searchable within minutes. |
| `runFullRebuild()` | `EMBEDDING_REBUILD_CRON` (default 11:45 PM) | Re-embeds everything into a staging table and swaps it in atomically; reconciles what a hash diff cannot see. |

Change detection uses content hashes rather than modified-date columns or write
hooks, because most GEAR tables have no usable change column (only
`obj_technology` and `obj_TRM` have an auto-updating `ChangeDTG`;
`obj_fisma_archer` has none), and because hashing catches changes from every
source — API edits, cron loaders, and direct SQL — without coupling a user's
save to USAi availability.

The nightly rebuild is a *reconciliation* pass, not the freshness mechanism. It
exists to repair drift: rows skipped due to USAi errors, changes to how document
text is built, and embedding model changes. It writes to a staging table and
swaps via `RENAME TABLE`, so searches never see a half-built index, and a failed
rebuild leaves the previous vectors serving.

### Manual operations

```
npm run embeddings:rebuild   # full rebuild (required once before first use)
npm run embeddings:refresh   # delta sweep
npm run embeddings:stats     # row count, age, model
node mcp/embedding-cli.js query "what do we use for ticketing?"
```

### Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `GEAR_SEMANTIC_SEARCH` | *(off)* | Master switch; must be `true` to enable semantic search and its cron jobs. |
| `EMBEDDING_DELTA_CRON` | — | Delta refresh schedule. |
| `EMBEDDING_REBUILD_CRON` | — | Nightly rebuild schedule. |
| `GEAR_SEMANTIC_WEIGHT` | `0.85` | Semantic share of the blended score. |
| `GEAR_SEARCH_CANDIDATE_DEPTH` | `50` | Candidates taken from each arm before blending. |
| `GEAR_MIN_SEMANTIC_SCORE` | `0.2` | Minimum cosine similarity to consider. |
| `GEAR_VECTOR_CACHE_TTL_MS` | `300000` | How long the in-memory index is trusted before reload. |
| `USAI_EMBEDDING_MODEL` | `cohere_english_v3` | Embedding model. |
| `GEAR_EMBED_BATCH_SIZE` | `96` | Documents per embeddings request. |
| `GEAR_EMBED_DELTA_MAX` | `600` | Max documents re-embedded per delta run; the rest defer to the nightly rebuild. |

Changing `USAI_EMBEDDING_MODEL` requires a full rebuild — vectors from different
models are not comparable, and dimensionality may differ. The delta refresh
detects a model mismatch and re-embeds affected rows automatically.

**Implementation note:** Cohere embeddings are asymmetric. Corpus text is
embedded as `search_document` and queries as `search_query`; USAi defaults to
`search_document` when `input_type` is omitted, so omitting it at query time
silently degrades retrieval quality.

## Logging and response review

Chat interactions are logged to `gear_log.ai_log`, which doubles as the prompt
cache's L2 store. Two columns make that log usable for analytics:

| Column | Values | Meaning |
| --- | --- | --- |
| `Source` | `user` / `developer` / `test` | Where the prompt came from |
| `Correct` | `correct` / `partial` / `incorrect` | Review verdict; `NULL` = unreviewed |
| `Review_Notes` | free text | Why the verdict was given |
| `Reviewed_DTG` | timestamp | When it was reviewed |

`Source` is resolved per message by `resolveSource()` in `prompt-cache.js`:

1. a **`dev!` message prefix** marks that single turn as `developer`;
2. otherwise explicit `GEAR_AI_LOG_SOURCE` (`user` | `developer` | `test`);
3. otherwise `ENVIRONMENT`/`NODE_ENV` of `development`/`dev`/`local`/`test`
   implies `developer`;
4. default is `user`.

Defaulting to `user` means a misconfigured production server still records real
traffic rather than silently discarding it. Set `GEAR_AI_LOG_SOURCE=test` for
benchmark or scripted runs so they stay out of usage analytics.

**The `dev!` prefix** lets a developer tag a single question as testing even
against a production deployment — type `dev! what software does GEAR use` in the
chatbot. The prefix is case-insensitive, stripped before the model and the log
see it, and never stored, so the logged prompt stays directly comparable to the
same question asked by a real user.

Cache lookups are **scoped to the same `Source`**, so a test or local-dev reply
is never served to a production user — and local prompt tuning gets a fresh
model call instead of a stale cached answer for the same question.

Cache hits are logged too (`Event.cache_hit = true`, no token cost). They were
previously returned without logging, which meant the most-repeated questions
were the least visible in the data.

Analytics queries:

```sql
-- Real user traffic only
SELECT DTG, Prompt, Correct FROM gear_log.ai_log
WHERE Source = 'user' ORDER BY DTG DESC;

-- Known-bad responses worth fixing
SELECT Prompt, Review_Notes FROM gear_log.ai_log
WHERE Source = 'user' AND Correct IN ('incorrect','partial');
```

### Regression questions

`gear_log.ai_eval_question` holds one row per question with the answer a correct
reply must contain, the expected tool chain, and `Must_Not_Contain` for known
hallucinations (e.g. `Flosum` for the low-code/no-code question). It is separate
from `ai_log` because `ai_log` has many responses per question, while the gold
answer belongs to the question.

Schema changes are recorded in
[`api/queries/DDL/2026-10-21_ai_log_review_columns.sql`](../api/queries/DDL/2026-10-21_ai_log_review_columns.sql)
and must be applied once per environment.

## Security notes

- The chatbot/MCP tools **never** run model-generated SQL; they only call
  existing GEAR `/api` endpoints.
- `/api/chat` has its own rate limiter (20/min) to protect the USAi budget
  (USAi enforces 3 chat calls/sec/key plus a weekly cost cap → HTTP 429).
- The embedding pipeline's SQL is a fixed set of read-only queries in
  `mcp/search-corpus.js`; vector writes use parameterized statements.
- Record text is sent to USAi for embedding — the same data path already used
  for chat completions, so no new vendor or data flow is introduced.
- Separately, note that the existing global-search controller and several other
  controllers interpolate user input directly into SQL strings (SQL injection
  risk, OWASP A03). That predates this work and was left unchanged, but it is
  worth remediating with parameterized queries.
