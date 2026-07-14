const jwt = require('jsonwebtoken');
const db = require('../db');

const verifyToken = async (req, res, next) => {
    // Tenta pegar do cookie primeiro, depois do header antigo (fallback)
    const token = req.cookies?.token || req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Token de autenticação não fornecido.' });
    }

    try {
        // Remove 'Bearer ' prefixo se existir
        const tokenReal = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

        const decoded = jwt.verify(tokenReal, process.env.JWT_SECRET);
        const [users] = await db.query('SELECT id, token_version FROM usuarios WHERE id = ?', [decoded.id]);
        if (!users.length || Number(decoded.tv ?? 0) !== Number(users[0].token_version || 0)) {
            return res.status(401).json({ message: 'Token invÃ¡lido ou expirado.' });
        }
        req.user = decoded; // { id, nome, iat, exp }
        next();
    } catch {
        return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};

module.exports = verifyToken;
