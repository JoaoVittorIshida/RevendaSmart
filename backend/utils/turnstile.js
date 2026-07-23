const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_TOKEN_LENGTH = 2048;
const REQUEST_TIMEOUT_MS = 8000;
const EXPECTED_ACTION = 'register';

const verifyTurnstileToken = async ({
    token,
    remoteIp,
    secretKey = process.env.TURNSTILE_SECRET_KEY,
    expectedHostname = process.env.TURNSTILE_EXPECTED_HOSTNAME,
    fetchImpl = global.fetch
}) => {
    if (!secretKey) {
        return { success: false, reason: 'configuration-error', errorCodes: ['missing-secret-key'] };
    }
    if (typeof token !== 'string' || !token || token.length > MAX_TOKEN_LENGTH) {
        return { success: false, reason: 'invalid-token', errorCodes: ['missing-or-invalid-token'] };
    }
    if (typeof fetchImpl !== 'function') {
        return { success: false, reason: 'service-error', errorCodes: ['fetch-unavailable'] };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const payload = {
            secret: secretKey,
            response: token
        };
        if (remoteIp) payload.remoteip = remoteIp;

        const response = await fetchImpl(SITEVERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        if (!response.ok) {
            return { success: false, reason: 'service-error', errorCodes: [`http-${response.status}`] };
        }

        const result = await response.json();
        const errorCodes = Array.isArray(result['error-codes']) ? result['error-codes'] : [];
        if (!result.success) return { success: false, reason: 'challenge-failed', errorCodes };
        const isCloudflareTestResponse = result.metadata?.result_with_testing_key === true;
        if (!isCloudflareTestResponse && result.action !== EXPECTED_ACTION) {
            return { success: false, reason: 'action-mismatch', errorCodes: ['action-mismatch'] };
        }
        if (expectedHostname && result.hostname !== expectedHostname) {
            return { success: false, reason: 'hostname-mismatch', errorCodes: ['hostname-mismatch'] };
        }

        return { success: true };
    } catch (error) {
        const errorCode = error?.name === 'AbortError' ? 'request-timeout' : 'request-failed';
        return { success: false, reason: 'service-error', errorCodes: [errorCode] };
    } finally {
        clearTimeout(timeoutId);
    }
};

module.exports = {
    EXPECTED_ACTION,
    MAX_TOKEN_LENGTH,
    SITEVERIFY_URL,
    verifyTurnstileToken
};
