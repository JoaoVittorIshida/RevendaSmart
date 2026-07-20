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
    assert.ok(files.includes('20260715_009_add_origem_e_canal_compra_em_vendas.sql'));
    assert.ok(files.includes('20260715_010_preencher_origem_e_canal_compra_em_vendas.sql'));
    assert.ok(files.includes('20260718_011_create_vitrine_configuracoes.sql'));
    assert.ok(files.includes('20260718_016_enforce_anuncios_produto_unico.sql'));
    assert.ok(files.includes('20260720_017_add_admin_fields.sql'));
    assert.ok(files.includes('20260720_018_create_admin_audit_logs.sql'));
    assert.match(fs.readFileSync(path.join(directory, '20260713_002_backfill_vendas.sql'), 'utf8'), /WHERE e\.status = 'vendido'/);
    assert.match(fs.readFileSync(path.join(directory, '20260713_007_add_nome_loja.sql'), 'utf8'), /^ALTER TABLE usuarios ADD COLUMN nome_loja VARCHAR\(100\) DEFAULT NULL AFTER nome;\s*$/);
    assert.match(fs.readFileSync(path.join(directory, '20260713_008_add_token_version.sql'), 'utf8'), /^ALTER TABLE usuarios ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER senha;\s*$/);
    assert.match(fs.readFileSync(path.join(directory, '20260715_010_preencher_origem_e_canal_compra_em_vendas.sql'), 'utf8'), /INNER JOIN estoque e ON e\.id = v\.estoque_id AND e\.usuario_id = v\.usuario_id/);
    assert.match(fs.readFileSync(path.join(directory, '20260718_011_create_vitrine_configuracoes.sql'), 'utf8'), /UNIQUE KEY uq_vitrine_configuracoes_slug \(slug\)/);
    assert.match(fs.readFileSync(path.join(directory, '20260718_016_enforce_anuncios_produto_unico.sql'), 'utf8'), /UNIQUE KEY uq_anuncios_usuario_produto \(usuario_id, produto_id\)/);
    assert.match(fs.readFileSync(path.join(directory, '20260720_017_add_admin_fields.sql'), 'utf8'), /ADD COLUMN admin TINYINT\(1\) NOT NULL DEFAULT 0/);
    assert.match(fs.readFileSync(path.join(directory, '20260720_017_add_admin_fields.sql'), 'utf8'), /idx_usuarios_admin_atividade \(admin, ultima_atividade_em\)/);
    assert.match(fs.readFileSync(path.join(directory, '20260720_018_create_admin_audit_logs.sql'), 'utf8'), /acao VARCHAR\(50\) NOT NULL/);
});
