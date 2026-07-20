const jwt = require('jsonwebtoken');
const db = require('../db');

const ACTIVITY_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

const createAuthMiddlewares = ({ database = db, jwtLibrary = jwt, getSecret = () => process.env.JWT_SECRET } = {}) => {
    const authenticate = async (req, res, next) => {
        const rawToken = req.cookies?.token || req.headers.authorization;
        if (!rawToken || typeof rawToken !== 'string') {
            return res.status(401).json({ message: 'Autenticação necessária.' });
        }

        try {
            const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
            const decoded = jwtLibrary.verify(token, getSecret());
            const [users] = await database.query(
                `SELECT id, nome, usuario, email, nome_loja, admin, token_version, ultima_atividade_em
                 FROM usuarios WHERE id = ?`,
                [decoded.id]
            );
            const user = users[0];
            if (!user || Number(decoded.tv ?? 0) !== Number(user.token_version || 0)) {
                return res.status(401).json({ message: 'Sessão inválida ou expirada.' });
            }

            req.user = {
                id: user.id,
                nome: user.nome,
                usuario: user.usuario,
                email: user.email || '',
                nomeLoja: user.nome_loja || '',
                admin: Boolean(user.admin)
            };

            const lastActivity = user.ultima_atividade_em ? new Date(user.ultima_atividade_em).getTime() : 0;
            if (Date.now() - lastActivity >= ACTIVITY_UPDATE_INTERVAL_MS) {
                await database.query(
                    `UPDATE usuarios SET ultima_atividade_em = UTC_TIMESTAMP()
                     WHERE id = ? AND (ultima_atividade_em IS NULL OR ultima_atividade_em < UTC_TIMESTAMP() - INTERVAL 5 MINUTE)`,
                    [user.id]
                );
            }
            return next();
        } catch {
            return res.status(401).json({ message: 'Sessão inválida ou expirada.' });
        }
    };

    const authorize = (shouldBeAdmin) => (req, res, next) => authenticate(req, res, () => {
        if (req.user.admin !== shouldBeAdmin) {
            return res.status(403).json({ message: 'Acesso não autorizado.' });
        }
        return next();
    });

    return {
        authenticate,
        memberOnly: authorize(false),
        adminOnly: authorize(true)
    };
};

const middlewares = createAuthMiddlewares();

// O export padrão protege o aplicativo comum e recusa contas administrativas.
module.exports = middlewares.memberOnly;
module.exports.authenticate = middlewares.authenticate;
module.exports.adminOnly = middlewares.adminOnly;
module.exports.createAuthMiddlewares = createAuthMiddlewares;
