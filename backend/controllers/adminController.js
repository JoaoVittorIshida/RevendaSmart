const bcrypt = require('bcrypt');
const db = require('../db');
const { validatePassword } = require('../utils/passwordPolicy');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const toInteger = (value) => Number.parseInt(value, 10) || 0;
const toMoney = (value) => Number(value) || 0;

const getSummary = async (req, res) => {
    try {
        const [[row]] = await db.query(`
            SELECT
              (SELECT COUNT(*) FROM usuarios WHERE admin = 0) AS usuarios,
              (SELECT COUNT(*) FROM usuarios WHERE admin = 0 AND criado_em >= UTC_TIMESTAMP() - INTERVAL 30 DAY) AS novos_30_dias,
              (SELECT COUNT(*) FROM usuarios WHERE admin = 0 AND COALESCE(ultima_atividade_em, criado_em) >= UTC_TIMESTAMP() - INTERVAL 30 DAY) AS ativos_30_dias,
              (SELECT COUNT(*) FROM produtos p INNER JOIN usuarios u ON u.id = p.usuario_id AND u.admin = 0) AS produtos,
              (SELECT COUNT(*) FROM vendas v INNER JOIN usuarios u ON u.id = v.usuario_id AND u.admin = 0 WHERE v.status = 'concluida') AS vendas,
              (SELECT COUNT(*) FROM estoque e INNER JOIN usuarios u ON u.id = e.usuario_id AND u.admin = 0 WHERE e.status IN ('disponivel', 'reservado')) AS estoque_ativo,
              (SELECT COALESCE(SUM(v.valor_liquido), 0) FROM vendas v INNER JOIN usuarios u ON u.id = v.usuario_id AND u.admin = 0 WHERE v.status = 'concluida') AS receita_liquida
        `);

        return res.json({
            usuarios: toInteger(row.usuarios),
            novos30Dias: toInteger(row.novos_30_dias),
            ativos30Dias: toInteger(row.ativos_30_dias),
            produtos: toInteger(row.produtos),
            vendas: toInteger(row.vendas),
            estoqueAtivo: toInteger(row.estoque_ativo),
            receitaLiquida: toMoney(row.receita_liquida)
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Não foi possível carregar as métricas administrativas.' });
    }
};

const getUsers = async (req, res) => {
    try {
        const requestedPage = Number.parseInt(req.query.page, 10);
        const requestedLimit = Number.parseInt(req.query.limit, 10);
        const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
        const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 50) : 20;
        const search = String(req.query.busca ?? '').trim().slice(0, 100);
        const searchClause = search
            ? ` AND (u.nome LIKE ? OR u.usuario LIKE ? OR u.email LIKE ? OR u.nome_loja LIKE ?)`
            : '';
        const searchParams = search ? Array(4).fill(`%${search}%`) : [];

        const [countResult, usersResult] = await Promise.all([
            db.query(`SELECT COUNT(*) AS total FROM usuarios u WHERE u.admin = 0${searchClause}`, searchParams),
            db.query(`
                SELECT
                  u.id, u.nome, u.usuario, u.email, u.nome_loja, u.criado_em, u.ultima_atividade_em,
                  COALESCE(p.total_produtos, 0) AS total_produtos,
                  COALESCE(e.estoque_ativo, 0) AS estoque_ativo,
                  COALESCE(v.total_vendas, 0) AS total_vendas,
                  COALESCE(v.receita_liquida, 0) AS receita_liquida
                FROM usuarios u
                LEFT JOIN (
                  SELECT usuario_id, COUNT(*) AS total_produtos
                  FROM produtos GROUP BY usuario_id
                ) p ON p.usuario_id = u.id
                LEFT JOIN (
                  SELECT usuario_id, SUM(status IN ('disponivel', 'reservado')) AS estoque_ativo
                  FROM estoque GROUP BY usuario_id
                ) e ON e.usuario_id = u.id
                LEFT JOIN (
                  SELECT usuario_id, COUNT(*) AS total_vendas, COALESCE(SUM(valor_liquido), 0) AS receita_liquida
                  FROM vendas WHERE status = 'concluida' GROUP BY usuario_id
                ) v ON v.usuario_id = u.id
                WHERE u.admin = 0${searchClause}
                ORDER BY COALESCE(u.ultima_atividade_em, u.criado_em) DESC, u.id
                LIMIT ? OFFSET ?
            `, [...searchParams, limit, (page - 1) * limit])
        ]);

        const countRow = countResult[0][0];
        const rows = usersResult[0];
        const total = toInteger(countRow.total);
        return res.json({
            usuarios: rows.map((user) => ({
                id: user.id,
                nome: user.nome,
                usuario: user.usuario,
                email: user.email || '',
                nomeLoja: user.nome_loja || '',
                criadoEm: user.criado_em,
                ultimaAtividadeEm: user.ultima_atividade_em || user.criado_em,
                produtos: toInteger(user.total_produtos),
                estoqueAtivo: toInteger(user.estoque_ativo),
                vendas: toInteger(user.total_vendas),
                receitaLiquida: toMoney(user.receita_liquida)
            })),
            paginacao: {
                pagina: page,
                limite: limit,
                total,
                totalPaginas: Math.max(1, Math.ceil(total / limit))
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Não foi possível carregar os usuários.' });
    }
};

const resetUserPassword = async (req, res) => {
    let connection;
    try {
        const targetId = String(req.params.id || '');
        const adminPassword = String(req.body.senhaAdmin ?? '');
        const newPassword = String(req.body.novaSenha ?? '');
        const confirmation = String(req.body.confirmarNovaSenha ?? '');

        if (!UUID_PATTERN.test(targetId)) return res.status(400).json({ message: 'Usuário inválido.' });
        if (!adminPassword || !newPassword || !confirmation) return res.status(400).json({ message: 'Preencha todos os campos de senha.' });
        const passwordError = validatePassword(newPassword);
        if (passwordError) return res.status(400).json({ message: passwordError });
        if (newPassword !== confirmation) return res.status(400).json({ message: 'A confirmação da nova senha não confere.' });

        const [admins] = await db.query('SELECT senha FROM usuarios WHERE id = ? AND admin = 1', [req.user.id]);
        if (!admins.length || !(await bcrypt.compare(adminPassword, admins[0].senha))) {
            return res.status(400).json({ message: 'A senha do administrador está incorreta.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [actors] = await connection.query('SELECT id FROM usuarios WHERE id = ? AND admin = 1 FOR UPDATE', [req.user.id]);
        if (!actors.length) throw Object.assign(new Error('Acesso não autorizado.'), { status: 403 });
        const [targets] = await connection.query('SELECT id FROM usuarios WHERE id = ? AND admin = 0 FOR UPDATE', [targetId]);
        if (!targets.length) throw Object.assign(new Error('Usuário não encontrado.'), { status: 404 });

        await connection.query(
            'UPDATE usuarios SET senha = ?, token_version = token_version + 1 WHERE id = ? AND admin = 0',
            [passwordHash, targetId]
        );
        await connection.query(
            "INSERT INTO admin_audit_logs (admin_id, usuario_alvo_id, acao) VALUES (?, ?, 'senha_redefinida')",
            [req.user.id, targetId]
        );
        await connection.commit();

        return res.json({ message: 'Senha redefinida. As sessões anteriores do usuário foram encerradas.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        return res.status(error.status || 500).json({
            message: error.status ? error.message : 'Não foi possível redefinir a senha.'
        });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { getSummary, getUsers, resetUserPassword };
