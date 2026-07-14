const db = require('../db');
const { randomUUID } = require('crypto');
const MAX_MONEY = 99999999.99;

const getAds = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT a.*, e.status AS estoque_status, p.nome AS produto_nome, p.marca, p.tipo, p.foto
            FROM anuncios a JOIN estoque e ON e.id = a.estoque_id AND e.usuario_id = a.usuario_id
            LEFT JOIN produtos p ON p.id = e.produto_id WHERE a.usuario_id = ? ORDER BY a.atualizado_em DESC`, [req.user.id]);
        res.json(rows.map((ad) => ({ id: ad.id, estoqueId: ad.estoque_id, precoAnuncio: Number(ad.preco_anuncio), detalhes: ad.detalhes || '', ativo: Boolean(ad.ativo), estoqueStatus: ad.estoque_status, produto: { nome: ad.produto_nome || 'Produto removido', marca: ad.marca || '', tipo: ad.tipo || '', foto: ad.foto || '' } })));
    } catch (error) { console.error(error); res.status(500).json({ message: 'Erro ao buscar anúncios.' }); }
};

const validate = (body) => {
    const price = Number(body.precoAnuncio); const details = String(body.detalhes || '').trim();
    if (!Number.isFinite(price) || price <= 0) return { error: 'Preço do anúncio inválido.' };
    if (details.length > 500) return { error: 'Os detalhes podem ter no máximo 500 caracteres.' };
    if (price > MAX_MONEY) return { error: 'Preco do anuncio invalido.' };
    return { price: Math.round(price * 100) / 100, details };
};

const createAd = async (req, res) => {
    const validated = validate(req.body); if (validated.error) return res.status(400).json({ message: validated.error });
    let connection;
    try {
        connection = await db.getConnection(); await connection.beginTransaction();
        // The stock-row lock serializes create, reserve and sell actions for the same item.
        const [items] = await connection.query("SELECT id FROM estoque WHERE id = ? AND usuario_id = ? AND status = 'disponivel' FOR UPDATE", [req.body.estoqueId, req.user.id]);
        if (!items.length) throw Object.assign(new Error('Somente itens disponíveis podem entrar na Vitrine.'), { status: 409 });
        const [existing] = await connection.query('SELECT id FROM anuncios WHERE estoque_id = ? AND usuario_id = ? AND ativo = 1', [req.body.estoqueId, req.user.id]);
        if (existing.length) throw Object.assign(new Error('Este item já possui anúncio ativo.'), { status: 409 });
        const id = randomUUID();
        await connection.query('INSERT INTO anuncios (id, usuario_id, estoque_id, preco_anuncio, detalhes) VALUES (?, ?, ?, ?, ?)', [id, req.user.id, req.body.estoqueId, validated.price, validated.details || null]);
        await connection.commit(); res.status(201).json({ id });
    } catch (error) {
        if (connection) await connection.rollback(); console.error(error); res.status(error.status || 500).json({ message: error.status ? error.message : 'Erro ao criar anúncio.' });
    } finally { if (connection) connection.release(); }
};

const updateAd = async (req, res) => {
    const validated = validate(req.body); if (validated.error) return res.status(400).json({ message: validated.error });
    try {
        const [result] = await db.query('UPDATE anuncios SET preco_anuncio = ?, detalhes = ? WHERE id = ? AND usuario_id = ?', [validated.price, validated.details || null, req.params.id, req.user.id]);
        if (!result.affectedRows) return res.status(404).json({ message: 'Anúncio não encontrado.' });
        res.json({ message: 'Anúncio atualizado.' });
    } catch (error) { console.error(error); res.status(500).json({ message: 'Erro ao atualizar anúncio.' }); }
};

const deactivateAd = async (req, res) => {
    try {
        const [result] = await db.query('UPDATE anuncios SET ativo = 0 WHERE id = ? AND usuario_id = ?', [req.params.id, req.user.id]);
        if (!result.affectedRows) return res.status(404).json({ message: 'Anúncio não encontrado.' });
        res.json({ message: 'Anúncio desativado.' });
    } catch (error) { console.error(error); res.status(500).json({ message: 'Erro ao desativar anúncio.' }); }
};

module.exports = { getAds, createAd, updateAd, deactivateAd };
