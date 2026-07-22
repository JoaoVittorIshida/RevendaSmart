const db = require('../db');

const getSales = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT id, estoque_id, produto_id, produto_nome, categoria_nome, canal_venda_id, canal_nome, preco_custo, valor_bruto, taxa_plataforma, frete_vendedor, valor_liquido, data_venda, recebido, data_recebimento, status, cancelada_em, dados_incompletos
            FROM vendas WHERE usuario_id = ? ORDER BY data_venda DESC, criado_em DESC`, [req.user.id]);
        res.json(rows.map((sale) => ({
            id: sale.id, estoqueId: sale.estoque_id, produtoId: sale.produto_id,
            produto: sale.produto_nome, categoria: sale.categoria_nome || 'Sem categoria', canal: sale.canal_nome || 'Não informado', canalVendaId: sale.canal_venda_id,
            custo: sale.preco_custo === null ? null : Number(sale.preco_custo), valorBruto: sale.valor_bruto === null ? null : Number(sale.valor_bruto),
            taxaPlataforma: Number(sale.taxa_plataforma || 0), freteVendedor: Number(sale.frete_vendedor || 0), valor: sale.valor_liquido === null ? null : Number(sale.valor_liquido),
            data: sale.data_venda ? new Date(sale.data_venda).toISOString() : null, recebido: Boolean(sale.recebido), dataRecebimento: sale.data_recebimento ? new Date(sale.data_recebimento).toISOString() : null, status: sale.status, dadosIncompletos: Boolean(sale.dados_incompletos),
            canceladaEm: sale.cancelada_em ? new Date(sale.cancelada_em).toISOString() : null
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar histórico de vendas.' });
    }
};

const toMySqlDate = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return null;
    const offset = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 19).replace('T', ' ');
};

const markSaleReceived = async (req, res) => {
    const receivedAt = toMySqlDate(req.body.dataRecebimento);
    if (!receivedAt) return res.status(400).json({ message: 'Data de recebimento invalida.' });
    if (receivedAt.slice(0, 10) > toMySqlDate().slice(0, 10)) return res.status(400).json({ message: 'A data de recebimento nao pode estar no futuro.' });
    try {
        const [result] = await db.query("UPDATE vendas SET recebido = 1, data_recebimento = ? WHERE id = ? AND usuario_id = ? AND status = 'concluida' AND recebido = 0 AND DATE(data_venda) <= DATE(?)", [receivedAt, req.params.id, req.user.id, receivedAt]);
        if (!result.affectedRows) return res.status(409).json({ message: 'Esta venda nao possui um recebimento pendente.' });
        res.json({ message: 'Recebimento registrado com sucesso.', dataRecebimento: new Date(receivedAt).toISOString() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao registrar recebimento.' });
    }
};

module.exports = { getSales, markSaleReceived };
