const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const getProducts = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query('SELECT * FROM produtos WHERE usuario_id = ? ORDER BY nome', [userId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar produtos' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { nome, marca, categoria, tipo, foto } = req.body;
        const userId = req.user.id;
        const id = uuidv4();

        await db.query(
            'INSERT INTO produtos (id, usuario_id, nome, marca, categoria, tipo, foto) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, userId, nome, marca, categoria, tipo, foto]
        );

        res.status(201).json({ id, nome, marca, categoria, tipo, foto });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar produto' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, marca, categoria, tipo, foto } = req.body;
        const userId = req.user.id;

        // Verifica se o produto pertence ao usuário
        const [check] = await db.query('SELECT * FROM produtos WHERE id = ? AND usuario_id = ?', [id, userId]);
        if (check.length === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        await db.query(
            'UPDATE produtos SET nome = ?, marca = ?, categoria = ?, tipo = ?, foto = ? WHERE id = ?',
            [nome, marca, categoria, tipo, foto, id]
        );

        res.json({ message: 'Produto atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar produto' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [result] = await db.query('DELETE FROM produtos WHERE id = ? AND usuario_id = ?', [id, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        res.json({ message: 'Produto removido com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao remover produto' });
    }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
