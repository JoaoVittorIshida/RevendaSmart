const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('migrations são SQL ordenadas e preservam o histórico de vendas', () => {
    const directory = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(directory).filter((file) => file.endsWith('.sql'));
    assert.deepEqual(files, [...files].sort());
    assert.ok(files.includes('20260713_001_create_vendas.sql'));
    assert.ok(files.includes('20260713_002_backfill_vendas.sql'));
    assert.ok(files.includes('20260713_007_add_nome_loja.sql'));
    assert.ok(files.includes('20260713_008_add_token_version.sql'));
    assert.match(fs.readFileSync(path.join(directory, '20260713_002_backfill_vendas.sql'), 'utf8'), /WHERE e\.status = 'vendido'/);
    assert.match(fs.readFileSync(path.join(directory, '20260713_007_add_nome_loja.sql'), 'utf8'), /^ALTER TABLE usuarios ADD COLUMN nome_loja VARCHAR\(100\) DEFAULT NULL AFTER nome;\s*$/);
    assert.match(fs.readFileSync(path.join(directory, '20260713_008_add_token_version.sql'), 'utf8'), /^ALTER TABLE usuarios ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER senha;\s*$/);
});
