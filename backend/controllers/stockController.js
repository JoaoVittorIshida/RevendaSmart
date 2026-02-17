const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const getStock = async (req, res) => {
    try {
        const userId = req.user.id;
        // Jointure com produtos para facilitar o front-end se quiser, mas aqui vou retornar flat
        // Na verdade o front espera itensEstoque
        const [rows] = await db.query(`
            SELECT e.* 
            FROM estoque e
            JOIN produtos p ON e.produto_id = p.id
            WHERE p.usuario_id = ?
        `, [userId]);

        // Converte decimais para números (MySQL driver retorna string para DECIMAL)
        const formatItem = (item) => ({
            ...item,
            id: item.id,
            produtoId: item.produto_id,
            precoCusto: Number(item.preco_custo),
            canalCompraId: item.canal_compra_id,
            origem: item.origem,
            status: item.status,
            dataEntrada: item.data_entrada,
            precoVenda: item.preco_venda ? Number(item.preco_venda) : null,
            canalVendaId: item.canal_venda_id,
            dataVenda: item.data_venda
        });

        res.json(rows.map(formatItem));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar estoque' });
    }
};

const addStockBatch = async (req, res) => {
    try {
        const { produtoId, quantidade, precoCusto, canalCompraId, origem } = req.body;
        const userId = req.user.id;

        // Verificar se produto pertence ao usuário
        const [prodCheck] = await db.query('SELECT * FROM produtos WHERE id = ? AND usuario_id = ?', [produtoId, userId]);
        if (prodCheck.length === 0) return res.status(403).json({ message: 'Produto inválido.' });

        const values = [];
        for (let i = 0; i < quantidade; i++) {
            values.push([uuidv4(), produtoId, precoCusto, canalCompraId, origem, 'disponivel']);
        }

        await db.query(
            'INSERT INTO estoque (id, produto_id, preco_custo, canal_compra_id, origem, status) VALUES ?',
            [values]
        );

        res.status(201).json({ message: `${quantidade} itens adicionados com sucesso.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao adicionar ao estoque' });
    }
};

const sellItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { precoVenda, canalVendaId, dataVenda } = req.body;
        const userId = req.user.id;

        // Verificar item e usuário
        const [check] = await db.query(`
            SELECT e.* FROM estoque e 
            JOIN produtos p ON e.produto_id = p.id 
            WHERE e.id = ? AND p.usuario_id = ?
        `, [id, userId]);

        if (check.length === 0) return res.status(404).json({ message: 'Item não encontrado.' });

        await db.query(
            'UPDATE estoque SET status = ?, preco_venda = ?, canal_venda_id = ?, data_venda = ? WHERE id = ?',
            ['vendido', precoVenda, canalVendaId, dataVenda || new Date(), id]
        );

        res.json({ message: 'Venda registrada com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao registrar venda' });
    }
};

const updateStockItem = async (req, res) => {
    // Implementar se necessário mudar preço custo ou origem
    res.status(501).json({ message: 'Not implemented' });
};

const deleteStockItem = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verificar permissão
        const [check] = await db.query(`
            SELECT e.id FROM estoque e 
            JOIN produtos p ON e.produto_id = p.id 
            WHERE e.id = ? AND p.usuario_id = ?
        `, [id, userId]);

        if (check.length === 0) return res.status(404).json({ message: 'Item não encontrado.' });

        await db.query('DELETE FROM estoque WHERE id = ?', [id]);
        res.json({ message: 'Item removido do estoque.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao remover item' });
    }
};

module.exports = { getStock, addStockBatch, sellItem, deleteStockItem };
