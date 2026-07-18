const assert = require('node:assert/strict');
const db = require('../db');

const base = `http://localhost:${process.env.TEST_API_PORT || 3101}/api`;
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const username = `catalog-test-${suffix}`;
const keepTestData = process.env.KEEP_TEST_DATA === '1';
let cookie = '';

const request = async (path, options = {}) => {
    const headers = {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...options.headers
    };
    const response = await fetch(`${base}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    return { response, data };
};

const main = async () => {
    let result = await request('/auth/register', { method: 'POST', body: JSON.stringify({ nome: 'Teste Catálogo', usuario: username, senha: 'SenhaTeste123!', nomeLoja: 'Loja Integração' }) });
    assert.equal(result.response.status, 201);

    result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ usuario: username, senha: 'SenhaTeste123!' }) });
    assert.equal(result.response.status, 200);
    const userId = result.data.user.id;
    cookie = result.response.headers.get('set-cookie').split(';')[0];

    result = await request('/produtos', { method: 'POST', body: JSON.stringify({ nome: 'Câmera Vintage', marca: 'Lumina', categoria: 'Fotografia', tipo: 'Seminova', foto: '' }) });
    assert.equal(result.response.status, 201);
    const productId = result.data.id;

    result = await request('/estoque/entrada', { method: 'POST', body: JSON.stringify({ produtoId: productId, quantidade: 2, precoCusto: 500, canalCompraId: null, origem: 'nacional' }) });
    assert.equal(result.response.status, 201);

    const adPayload = {
        produtoId: productId,
        nomeAnuncio: 'Câmera pronta para fotografar',
        precoAnuncio: 899.9,
        descricao: '<p onclick="x()"><strong>Revisada</strong> 📷</p><script>alert(1)</script>',
        linkOlx: 'https://sp.olx.com.br/item/123',
        linkFacebook: '',
        linkMercadoLivre: '',
        linkOutros: 'https://example.com/camera'
    };
    result = await request('/anuncios', { method: 'POST', body: JSON.stringify(adPayload) });
    assert.equal(result.response.status, 201);

    result = await request('/anuncios', { method: 'POST', body: JSON.stringify({ ...adPayload, precoAnuncio: 879.9 }) });
    assert.equal(result.response.status, 200);
    assert.equal(result.data.reativado, true);

    result = await request('/anuncios');
    assert.equal(result.response.status, 200);
    assert.equal(result.data.length, 1);
    assert.equal(result.data[0].nomeAnuncio, adPayload.nomeAnuncio);
    assert.equal(result.data[0].precoAnuncio, 879.9);
    assert.doesNotMatch(result.data[0].descricao, /onclick|script/i);

    result = await request('/anuncios/configuracao', { method: 'PATCH', body: JSON.stringify({ whatsapp: '(11) 99999-9999', cidade: 'São Paulo', estado: 'SP' }) });
    assert.equal(result.response.status, 200);
    assert.equal(result.data.configuracao.whatsapp, '11999999999');

    result = await request('/anuncios/publicacao', { method: 'PATCH', body: JSON.stringify({ publicada: true }) });
    assert.equal(result.response.status, 200);
    const slug = result.data.configuracao.slug;
    assert.match(slug, /^loja-integracao/);

    const publicResponse = await fetch(`${base}/vitrine/${slug}`);
    const publicData = await publicResponse.json();
    assert.equal(publicResponse.status, 200);
    assert.equal(publicData.loja.nome, 'Loja Integração');
    assert.equal(publicData.loja.whatsappUrl, 'https://wa.me/5511999999999');
    assert.equal(publicData.anuncios.length, 1);
    assert.equal(publicData.anuncios[0].nome, adPayload.nomeAnuncio);
    assert.equal(publicData.anuncios[0].id, undefined);
    assert.equal(publicData.anuncios[0].produtoId, undefined);
    assert.equal(publicData.usuario, undefined);
    assert.doesNotMatch(JSON.stringify(publicData), /usuario_id|preco_custo|senha|token/i);

    result = await request('/auth/conta', { method: 'PATCH', body: JSON.stringify({ nome: 'Teste Catálogo', nomeLoja: '' }) });
    assert.equal(result.response.status, 409);

    if (!keepTestData) {
        result = await request('/anuncios/publicacao', { method: 'PATCH', body: JSON.stringify({ publicada: false }) });
        assert.equal(result.response.status, 200);
        const hiddenResponse = await fetch(`${base}/vitrine/${slug}`);
        assert.equal(hiddenResponse.status, 404);
    }

    const [[uniqueness]] = await db.query('SELECT COUNT(*) AS total FROM anuncios WHERE usuario_id = ? AND produto_id = ?', [userId, productId]);
    assert.equal(uniqueness.total, 1);
    console.log(JSON.stringify({ ok: true, slug, username, password: keepTestData ? 'SenhaTeste123!' : undefined, publicFields: Object.keys(publicData), adCount: publicData.anuncios.length, uniqueRows: uniqueness.total, kept: keepTestData }, null, 2));
};

main()
    .catch((error) => { console.error(error); process.exitCode = 1; })
    .finally(async () => {
        if (!keepTestData) await db.query('DELETE FROM usuarios WHERE usuario = ?', [username]);
        await db.end();
    });
