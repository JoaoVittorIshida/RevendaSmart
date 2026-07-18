const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const normalizeStoreName = (value) => String(value ?? '').trim();
const normalizeName = (value) => String(value ?? '').trim();
const normalizeUsername = (value) => String(value ?? '').trim();
const userDto = (user) => ({ id: user.id, nome: user.nome, usuario: user.usuario, nomeLoja: user.nome_loja || '' });
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;

const validatePassword = (value) => {
    const password = String(value ?? '');
    if (password.length < MIN_PASSWORD_LENGTH || Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
        return `A senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres e no mÃ¡ximo ${MAX_PASSWORD_BYTES} bytes.`;
    }
    return null;
};

const tokenCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});

const register = async (req, res) => {
    try {
        const nome = normalizeName(req.body.nome);
        const usuario = normalizeUsername(req.body.usuario);
        const senha = String(req.body.senha ?? '');
        const nomeLoja = normalizeStoreName(req.body.nomeLoja);

        if (!nome || !usuario || !senha) {
            return res.status(400).json({ message: 'Preencha todos os campos.' });
        }
        if (nomeLoja.length > 100) return res.status(400).json({ message: 'O nome da loja pode ter no máximo 100 caracteres.' });

        // Verifica se usuário já existe
        if (nome.length > 255 || usuario.length > 100) return res.status(400).json({ message: 'Nome ou usuÃ¡rio excede o limite permitido.' });
        const passwordError = validatePassword(senha);
        if (passwordError) return res.status(400).json({ message: passwordError });

        const [existing] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Usuário já cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);
        const id = randomUUID();

        await db.query(
            'INSERT INTO usuarios (id, nome, usuario, senha, nome_loja) VALUES (?, ?, ?, ?, ?)',
            [id, nome, usuario, hashedPassword, nomeLoja || null]
        );

        res.status(201).json({ message: 'Usuário criado com sucesso!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

const login = async (req, res) => {
    try {
        const usuario = normalizeUsername(req.body.usuario);
        const senha = String(req.body.senha ?? '');

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
            { id: user.id, nome: user.nome, tv: Number(user.token_version || 0) },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, { ...tokenCookieOptions(), maxAge: 24 * 60 * 60 * 1000 });

        res.json({ user: userDto(user) });

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
        const [users] = await db.query('SELECT id, nome, usuario, nome_loja, token_version FROM usuarios WHERE id = ?', [decoded.id]);

        if (users.length === 0 || Number(decoded.tv ?? 0) !== Number(users[0].token_version || 0)) {
            return res.status(401).json({ message: 'Usuário não encontrado' });
        }

        res.json({ user: userDto(users[0]) });

    } catch {
        return res.status(401).json({ message: 'Sessão inválida ou expirada.' });
    }
};

const logout = (req, res) => {
    res.clearCookie('token', tokenCookieOptions());
    res.json({ message: 'Logout realizado com sucesso' });
};

const updateAccount = async (req, res) => {
    let connection;
    try {
        const nome = normalizeName(req.body.nome);
        const nomeLoja = normalizeStoreName(req.body.nomeLoja);
        if (!nome || nome.length > 255) return res.status(400).json({ message: 'Informe um nome completo de até 255 caracteres.' });
        if (nomeLoja.length > 100) return res.status(400).json({ message: 'O nome da loja pode ter no máximo 100 caracteres.' });
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [accounts] = await connection.query('SELECT id FROM usuarios WHERE id = ? FOR UPDATE', [req.user.id]);
        if (!accounts.length) throw Object.assign(new Error('Usuário não encontrado.'), { status: 404 });
        const [showcases] = await connection.query('SELECT publicada FROM vitrine_configuracoes WHERE usuario_id = ? FOR UPDATE', [req.user.id]);
        if (!nomeLoja && showcases[0]?.publicada) {
            throw Object.assign(new Error('Despublique a Vitrine antes de apagar o nome da loja.'), { status: 409 });
        }
        const [result] = await connection.query('UPDATE usuarios SET nome = ?, nome_loja = ? WHERE id = ?', [nome, nomeLoja || null, req.user.id]);
        if (!result.affectedRows) throw Object.assign(new Error('Usuário não encontrado.'), { status: 404 });
        const [users] = await connection.query('SELECT id, nome, usuario, nome_loja FROM usuarios WHERE id = ?', [req.user.id]);
        await connection.commit();
        res.json({ user: userDto(users[0]) });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(error.status || 500).json({ message: error.status ? error.message : 'Não foi possível atualizar os dados da conta.' });
    } finally {
        if (connection) connection.release();
    }
};

const changePassword = async (req, res) => {
    try {
        const senhaAtual = String(req.body.senhaAtual ?? '');
        const novaSenha = String(req.body.novaSenha ?? '');
        const confirmarNovaSenha = String(req.body.confirmarNovaSenha ?? '');
        if (!senhaAtual || !novaSenha || !confirmarNovaSenha) return res.status(400).json({ message: 'Preencha todos os campos de senha.' });
        const passwordError = validatePassword(novaSenha);
        if (passwordError) return res.status(400).json({ message: passwordError });
        if (novaSenha !== confirmarNovaSenha) return res.status(400).json({ message: 'A confirmação da nova senha não confere.' });

        const [users] = await db.query('SELECT id, senha FROM usuarios WHERE id = ?', [req.user.id]);
        if (!users.length) return res.status(404).json({ message: 'Usuário não encontrado.' });
        const matches = await bcrypt.compare(senhaAtual, users[0].senha);
        if (!matches) return res.status(400).json({ message: 'A senha atual está incorreta.' });

        const hash = await bcrypt.hash(novaSenha, 10);
        await db.query('UPDATE usuarios SET senha = ?, token_version = token_version + 1 WHERE id = ?', [hash, req.user.id]);
        res.clearCookie('token', tokenCookieOptions());
        res.json({ message: 'Senha atualizada com sucesso. Entre novamente para continuar.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Não foi possível atualizar a senha.' });
    }
};

module.exports = { register, login, verifySession, logout, updateAccount, changePassword, validatePassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_BYTES };
