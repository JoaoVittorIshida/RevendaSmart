const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// --- Helpers Genéricos ---
const getAll = async (table, userId, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM ${table} WHERE usuario_id = ?`, [userId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar dados' });
    }
};

const createOne = async (table, nome, userId, res) => {
    try {
        if (!nome) return res.status(400).json({ message: 'Nome é obrigatório' });
        const id = uuidv4();
        await db.query(`INSERT INTO ${table} (id, usuario_id, nome) VALUES (?, ?, ?)`, [id, userId, nome]);
        res.status(201).json({ id, nome });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar' });
    }
};

const deleteOne = async (table, id, userId, res) => {
    try {
        const [result] = await db.query(`DELETE FROM ${table} WHERE id = ? AND usuario_id = ?`, [id, userId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Não encontrado' });
        res.json({ message: 'Removido com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao remover' });
    }
};

// --- Exports ---
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
