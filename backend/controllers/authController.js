const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const { validatePassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_BYTES } = require('../utils/passwordPolicy');

const normalizeStoreName = (value) => String(value ?? '').trim();
const normalizeName = (value) => String(value ?? '').trim();
const normalizeUsername = (value) => String(value ?? '').trim();
const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();
const isValidEmail = (value) => value.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const normalizeProfilePhoto = (value) => String(value ?? '').trim();
const MAX_PROFILE_PHOTO_LENGTH = 900000;
const isValidProfilePhoto = (value) => !value || /^data:image\/(png|jpe?g|webp);base64,/i.test(value);
const userDto = (user) => ({
    id: user.id,
    nome: user.nome,
    usuario: user.usuario,
    email: user.email || '',
    nomeLoja: user.nome_loja || '',
    fotoPerfil: user.foto_perfil || '',
    admin: Boolean(user.admin)
});

const tokenCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});

const register = async (req, res) => {
    try {
        const nome = normalizeName(req.body.nome);
        const usuario = normalizeUsername(req.body.usuario);
        const email = normalizeEmail(req.body.email);
        const senha = String(req.body.senha ?? '');
        const nomeLoja = normalizeStoreName(req.body.nomeLoja);

        if (!nome || !usuario || !email || !senha) {
            return res.status(400).json({ message: 'Preencha todos os campos.' });
        }
        if (!isValidEmail(email)) return res.status(400).json({ message: 'Informe um e-mail válido.' });
        if (nomeLoja.length > 100) return res.status(400).json({ message: 'O nome da loja pode ter no máximo 100 caracteres.' });
        if (nome.length > 255 || usuario.length > 100) return res.status(400).json({ message: 'Nome ou usuário excede o limite permitido.' });
        const passwordError = validatePassword(senha);
        if (passwordError) return res.status(400).json({ message: passwordError });

        const [existing] = await db.query('SELECT id FROM usuarios WHERE usuario = ? OR email = ? LIMIT 1', [usuario, email]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Usuário ou e-mail já cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);
        const id = randomUUID();

        await db.query(
            'INSERT INTO usuarios (id, nome, usuario, email, senha, nome_loja, admin) VALUES (?, ?, ?, ?, ?, ?, 0)',
            [id, nome, usuario, email, hashedPassword, nomeLoja || null]
        );

        return res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Usuário ou e-mail já cadastrado.' });
        return res.status(500).json({ message: 'Erro no servidor' });
    }
};

const login = async (req, res) => {
    try {
        const usuario = normalizeUsername(req.body.usuario);
        const senha = String(req.body.senha ?? '');
        const [users] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);

        if (users.length === 0) return res.status(401).json({ message: 'Usuário ou senha inválidos.' });

        const user = users[0];
        const match = await bcrypt.compare(senha, user.senha);
        if (!match) return res.status(401).json({ message: 'Usuário ou senha inválidos.' });

        const token = jwt.sign(
            { id: user.id, nome: user.nome, tv: Number(user.token_version || 0) },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        await db.query('UPDATE usuarios SET ultima_atividade_em = UTC_TIMESTAMP() WHERE id = ?', [user.id]);
        res.cookie('token', token, { ...tokenCookieOptions(), maxAge: 24 * 60 * 60 * 1000 });
        return res.json({ user: userDto(user) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro no servidor' });
    }
};

const verifySession = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'Não autenticado' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await db.query(
            'SELECT id, nome, usuario, email, nome_loja, foto_perfil, admin, token_version FROM usuarios WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0 || Number(decoded.tv ?? 0) !== Number(users[0].token_version || 0)) {
            return res.status(401).json({ message: 'Usuário não encontrado' });
        }

        await db.query(
            `UPDATE usuarios SET ultima_atividade_em = UTC_TIMESTAMP()
             WHERE id = ? AND (ultima_atividade_em IS NULL OR ultima_atividade_em < UTC_TIMESTAMP() - INTERVAL 5 MINUTE)`,
            [decoded.id]
        );
        return res.json({ user: userDto(users[0]) });
    } catch {
        return res.status(401).json({ message: 'Sessão inválida ou expirada.' });
    }
};

const logout = (req, res) => {
    res.clearCookie('token', tokenCookieOptions());
    return res.json({ message: 'Logout realizado com sucesso' });
};

const updateAccount = async (req, res) => {
    let connection;
    try {
        const nome = normalizeName(req.body.nome);
        const nomeLoja = normalizeStoreName(req.body.nomeLoja);
        const fotoPerfil = normalizeProfilePhoto(req.body.fotoPerfil);
        if (!nome || nome.length > 255) return res.status(400).json({ message: 'Informe um nome completo de até 255 caracteres.' });
        if (nomeLoja.length > 100) return res.status(400).json({ message: 'O nome da loja pode ter no máximo 100 caracteres.' });
        if (fotoPerfil.length > MAX_PROFILE_PHOTO_LENGTH || !isValidProfilePhoto(fotoPerfil)) return res.status(400).json({ message: 'A foto de perfil deve ser PNG, JPG ou WEBP e respeitar o limite permitido.' });

        connection = await db.getConnection();
        await connection.beginTransaction();
        const [accounts] = await connection.query('SELECT id FROM usuarios WHERE id = ? FOR UPDATE', [req.user.id]);
        if (!accounts.length) throw Object.assign(new Error('Usuário não encontrado.'), { status: 404 });
        const [showcases] = await connection.query('SELECT publicada FROM vitrine_configuracoes WHERE usuario_id = ? FOR UPDATE', [req.user.id]);
        if (!nomeLoja && showcases[0]?.publicada) {
            throw Object.assign(new Error('Despublique a Vitrine antes de apagar o nome da loja.'), { status: 409 });
        }
        const [result] = await connection.query('UPDATE usuarios SET nome = ?, nome_loja = ?, foto_perfil = ? WHERE id = ?', [nome, nomeLoja || null, fotoPerfil || null, req.user.id]);
        if (!result.affectedRows) throw Object.assign(new Error('Usuário não encontrado.'), { status: 404 });
        const [users] = await connection.query('SELECT id, nome, usuario, email, nome_loja, foto_perfil, admin FROM usuarios WHERE id = ?', [req.user.id]);
        await connection.commit();
        return res.json({ user: userDto(users[0]) });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        return res.status(error.status || 500).json({ message: error.status ? error.message : 'Não foi possível atualizar os dados da conta.' });
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
        return res.json({ message: 'Senha atualizada com sucesso. Entre novamente para continuar.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Não foi possível atualizar a senha.' });
    }
};

module.exports = {
    register,
    login,
    verifySession,
    logout,
    updateAccount,
    changePassword,
    validatePassword,
    MIN_PASSWORD_LENGTH,
    MAX_PASSWORD_BYTES
};
