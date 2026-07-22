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
    assert.match(stock, /SELECT produto_id, status FROM estoque WHERE id = \? AND usuario_id = \? FOR UPDATE/);
    assert.match(stock, /status = 'disponivel' LIMIT 1 FOR UPDATE/);
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
    assert.match(analytics, /incluirPendentes/);
    assert.match(analytics, /recebido = 1/);
    assert.match(portability, /canal_compra_nome/);
    assert.match(portability, /dados_incompletos/);
});

test('sales preserve receipt status and only allow a pending sale to be received', () => {
    const stock = read('backend', 'controllers', 'stockController.js');
    const sales = read('backend', 'controllers', 'salesController.js');
    const salesRoutes = read('backend', 'routes', 'salesRoutes.js');
    assert.match(stock, /recebido = true/);
    assert.match(stock, /data_recebimento/);
    assert.match(sales, /dataRecebimento/);
    assert.match(sales, /AND recebido = 0/);
    assert.match(sales, /data de recebimento nao pode estar no futuro/i);
    assert.match(sales, /DATE\(data_venda\) <= DATE\(\?\)/);
    assert.match(salesRoutes, /router\.patch\('\/:id\/recebimento'/);
});

test('receipt confirmation uses a review modal instead of changing the date in the table', () => {
    const receiptPage = read('src', 'pages', 'Recebimentos.jsx');
    assert.match(receiptPage, /Confirmar recebimento/);
    assert.match(receiptPage, /Data da venda/);
    assert.match(receiptPage, /Data de recebimento/);
    assert.match(receiptPage, /openReceiptModal/);
    assert.match(receiptPage, /<Modal/);
});

test('public showcase exposes an explicit DTO and account name is protected while published', () => {
    const showcase = read('backend', 'controllers', 'showcaseController.js');
    const account = read('backend', 'controllers', 'authController.js');
    const ads = read('backend', 'controllers', 'adsController.js');
    assert.match(showcase, /c\.slug = \? AND c\.publicada = 1/);
    assert.match(showcase, /Cache-Control', 'no-store/);
    assert.doesNotMatch(showcase, /SELECT \*/);
    assert.doesNotMatch(showcase, /senha|token_version/);
    assert.match(account, /Despublique a Vitrine antes de apagar o nome da loja/);
    assert.match(ads, /uq_anuncios_usuario_produto|ER_DUP_ENTRY/);
    assert.match(ads, /p\.usuario_id = a\.usuario_id/);
});
