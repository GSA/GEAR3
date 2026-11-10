/**
 * Tests for GEAR link normalization in the chat orchestrator.
 *
 * Run: node --test mcp/test/gear-links.test.js
 *
 * The assistant must emit GEAR record links in relative, hash-based form
 * ("#/it_standards/7186"). An absolute link works in production only by
 * coincidence and breaks in every other environment, so normalizeGearLinks()
 * enforces it rather than trusting the model to follow the prompt.
 */

const test = require('node:test');
const assert = require('node:assert');

const { normalizeGearLinks } = require('../chat-orchestrator');

test('strips the hostname from GEAR links that carry an Angular hash route', () => {
  assert.strictEqual(
    normalizeGearLinks('[Alteryx](https://gear.gsa.gov#/it_standards/7186)'),
    '[Alteryx](#/it_standards/7186)'
  );
  assert.strictEqual(
    normalizeGearLinks('[X](https://gear.gsa.gov/#/it_standards/7186)'),
    '[X](#/it_standards/7186)'
  );
});

test('strips non-production hostnames too, which is the case that actually breaks', () => {
  assert.strictEqual(
    normalizeGearLinks('[X](http://dev1.ea.gsa.gov#/FISMA/1537)'),
    '[X](#/FISMA/1537)'
  );
  assert.strictEqual(
    normalizeGearLinks('[X](https://dev1.ea.gsa.gov/#/systems/99)'),
    '[X](#/systems/99)'
  );
  assert.strictEqual(
    normalizeGearLinks('[X](http://localhost:4200/#/capabilities/5)'),
    '[X](#/capabilities/5)'
  );
});

test('rebuilds the hash route when the model omits it on a GEAR host', () => {
  assert.strictEqual(
    normalizeGearLinks('[X](https://gear.gsa.gov/it_standards/7186)'),
    '[X](#/it_standards/7186)'
  );
});

test('leaves already-correct relative links unchanged', () => {
  const text = '[X](#/it_standards/7186) and [Y](#/FISMA/1537)';
  assert.strictEqual(normalizeGearLinks(text), text);
});

test('normalizes every link in a multi-link answer', () => {
  assert.strictEqual(
    normalizeGearLinks(
      '[A](https://gear.gsa.gov#/it_standards/1) and [B](https://gear.gsa.gov#/systems/2)'
    ),
    '[A](#/it_standards/1) and [B](#/systems/2)'
  );
});

test('covers every GEAR entity route', () => {
  const routes = [
    'systems', 'FISMA', 'it_standards', 'capabilities',
    'organizations', 'investments', 'websites', 'records_mgmt',
  ];
  for (const route of routes) {
    assert.strictEqual(
      normalizeGearLinks(`[X](https://gear.gsa.gov#/${route}/42)`),
      `[X](#/${route}/42)`,
      `route ${route} should be normalized`
    );
  }
});

test('leaves genuine external links and mailto alone', () => {
  const untouched = [
    '[m](mailto:ea@gsa.gov)',
    '[m](mailto:it-standards@gsa.gov)',
    'See https://www.gsa.gov/policy-and-regulations for details',
    '[doc](https://usai.gsa.gov/docs/api)',
    // A plain /systems/ path on an unrelated host is not distinctive enough
    // to rewrite, so it must be preserved.
    '[ext](https://example.com/systems/2)',
  ];
  for (const text of untouched) {
    assert.strictEqual(normalizeGearLinks(text), text, `should not rewrite: ${text}`);
  }
});

test('handles empty and non-string input without throwing', () => {
  assert.strictEqual(normalizeGearLinks(''), '');
  assert.strictEqual(normalizeGearLinks(null), '');
  assert.strictEqual(normalizeGearLinks(undefined), '');
});
