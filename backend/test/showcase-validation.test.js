const assert = require('node:assert/strict');
const test = require('node:test');
const {
    normalizeWhatsapp,
    sanitizeDescription,
    slugifyStoreName,
    validateAdInput,
    validateContactInput,
    validateUrl
} = require('../utils/showcaseValidation');

test('descrição rica mantém formatação segura e remove conteúdo executável', () => {
    const clean = sanitizeDescription('<p onclick="steal()"><strong>Oferta</strong> 😄 <img src=x onerror=steal()><script>alert(1)</script></p>');
    assert.match(clean, /<strong>Oferta<\/strong> 😄/);
    assert.doesNotMatch(clean, /onclick|onerror|<img|<script/i);
});

test('anúncio valida preço, nome e domínios das plataformas', () => {
    const valid = validateAdInput({
        nomeAnuncio: 'Console seminovo',
        precoAnuncio: 1299.9,
        descricao: '<p><b>Completo</b> 🎮</p>',
        linkOlx: 'https://sp.olx.com.br/item/123',
        linkFacebook: 'https://www.facebook.com/marketplace/item/123',
        linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-123',
        linkOutros: 'https://minhaloja.example/produto'
    });
    assert.equal(valid.error, undefined);
    assert.equal(valid.value.precoAnuncio, 1299.9);
    assert.equal(valid.value.linkOlx, 'https://sp.olx.com.br/item/123');

    assert.match(validateAdInput({ nomeAnuncio: 'X', precoAnuncio: 1, linkOlx: 'https://example.com/golpe' }).error, /plataforma/);
    assert.match(validateUrl('javascript:alert(1)').error, /HTTP/);
});

test('contato normaliza WhatsApp brasileiro e exige cidade com UF', () => {
    assert.equal(normalizeWhatsapp('+55 (11) 99999-9999'), '11999999999');
    assert.equal(normalizeWhatsapp('(11) 3333-4444'), '1133334444');
    assert.equal(normalizeWhatsapp('123'), undefined);
    assert.deepEqual(validateContactInput({ whatsapp: '(11) 99999-9999', cidade: 'São Paulo', estado: 'sp' }).value, {
        whatsapp: '11999999999', cidade: 'São Paulo', estado: 'SP'
    });
    assert.match(validateContactInput({ cidade: 'São Paulo' }).error, /cidade e estado/);
});

test('slug da loja é legível, estável e evita rotas reservadas', () => {
    assert.equal(slugifyStoreName('João & Filhos'), 'joao-filhos');
    assert.equal(slugifyStoreName('Login'), 'login-loja');
});
