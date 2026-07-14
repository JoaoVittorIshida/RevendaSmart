const db = require('../db');
const { randomUUID } = require('crypto');

const MAX_QUANTIDADE = 500;
const MAX_MONEY = 99999999.99;
const VALID_ORIGINS = new Set(['nacional', 'importado']);

const parseMoney = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
};

const toMySqlDate = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return null;
    const offset = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 19).replace('T', ' ');
};

const safeDate = (value) => (value ? new Date(value).toISOString() : null);

const validateStockInput = ({ quantidade, precoCusto, origem }) => {
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > MAX_QUANTIDADE) return 'Quantidade invalida.';
    const cost = parseMoney(precoCusto);
    if (cost === null || cost < 0 || cost > MAX_MONEY) return 'Custo invalido.';
    if (!VALID_ORIGINS.has(String(origem ?? '').trim().toLowerCase())) return 'Origem invalida.';
    return null;
};

const getStock = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM estoque WHERE usuario_id = ?', [req.user.id]);
        res.json(rows.map((item) => ({
            id: item.id,
            produtoId: item.produto_id,
            precoCusto: Number(item.preco_custo),
            canalCompraId: item.canal_compra_id,
            origem: item.origem,
            status: item.status,
            reservadoAte: safeDate(item.reservado_ate),
            reservaObservacao: item.reserva_observacao,
            dataEntrada: safeDate(item.data_entrada),
            precoVenda: item.preco_venda === null ? null : Number(item.preco_venda),
            canalVendaId: item.canal_venda_id,
            dataVenda: safeDate(item.data_venda)
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar estoque.' });
    }
};

const addStockBatch = async (req, res) => {
    const { produtoId, quantidade, precoCusto, canalCompraId, origem } = req.body;
    const inputError = validateStockInput({ quantidade, precoCusto, origem });
    if (inputError) return res.status(400).json({ message: inputError });
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [products] = await connection.query('SELECT id FROM produtos WHERE id = ? AND usuario_id = ? FOR UPDATE', [produtoId, req.user.id]);
        if (!products.length) throw Object.assign(new Error('Produto invalido.'), { status: 403 });
        if (canalCompraId) {
            const [channels] = await connection.query('SELECT id FROM canais_compra WHERE id = ? AND usuario_id = ?', [canalCompraId, req.user.id]);
            if (!channels.length) throw Object.assign(new Error('Canal de compra invalido.'), { status: 400 });
        }
        const normalizedOrigin = String(origem).trim().toLowerCase();
        const values = Array.from({ length: quantidade }, () => [randomUUID(), produtoId, req.user.id, parseMoney(precoCusto), canalCompraId || null, normalizedOrigin, 'disponivel']);
        await connection.query('INSERT INTO estoque (id, produto_id, usuario_id, preco_custo, canal_compra_id, origem, status) VALUES ?', [values]);
        await connection.commit();
        res.status(201).json({ message: `${quantidade} itens adicionados com sucesso.` });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(error.status || 500).json({ message: error.status ? error.message : 'Erro ao adicionar ao estoque.' });
    } finally {
        if (connection) connection.release();
    }
};

const sellItem = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { precoVenda, valorBruto, taxaPlataforma = 0, freteVendedor = 0, canalVendaId, dataVenda } = req.body;
        const gross = parseMoney(valorBruto ?? precoVenda);
        const fee = parseMoney(taxaPlataforma);
        const shipping = parseMoney(freteVendedor);
        const saleDate = toMySqlDate(dataVenda);
        if (gross === null || gross <= 0 || gross > MAX_MONEY || fee === null || fee < 0 || fee > MAX_MONEY || shipping === null || shipping < 0 || shipping > MAX_MONEY || !saleDate) return res.status(400).json({ message: 'Dados da venda invalidos.' });
        const net = Math.round((gross - fee - shipping) * 100) / 100;
        if (net < 0) return res.status(400).json({ message: 'O valor liquido nao pode ser negativo.' });

        connection = await db.getConnection();
        await connection.beginTransaction();
        const [items] = await connection.query(`SELECT e.*, p.nome AS produto_nome, p.categoria AS categoria_nome, cv.nome AS canal_nome
            FROM estoque e
            LEFT JOIN produtos p ON p.id = e.produto_id
            LEFT JOIN canais_venda cv ON cv.id = ? AND cv.usuario_id = e.usuario_id
            WHERE e.id = ? AND e.usuario_id = ? FOR UPDATE`, [canalVendaId || null, id, req.user.id]);
        if (!items.length) throw Object.assign(new Error('Item nao encontrado.'), { status: 404 });
        const item = items[0];
        if (!['disponivel', 'reservado'].includes(item.status)) throw Object.assign(new Error('Este item nao esta disponivel para venda.'), { status: 409 });
        if (canalVendaId && !item.canal_nome) throw Object.assign(new Error('Canal de venda invalido.'), { status: 400 });

        const saleId = randomUUID();
        await connection.query(`INSERT INTO vendas (id, usuario_id, estoque_id, produto_id, produto_nome, categoria_nome, canal_venda_id, canal_nome, preco_custo, valor_bruto, taxa_plataforma, frete_vendedor, valor_liquido, data_venda)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [saleId, req.user.id, item.id, item.produto_id, item.produto_nome || 'Produto removido', item.categoria_nome || 'Sem categoria', canalVendaId || null, item.canal_nome || 'Nao informado', item.preco_custo, gross, fee, shipping, net, saleDate]);
        await connection.query("UPDATE estoque SET status = 'vendido', preco_venda = ?, canal_venda_id = ?, data_venda = ?, reservado_ate = NULL, reserva_observacao = NULL WHERE id = ? AND usuario_id = ?", [net, canalVendaId || null, saleDate, id, req.user.id]);
        await connection.query('UPDATE anuncios SET ativo = 0 WHERE estoque_id = ? AND usuario_id = ?', [id, req.user.id]);
        await connection.commit();
        res.json({ message: 'Venda registrada com sucesso!', vendaId: saleId, valorLiquido: net });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(error.status || 500).json({ message: error.status ? error.message : 'Erro ao registrar venda.' });
    } finally {
        if (connection) connection.release();
    }
};

const cancelSale = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [items] = await connection.query('SELECT id, status FROM estoque WHERE id = ? AND usuario_id = ? FOR UPDATE', [req.params.id, req.user.id]);
        if (!items.length) throw Object.assign(new Error('Item nao encontrado.'), { status: 404 });
        if (items[0].status !== 'vendido') throw Object.assign(new Error('Apenas itens vendidos podem ter a venda cancelada.'), { status: 400 });
        const [sales] = await connection.query("SELECT id FROM vendas WHERE estoque_id = ? AND usuario_id = ? AND status = 'concluida' ORDER BY data_venda DESC, criado_em DESC LIMIT 1 FOR UPDATE", [req.params.id, req.user.id]);
        if (!sales.length) throw Object.assign(new Error('Historico da venda nao encontrado; cancelamento seguro indisponivel.'), { status: 409 });
        await connection.query("UPDATE vendas SET status = 'cancelada', cancelada_em = UTC_TIMESTAMP() WHERE id = ?", [sales[0].id]);
        await connection.query("UPDATE estoque SET status = 'disponivel', preco_venda = NULL, canal_venda_id = NULL, data_venda = NULL WHERE id = ? AND usuario_id = ?", [req.params.id, req.user.id]);
        await connection.commit();
        res.json({ message: 'Venda cancelada com sucesso!', vendaId: sales[0].id });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(error.status || 500).json({ message: error.status ? error.message : 'Erro ao cancelar venda.' });
    } finally {
        if (connection) connection.release();
    }
};

const reserveItem = async (req, res) => {
    let connection;
    try {
        const until = toMySqlDate(req.body.reservadoAte);
        const observation = String(req.body.observacao || '').trim();
        if (!until || new Date(until).getTime() <= Date.now()) return res.status(400).json({ message: 'Informe uma data futura para a reserva.' });
        if (observation.length > 280) return res.status(400).json({ message: 'A observacao pode ter no maximo 280 caracteres.' });
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [items] = await connection.query('SELECT id, status FROM estoque WHERE id = ? AND usuario_id = ? FOR UPDATE', [req.params.id, req.user.id]);
        if (!items.length || items[0].status !== 'disponivel') throw Object.assign(new Error('O item nao esta disponivel para reserva.'), { status: 409 });
        await connection.query("UPDATE estoque SET status = 'reservado', reservado_ate = ?, reserva_observacao = ? WHERE id = ? AND usuario_id = ?", [until, observation || null, req.params.id, req.user.id]);
        await connection.query('UPDATE anuncios SET ativo = 0 WHERE estoque_id = ? AND usuario_id = ?', [req.params.id, req.user.id]);
        await connection.commit();
        res.json({ message: 'Item reservado com sucesso.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(error.status || 500).json({ message: error.status ? error.message : 'Erro ao reservar item.' });
    } finally {
        if (connection) connection.release();
    }
};

const releaseReservation = async (req, res) => {
    try {
        const [result] = await db.query("UPDATE estoque SET status = 'disponivel', reservado_ate = NULL, reserva_observacao = NULL WHERE id = ? AND usuario_id = ? AND status = 'reservado'", [req.params.id, req.user.id]);
        if (!result.affectedRows) return res.status(409).json({ message: 'O item nao possui reserva ativa.' });
        res.json({ message: 'Reserva liberada com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao liberar reserva.' });
    }
};

const deleteStockItem = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [items] = await connection.query('SELECT status FROM estoque WHERE id = ? AND usuario_id = ? FOR UPDATE', [req.params.id, req.user.id]);
        if (!items.length) throw Object.assign(new Error('Item nao encontrado.'), { status: 404 });
        if (items[0].status === 'vendido') throw Object.assign(new Error('Itens vendidos nao podem ser excluidos; cancele a venda primeiro.'), { status: 409 });
        await connection.query("DELETE FROM estoque WHERE id = ? AND usuario_id = ? AND status <> 'vendido'", [req.params.id, req.user.id]);
        await connection.commit();
        res.json({ message: 'Item removido do estoque.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(error.status || 500).json({ message: error.status ? error.message : 'Erro ao remover item.' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { getStock, addStockBatch, sellItem, cancelSale, reserveItem, releaseReservation, deleteStockItem, validateStockInput, MAX_QUANTIDADE, MAX_MONEY };
