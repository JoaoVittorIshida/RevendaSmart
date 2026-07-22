const db = require('../db');
const { randomUUID } = require('crypto');
const { ZipArchive } = require('archiver');

const MAX_IMPORT_ROWS = 500;
const MAX_IMPORT_UNITS = 5000;
const MAX_MONEY = 99999999.99;

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const makeCsv = (header, rows) => `\uFEFF${[header, ...rows].map((row) => row.map(csvEscape).join(';')).join('\n')}`;
const sendCsv = (res, filename, header, rows) => {
    res.attachment(filename);
    res.type('text/csv; charset=utf-8').send(makeCsv(header, rows));
};

const exportStock = async (req, res) => {
    const [rows] = await db.query(`SELECT p.nome, p.marca, p.categoria, p.tipo, e.preco_custo, e.origem, e.status, e.data_entrada, e.reservado_ate
        FROM estoque e LEFT JOIN produtos p ON p.id = e.produto_id WHERE e.usuario_id = ? ORDER BY e.data_entrada DESC`, [req.user.id]);
    sendCsv(res, 'revendasmart-estoque.csv', ['Produto', 'Marca', 'Categoria', 'Tipo', 'Custo unitário', 'Origem', 'Status', 'Data de entrada', 'Reservado até'], rows.map((row) => [row.nome, row.marca, row.categoria, row.tipo, row.preco_custo, row.origem, row.status, row.data_entrada, row.reservado_ate]));
};

const exportSales = async (req, res) => {
    const [rows] = await db.query(`SELECT produto_nome, categoria_nome, origem, canal_compra_nome, canal_nome, preco_custo, valor_bruto, taxa_plataforma, frete_vendedor, valor_liquido, data_venda, recebido, data_recebimento, status
        FROM vendas WHERE usuario_id = ? ORDER BY data_venda DESC`, [req.user.id]);
    sendCsv(res, 'revendasmart-vendas.csv', ['Produto', 'Categoria', 'Origem', 'Canal de compra', 'Canal de venda', 'Custo', 'Valor bruto', 'Taxa', 'Frete', 'Valor líquido', 'Data da venda', 'Recebido', 'Data do recebimento', 'Status'], rows.map((row) => [row.produto_nome, row.categoria_nome, row.origem, row.canal_compra_nome, row.canal_nome, row.preco_custo, row.valor_bruto, row.taxa_plataforma, row.frete_vendedor, row.valor_liquido, row.data_venda, row.recebido, row.data_recebimento, row.status]));
};

const backup = async (req, res) => {
    try {
        const userId = req.user.id;
        const [categorias, canaisVenda, canaisCompra, produtos, estoque, vendas, anuncios, vitrineConfiguracoes] = await Promise.all([
            db.query('SELECT id, nome FROM categorias WHERE usuario_id = ? ORDER BY nome', [userId]),
            db.query('SELECT id, nome FROM canais_venda WHERE usuario_id = ? ORDER BY nome', [userId]),
            db.query('SELECT id, nome FROM canais_compra WHERE usuario_id = ? ORDER BY nome', [userId]),
            db.query('SELECT id, nome, marca, categoria, tipo, foto, criado_em, atualizado_em FROM produtos WHERE usuario_id = ? ORDER BY nome', [userId]),
            db.query('SELECT id, produto_id, preco_custo, canal_compra_id, origem, status, data_entrada, preco_venda, canal_venda_id, data_venda, reservado_ate, reserva_observacao FROM estoque WHERE usuario_id = ? ORDER BY data_entrada DESC', [userId]),
            db.query('SELECT id, estoque_id, produto_id, produto_nome, categoria_nome, origem, canal_compra_id, canal_compra_nome, canal_venda_id, canal_nome, preco_custo, valor_bruto, taxa_plataforma, frete_vendedor, valor_liquido, dados_incompletos, data_venda, recebido, data_recebimento, status, cancelada_em, criado_em, atualizado_em FROM vendas WHERE usuario_id = ? ORDER BY data_venda DESC', [userId]),
            db.query('SELECT id, estoque_id, produto_id, nome_anuncio, preco_anuncio, descricao, link_olx, link_facebook, link_mercado_livre, link_outros, ativo, criado_em, atualizado_em FROM anuncios WHERE usuario_id = ? ORDER BY criado_em DESC', [userId]),
            db.query('SELECT slug, publicada, whatsapp, cidade, estado, criado_em, atualizado_em FROM vitrine_configuracoes WHERE usuario_id = ?', [userId]),
        ]);
        const files = [
            ['categorias.csv', ['ID', 'Nome'], categorias[0].map((row) => [row.id, row.nome])],
            ['canais-de-venda.csv', ['ID', 'Nome'], canaisVenda[0].map((row) => [row.id, row.nome])],
            ['canais-de-compra.csv', ['ID', 'Nome'], canaisCompra[0].map((row) => [row.id, row.nome])],
            ['produtos.csv', ['ID', 'Produto', 'Marca', 'Categoria', 'Tipo', 'Foto', 'Criado em', 'Atualizado em'], produtos[0].map((row) => [row.id, row.nome, row.marca, row.categoria, row.tipo, row.foto, row.criado_em, row.atualizado_em])],
            ['estoque.csv', ['ID', 'ID do produto', 'Custo', 'ID canal de compra', 'Origem', 'Status', 'Data de entrada', 'Preço de venda antigo', 'ID canal de venda antigo', 'Data de venda antiga', 'Reservado até', 'Observação da reserva'], estoque[0].map((row) => [row.id, row.produto_id, row.preco_custo, row.canal_compra_id, row.origem, row.status, row.data_entrada, row.preco_venda, row.canal_venda_id, row.data_venda, row.reservado_ate, row.reserva_observacao])],
            ['vendas.csv', ['ID', 'ID do estoque', 'ID do produto', 'Produto', 'Categoria', 'Origem', 'ID canal de compra', 'Canal de compra', 'ID canal de venda', 'Canal de venda', 'Custo', 'Valor bruto', 'Taxa da plataforma', 'Frete do vendedor', 'Valor líquido', 'Dados incompletos', 'Data da venda', 'Recebido', 'Data do recebimento', 'Status', 'Cancelada em', 'Criada em', 'Atualizada em'], vendas[0].map((row) => [row.id, row.estoque_id, row.produto_id, row.produto_nome, row.categoria_nome, row.origem, row.canal_compra_id, row.canal_compra_nome, row.canal_venda_id, row.canal_nome, row.preco_custo, row.valor_bruto, row.taxa_plataforma, row.frete_vendedor, row.valor_liquido, row.dados_incompletos, row.data_venda, row.recebido, row.data_recebimento, row.status, row.cancelada_em, row.criado_em, row.atualizado_em])],
            ['anuncios.csv', ['ID', 'ID do estoque', 'ID do produto', 'Nome do anúncio', 'Preço anunciado', 'Descrição HTML', 'Link OLX', 'Link Facebook', 'Link Mercado Livre', 'Link outros', 'Ativo', 'Criado em', 'Atualizado em'], anuncios[0].map((row) => [row.id, row.estoque_id, row.produto_id, row.nome_anuncio, row.preco_anuncio, row.descricao, row.link_olx, row.link_facebook, row.link_mercado_livre, row.link_outros, row.ativo, row.criado_em, row.atualizado_em])],
            ['vitrine-configuracoes.csv', ['Slug', 'Publicada', 'WhatsApp', 'Cidade', 'Estado', 'Criada em', 'Atualizada em'], vitrineConfiguracoes[0].map((row) => [row.slug, row.publicada, row.whatsapp, row.cidade, row.estado, row.criado_em, row.atualizado_em])],
        ];

        res.attachment('revendasmart-backup-completo.zip');
        res.type('application/zip');
        const archive = new ZipArchive({ zlib: { level: 9 } });
        archive.on('error', (error) => {
            console.error(error);
            res.destroy(error);
        });
        archive.pipe(res);
        archive.append(`Backup RevendaSmart\nExportado em: ${new Date().toISOString()}\n\nCada arquivo CSV pode ser aberto no Excel. Os IDs e campos de relacionamento foram mantidos para preservar a estrutura dos dados.\n`, { name: 'LEIA-ME.txt' });
        files.forEach(([filename, header, rows]) => archive.append(makeCsv(header, rows), { name: filename }));
        await archive.finalize();
    } catch (error) {
        console.error(error);
        if (!res.headersSent) res.status(500).json({ message: 'Não foi possível gerar o backup.' });
        else res.destroy(error);
    }
};

const importStock = async (req, res) => {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    if (!rows.length || rows.length > MAX_IMPORT_ROWS) return res.status(400).json({ message: `Envie entre 1 e ${MAX_IMPORT_ROWS} linhas.` });
    const errors = [];
    let totalUnits = 0;
    rows.forEach((row, index) => {
        const quantity = Number(row.quantidade);
        totalUnits += Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
        const rawCost = String(row.custoUnitario ?? '').trim();
        const cost = Number(rawCost.replace(',', '.'));
        if (cost > MAX_MONEY) errors.push({ linha: index + 2, mensagem: 'Custo unitario acima do limite permitido.' });
        if (!String(row.nome || '').trim()) errors.push({ linha: index + 2, mensagem: 'Produto é obrigatório.' });
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) errors.push({ linha: index + 2, mensagem: 'Quantidade inválida.' });
        if (!rawCost || !Number.isFinite(cost) || cost < 0) errors.push({ linha: index + 2, mensagem: 'Custo unitário inválido.' });
        if (!['nacional', 'importado'].includes(String(row.origem || 'nacional').trim().toLowerCase())) errors.push({ linha: index + 2, mensagem: 'Origem deve ser nacional ou importado.' });
        if (String(row.nome || '').trim().length > 255 || String(row.marca || '').trim().length > 100 || String(row.categoria || '').trim().length > 100 || String(row.tipo || '').trim().length > 100) errors.push({ linha: index + 2, mensagem: 'Um dos campos de produto excede o limite permitido.' });
    });
    if (totalUnits > MAX_IMPORT_UNITS) errors.push({ linha: 0, mensagem: `A importacao suporta no maximo ${MAX_IMPORT_UNITS} unidades por vez.` });
    if (errors.length) return res.status(400).json({ message: 'Corrija as linhas inválidas.', errors });
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        let added = 0;
        for (const row of rows) {
            const name = String(row.nome).trim();
            const brand = String(row.marca || '').trim();
            const [products] = await connection.query('SELECT id FROM produtos WHERE usuario_id = ? AND nome = ? AND COALESCE(marca, \'\') = ? LIMIT 1', [req.user.id, name, brand]);
            const productId = products[0]?.id || randomUUID();
            if (!products.length) await connection.query('INSERT INTO produtos (id, usuario_id, nome, marca, categoria, tipo) VALUES (?, ?, ?, ?, ?, ?)', [productId, req.user.id, name, brand || null, String(row.categoria || '').trim() || null, String(row.tipo || '').trim() || null]);
            const values = Array.from({ length: Number(row.quantidade) }, () => [randomUUID(), productId, req.user.id, Number(String(row.custoUnitario).replace(',', '.')), null, String(row.origem || 'nacional').trim().toLowerCase(), 'disponivel']);
            await connection.query('INSERT INTO estoque (id, produto_id, usuario_id, preco_custo, canal_compra_id, origem, status) VALUES ?', [values]);
            added += values.length;
        }
        await connection.commit();
        res.status(201).json({ message: 'Importação concluída.', itensAdicionados: added });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'A importação foi desfeita por erro interno.' });
    } finally {
        connection.release();
    }
};

module.exports = { exportStock, exportSales, backup, importStock, MAX_IMPORT_ROWS, MAX_IMPORT_UNITS };
