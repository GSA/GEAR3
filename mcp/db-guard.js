/**
 * Database write guard for the AI layer.
 *
 * Invariant this module enforces:
 *
 *   The GEAR Assistant (chatbot + MCP server) may READ GEAR's data, but it may
 *   only ever WRITE to the `gear_log` schema. It must NEVER write to
 *   `gear_acl` (authentication/authorization) or `gear_schema` (the system of
 *   record), and must never read `gear_acl` at all.
 *
 * Why a runtime guard when no model-generated SQL is executed:
 *
 *   The AI layer's tools only call GEAR's read-only /api endpoints, so today no
 *   user prompt can reach a write. But the AI layer does hold two real MySQL
 *   pools (prompt-cache for gear_log.ai_log, vector-store for
 *   gear_log.search_vectors), and those pools authenticate as the same
 *   full-privilege DB_USER the rest of the app uses. This guard makes the
 *   restriction explicit and self-enforcing, so a future tool, cache feature,
 *   or feedback-logging path cannot quietly widen the AI layer's write surface.
 *
 * Posture: deny by default. Reads are allowed (except `gear_acl`); writes are
 * allowed only when every target table resolves into an allowed schema. Any
 * statement whose targets cannot be determined with confidence is refused
 * rather than guessed at.
 *
 * This is the application-level half of a defense-in-depth pair. The stronger
 * half is a least-privilege database grant for the AI layer; see the
 * "Database privilege separation" section of ./README.md.
 */

/** The only schema the AI layer may write to. */
const WRITABLE_SCHEMAS = new Set(['gear_log']);

/**
 * Schemas the AI layer must never touch, in any statement.
 *
 * `gear_acl` holds logins, JWTs, and role grants, so it is excluded from reads
 * as well as writes — the AI layer has no legitimate need for any of it.
 */
const FORBIDDEN_SCHEMAS = new Set(['gear_acl']);

/** Statement verbs that only read. Safe for any schema except FORBIDDEN_SCHEMAS. */
const READ_VERBS = new Set(['select', 'with', 'show', 'describe', 'desc', 'explain']);

const IDENT = '(?:`[^`]+`|[A-Za-z_][A-Za-z0-9_$]*)';
const TABLE_REF = `${IDENT}(?:\\s*\\.\\s*${IDENT})?`;
const TABLE_REF_RE = new RegExp(`^(${IDENT})(?:\\s*\\.\\s*(${IDENT}))?$`);

/**
 * Words that may appear where a table reference is expected but are not tables.
 * Anything else in a write target clause is treated as a table and checked.
 */
const NOT_A_TABLE = new Set([
  'to', 'if', 'exists', 'not', 'restrict', 'cascade', 'as', 'using', 'from',
  'join', 'inner', 'left', 'right', 'full', 'outer', 'cross', 'straight_join',
  'on', 'and', 'or', 'where', 'low_priority', 'quick', 'ignore', 'delayed',
  'high_priority', 'temporary', 'table', 'tables', 'into', 'partition', 'null',
  'true', 'false', 'is', 'in', 'select', 'values', 'set', 'duplicate', 'key',
  'update', 'local', 'concurrent',
]);

/**
 * Remove comments and string literals so statement splitting and keyword
 * matching cannot be fooled by SQL embedded in data. Backtick-quoted
 * identifiers are preserved because table names depend on them.
 *
 * @param {string} sql
 * @returns {string}
 */
function stripNoise(sql) {
  return String(sql)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/#[^\n]*/g, ' ')
    .replace(/'(?:[^'\\]|\\.|'')*'/g, "''")
    .replace(/"(?:[^"\\]|\\.|"")*"/g, "''");
}

/** Split a (noise-stripped) script into individual non-empty statements. */
function splitStatements(stripped) {
  return stripped
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Leading verb of a statement, normalized to lower case. */
function statementVerb(statement) {
  const match = statement.match(/^\(*\s*([A-Za-z_]+)/);
  return match ? match[1].toLowerCase() : '';
}

function unquoteIdent(raw) {
  const trimmed = String(raw).trim();
  return trimmed.startsWith('`') && trimmed.endsWith('`')
    ? trimmed.slice(1, -1).trim()
    : trimmed;
}

/**
 * Resolve a table reference to { schema, table }.
 *
 * An unqualified name resolves to the connection's default schema, which is why
 * createGuard() refuses to guard a pool whose default schema is not writable:
 * it is what makes "unqualified means gear_log" a safe assumption.
 *
 * @returns {{schema: string, table: string} | null} null when unparseable.
 */
function resolveTableRef(raw, defaultSchema) {
  const match = String(raw).trim().match(TABLE_REF_RE);
  if (!match) return null;
  const first = unquoteIdent(match[1]);
  if (match[2] === undefined) {
    return { schema: String(defaultSchema).toLowerCase(), table: first.toLowerCase() };
  }
  return { schema: first.toLowerCase(), table: unquoteIdent(match[2]).toLowerCase() };
}

/** Every table-looking reference in a write target clause. */
function tableRefsIn(clause) {
  const matches = String(clause).match(new RegExp(TABLE_REF, 'g')) || [];
  return matches.filter((ref) => !NOT_A_TABLE.has(unquoteIdent(ref).toLowerCase()));
}

/** Truncate a clause at the first of the given keywords. */
function clauseUntil(text, keywords) {
  let end = text.length;
  for (const keyword of keywords) {
    const match = text.match(new RegExp(`\\b${keyword}\\b`, 'i'));
    if (match && match.index < end) end = match.index;
  }
  return text.slice(0, end);
}

/**
 * Single-target write statements. The capture group is the target table.
 * `ON DUPLICATE KEY UPDATE` is handled correctly because INSERT is matched on
 * its own leading verb rather than by scanning for the word UPDATE.
 */
const SINGLE_TARGET_PATTERNS = [
  new RegExp(`^INSERT\\s+(?:(?:LOW_PRIORITY|DELAYED|HIGH_PRIORITY|IGNORE)\\s+)*(?:INTO\\s+)?(${TABLE_REF})`, 'i'),
  new RegExp(`^REPLACE\\s+(?:(?:LOW_PRIORITY|DELAYED)\\s+)*(?:INTO\\s+)?(${TABLE_REF})`, 'i'),
  new RegExp(`^CREATE\\s+(?:TEMPORARY\\s+)?TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(${TABLE_REF})`, 'i'),
  new RegExp(`^ALTER\\s+(?:IGNORE\\s+)?TABLE\\s+(${TABLE_REF})`, 'i'),
  new RegExp(`^(?:CREATE|DROP)\\s+(?:UNIQUE\\s+|FULLTEXT\\s+|SPATIAL\\s+)?INDEX\\s+${IDENT}\\s+ON\\s+(${TABLE_REF})`, 'i'),
  new RegExp(`^LOAD\\s+DATA\\b[\\s\\S]*?\\bINTO\\s+TABLE\\s+(${TABLE_REF})`, 'i'),
];

/**
 * Multi-target write statements. Each entry isolates the clause that holds the
 * target tables, then every reference inside it is checked.
 */
const MULTI_TARGET_EXTRACTORS = [
  {
    re: /^DROP\s+(?:TEMPORARY\s+)?TABLES?\s+(?:IF\s+EXISTS\s+)?([\s\S]+)$/i,
    clause: (m) => clauseUntil(m[1], ['restrict', 'cascade']),
  },
  {
    re: /^TRUNCATE\s+(?:TABLE\s+)?([\s\S]+)$/i,
    clause: (m) => m[1],
  },
  {
    re: /^RENAME\s+TABLES?\s+([\s\S]+)$/i,
    clause: (m) => m[1],
  },
  {
    re: /^UPDATE\s+(?:(?:LOW_PRIORITY|IGNORE)\s+)*([\s\S]+)$/i,
    clause: (m) => clauseUntil(m[1], ['set']),
  },
  {
    re: /^DELETE\s+([\s\S]+)$/i,
    clause: (m) => clauseUntil(m[1], ['where', 'order\\s+by', 'limit']),
  },
];

/**
 * Verbs refused outright. Stored procedures and privilege statements can reach
 * any schema regardless of the text of the call, so they are never allowed from
 * the AI layer. (gear_acl.setJwt and gear_acl.get_user_perms are exactly the
 * kind of procedure this blocks.)
 */
const BLOCKED_VERBS = new Map([
  ['call', 'stored procedures can modify any schema'],
  ['grant', 'privilege changes are never permitted from the AI layer'],
  ['revoke', 'privilege changes are never permitted from the AI layer'],
  ['do', 'arbitrary expression execution is not permitted'],
  ['handler', 'direct table handlers are not permitted'],
  ['flush', 'server administration is not permitted'],
  ['reset', 'server administration is not permitted'],
  ['shutdown', 'server administration is not permitted'],
  ['lock', 'explicit table locking is not permitted'],
  ['unlock', 'explicit table locking is not permitted'],
]);

class DbGuardViolation extends Error {
  constructor(message) {
    super(message);
    this.name = 'DbGuardViolation';
    this.code = 'EGEARDBGUARD';
  }
}

/**
 * Validate one statement, or throw DbGuardViolation.
 *
 * @param {string} statement Noise-stripped single statement.
 * @param {{defaultSchema: string, readOnly: boolean, label: string}} options
 */
function assertStatementAllowed(statement, options) {
  const { defaultSchema, readOnly, label } = options;
  const verb = statementVerb(statement);

  const forbidden = [...FORBIDDEN_SCHEMAS].find((schema) =>
    new RegExp(`\\b${schema}\\b`, 'i').test(statement)
  );
  if (forbidden) {
    throw new DbGuardViolation(
      `[${label}] blocked: the AI layer may not reference the ${forbidden} schema.`
    );
  }

  if (READ_VERBS.has(verb)) return;

  if (readOnly) {
    throw new DbGuardViolation(
      `[${label}] blocked: this connection is read-only, but the statement starts with "${verb.toUpperCase()}".`
    );
  }

  if (BLOCKED_VERBS.has(verb)) {
    throw new DbGuardViolation(
      `[${label}] blocked "${verb.toUpperCase()}": ${BLOCKED_VERBS.get(verb)}.`
    );
  }

  const targets = [];

  for (const pattern of SINGLE_TARGET_PATTERNS) {
    const match = statement.match(pattern);
    if (match) {
      targets.push(match[1]);
      break;
    }
  }

  if (!targets.length) {
    for (const extractor of MULTI_TARGET_EXTRACTORS) {
      const match = statement.match(extractor.re);
      if (match) {
        targets.push(...tableRefsIn(extractor.clause(match)));
        break;
      }
    }
  }

  // Deny by default: an unrecognized write verb, or a write whose targets could
  // not be isolated, is refused rather than assumed safe.
  if (!targets.length) {
    throw new DbGuardViolation(
      `[${label}] blocked: could not verify the write target of a "${verb.toUpperCase()}" statement. ` +
        'The AI layer may only write to the gear_log schema.'
    );
  }

  for (const target of targets) {
    const resolved = resolveTableRef(target, defaultSchema);
    if (!resolved) {
      throw new DbGuardViolation(
        `[${label}] blocked: unparseable write target "${target}".`
      );
    }
    if (!WRITABLE_SCHEMAS.has(resolved.schema)) {
      throw new DbGuardViolation(
        `[${label}] blocked write to ${resolved.schema}.${resolved.table}. ` +
          `The AI layer may only write to: ${[...WRITABLE_SCHEMAS].join(', ')}.`
      );
    }
  }
}

/**
 * Validate a SQL string (which may contain multiple statements), or throw.
 *
 * Exported for direct use and for tests.
 *
 * @param {string} sql
 * @param {{defaultSchema?: string, readOnly?: boolean, label?: string}} [options]
 */
function assertSqlAllowed(sql, options = {}) {
  const resolved = {
    defaultSchema: String(options.defaultSchema || '').toLowerCase(),
    readOnly: Boolean(options.readOnly),
    label: options.label || 'db-guard',
  };

  if (!resolved.readOnly && !WRITABLE_SCHEMAS.has(resolved.defaultSchema)) {
    throw new DbGuardViolation(
      `[${resolved.label}] blocked: writes require a connection whose default schema is ` +
        `one of: ${[...WRITABLE_SCHEMAS].join(', ')} (got "${resolved.defaultSchema || 'none'}").`
    );
  }

  const statements = splitStatements(stripNoise(sql));
  if (!statements.length) {
    throw new DbGuardViolation(`[${resolved.label}] blocked: empty statement.`);
  }
  for (const statement of statements) {
    assertStatementAllowed(statement, resolved);
  }
}

/** Pull the SQL text out of either calling convention mysql2 accepts. */
function sqlTextOf(arg) {
  if (typeof arg === 'string') return arg;
  if (arg && typeof arg === 'object' && typeof arg.sql === 'string') return arg.sql;
  return null;
}

/**
 * Wrap a mysql2 promise pool or connection so every query is checked first.
 *
 * Returns a Proxy, so all other pool methods and properties behave normally.
 * `getConnection()` returns a guarded connection, closing the obvious bypass.
 *
 * @template T
 * @param {T} target mysql2/promise Pool or Connection.
 * @param {{defaultSchema?: string, readOnly?: boolean, label: string}} options
 * @returns {T}
 */
function guardPool(target, options) {
  const label = options.label;
  const settings = {
    defaultSchema: options.defaultSchema,
    readOnly: Boolean(options.readOnly),
    label,
  };

  const check = (args) => {
    const sql = sqlTextOf(args[0]);
    if (sql === null) {
      throw new DbGuardViolation(
        `[${label}] blocked: query called without SQL text, so it cannot be verified.`
      );
    }
    try {
      assertSqlAllowed(sql, settings);
    } catch (err) {
      if (err instanceof DbGuardViolation) {
        // stdout is reserved for the MCP protocol; log violations to stderr.
        console.error('[db-guard] %s | sql: %s', err.message, String(sql).slice(0, 300));
      }
      throw err;
    }
  };

  return new Proxy(target, {
    get(obj, prop, receiver) {
      // Async so a violation surfaces as a rejected promise, matching
      // mysql2/promise semantics instead of throwing synchronously at the
      // call site.
      if (prop === 'query' || prop === 'execute') {
        return async (...args) => {
          check(args);
          return obj[prop](...args);
        };
      }
      if (prop === 'getConnection') {
        return async (...args) => {
          const connection = await obj.getConnection(...args);
          return guardPool(connection, options);
        };
      }
      const value = Reflect.get(obj, prop, receiver);
      return typeof value === 'function' ? value.bind(obj) : value;
    },
  });
}

/**
 * Convenience wrapper for a pool that must never write anywhere, used for the
 * AI layer's read-only access to GEAR's system of record (`gear_schema`).
 */
function readOnlyPool(target, label) {
  return guardPool(target, { readOnly: true, label });
}

module.exports = {
  WRITABLE_SCHEMAS,
  FORBIDDEN_SCHEMAS,
  DbGuardViolation,
  assertSqlAllowed,
  guardPool,
  readOnlyPool,
};
