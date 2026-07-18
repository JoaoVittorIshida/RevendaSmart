const db = require('../db');
const { randomBytes } = require('crypto');
const {
    PLATFORM_DOMAINS,
    normalizeWhatsapp,
    sanitizeDescription,
    slugifyStoreName,
    validateContactInput,
    validateUrl
} = require('../utils/showcaseValidation');

const configDto = (row = {}) => ({
    publicada: Boolean(row.publicada),
    slug: row.slug || '',
    whatsapp: row.whatsapp || '',
    cidade: row.cidade || '',
    estado: row.estado || ''
});

const getConfig = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT slug, publicada, whatsapp, cidade, estado FROM vitrine_configuracoes WHERE usuario_id = ?', [req.user.id]);
        return res.json(configDto(rows[0]));
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Não foi possível carregar as configurações da Vitrine.' });
    }
};

const updateConfig = async (req, res) => {
    const validated = validateContactInput(req.body);
    if (validated.error) return res.status(400).json({ message: validated.error });
    try {
        const contact = validated.value;
        await db.query(`INSERT INTO vitrine_configuracoes (usuario_id, whatsapp, cidade, estado)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE whatsapp = VALUES(whatsapp), cidade = VALUES(cidade), estado = VALUES(estado)`,
            [req.user.id, contact.whatsapp, contact.cidade, contact.estado]);
        const [rows] = await db.query('SELECT slug, publicada, whatsapp, cidade, estado FROM vitrine_configuracoes WHERE usuario_id = ?', [req.user.id]);
        return res.json({ message: 'Informações da loja atualizadas.', configuracao: configDto(rows[0]) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Não foi possível salvar as informações da loja.' });
    }
};

const slugCandidates = (storeName) => {
    const base = slugifyStoreName(storeName);
    return [base, ...Array.from({ length: 5 }, () => `${base}-${randomBytes(3).toString('hex')}`)];
};

const publishShowcase = async (req, res) => {
    if (typeof req.body.publicada !== 'boolean') return res.status(400).json({ message: 'Estado de publicação inválido.' });
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [users] = await connection.query('SELECT nome_loja FROM usuarios WHERE id = ? FOR UPDATE', [req.user.id]);
        if (!users.length) throw Object.assign(new Error('Usuário não encontrado.'), { status: 404 });
        const storeName = String(users[0].nome_loja || '').trim();
        const [configs] = await connection.query('SELECT slug, publicada, whatsapp, cidade, estado FROM vitrine_configuracoes WHERE usuario_id = ? FOR UPDATE', [req.user.id]);

        if (!req.body.publicada) {
            await connection.query(`INSERT INTO vitrine_configuracoes (usuario_id, publicada) VALUES (?, 0)
                ON DUPLICATE KEY UPDATE publicada = 0`, [req.user.id]);
            await connection.commit();
            return res.json({ message: 'Vitrine retirada do ar.', configuracao: configDto({ ...(configs[0] || {}), publicada: 0 }) });
        }

        if (!storeName) throw Object.assign(new Error('Defina um nome para a loja antes de publicar a Vitrine.'), { status: 409 });
        let slug = configs[0]?.slug || '';
        if (slug) {
            await connection.query('UPDATE vitrine_configuracoes SET publicada = 1 WHERE usuario_id = ?', [req.user.id]);
        } else {
            let saved = false;
            for (const candidate of slugCandidates(storeName)) {
                try {
                    if (configs.length) await connection.query('UPDATE vitrine_configuracoes SET slug = ?, publicada = 1 WHERE usuario_id = ?', [candidate, req.user.id]);
                    else await connection.query('INSERT INTO vitrine_configuracoes (usuario_id, slug, publicada) VALUES (?, ?, 1)', [req.user.id, candidate]);
                    slug = candidate;
                    saved = true;
                    break;
                } catch (error) {
                    if (error.code !== 'ER_DUP_ENTRY') throw error;
                }
            }
            if (!saved) throw Object.assign(new Error('Não foi possível gerar um link único para a loja.'), { status: 409 });
        }

        await connection.commit();
        return res.json({ message: 'Vitrine publicada.', configuracao: configDto({ ...(configs[0] || {}), slug, publicada: 1 }) });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        return res.status(error.status || 500).json({ message: error.status ? error.message : 'Não foi possível alterar a publicação da Vitrine.' });
    } finally {
        if (connection) connection.release();
    }
};

const safeStoredLink = (value, domains) => validateUrl(value, domains).value || null;

const getPublicShowcase = async (req, res) => {
    const slug = String(req.params.slug || '').trim().toLowerCase();
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) return res.status(404).json({ message: 'Vitrine não encontrada.' });
    try {
        const [stores] = await db.query(`SELECT u.nome_loja, c.whatsapp, c.cidade, c.estado
            FROM vitrine_configuracoes c
            INNER JOIN usuarios u ON u.id = c.usuario_id
            WHERE c.slug = ? AND c.publicada = 1 LIMIT 1`, [slug]);
        if (!stores.length) return res.status(404).json({ message: 'Vitrine não encontrada ou indisponível.' });

        const [ads] = await db.query(`SELECT a.nome_anuncio, a.preco_anuncio, a.descricao,
            a.link_olx, a.link_facebook, a.link_mercado_livre, a.link_outros,
            p.nome AS produto_nome, p.marca, p.tipo, p.foto
            FROM vitrine_configuracoes c
            INNER JOIN anuncios a ON a.usuario_id = c.usuario_id AND a.ativo = 1
            INNER JOIN produtos p ON p.id = a.produto_id AND p.usuario_id = a.usuario_id
            WHERE c.slug = ? AND c.publicada = 1
            ORDER BY a.atualizado_em DESC`, [slug]);
        const store = stores[0];
        const whatsapp = normalizeWhatsapp(store.whatsapp);
        res.set('Cache-Control', 'no-store');
        return res.json({
            loja: {
                nome: store.nome_loja,
                cidade: store.cidade || '',
                estado: store.estado || '',
                whatsappUrl: whatsapp ? `https://wa.me/55${whatsapp}` : ''
            },
            anuncios: ads.map((ad) => ({
                nome: ad.nome_anuncio,
                preco: Number(ad.preco_anuncio),
                descricao: sanitizeDescription(ad.descricao || ''),
                foto: ad.foto || '',
                marca: ad.marca || '',
                tipo: ad.tipo || '',
                links: {
                    olx: safeStoredLink(ad.link_olx, PLATFORM_DOMAINS.olx),
                    facebook: safeStoredLink(ad.link_facebook, PLATFORM_DOMAINS.facebook),
                    mercadoLivre: safeStoredLink(ad.link_mercado_livre, PLATFORM_DOMAINS.mercadoLivre),
                    outros: safeStoredLink(ad.link_outros, null)
                }
            }))
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Não foi possível carregar esta Vitrine.' });
    }
};

module.exports = { getConfig, updateConfig, publishShowcase, getPublicShowcase, configDto, slugCandidates };
