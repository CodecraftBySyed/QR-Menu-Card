const assert = require('assert');
const resolver = require('./tableNumberResolver');

function run() {
  assert.strictEqual(resolver.sanitizeTableNumber('  5  '), '5');
  assert.strictEqual(resolver.sanitizeTableNumber(''), '');

  assert.strictEqual(resolver.getTableFromSearch('?table=5'), '5');
  assert.strictEqual(resolver.getTableFromSearch('?table='), '');
  assert.strictEqual(resolver.getTableFromSearch('?x=1'), '');

  assert.strictEqual(
    resolver.resolveTableNumber({ search: '?table=7', stored: '3' }),
    '7'
  );
  assert.strictEqual(
    resolver.resolveTableNumber({ search: '?x=1', stored: '3' }),
    '3'
  );
  assert.strictEqual(
    resolver.resolveTableNumber({ search: '', stored: '' }),
    ''
  );

  assert.strictEqual(resolver.formatTableLabel('9'), 'Table 9');
  assert.strictEqual(resolver.formatTableLabel(''), '—');

  console.log('✅ tableNumberResolver tests passed');
}

run();

