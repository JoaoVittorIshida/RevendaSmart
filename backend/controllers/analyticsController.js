const db = require('../db');

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toDateKey = (date) => date.toISOString().slice(0, 10);

const parseDate = (value) => {
    if (!DATE_PATTERN.test(String(value || ''))) return null;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) || toDateKey(parsed) !== value ? null : parsed;
};

const resolvePeriod = ({ inicio, fim, modo }) => {
    if (modo === 'todo') return { modo: 'todo' };
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const defaultEnd = new Date(today);
    const defaultStart = new Date(today);
    defaultStart.setUTCDate(defaultStart.getUTCDate() - 29);

    const start = inicio ? parseDate(inicio) : defaultStart;
    const end = fim ? parseDate(fim) : defaultEnd;
    if (!start || !end || end < start) return null;

    const days = Math.round((end - start) / DAY_MS) + 1;
    if (days > 366) return null;
    const previousEnd = new Date(start);
    previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setUTCDate(previousStart.getUTCDate() - days + 1);

    return {
        inicio: toDateKey(start),
        fim: toDateKey(end),
        anteriorInicio: toDateKey(previousStart),
        anteriorFim: toDateKey(previousEnd)
    };
};

const salesParams = (userId, period) => period.modo === 'todo' ? [userId] : [userId, period.inicio, period.fim];
const salesFilters = (period, alias = '') => `
    WHERE ${alias}usuario_id = ?
      AND ${alias}status = 'concluida'
      AND ${alias}dados_incompletos = 0${period.modo === 'todo' ? '' : `
      AND ${alias}data_venda >= ?
      AND ${alias}data_venda < DATE_ADD(?, INTERVAL 1 DAY)`}`;
const salesWhere = (period) => `FROM vendas ${salesFilters(period)}`;

const number = (value) => Number(value || 0);
const percent = (part, total) => (total ? (part / total) * 100 : 0);

const mapPerformance = (row) => {
    const receitaLiquida = number(row.receita_liquida);
    const lucroLiquido = number(row.lucro_liquido);
    const custo = number(row.custo);
    const receitaBruta = number(row.receita_bruta);
    const taxas = number(row.taxas);
    const frete = number(row.frete);
    return {
        id: row.id || null,
        nome: row.nome || 'Não informado',
        vendas: number(row.vendas),
        custo,
        receitaBruta,
        taxas,
        frete,
        receitaLiquida,
        lucroLiquido,
        margem: percent(lucroLiquido, receitaLiquida),
        ticketMedio: number(row.ticket_medio),
        custoDoCanal: percent(taxas + frete, receitaBruta),
        roi: percent(lucroLiquido, custo),
        giroMedio: number(row.giro_medio)
    };
};

const getAnalytics = async (req, res) => {
    const period = resolvePeriod(req.query);
    if (!period) return res.status(400).json({ message: 'Informe um período válido de até 366 dias.' });

    try {
        const userId = req.user.id;
        const currentParams = salesParams(userId, period);
        const previousPeriod = { inicio: period.anteriorInicio, fim: period.anteriorFim };
        const previousParams = salesParams(userId, previousPeriod);
        const performanceFields = (alias = '') => `
            COUNT(*) AS vendas,
            COALESCE(SUM(${alias}preco_custo), 0) AS custo,
            COALESCE(SUM(${alias}valor_bruto), 0) AS receita_bruta,
            COALESCE(SUM(${alias}taxa_plataforma), 0) AS taxas,
            COALESCE(SUM(${alias}frete_vendedor), 0) AS frete,
            COALESCE(SUM(${alias}valor_liquido), 0) AS receita_liquida,
            COALESCE(SUM(${alias}valor_liquido - ${alias}preco_custo), 0) AS lucro_liquido,
            COALESCE(AVG(${alias}valor_liquido), 0) AS ticket_medio`;

        const [
            [summaryRows],
            [previousSummaryRows],
            [salesChannels],
            [purchaseChannels],
            [origins],
            [matrix],
            [inventoryByOrigin],
            [inventoryByPurchaseChannel],
            [inventorySummaryRows],
            [ranking],
            [fastest]
        ] = await Promise.all([
            db.query(`SELECT ${performanceFields()} ${salesWhere(period)}`, currentParams),
            period.modo === 'todo' ? Promise.resolve([[{}]]) : db.query(`SELECT ${performanceFields()} ${salesWhere(previousPeriod)}`, previousParams),
            db.query(`SELECT canal_venda_id AS id, COALESCE(NULLIF(canal_nome, ''), 'Não informado') AS nome, ${performanceFields()}
                ${salesWhere(period)} GROUP BY canal_venda_id, canal_nome ORDER BY lucro_liquido DESC, vendas DESC`, currentParams),
            db.query(`SELECT v.canal_compra_id AS id, COALESCE(NULLIF(v.canal_compra_nome, ''), 'Não informado') AS nome, ${performanceFields('v.')},
                COALESCE(AVG(GREATEST(0, DATEDIFF(v.data_venda, e.data_entrada))), 0) AS giro_medio
                FROM vendas v LEFT JOIN estoque e ON e.id = v.estoque_id AND e.usuario_id = v.usuario_id
                ${salesFilters(period, 'v.')}
                GROUP BY v.canal_compra_id, v.canal_compra_nome ORDER BY lucro_liquido DESC, vendas DESC`, currentParams),
            db.query(`SELECT COALESCE(NULLIF(v.origem, ''), 'Não informado') AS nome, ${performanceFields('v.')},
                COALESCE(AVG(GREATEST(0, DATEDIFF(v.data_venda, e.data_entrada))), 0) AS giro_medio
                FROM vendas v LEFT JOIN estoque e ON e.id = v.estoque_id AND e.usuario_id = v.usuario_id
                ${salesFilters(period, 'v.')}
                GROUP BY v.origem ORDER BY lucro_liquido DESC, vendas DESC`, currentParams),
            db.query(`SELECT
                COALESCE(NULLIF(canal_compra_nome, ''), 'Não informado') AS canal_compra,
                COALESCE(NULLIF(canal_nome, ''), 'Não informado') AS canal_venda,
                COUNT(*) AS vendas,
                COALESCE(SUM(valor_liquido - preco_custo), 0) AS lucro_liquido,
                COALESCE(SUM(valor_liquido), 0) AS receita_liquida
                ${salesWhere(period)}
                GROUP BY canal_compra_nome, canal_nome
                ORDER BY lucro_liquido DESC, vendas DESC LIMIT 12`, currentParams),
            db.query(`SELECT COALESCE(NULLIF(origem, ''), 'Não informado') AS nome,
                COUNT(*) AS unidades, COALESCE(SUM(preco_custo), 0) AS capital,
                SUM(data_entrada <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY) AND data_entrada > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 DAY)) AS parados_30_59,
                SUM(data_entrada <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 DAY) AND data_entrada > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY)) AS parados_60_89,
                SUM(data_entrada <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY)) AS parados_90_mais
                FROM estoque WHERE usuario_id = ? AND status IN ('disponivel', 'reservado')
                GROUP BY origem ORDER BY capital DESC`, [userId]),
            db.query(`SELECT COALESCE(NULLIF(cc.nome, ''), 'Não informado') AS nome,
                COUNT(*) AS unidades, COALESCE(SUM(e.preco_custo), 0) AS capital,
                SUM(e.data_entrada <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY) AND e.data_entrada > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 DAY)) AS parados_30_59,
                SUM(e.data_entrada <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 DAY) AND e.data_entrada > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY)) AS parados_60_89,
                SUM(e.data_entrada <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY)) AS parados_90_mais
                FROM estoque e LEFT JOIN canais_compra cc ON cc.id = e.canal_compra_id AND cc.usuario_id = e.usuario_id
                WHERE e.usuario_id = ? AND e.status IN ('disponivel', 'reservado')
                GROUP BY e.canal_compra_id, cc.nome ORDER BY capital DESC`, [userId]),
            db.query(`SELECT COUNT(*) AS unidades, COALESCE(SUM(preco_custo), 0) AS capital,
                SUM(data_entrada <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY) AND data_entrada > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 DAY)) AS parados_30_59,
                SUM(data_entrada <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 DAY) AND data_entrada > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY)) AS parados_60_89,
                SUM(data_entrada <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY)) AS parados_90_mais
                FROM estoque WHERE usuario_id = ? AND status IN ('disponivel', 'reservado')`, [userId]),
            db.query(`SELECT produto_nome AS nome, COUNT(*) AS vendas,
                COALESCE(SUM(valor_liquido - preco_custo), 0) AS lucro
                ${salesWhere(period)} GROUP BY produto_nome ORDER BY lucro DESC, vendas DESC LIMIT 8`, currentParams),
            db.query(`SELECT v.id, v.produto_nome AS nome, v.valor_liquido AS valor, GREATEST(0, DATEDIFF(v.data_venda, e.data_entrada)) AS dias
                FROM vendas v INNER JOIN estoque e ON e.id = v.estoque_id AND e.usuario_id = v.usuario_id
                ${salesFilters(period, 'v.')}
                ORDER BY dias ASC, v.data_venda DESC LIMIT 8`, currentParams)
        ]);

        const summary = mapPerformance(summaryRows[0]);
        const previous = mapPerformance(previousSummaryRows[0]);
        const inventory = inventorySummaryRows[0];
        res.json({
            periodo: period,
            resumo: summary,
            comparativo: period.modo === 'todo' ? null : {
                receitaLiquida: number(summary.receitaLiquida - previous.receitaLiquida),
                lucroLiquido: number(summary.lucroLiquido - previous.lucroLiquido),
                vendas: number(summary.vendas - previous.vendas),
                margem: number(summary.margem - previous.margem),
                anterior: previous
            },
            porCanalVenda: salesChannels.map(mapPerformance),
            porCanalCompra: purchaseChannels.map(mapPerformance),
            porOrigem: origins.map(mapPerformance),
            matrizCompraVenda: matrix.map((row) => ({
                canalCompra: row.canal_compra,
                canalVenda: row.canal_venda,
                vendas: number(row.vendas),
                receitaLiquida: number(row.receita_liquida),
                lucroLiquido: number(row.lucro_liquido),
                margem: percent(number(row.lucro_liquido), number(row.receita_liquida))
            })),
            estoque: {
                unidades: number(inventory.unidades),
                capital: number(inventory.capital),
                parados30Mais: number(inventory.parados_30_59) + number(inventory.parados_60_89) + number(inventory.parados_90_mais),
                parados30a59: number(inventory.parados_30_59),
                parados60a89: number(inventory.parados_60_89),
                parados90Mais: number(inventory.parados_90_mais),
                porOrigem: inventoryByOrigin.map((row) => ({ nome: row.nome || 'Não informado', unidades: number(row.unidades), capital: number(row.capital), parados30a59: number(row.parados_30_59), parados60a89: number(row.parados_60_89), parados90Mais: number(row.parados_90_mais) })),
                porCanalCompra: inventoryByPurchaseChannel.map((row) => ({ nome: row.nome || 'Não informado', unidades: number(row.unidades), capital: number(row.capital), parados30a59: number(row.parados_30_59), parados60a89: number(row.parados_60_89), parados90Mais: number(row.parados_90_mais) }))
            },
            maisLucrativos: ranking.map((row) => ({ nome: row.nome, vendas: number(row.vendas), lucro: number(row.lucro) })),
            vendasMaisRapidas: fastest.map((row) => ({ id: row.id, nome: row.nome, valor: number(row.valor), dias: number(row.dias) }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao calcular análises.' });
    }
};

module.exports = { getAnalytics, resolvePeriod };
