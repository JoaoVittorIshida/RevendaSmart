const db = require('../db');
const { randomUUID } = require('crypto');
const { sanitizeDescription, validateAdInput } = require('../utils/showcaseValidation');

const toAdDto = (ad) => ({
    id: ad.id,
    produtoId: ad.produto_id,
    nomeAnuncio: ad.nome_anuncio,
    precoAnuncio: Number(ad.preco_anuncio),
    descricao: sanitizeDescription(ad.descricao || ''),
    links: {
        olx: ad.link_olx || '',
        facebook: ad.link_facebook || '',
        mercadoLivre: ad.link_mercado_livre || '',
        outros: ad.link_outros || ''
    },
    ativo: Boolean(ad.ativo),
    unidadesDisponiveis: Number(ad.unidades_disponiveis || 0),
    produto: {
        nome: ad.produto_nome || 'Produto removido',
        marca: ad.marca || '',
        tipo: ad.tipo || '',
        foto: ad.foto || ''
    }
});

const getAds = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT a.*, p.nome AS produto_nome, p.marca, p.tipo, p.foto,
            (SELECT COUNT(*) FROM estoque e WHERE e.produto_id = a.produto_id AND e.usuario_id = a.usuario_id AND e.status = 'disponivel') AS unidades_disponiveis
            FROM anuncios a
            INNER JOIN produtos p ON p.id = a.produto_id AND p.usuario_id = a.usuario_id
            WHERE a.usuario_id = ? ORDER BY a.ativo DESC, a.atualizado_em DESC`, [req.user.id]);
        res.json(rows.map(toAdDto));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar anúncios.' });
    }
};

const createAd = async (req, res) => {
    const validated = validateAdInput(req.body);
    if (validated.error) return res.status(400).json({ message: validated.error });
    const produtoId = String(req.body.produtoId || '').trim();
    if (!produtoId) return res.status(400).json({ message: 'Selecione um produto.' });

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [products] = await connection.query('SELECT id FROM produtos WHERE id = ? AND usuario_id = ? FOR UPDATE', [produtoId, req.user.id]);
        if (!products.length) throw Object.assign(new Error('Produto não encontrado.'), { status: 404 });
        const [items] = await connection.query("SELECT id FROM estoque WHERE produto_id = ? AND usuario_id = ? AND status = 'disponivel' ORDER BY data_entrada, id LIMIT 1 FOR UPDATE", [produtoId, req.user.id]);
        if (!items.length) throw Object.assign(new Error('Somente produtos com unidades disponíveis podem entrar na Vitrine.'), { status: 409 });

        const [existing] = await connection.query('SELECT id FROM anuncios WHERE produto_id = ? AND usuario_id = ? FOR UPDATE', [produtoId, req.user.id]);
        const ad = validated.value;
        if (existing.length) {
            await connection.query(`UPDATE anuncios SET estoque_id = ?, nome_anuncio = ?, preco_anuncio = ?, descricao = ?, link_olx = ?, link_facebook = ?, link_mercado_livre = ?, link_outros = ?, ativo = 1 WHERE id = ? AND usuario_id = ?`,
                [items[0].id, ad.nomeAnuncio, ad.precoAnuncio, ad.descricao, ad.linkOlx, ad.linkFacebook, ad.linkMercadoLivre, ad.linkOutros, existing[0].id, req.user.id]);
            await connection.commit();
            return res.json({ id: existing[0].id, reativado: true, message: 'Anúncio reativado.' });
        }

        const id = randomUUID();
        await connection.query(`INSERT INTO anuncios (id, usuario_id, estoque_id, produto_id, nome_anuncio, preco_anuncio, descricao, link_olx, link_facebook, link_mercado_livre, link_outros)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, req.user.id, items[0].id, produtoId, ad.nomeAnuncio, ad.precoAnuncio, ad.descricao, ad.linkOlx, ad.linkFacebook, ad.linkMercadoLivre, ad.linkOutros]);
        await connection.commit();
        return res.status(201).json({ id, message: 'Anúncio criado.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Este produto já está na Vitrine.' });
        return res.status(error.status || 500).json({ message: error.status ? error.message : 'Erro ao criar anúncio.' });
    } finally {
        if (connection) connection.release();
    }
};

const updateAd = async (req, res) => {
    const validated = validateAdInput(req.body);
    if (validated.error) return res.status(400).json({ message: validated.error });
    try {
        const ad = validated.value;
        const [result] = await db.query(`UPDATE anuncios SET nome_anuncio = ?, preco_anuncio = ?, descricao = ?, link_olx = ?, link_facebook = ?, link_mercado_livre = ?, link_outros = ? WHERE id = ? AND usuario_id = ?`,
            [ad.nomeAnuncio, ad.precoAnuncio, ad.descricao, ad.linkOlx, ad.linkFacebook, ad.linkMercadoLivre, ad.linkOutros, req.params.id, req.user.id]);
        if (!result.affectedRows) return res.status(404).json({ message: 'Anúncio não encontrado.' });
        return res.json({ message: 'Anúncio atualizado.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar anúncio.' });
    }
};

const deactivateAd = async (req, res) => {
    try {
        const [result] = await db.query('UPDATE anuncios SET ativo = 0 WHERE id = ? AND usuario_id = ?', [req.params.id, req.user.id]);
        if (!result.affectedRows) return res.status(404).json({ message: 'Anúncio não encontrado.' });
        return res.json({ message: 'Anúncio removido da Vitrine.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao remover anúncio.' });
    }
};

module.exports = { getAds, createAd, updateAd, deactivateAd, toAdDto };
