const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const register = async (req, res) => {
    try {
        const { nome, usuario, senha } = req.body;

        if (!nome || !usuario || !senha) {
            return res.status(400).json({ message: 'Preencha todos os campos.' });
        }

        // Verifica se usuário já existe
        const [existing] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Usuário já cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);
        const id = uuidv4();

        await db.query(
            'INSERT INTO usuarios (id, nome, usuario, senha) VALUES (?, ?, ?, ?)',
            [id, nome, usuario, hashedPassword]
        );

        res.status(201).json({ message: 'Usuário criado com sucesso!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

const login = async (req, res) => {
    try {
        const { usuario, senha } = req.body;

        const [users] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }

        const user = users[0];
        const match = await bcrypt.compare(senha, user.senha);

        if (!match) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }

        const token = jwt.sign(
            { id: user.id, nome: user.nome },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 dia
        });

        res.json({
            user: {
                id: user.id,
                nome: user.nome,
                usuario: user.usuario
            },
            token // para uso via Authorization header em CI/CD e testes de API
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

const verifySession = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Não autenticado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar dados atualizados do usuário (opcional, mas recomendado)
        const [users] = await db.query('SELECT id, nome, usuario FROM usuarios WHERE id = ?', [decoded.id]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Usuário não encontrado' });
        }

        res.json({ user: users[0] });

    } catch (error) {
        return res.status(401).json({ message: 'Sessão inválida ou expirada.' });
    }
};

const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.json({ message: 'Logout realizado com sucesso' });
};

module.exports = { register, login, verifySession, logout };
