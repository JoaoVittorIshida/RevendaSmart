const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Token de autenticação não fornecido.' });
    }

    try {
        // Remove 'Bearer ' prefixo se existir
        const tokenReal = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

        const decoded = jwt.verify(tokenReal, process.env.JWT_SECRET);
        req.user = decoded; // { id, nome, iat, exp }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};

module.exports = verifyToken;
