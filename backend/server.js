const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();

// Middlewares
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*', // Em produção, defina a variável FRONTEND_URL
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const productsRoutes = require('./routes/productsRoutes');
const stockRoutes = require('./routes/stockRoutes');
const dataRoutes = require('./routes/dataRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/produtos', productsRoutes);
app.use('/api/estoque', stockRoutes);
app.use('/api/dados', dataRoutes);

// Rota de Teste
app.get('/', (req, res) => {
    res.json({ message: 'API RevendaSmart Online 🚀' });
});

// Rota de verificação de conexão com banco
app.get('/api/status', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({
            status: 'online',
            database: 'conectado',
            test_query: rows[0].result
        });
    } catch (error) {
        res.status(500).json({
            status: 'erro',
            database: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
