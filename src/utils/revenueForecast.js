const CATEGORY_PRIOR_SALES = 5;
const MIN_ROI = -1;
const MAX_ROI = 3;

const number = (value) => Number(value);
const isFiniteNumber = (value) => Number.isFinite(number(value));
const categoryKey = (value) => String(value || 'Sem categoria').trim().toLocaleLowerCase('pt-BR') || 'sem categoria';
const clampRoi = (value) => Math.min(MAX_ROI, Math.max(MIN_ROI, value));

const confidenceFromSample = (sampleSize) => {
    if (sampleSize < 5) return 'inicial';
    if (sampleSize < 15) return 'moderada';
    return 'boa';
};

export const calculateRevenueForecast = ({ vendas = [], itensEstoque = [], produtos = [] }) => {
    const validSales = vendas.filter((sale) => (
        sale.status === 'concluida'
        && !sale.dadosIncompletos
        && sale.custo != null
        && sale.valor != null
        && isFiniteNumber(sale.custo)
        && isFiniteNumber(sale.valor)
        && number(sale.custo) > 0
    ));

    const historyByCategory = new Map();
    let historicalCost = 0;
    let historicalProfit = 0;

    validSales.forEach((sale) => {
        const cost = number(sale.custo);
        const profit = number(sale.valor) - cost;
        const key = categoryKey(sale.categoria);
        const current = historyByCategory.get(key) || { cost: 0, profit: 0, sales: 0 };
        current.cost += cost;
        current.profit += profit;
        current.sales += 1;
        historyByCategory.set(key, current);
        historicalCost += cost;
        historicalProfit += profit;
    });

    const productCategory = new Map(produtos.map((product) => [product.id, categoryKey(product.categoria)]));
    const stockByCategory = new Map();

    itensEstoque
        .filter((item) => item.status !== 'vendido' && isFiniteNumber(item.precoCusto) && number(item.precoCusto) >= 0)
        .forEach((item) => {
            const key = productCategory.get(item.produtoId) || 'sem categoria';
            stockByCategory.set(key, (stockByCategory.get(key) || 0) + number(item.precoCusto));
        });

    const invested = [...stockByCategory.values()].reduce((sum, cost) => sum + cost, 0);
    if (!validSales.length || historicalCost <= 0 || invested <= 0) {
        return {
            invested,
            hasForecast: false,
            estimatedRevenue: null,
            estimatedProfit: null,
            projectedRoi: null,
            sampleSize: validSales.length,
            confidence: 'indisponível',
            categoriesWithHistory: 0,
            stockCategories: stockByCategory.size,
        };
    }

    const overallRoi = clampRoi(historicalProfit / historicalCost);
    let estimatedRevenue = 0;
    let categoriesWithHistory = 0;

    stockByCategory.forEach((capital, key) => {
        const category = historyByCategory.get(key);
        let effectiveRoi = overallRoi;

        if (category?.cost > 0) {
            const categoryRoi = clampRoi(category.profit / category.cost);
            const categoryWeight = category.sales / (category.sales + CATEGORY_PRIOR_SALES);
            effectiveRoi = categoryRoi * categoryWeight + overallRoi * (1 - categoryWeight);
            categoriesWithHistory += 1;
        }

        estimatedRevenue += capital * (1 + effectiveRoi);
    });

    const estimatedProfit = estimatedRevenue - invested;
    return {
        invested,
        hasForecast: true,
        estimatedRevenue,
        estimatedProfit,
        projectedRoi: invested > 0 ? (estimatedProfit / invested) * 100 : null,
        sampleSize: validSales.length,
        confidence: confidenceFromSample(validSales.length),
        categoriesWithHistory,
        stockCategories: stockByCategory.size,
    };
};
