/**
 * Tests for the AI layer's database write guard (../db-guard.js).
 *
 * Run: node --test mcp/test/db-guard.test.js
 *
 * These are pure unit tests over SQL strings — no database connection is made.
 * They encode the invariant that the GEAR Assistant may only ever write to the
 * `gear_log` schema, and may never touch `gear_acl` or write to `gear_schema`.
 */

const test = require('node:test');
const assert = require('node:assert');

const {
  assertSqlAllowed,
  DbGuardViolation,
  guardPool,
  readOnlyPool,
} = require('../db-guard');

const writable = { defaultSchema: 'gear_log', label: 'test' };

/** Assert a statement is refused by the guard. */
function assertBlocked(sql, options = writable) {
  assert.throws(
    () => assertSqlAllowed(sql, options),
    DbGuardViolation,
    `expected to be blocked: ${sql}`
  );
}

/** Assert a statement is permitted by the guard. */
function assertAllowed(sql, options = writable) {
  assert.doesNotThrow(() => assertSqlAllowed(sql, options), `expected to be allowed: ${sql}`);
}

test('allows the AI layer writes that actually exist today', () => {
  assertAllowed(
    `INSERT INTO gear_log.ai_log
       (DTG, Event, Prompt, Response, Response_Time, Tokens_Used, Source)
     VALUES (NOW(), ?, ?, ?, ?, ?, ?)`
  );
  assertAllowed(
    `INSERT INTO gear_log.search_vectors
       (entity_type, entity_id, name, description, status, type_display,
        content_hash, dimensions, embedding, model)
     VALUES ?
     ON DUPLICATE KEY UPDATE name = VALUES(name), model = VALUES(model)`
  );
  assertAllowed('DELETE FROM gear_log.search_vectors WHERE (entity_type, entity_id) IN (?)');
  assertAllowed('CREATE TABLE IF NOT EXISTS gear_log.search_vectors_staging (id INT)');
  assertAllowed('ALTER TABLE gear_log.search_vectors ADD COLUMN description TEXT NULL AFTER name');
  assertAllowed('DROP TABLE IF EXISTS gear_log.search_vectors_staging');
  assertAllowed(
    `RENAME TABLE gear_log.search_vectors TO gear_log.search_vectors_staging_old,
                  gear_log.search_vectors_staging TO gear_log.search_vectors`
  );
  assertAllowed(
    'UPDATE gear_log.ai_log SET Correct = ?, Review_Notes = ?, Reviewed_DTG = NOW() WHERE Id = ?'
  );
});

test('allows unqualified writes, which resolve to the gear_log default schema', () => {
  assertAllowed('INSERT INTO ai_log (Prompt) VALUES (?)');
  assertAllowed('DELETE FROM search_vectors WHERE entity_id = ?');
  assertAllowed('UPDATE `ai_log` SET Correct = ? WHERE Id = ?');
});

test("blocks every write to gear_schema, GEAR's system of record", () => {
  assertBlocked("UPDATE gear_schema.obj_technology SET Description = 'x' WHERE Id = 1");
  assertBlocked('DELETE FROM gear_schema.obj_fisma_archer WHERE `ex:GEAR_ID` = 1');
  assertBlocked('INSERT INTO gear_schema.obj_ldap_poc (Email) VALUES (?)');
  assertBlocked('REPLACE INTO gear_schema.obj_investments (Investment_Id) VALUES (?)');
  assertBlocked('TRUNCATE TABLE gear_schema.obj_technology');
  assertBlocked('DROP TABLE gear_schema.obj_capability');
  assertBlocked('ALTER TABLE gear_schema.obj_technology ADD COLUMN hacked INT');
  assertBlocked('RENAME TABLE gear_schema.obj_technology TO gear_schema.obj_technology_x');
  assertBlocked('CREATE TABLE gear_schema.sneaky (id INT)');
  assertBlocked('CREATE INDEX idx_x ON gear_schema.obj_technology (Id)');
  assertBlocked("LOAD DATA LOCAL INFILE '/tmp/x' INTO TABLE gear_schema.obj_technology");
});

test('blocks all access to gear_acl, including reads', () => {
  assertBlocked('SELECT jwt FROM gear_acl.logins WHERE email = ?');
  assertBlocked("UPDATE gear_acl.logins SET jwt = 'x' WHERE email = ?");
  assertBlocked('DELETE FROM gear_acl.logins');
  assertBlocked('CALL gear_acl.setJwt(?, ?)');
  assertBlocked('SELECT jwt FROM gear_acl.logins', { readOnly: true, label: 'test' });
});

test('blocks multi-target writes where only one target is allowed', () => {
  assertBlocked('DROP TABLE gear_log.search_vectors, gear_schema.obj_technology');
  assertBlocked(
    'RENAME TABLE gear_log.search_vectors TO gear_log.x, gear_schema.obj_technology TO gear_schema.y'
  );
  assertBlocked(
    `UPDATE gear_log.ai_log AS a JOIN gear_schema.obj_technology AS t ON a.Id = t.Id
     SET t.Description = 'x'`
  );
  assertBlocked('DELETE a, t FROM gear_log.ai_log a JOIN gear_schema.obj_technology t');
});

test('blocks writes hidden behind extra statements or comments', () => {
  assertBlocked('SELECT 1; DELETE FROM gear_schema.obj_technology');
  assertBlocked('INSERT INTO gear_log.ai_log (Prompt) VALUES (?); DROP TABLE gear_schema.obj_TRM');
  assertBlocked('/* harmless */ UPDATE /* still */ gear_schema.obj_technology SET Id = 1');
  assertBlocked('UPDATE gear_schema.obj_technology -- comment\n SET Id = 1');
  assertBlocked('UPDATE\n\tgear_schema\n\t.\n\tobj_technology SET Id = 1');
  assertBlocked('UPDATE `gear_schema`.`obj_technology` SET Id = 1');
  assertBlocked('update GEAR_SCHEMA.OBJ_TECHNOLOGY set Id = 1');
});

test('a schema name inside a string literal does not smuggle a write through', () => {
  // The literal is neutralized, so this is judged on its real target (gear_log).
  assertAllowed("INSERT INTO gear_log.ai_log (Prompt) VALUES ('update gear_schema.obj_technology')");
  // ...but a real second statement after a literal is still caught.
  assertBlocked(
    "INSERT INTO gear_log.ai_log (Prompt) VALUES ('; nice try'); DELETE FROM gear_schema.obj_TRM"
  );
});

test('blocks writes to any schema that is not gear_log', () => {
  assertBlocked('INSERT INTO mysql.user (User) VALUES (?)');
  assertBlocked('UPDATE information_schema.tables SET TABLE_NAME = ?');
  assertBlocked('CREATE TABLE some_other_db.t (id INT)');
});

test('blocks stored procedures, privilege and admin statements outright', () => {
  assertBlocked('CALL gear_schema.anything()');
  assertBlocked('CALL some_proc(1)');
  assertBlocked("GRANT ALL ON *.* TO 'x'@'%'");
  assertBlocked("REVOKE SELECT ON gear_log.* FROM 'x'@'%'");
  assertBlocked('FLUSH PRIVILEGES');
  assertBlocked('LOCK TABLES gear_log.ai_log WRITE');
  assertBlocked('SHUTDOWN');
});

test('denies by default: unrecognized or unverifiable writes are refused', () => {
  assertBlocked('MERGE INTO gear_log.ai_log USING x ON (1=1)');
  assertBlocked('CREATE VIEW gear_log.v AS SELECT 1');
  assertBlocked('CREATE PROCEDURE gear_log.p() BEGIN END');
  assertBlocked('CREATE TRIGGER t BEFORE INSERT ON gear_log.ai_log FOR EACH ROW BEGIN END');
  assertBlocked('');
  assertBlocked('   ');
});

test('reads of GEAR data are allowed, as semantic search requires', () => {
  assertAllowed(
    "SELECT `ex:GEAR_ID` AS Id FROM gear_schema.obj_fisma_archer WHERE `ex:SystemLevel` = 'System'",
    { readOnly: true, label: 'test' }
  );
  assertAllowed(
    'SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?',
    writable
  );
  assertAllowed('WITH x AS (SELECT 1) SELECT * FROM x', { readOnly: true, label: 'test' });
  assertAllowed('SHOW TABLES FROM gear_log', { readOnly: true, label: 'test' });
  assertAllowed('EXPLAIN SELECT 1', { readOnly: true, label: 'test' });
});

test('a read-only connection rejects writes even to gear_log', () => {
  const readOnly = { readOnly: true, label: 'test' };
  assertBlocked('INSERT INTO gear_log.ai_log (Prompt) VALUES (?)', readOnly);
  assertBlocked('DELETE FROM gear_log.search_vectors', readOnly);
  assertBlocked('UPDATE gear_log.ai_log SET Correct = ?', readOnly);
});

test('writes require a connection whose default schema is gear_log', () => {
  assertBlocked('INSERT INTO gear_log.ai_log (Prompt) VALUES (?)', {
    defaultSchema: 'gear_schema',
    label: 'test',
  });
  assertBlocked('INSERT INTO gear_log.ai_log (Prompt) VALUES (?)', { label: 'test' });
});

test('guardPool intercepts query and execute, and guards checked-out connections', async () => {
  const calls = [];
  const fakeConnection = {
    query: async (sql) => { calls.push(['conn.query', sql]); return [[], []]; },
    execute: async (sql) => { calls.push(['conn.execute', sql]); return [[], []]; },
    release: () => calls.push(['release']),
  };
  const fakePool = {
    query: async (sql) => { calls.push(['query', sql]); return [[], []]; },
    execute: async (sql) => { calls.push(['execute', sql]); return [[], []]; },
    getConnection: async () => fakeConnection,
  };

  const guarded = guardPool(fakePool, { defaultSchema: 'gear_log', label: 'test-pool' });

  await guarded.query('INSERT INTO gear_log.ai_log (Prompt) VALUES (?)', ['x']);
  await guarded.execute('SELECT 1');
  assert.deepStrictEqual(calls.map((c) => c[0]), ['query', 'execute']);

  await assert.rejects(
    () => guarded.query('DELETE FROM gear_schema.obj_technology'),
    DbGuardViolation
  );
  await assert.rejects(
    () => guarded.execute('UPDATE gear_acl.logins SET jwt = ?', ['x']),
    DbGuardViolation
  );
  // Blocked statements never reached the underlying pool.
  assert.strictEqual(calls.filter((c) => c[0] === 'query').length, 1);

  const conn = await guarded.getConnection();
  await assert.rejects(
    () => conn.query('DROP TABLE gear_schema.obj_technology'),
    DbGuardViolation
  );
  await conn.query('DELETE FROM gear_log.search_vectors WHERE entity_id = ?', ['1']);
  assert.ok(calls.some((c) => c[0] === 'conn.query'));

  // Non-intercepted members still work through the proxy.
  conn.release();
  assert.ok(calls.some((c) => c[0] === 'release'));
});

test('guardPool supports the option-object query form and rejects SQL-less calls', async () => {
  const seen = [];
  const guarded = guardPool(
    { query: async (arg) => { seen.push(arg); return [[], []]; } },
    { defaultSchema: 'gear_log', label: 'test-pool' }
  );

  await guarded.query({ sql: 'SELECT 1', timeout: 1000 });
  assert.strictEqual(seen.length, 1);

  await assert.rejects(
    () => guarded.query({ sql: 'DELETE FROM gear_schema.obj_technology' }),
    DbGuardViolation
  );
  await assert.rejects(() => guarded.query(undefined), DbGuardViolation);
  assert.strictEqual(seen.length, 1);
});

test('readOnlyPool blocks every write through the wrapped pool', async () => {
  const guarded = readOnlyPool({ query: async () => [[], []] }, 'test-ro');
  await guarded.query('SELECT Id FROM gear_schema.obj_technology');
  await assert.rejects(
    () => guarded.query('UPDATE gear_schema.obj_technology SET Id = 1'),
    DbGuardViolation
  );
  await assert.rejects(
    () => guarded.query('INSERT INTO gear_log.ai_log (Prompt) VALUES (?)'),
    DbGuardViolation
  );
});
