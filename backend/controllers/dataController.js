const db = require('../db');
const { randomUUID } = require('crypto');

const ALLOWED_TABLES = new Set(['categorias', 'canais_venda', 'canais_compra']);

const getAll = async (table, userId, res) => {
    try {
        if (!ALLOWED_TABLES.has(table)) throw new Error('Tabela auxiliar invalida.');
        const [rows] = await db.query(`SELECT * FROM ${table} WHERE usuario_id = ? ORDER BY nome`, [userId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar dados' });
    }
};

const createOne = async (table, nome, userId, res) => {
    try {
        if (!ALLOWED_TABLES.has(table)) throw new Error('Tabela auxiliar invalida.');
        const normalizedName = String(nome ?? '').trim();
        if (!normalizedName || normalizedName.length > 100) return res.status(400).json({ message: 'Nome invalido.' });
        const id = randomUUID();
        await db.query(`INSERT INTO ${table} (id, usuario_id, nome) VALUES (?, ?, ?)`, [id, userId, normalizedName]);
        res.status(201).json({ id, nome: normalizedName });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar' });
    }
};

const deleteOne = async (table, id, userId, res) => {
    try {
        if (!ALLOWED_TABLES.has(table)) throw new Error('Tabela auxiliar invalida.');
        const [result] = await db.query(`DELETE FROM ${table} WHERE id = ? AND usuario_id = ?`, [id, userId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Nao encontrado' });
        res.json({ message: 'Removido com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao remover' });
    }
};

const getCategorias = (req, res) => getAll('categorias', req.user.id, res);
const createCategoria = (req, res) => createOne('categorias', req.body.nome, req.user.id, res);
const deleteCategoria = (req, res) => deleteOne('categorias', req.params.id, req.user.id, res);

const getCanaisVenda = (req, res) => getAll('canais_venda', req.user.id, res);
const createCanalVenda = (req, res) => createOne('canais_venda', req.body.nome, req.user.id, res);
const deleteCanalVenda = (req, res) => deleteOne('canais_venda', req.params.id, req.user.id, res);

const getCanaisCompra = (req, res) => getAll('canais_compra', req.user.id, res);
const createCanalCompra = (req, res) => createOne('canais_compra', req.body.nome, req.user.id, res);
const deleteCanalCompra = (req, res) => deleteOne('canais_compra', req.params.id, req.user.id, res);

module.exports = {
    getCategorias, createCategoria, deleteCategoria,
    getCanaisVenda, createCanalVenda, deleteCanalVenda,
    getCanaisCompra, createCanalCompra, deleteCanalCompra
};
