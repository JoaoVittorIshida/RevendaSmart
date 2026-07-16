const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..', '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('baseline is ordered before migrations add newer columns', () => {
    const schema = read('database_schema.sql');
    assert.ok(schema.indexOf('CREATE TABLE usuarios') < schema.indexOf('CREATE TABLE categorias'));
    assert.ok(schema.indexOf('CREATE TABLE usuarios') < schema.indexOf('CREATE TABLE canais_venda'));
    assert.ok(schema.indexOf('CREATE TABLE usuarios') < schema.indexOf('CREATE TABLE produtos'));
    assert.ok(!schema.includes('nome_loja'));
    assert.ok(!schema.includes('token_version'));
});

test('critical multi-tenant and concurrency guards are present', () => {
    const stock = read('backend', 'controllers', 'stockController.js');
    const products = read('backend', 'controllers', 'productsController.js');
    assert.match(stock, /canais_compra WHERE id = \? AND usuario_id = \?/);
    assert.match(stock, /SELECT status FROM estoque WHERE id = \? AND usuario_id = \? FOR UPDATE/);
    assert.doesNotMatch(stock, /reservado_ate <= UTC_TIMESTAMP\(\)/);
    assert.match(stock, /AND status = 'reservado'/);
    assert.match(products, /SELECT id FROM produtos WHERE id = \? AND usuario_id = \? FOR UPDATE/);
    assert.match(products, /Nao e possivel excluir um produto que possui unidades/);
});

test('expired reservations remain reserved until the user releases them', () => {
    const stock = read('backend', 'controllers', 'stockController.js');
    const stockPage = read('src', 'pages', 'Estoque.jsx');
    assert.doesNotMatch(stock, /reservado_ate <= UTC_TIMESTAMP\(\)/);
    assert.match(stock, /AND status = 'reservado'/);
    assert.match(stockPage, /reservationIsExpired/);
    assert.match(stockPage, /aguardando revisão/);
    assert.match(stockPage, /Liberar item/);
});

test('stock age filters parse labels such as 30+, 60+ and 90+ correctly', () => {
    const stockPage = read('src', 'pages', 'Estoque.jsx');
    assert.match(stockPage, /age >= Number\.parseInt\(filter, 10\)/);
    assert.doesNotMatch(stockPage, /age >= Number\(filter\)/);
});

test('sale completion uses an accessible detail switch and one calendar indicator', () => {
    const salesPage = read('src', 'pages', 'Vendas.jsx');
    assert.match(salesPage, /role="switch"/);
    assert.match(salesPage, /aria-checked=\{details\}/);
    assert.match(salesPage, /className="input date-input pr-11"/);
    assert.match(salesPage, /pointer-events-none absolute right-3 bottom-3/);
});

test('client data requests discard stale sessions and imports have a total-unit cap', () => {
    const dataContext = read('src', 'contexts', 'DataContext.jsx');
    const portability = read('backend', 'controllers', 'portabilityController.js');
    assert.match(dataContext, /currentUserId\.current !== userId/);
    assert.match(dataContext, /requestGeneration\.current/);
    assert.match(portability, /MAX_IMPORT_UNITS = 5000/);
    assert.match(portability, /totalUnits > MAX_IMPORT_UNITS/);
});

test('analytics preserves source snapshots and aggregates by the selected period', () => {
    const stock = read('backend', 'controllers', 'stockController.js');
    const analytics = read('backend', 'controllers', 'analyticsController.js');
    const portability = read('backend', 'controllers', 'portabilityController.js');
    assert.match(stock, /canal_compra_nome/);
    assert.match(stock, /origem, canal_compra_id, canal_compra_nome/);
    assert.match(analytics, /dados_incompletos = 0/);
    assert.match(analytics, /DATE_ADD\(\?, INTERVAL 1 DAY\)/);
    assert.match(analytics, /porCanalVenda/);
    assert.match(analytics, /porCanalCompra/);
    assert.match(analytics, /porCategoria/);
    assert.match(analytics, /categoria_nome/);
    assert.match(analytics, /inventoryByCategory/);
    assert.match(analytics, /matrizCompraVenda/);
    assert.match(analytics, /parados30Mais/);
    assert.match(analytics, /parados_30_59/);
    assert.match(analytics, /parados_60_89/);
    assert.match(analytics, /parados_90_mais/);
    assert.match(analytics, /AVG\(GREATEST\(0, DATEDIFF\(v\.data_venda, e\.data_entrada\)\)\)/);
    assert.match(portability, /canal_compra_nome/);
    assert.match(portability, /dados_incompletos/);
});
