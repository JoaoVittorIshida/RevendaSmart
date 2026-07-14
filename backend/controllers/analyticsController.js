const db = require('../db');

const getAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        const [[summary]] = await db.query(`SELECT
            COUNT(*) AS vendas_concluidas,
            COALESCE(SUM(valor_liquido), 0) AS receita_liquida,
            COALESCE(SUM(valor_liquido - preco_custo), 0) AS lucro_liquido
            FROM vendas WHERE usuario_id = ? AND status = 'concluida' AND dados_incompletos = 0`, [userId]);
        const [[inventory]] = await db.query(`SELECT COALESCE(SUM(preco_custo), 0) AS capital_imobilizado,
            SUM(CASE WHEN data_entrada <= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS itens_parados_30_dias
            FROM estoque WHERE usuario_id = ? AND status IN ('disponivel', 'reservado')`, [userId]);
        const [ranking] = await db.query(`SELECT produto_nome AS nome, COUNT(*) AS vendas,
            COALESCE(SUM(valor_liquido - preco_custo), 0) AS lucro
            FROM vendas WHERE usuario_id = ? AND status = 'concluida' AND dados_incompletos = 0
            GROUP BY produto_nome ORDER BY lucro DESC, vendas DESC LIMIT 8`, [userId]);
        res.json({
            vendasConcluidas: Number(summary.vendas_concluidas), receitaLiquida: Number(summary.receita_liquida), lucroLiquido: Number(summary.lucro_liquido),
            capitalImobilizado: Number(inventory.capital_imobilizado), itensParados30Dias: Number(inventory.itens_parados_30_dias || 0),
            maisLucrativos: ranking.map((item) => ({ nome: item.nome, vendas: Number(item.vendas), lucro: Number(item.lucro) }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao calcular análises.' });
    }
};

module.exports = { getAnalytics };
