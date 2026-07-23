const assert = require('node:assert/strict');
const test = require('node:test');
const {
    EXPECTED_ACTION,
    MAX_TOKEN_LENGTH,
    SITEVERIFY_URL,
    verifyTurnstileToken
} = require('../utils/turnstile');

test('Turnstile envia o token apenas ao Siteverify e aceita action e hostname esperados', async () => {
    let captured;
    const result = await verifyTurnstileToken({
        token: 'token-valido',
        remoteIp: '203.0.113.10',
        secretKey: 'segredo',
        expectedHostname: 'revendasmart.example',
        fetchImpl: async (url, options) => {
            captured = { url, options };
            return {
                ok: true,
                async json() {
                    return { success: true, action: EXPECTED_ACTION, hostname: 'revendasmart.example' };
                }
            };
        }
    });

    assert.deepEqual(result, { success: true });
    assert.equal(captured.url, SITEVERIFY_URL);
    assert.deepEqual(JSON.parse(captured.options.body), {
        secret: 'segredo',
        response: 'token-valido',
        remoteip: '203.0.113.10'
    });
});

test('Turnstile recusa token ausente ou acima do limite sem chamar a rede', async () => {
    let calls = 0;
    const fetchImpl = async () => { calls += 1; };

    const missing = await verifyTurnstileToken({ token: '', secretKey: 'segredo', fetchImpl });
    const oversized = await verifyTurnstileToken({ token: 'x'.repeat(MAX_TOKEN_LENGTH + 1), secretKey: 'segredo', fetchImpl });

    assert.equal(missing.reason, 'invalid-token');
    assert.equal(oversized.reason, 'invalid-token');
    assert.equal(calls, 0);
});

test('Turnstile falha fechado quando segredo, action ou serviço são inválidos', async () => {
    const missingSecret = await verifyTurnstileToken({ token: 'token', secretKey: '' });
    const wrongAction = await verifyTurnstileToken({
        token: 'token',
        secretKey: 'segredo',
        fetchImpl: async () => ({
            ok: true,
            async json() { return { success: true, action: 'login' }; }
        })
    });
    const unavailable = await verifyTurnstileToken({
        token: 'token',
        secretKey: 'segredo',
        fetchImpl: async () => { throw new Error('offline'); }
    });

    assert.equal(missingSecret.reason, 'configuration-error');
    assert.equal(wrongAction.reason, 'action-mismatch');
    assert.equal(unavailable.reason, 'service-error');
});

test('Turnstile reconhece a resposta oficial de chave de teste sem dispensar action em produção', async () => {
    const testKeyResult = await verifyTurnstileToken({
        token: 'XXXX.DUMMY.TOKEN.XXXX',
        secretKey: 'chave-oficial-de-teste',
        fetchImpl: async () => ({
            ok: true,
            async json() {
                return { success: true, metadata: { result_with_testing_key: true } };
            }
        })
    });

    assert.deepEqual(testKeyResult, { success: true });
});
