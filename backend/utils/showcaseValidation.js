const sanitizeHtml = require('sanitize-html');

const MAX_MONEY = 99999999.99;
const MAX_DESCRIPTION_HTML = 15000;
const MAX_DESCRIPTION_TEXT = 3000;
const VALID_STATES = new Set([
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO'
]);
const RESERVED_SLUGS = new Set([
    'api', 'cadastro', 'cadastros', 'dados', 'estoque', 'historico-vendas', 'login',
    'minha-conta', 'vendas', 'vitrine', 'analises', 'favicon.ico'
]);

const PLATFORM_DOMAINS = {
    olx: ['olx.com.br'],
    facebook: ['facebook.com'],
    mercadoLivre: ['mercadolivre.com.br', 'mercadolivre.com', 'mercadolibre.com']
};

const plainText = (html) => sanitizeHtml(String(html || ''), { allowedTags: [], allowedAttributes: {} }).trim();

const sanitizeDescription = (value) => sanitizeHtml(String(value ?? ''), {
    allowedTags: ['p', 'div', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
        a: (tagName, attribs) => ({
            tagName,
            attribs: { href: attribs.href || '', target: '_blank', rel: 'noopener noreferrer nofollow' }
        })
    }
}).trim();

const hostMatches = (hostname, domains) => domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

const validateUrl = (value, domains = null) => {
    const text = String(value ?? '').trim();
    if (!text) return { value: null };
    if (text.length > 2048) return { error: 'Um dos links excede o limite permitido.' };
    try {
        const parsed = new URL(text);
        if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
            return { error: 'Use somente links HTTP ou HTTPS válidos.' };
        }
        if (domains && !hostMatches(parsed.hostname.toLowerCase(), domains)) {
            return { error: 'O link informado não pertence à plataforma selecionada.' };
        }
        return { value: parsed.toString() };
    } catch {
        return { error: 'Informe um link completo e válido, começando com https://.' };
    }
};

const validateAdInput = (body = {}) => {
    const nomeAnuncio = String(body.nomeAnuncio ?? '').trim();
    const price = Number(body.precoAnuncio);
    const rawDescription = String(body.descricao ?? '');
    if (!nomeAnuncio || nomeAnuncio.length > 255) return { error: 'Informe um nome de anúncio de até 255 caracteres.' };
    if (!Number.isFinite(price) || price <= 0 || price > MAX_MONEY) return { error: 'Informe um valor de venda válido.' };
    if (rawDescription.length > MAX_DESCRIPTION_HTML) return { error: 'A descrição excede o limite permitido.' };
    const descricao = sanitizeDescription(rawDescription);
    if (plainText(descricao).length > MAX_DESCRIPTION_TEXT) return { error: `A descrição pode ter no máximo ${MAX_DESCRIPTION_TEXT} caracteres.` };

    const definitions = [
        ['linkOlx', PLATFORM_DOMAINS.olx],
        ['linkFacebook', PLATFORM_DOMAINS.facebook],
        ['linkMercadoLivre', PLATFORM_DOMAINS.mercadoLivre],
        ['linkOutros', null]
    ];
    const links = {};
    for (const [field, domains] of definitions) {
        const result = validateUrl(body[field], domains);
        if (result.error) return { error: result.error };
        links[field] = result.value;
    }

    return {
        value: {
            nomeAnuncio,
            precoAnuncio: Math.round(price * 100) / 100,
            descricao: descricao || null,
            ...links
        }
    };
};

const normalizeWhatsapp = (value) => {
    let digits = String(value ?? '').replace(/\D/g, '');
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2);
    if (!digits) return null;
    if (!/^[1-9]{2}\d{8,9}$/.test(digits)) return undefined;
    return digits;
};

const validateContactInput = (body = {}) => {
    const whatsapp = normalizeWhatsapp(body.whatsapp);
    const cidade = String(body.cidade ?? '').trim();
    const estado = String(body.estado ?? '').trim().toUpperCase();
    if (whatsapp === undefined) return { error: 'Informe um WhatsApp válido com DDD.' };
    if (cidade.length > 100) return { error: 'A cidade pode ter no máximo 100 caracteres.' };
    if ((cidade && !VALID_STATES.has(estado)) || (!cidade && estado)) return { error: 'Informe cidade e estado juntos.' };
    return { value: { whatsapp, cidade: cidade || null, estado: estado || null } };
};

const slugifyStoreName = (value) => {
    let slug = String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 90)
        .replace(/-+$/g, '');
    if (!slug) slug = 'loja';
    if (RESERVED_SLUGS.has(slug)) slug = `${slug}-loja`;
    return slug;
};

module.exports = {
    PLATFORM_DOMAINS,
    VALID_STATES,
    plainText,
    sanitizeDescription,
    validateUrl,
    validateAdInput,
    normalizeWhatsapp,
    validateContactInput,
    slugifyStoreName
};
