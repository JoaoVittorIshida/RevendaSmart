const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const db = require('./db');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cookieParser());

const allowedOrigins = new Set([
    process.env.FRONTEND_URL,
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://localhost:4173'] : [])
].filter(Boolean));
app.use(cors({
    origin(origin, callback) {
        // Requests without Origin are non-browser clients such as health checks and CLI.
        // Browser origins must be explicitly allowed; never trust every localhost port.
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error('Bloqueado pelo CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '1mb' }));
app.use(require('./middleware/csrfMiddleware'));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/produtos', require('./routes/productsRoutes'));
app.use('/api/estoque', require('./routes/stockRoutes'));
app.use('/api/dados', require('./routes/dataRoutes'));
app.use('/api/vendas', require('./routes/salesRoutes'));
app.use('/api/anuncios', require('./routes/adsRoutes'));
app.use('/api/vitrine', require('./routes/publicShowcaseRoutes'));
app.use('/api/portabilidade', require('./routes/portabilityRoutes'));
app.use('/api/analises', require('./routes/analyticsRoutes'));

app.get('/', (req, res) => res.json({ message: 'API RevendaSmart Online' }));
const checkHealth = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({ status: 'online', api: 'online', database: 'online', test_query: rows[0].result, checked_at: new Date().toISOString() });
    } catch {
        res.status(503).json({ status: 'offline', api: 'online', database: 'offline', message: 'Banco de dados indisponível.', checked_at: new Date().toISOString() });
    }
};
app.get('/api/health', checkHealth);
app.get('/api/status', checkHealth);

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error?.type === 'entity.too.large') return res.status(413).json({ message: 'Requisicao excede o limite permitido.' });
    if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ message: 'JSON invalido.' });
    console.error(error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
