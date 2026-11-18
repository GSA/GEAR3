/**
 * Tests for the taxonomy-gap analyzer's pure, no-I/O helper functions:
 * Proposed_SQL builders and the model-response JSON extractor.
 *
 * These are the functions that turn a validated decision (an existing node id,
 * or a new-node-name + existing-parent-id pair) into draft SQL text. They are
 * deliberately pure so they can be tested without a database or USAi call;
 * the actual gear_schema reads/writes and USAi call live in
 * runNightlyAnalysis(), which is exercised manually via
 * `npm run taxonomy-gaps:run` against a real environment.
 *
 * Run: node --test mcp/test/taxonomy-gap-analyzer.test.js
 */

const test = require('node:test');
const assert = require('node:assert');

const {
  extractJsonObject,
  buildAddMappingSql,
  buildAddNodeSql,
  buildRemoveNodeMergeSql,
  buildManualReviewPlaceholderSql,
  sqlString,
} = require('../taxonomy-gap-analyzer');
const { assertSqlAllowed, DbGuardViolation } = require('../db-guard');

test('buildAddMappingSql links an existing TRM category to a technology', () => {
  assert.strictEqual(
    buildAddMappingSql('technology_trm_mapping', 42, 100),
    'INSERT INTO gear_schema.zk_technology_TRM (obj_TRM_Id, obj_technology_Id) VALUES (42, 100);'
  );
});

test('buildAddMappingSql links an existing Business Capability to a system', () => {
  assert.strictEqual(
    buildAddMappingSql('system_capability_mapping', 7, 200),
    'INSERT INTO gear_schema.zk_systems_subsystems_capabilities (obj_capability_Id, obj_systems_subsystems_Id) VALUES (7, 200);'
  );
});

test('buildAddNodeSql creates a new TRM category under an existing parent, then maps the technology', () => {
  const sql = buildAddNodeSql({
    gapType: 'technology_trm_mapping',
    name: 'Data Visualization Platforms',
    description: 'BI tools for dashboards',
    level: 3,
    parentId: 5,
    entityId: 100,
  });
  // Parent creation step must precede the mapping step, and must use
  // LAST_INSERT_ID() rather than a guessed id, so the new node is never left
  // orphaned and the mapping always targets the row actually created.
  assert.match(sql, /INSERT INTO gear_schema\.obj_TRM .* VALUES \('Data Visualization Platforms', 'BI tools for dashboards', 3, 5\);/);
  assert.match(sql, /INSERT INTO gear_schema\.zk_technology_TRM \(obj_TRM_Id, obj_technology_Id\) VALUES \(LAST_INSERT_ID\(\), 100\);$/);
  assert.ok(sql.indexOf('obj_TRM') < sql.indexOf('LAST_INSERT_ID'));
});

test('buildAddNodeSql creates a new Business Capability under an existing parent, then maps the system', () => {
  const sql = buildAddNodeSql({
    gapType: 'system_capability_mapping',
    name: 'Grants Lifecycle Management',
    description: 'Manages grant applications end to end',
    level: 2,
    parentId: 9,
    entityId: 300,
  });
  assert.match(sql, /INSERT INTO gear_schema\.obj_capability .* VALUES \('Grants Lifecycle Management', 'Manages grant applications end to end', 2, 9\);/);
  assert.match(sql, /INSERT INTO gear_schema\.zk_systems_subsystems_capabilities \(obj_capability_Id, obj_systems_subsystems_Id\) VALUES \(LAST_INSERT_ID\(\), 300\);$/);
});

test('buildAddNodeSql escapes single quotes in name/description so the statement stays valid', () => {
  const sql = buildAddNodeSql({
    gapType: 'technology_trm_mapping',
    name: "O'Reilly's Category",
    description: 'A "quoted" description',
    level: 3,
    parentId: 1,
    entityId: 2,
  });
  assert.match(sql, /'O\\'Reilly\\'s Category'/);
});

test('buildRemoveNodeMergeSql re-parents children and re-maps technologies before deleting the duplicate TRM category', () => {
  const sql = buildRemoveNodeMergeSql('trm_category', 1, 2);
  const parentIdx = sql.indexOf('UPDATE gear_schema.obj_TRM SET obj_technology_category_Parent_Id');
  const mapIdx = sql.indexOf('UPDATE gear_schema.zk_technology_TRM');
  const deleteIdx = sql.indexOf('DELETE FROM gear_schema.obj_TRM');
  // Every reference to the duplicate (Id 2) must be rewired before it is deleted.
  assert.ok(parentIdx !== -1 && mapIdx !== -1 && deleteIdx !== -1);
  assert.ok(parentIdx < deleteIdx && mapIdx < deleteIdx, 'child/mapping rewiring must precede the DELETE');
  assert.match(sql, /WHERE obj_technology_category_Parent_Id = 2;/);
  assert.match(sql, /WHERE obj_TRM_Id = 2;/);
  assert.match(sql, /WHERE Technology_Category_Id = 2;$/);
});

test('buildRemoveNodeMergeSql re-parents children and re-maps systems before deleting the duplicate Capability', () => {
  const sql = buildRemoveNodeMergeSql('business_capability', 3, 4);
  const deleteIdx = sql.indexOf('DELETE FROM gear_schema.obj_capability');
  assert.ok(sql.indexOf('UPDATE gear_schema.obj_capability SET Parent_Id') < deleteIdx);
  assert.ok(sql.indexOf('UPDATE gear_schema.zk_systems_subsystems_capabilities') < deleteIdx);
  assert.match(sql, /WHERE capability_Id = 4;$/);
});

test('buildManualReviewPlaceholderSql produces a harmless SQL comment, not an executable statement', () => {
  const sql = buildManualReviewPlaceholderSql('could not ground a match');
  assert.match(sql, /^-- MANUAL REVIEW REQUIRED:/);
  assert.ok(!/;.*\S/.test(sql.replace(/^--.*$/m, '')), 'placeholder must carry no real SQL after the comment');
});

test('every generated Proposed_SQL statement is rejected by db-guard when run through an AI-layer pool', () => {
  // This is the structural proof that Proposed_SQL is advisory-only text: even
  // though these builders know how to write valid gear_schema SQL, nothing in
  // the AI layer's real DB pools (all scoped to gear_log by db-guard.js) can
  // ever execute it.
  const writable = { defaultSchema: 'gear_log', label: 'test' };
  const samples = [
    buildAddMappingSql('technology_trm_mapping', 42, 100),
    buildAddMappingSql('system_capability_mapping', 7, 200),
    buildAddNodeSql({ gapType: 'technology_trm_mapping', name: 'X', description: '', level: 3, parentId: 1, entityId: 2 }),
    buildAddNodeSql({ gapType: 'system_capability_mapping', name: 'Y', description: '', level: 2, parentId: 1, entityId: 2 }),
    buildRemoveNodeMergeSql('trm_category', 1, 2),
    buildRemoveNodeMergeSql('business_capability', 3, 4),
  ];
  for (const sql of samples) {
    assert.throws(() => assertSqlAllowed(sql, writable), DbGuardViolation, `expected block for: ${sql}`);
  }
});

test('extractJsonObject parses a clean JSON-only response', () => {
  assert.deepStrictEqual(
    extractJsonObject('{"decision":"map_existing","target_id":"5"}'),
    { decision: 'map_existing', target_id: '5' }
  );
});

test('extractJsonObject tolerates surrounding prose and a markdown code fence', () => {
  const text = 'Here is my answer:\n```json\n{"decision":"no_fit","new_node_name":"X"}\n```\nThanks.';
  assert.deepStrictEqual(extractJsonObject(text), { decision: 'no_fit', new_node_name: 'X' });
});

test('extractJsonObject returns null for non-JSON text', () => {
  assert.strictEqual(extractJsonObject('no json here'), null);
});

test('extractJsonObject returns null for empty/non-string input rather than throwing', () => {
  assert.strictEqual(extractJsonObject(''), null);
  assert.strictEqual(extractJsonObject(undefined), null);
  assert.strictEqual(extractJsonObject(null), null);
});

test('sqlString escapes single quotes and backslashes for safe interpolation', () => {
  assert.strictEqual(sqlString("it's a \"test\""), '\'it\\\'s a "test"\'');
  assert.strictEqual(sqlString(null), "''");
  assert.strictEqual(sqlString(42), "'42'");
});
