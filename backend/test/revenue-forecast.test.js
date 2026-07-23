const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');

const moduleUrl = pathToFileURL(path.join(__dirname, '..', '..', 'src', 'utils', 'revenueForecast.js')).href;

test('revenue forecast blends category ROI with the overall history and falls back for unseen categories', async () => {
    const { calculateRevenueForecast } = await import(moduleUrl);
    const vendas = [
        ...Array.from({ length: 2 }, (_, index) => ({ id: `a${index}`, status: 'concluida', categoria: 'A', custo: 100, valor: 200 })),
        ...Array.from({ length: 5 }, (_, index) => ({ id: `b${index}`, status: 'concluida', categoria: 'B', custo: 100, valor: 120 })),
    ];
    const result = calculateRevenueForecast({
        vendas,
        produtos: [{ id: 'pa', categoria: 'A' }, { id: 'pc', categoria: 'Sem histórico' }],
        itensEstoque: [
            { produtoId: 'pa', status: 'disponivel', precoCusto: 100 },
            { produtoId: 'pc', status: 'reservado', precoCusto: 100 },
        ],
    });

    assert.equal(result.hasForecast, true);
    assert.equal(result.sampleSize, 7);
    assert.equal(result.categoriesWithHistory, 1);
    assert.ok(Math.abs(result.estimatedRevenue - 302.0408163265306) < 0.000001);
    assert.ok(Math.abs(result.estimatedProfit - 102.0408163265306) < 0.000001);
});

test('revenue forecast ignores cancelled, incomplete and invalid sales', async () => {
    const { calculateRevenueForecast } = await import(moduleUrl);
    const result = calculateRevenueForecast({
        vendas: [
            { status: 'cancelada', categoria: 'A', custo: 100, valor: 200 },
            { status: 'concluida', categoria: 'A', custo: 100, valor: 200, dadosIncompletos: true },
            { status: 'concluida', categoria: 'A', custo: 0, valor: 200 },
        ],
        produtos: [{ id: 'pa', categoria: 'A' }],
        itensEstoque: [{ produtoId: 'pa', status: 'disponivel', precoCusto: 100 }],
    });

    assert.equal(result.hasForecast, false);
    assert.equal(result.sampleSize, 0);
    assert.equal(result.estimatedRevenue, null);
});

test('revenue forecast excludes sold stock from projected revenue', async () => {
    const { calculateRevenueForecast } = await import(moduleUrl);
    const result = calculateRevenueForecast({
        vendas: [{ status: 'concluida', categoria: 'A', custo: 100, valor: 150 }],
        produtos: [{ id: 'pa', categoria: 'A' }],
        itensEstoque: [
            { produtoId: 'pa', status: 'disponivel', precoCusto: 200 },
            { produtoId: 'pa', status: 'vendido', precoCusto: 900 },
        ],
    });

    assert.equal(result.invested, 200);
    assert.equal(result.estimatedRevenue, 300);
});
