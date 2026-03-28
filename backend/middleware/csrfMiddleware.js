const csrfGuard = (req, res, next) => {
    // Em desenvolvimento, sem restrição — CSRF é um problema de produção
    if (process.env.NODE_ENV !== 'production') return next();

    // Métodos que não modificam estado não precisam de proteção
    if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) return next();

    // Sem cookie = request programático (CI/CD, Authorization header)
    // Não há risco de CSRF — o browser não injetou o cookie automaticamente
    if (!req.cookies?.token) return next();

    // Com cookie = fluxo de browser — validar Origin
    const origin = req.headers.origin;
    if (!origin || origin !== process.env.FRONTEND_URL) {
        return res.status(403).json({ message: 'Requisição inválida.' });
    }

    next();
};

module.exports = csrfGuard;
