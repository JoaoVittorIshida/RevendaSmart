const db = require('../db');

const getSales = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT id, estoque_id, produto_id, produto_nome, categoria_nome, canal_venda_id, canal_nome, preco_custo, valor_bruto, taxa_plataforma, frete_vendedor, valor_liquido, data_venda, status, cancelada_em, dados_incompletos
            FROM vendas WHERE usuario_id = ? ORDER BY data_venda DESC, criado_em DESC`, [req.user.id]);
        res.json(rows.map((sale) => ({
            id: sale.id, estoqueId: sale.estoque_id, produtoId: sale.produto_id,
            produto: sale.produto_nome, categoria: sale.categoria_nome || 'Sem categoria', canal: sale.canal_nome || 'Não informado', canalVendaId: sale.canal_venda_id,
            custo: sale.preco_custo === null ? null : Number(sale.preco_custo), valorBruto: sale.valor_bruto === null ? null : Number(sale.valor_bruto),
            taxaPlataforma: Number(sale.taxa_plataforma || 0), freteVendedor: Number(sale.frete_vendedor || 0), valor: sale.valor_liquido === null ? null : Number(sale.valor_liquido),
            data: sale.data_venda ? new Date(sale.data_venda).toISOString() : null, status: sale.status, dadosIncompletos: Boolean(sale.dados_incompletos),
            canceladaEm: sale.cancelada_em ? new Date(sale.cancelada_em).toISOString() : null
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar histórico de vendas.' });
    }
};

module.exports = { getSales };
