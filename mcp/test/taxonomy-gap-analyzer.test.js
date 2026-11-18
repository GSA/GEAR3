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

/* ------------------------------------------------------------------ *
 * Re-alignment review of EXISTING technology<->TRM mappings
 * ------------------------------------------------------------------ */

const {
  mappingFingerprint,
  selectDueForReview,
  buildRealignMappingSql,
  validateRealignmentDecision,
  buildRealignmentRecommendation,
} = require('../taxonomy-gap-analyzer');

test('mappingFingerprint is order- and duplicate-insensitive', () => {
  assert.strictEqual(mappingFingerprint([3, 1, 3, 2]), '1,2,3');
  assert.strictEqual(mappingFingerprint(['10', 2]), '2,10');
  assert.strictEqual(mappingFingerprint([]), '');
});

test('selectDueForReview prioritises never-reviewed, then changed, then stale, and skips open recommendations', () => {
  const day = 24 * 60 * 60 * 1000;
  const nowMs = 1000 * day;
  const techs = [
    { Id: 1, TrmIds: [5] }, // fresh review, unchanged -> not due
    { Id: 2, TrmIds: [5] }, // stale review -> due (tier 3)
    { Id: 3, TrmIds: [6] }, // mapping changed since review -> due (tier 2)
    { Id: 4, TrmIds: [7] }, // never reviewed -> due (tier 1)
    { Id: 5, TrmIds: [8] }, // never reviewed but has open recommendation -> skipped
    { Id: 6, TrmIds: [5] }, // staler than Id 2 -> due before it
  ];
  const state = new Map([
    ['1', { fingerprint: '5', reviewedMs: nowMs - 1 * day }],
    ['2', { fingerprint: '5', reviewedMs: nowMs - 100 * day }],
    ['3', { fingerprint: '5', reviewedMs: nowMs - 1 * day }],
    ['6', { fingerprint: '5', reviewedMs: nowMs - 200 * day }],
  ]);
  const due = selectDueForReview(techs, state, new Set(['5']), { limit: 10, intervalDays: 90, nowMs });
  assert.deepStrictEqual(due.map((t) => t.Id), [4, 3, 6, 2]);

  const capped = selectDueForReview(techs, state, new Set(['5']), { limit: 2, intervalDays: 90, nowMs });
  assert.deepStrictEqual(capped.map((t) => t.Id), [4, 3]);
});

test('buildRealignMappingSql inserts new links before deleting old ones', () => {
  const { toAdd, toRemove, sql } = buildRealignMappingSql(100, [1, 2], [2, 3]);
  assert.deepStrictEqual(toAdd, [3]);
  assert.deepStrictEqual(toRemove, [1]);
  const insertIdx = sql.indexOf('INSERT INTO gear_schema.zk_technology_TRM (obj_TRM_Id, obj_technology_Id) VALUES (3, 100);');
  const deleteIdx = sql.indexOf('DELETE FROM gear_schema.zk_technology_TRM WHERE obj_TRM_Id = 1 AND obj_technology_Id = 100;');
  assert.ok(insertIdx !== -1 && deleteIdx !== -1);
  assert.ok(insertIdx < deleteIdx, 'technology must never be left unmapped part-way through the script');
  assert.ok(!/obj_TRM_Id = 2\b/.test(sql) && !/VALUES \(2, 100\)/.test(sql), 'unchanged mapping must not be touched');
});

test('buildRealignMappingSql output is rejected by db-guard on an AI-layer pool', () => {
  const { sql } = buildRealignMappingSql(100, [1], [2]);
  assert.throws(() => assertSqlAllowed(sql, { defaultSchema: 'gear_log', label: 'test' }), DbGuardViolation);
});

test('validateRealignmentDecision accepts keep and grounded change answers', () => {
  const known = new Set([1, 2, 3]);
  assert.strictEqual(validateRealignmentDecision({ verdict: 'keep', confidence: 'high' }, [1], known).verdict, 'keep');
  const change = validateRealignmentDecision({ verdict: 'change', target_ids: ['3', 3], confidence: 'medium' }, [1], known);
  assert.deepStrictEqual(change, { verdict: 'change', desiredIds: [3], confidence: 'medium', reasoning: '' });
});

test('validateRealignmentDecision rejects ungrounded, empty, or malformed answers', () => {
  const known = new Set([1, 2]);
  assert.strictEqual(validateRealignmentDecision({ verdict: 'change', target_ids: [99] }, [1], known), null);
  assert.strictEqual(validateRealignmentDecision({ verdict: 'change', target_ids: [] }, [1], known), null);
  assert.strictEqual(validateRealignmentDecision({ verdict: 'change' }, [1], known), null);
  assert.strictEqual(validateRealignmentDecision({ verdict: 'maybe' }, [1], known), null);
  assert.strictEqual(validateRealignmentDecision(null, [1], known), null);
});

test('validateRealignmentDecision treats a change to the identical set as keep', () => {
  const d = validateRealignmentDecision({ verdict: 'change', target_ids: [2, 1] }, [1, 2], new Set([1, 2]));
  assert.strictEqual(d.verdict, 'keep');
});

test('validateRealignmentDecision always drops mappings to TRM ids that no longer exist', () => {
  const d = validateRealignmentDecision({ verdict: 'keep', confidence: 'low' }, [1, 99], new Set([1]));
  assert.deepStrictEqual(d.desiredIds, [1]);
  assert.strictEqual(d.verdict, 'change');
  // If every current mapping is dangling, there is nothing safe to keep; a human must decide.
  assert.strictEqual(validateRealignmentDecision({ verdict: 'keep' }, [99], new Set([1])), null);
});

test('buildRealignmentRecommendation labels add-only, remove-only, and swap changes correctly', () => {
  const trmById = new Map([
    [1, { Id: 1, Name: 'Databases' }],
    [2, { Id: 2, Name: 'Data Visualization' }],
  ]);
  const tech = { Id: 100, Name: 'Tableau', Status: 'Approved', TrmIds: [1] };
  const base = { confidence: 'medium', reasoning: 'BI tool.' };

  const swap = buildRealignmentRecommendation(tech, { ...base, desiredIds: [2] }, trmById, 's', 'test');
  assert.strictEqual(swap.recommendedAction, 'remap_mapping');
  assert.strictEqual(swap.gapType, 'technology_trm_mapping');
  assert.strictEqual(swap.affectedEntityId, 100);
  assert.match(swap.recommendedAddition, /map it to "Data Visualization" \(Id 2\); remove its mapping to "Databases" \(Id 1\)/);

  const add = buildRealignmentRecommendation(tech, { ...base, desiredIds: [1, 2] }, trmById, 's', 'test');
  assert.strictEqual(add.recommendedAction, 'add_mapping');

  const remove = buildRealignmentRecommendation({ ...tech, TrmIds: [1, 2] }, { ...base, desiredIds: [2] }, trmById, 's', 'test');
  assert.strictEqual(remove.recommendedAction, 'remove_mapping');

  assert.strictEqual(buildRealignmentRecommendation(tech, { ...base, desiredIds: [1] }, trmById, 's', 'test'), null);
});

/* ------------------------------------------------------------------ *
 * Unmapped-standard scan rotation (shares selectDueForReview with re-alignment)
 * ------------------------------------------------------------------ */

const { reviewTier } = require('../taxonomy-gap-analyzer');

test('unmapped scan filters covered standards before the cap, so it never stalls on the lowest Ids', () => {
  const day = 24 * 60 * 60 * 1000;
  const nowMs = 1000 * day;
  const unmapped = [1, 2, 3, 4, 5].map((Id) => ({ Id, TrmIds: [] }));
  // Ids 1-3 have open recommendations awaiting an admin; previously these
  // filled every slot of a cap of 3 forever.
  const open = new Set(['1', '2', '3']);
  const due = selectDueForReview(unmapped, new Map(), open, { limit: 3, intervalDays: 90, nowMs });
  assert.deepStrictEqual(due.map((t) => t.Id), [4, 5]);
});

test('a rejected unmapped-standard suggestion is not raised again until the interval elapses', () => {
  const day = 24 * 60 * 60 * 1000;
  const nowMs = 1000 * day;
  const tech = { Id: 7, TrmIds: [] };
  const cutoff = nowMs - 90 * day;
  // Rejected => no longer open, but the review row is recent.
  assert.strictEqual(reviewTier(tech, { fingerprint: '', reviewedMs: nowMs - 5 * day }, new Set(), cutoff), null);
  assert.strictEqual(reviewTier(tech, { fingerprint: '', reviewedMs: nowMs - 91 * day }, new Set(), cutoff), 2);
});

test('an open recommendation of ANY gap type blocks re-review (e.g. a trm_category add_node)', () => {
  // fetchOpenRecommendationEntityIds collects by entity, not gap type, so an
  // open "create a new TRM category" suggestion counts as covering the standard.
  assert.strictEqual(reviewTier({ Id: 9, TrmIds: [] }, undefined, new Set(['9']), 0), null);
  assert.strictEqual(reviewTier({ Id: 9, TrmIds: [] }, undefined, new Set(), 0), 0);
});

test('a standard that lost all its mappings is due again, because its fingerprint changed', () => {
  assert.strictEqual(reviewTier({ Id: 3, TrmIds: [] }, { fingerprint: '4,5', reviewedMs: Date.now() }, new Set(), 0), 1);
});
