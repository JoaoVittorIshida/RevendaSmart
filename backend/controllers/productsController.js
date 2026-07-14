const db = require('../db');
const { randomUUID } = require('crypto');

const LIMITS = { nome: 255, marca: 100, categoria: 100, tipo: 100, foto: 900000 };

const optionalText = (value, limit) => {
    const text = String(value ?? '').trim();
    return text && text.length <= limit ? text : text || null;
};

const validateProduct = (body) => {
    const nome = String(body.nome ?? '').trim();
    const marca = optionalText(body.marca, LIMITS.marca);
    const categoria = optionalText(body.categoria, LIMITS.categoria);
    const tipo = optionalText(body.tipo, LIMITS.tipo);
    const foto = String(body.foto ?? '').trim();

    if (!nome || nome.length > LIMITS.nome) return { error: 'Nome do produto invalido.' };
    if ([marca, categoria, tipo].some((value) => value && value.length > 100)) return { error: 'Um dos campos do produto excede o limite permitido.' };
    if (foto.length > LIMITS.foto) return { error: 'A foto excede o limite permitido.' };
    if (foto && !/^data:image\/(png|jpe?g|webp);base64,/i.test(foto)) return { error: 'A foto deve ser PNG, JPG ou WEBP em formato valido.' };
    return { value: { nome, marca, categoria, tipo, foto: foto || null } };
};

const getProducts = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM produtos WHERE usuario_id = ? ORDER BY nome', [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar produtos' });
    }
};

const createProduct = async (req, res) => {
    const validated = validateProduct(req.body);
    if (validated.error) return res.status(400).json({ message: validated.error });
    try {
        const id = randomUUID();
        const product = validated.value;
        await db.query(
            'INSERT INTO produtos (id, usuario_id, nome, marca, categoria, tipo, foto) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, req.user.id, product.nome, product.marca, product.categoria, product.tipo, product.foto]
        );
        res.status(201).json({ id, ...product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar produto' });
    }
};

const updateProduct = async (req, res) => {
    const validated = validateProduct(req.body);
    if (validated.error) return res.status(400).json({ message: validated.error });
    try {
        const product = validated.value;
        const [result] = await db.query(
            'UPDATE produtos SET nome = ?, marca = ?, categoria = ?, tipo = ?, foto = ? WHERE id = ? AND usuario_id = ?',
            [product.nome, product.marca, product.categoria, product.tipo, product.foto, req.params.id, req.user.id]
        );
        if (!result.affectedRows) return res.status(404).json({ message: 'Produto nao encontrado.' });
        res.json({ message: 'Produto atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar produto' });
    }
};

const deleteProduct = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [products] = await connection.query('SELECT id FROM produtos WHERE id = ? AND usuario_id = ? FOR UPDATE', [req.params.id, req.user.id]);
        if (!products.length) {
            await connection.rollback();
            return res.status(404).json({ message: 'Produto nao encontrado.' });
        }
        const [stock] = await connection.query('SELECT id FROM estoque WHERE produto_id = ? AND usuario_id = ? LIMIT 1 FOR UPDATE', [req.params.id, req.user.id]);
        if (stock.length) {
            await connection.rollback();
            return res.status(409).json({ message: 'Nao e possivel excluir um produto que possui unidades em estoque ou historico.' });
        }
        await connection.query('DELETE FROM produtos WHERE id = ? AND usuario_id = ?', [req.params.id, req.user.id]);
        await connection.commit();
        res.json({ message: 'Produto removido com sucesso' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Erro ao remover produto' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct, validateProduct };
