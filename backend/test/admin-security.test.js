const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

// Evita abrir uma conexão real apenas para testar a fábrica de middlewares.
const dbPath = require.resolve('../db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: {} };
const { createAuthMiddlewares } = require('../middleware/authMiddleware');

const root = path.join(__dirname, '..', '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const createResponse = () => ({
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
});

const createDatabase = (user) => ({
    async query(sql) {
        if (/^\s*SELECT/.test(sql)) return [[user]];
        return [{ affectedRows: 1 }];
    }
});

const runMiddleware = async (middleware, user, decoded = { id: 'user-1', tv: 2 }) => {
    const jwtLibrary = { verify: () => decoded };
    const database = createDatabase(user);
    const middlewares = createAuthMiddlewares({ database, jwtLibrary, getSecret: () => 'test-secret' });
    const req = { cookies: { token: 'signed-token' }, headers: {} };
    const res = createResponse();
    let reachedController = false;
    await middlewares[middleware](req, res, () => { reachedController = true; });
    return { req, res, reachedController };
};

const baseUser = {
    id: 'user-1',
    nome: 'Cliente',
    usuario: 'cliente',
    email: 'cliente@example.com',
    nome_loja: 'Loja',
    token_version: 2,
    ultima_atividade_em: new Date(),
    admin: 0
};

test('middleware decide o papel pelo banco e separa admin de cliente nos dois sentidos', async () => {
    const memberOnAdmin = await runMiddleware('adminOnly', baseUser, { id: 'user-1', tv: 2, admin: true });
    assert.equal(memberOnAdmin.res.statusCode, 403);
    assert.equal(memberOnAdmin.reachedController, false);

    const adminOnMember = await runMiddleware('memberOnly', { ...baseUser, admin: 1 });
    assert.equal(adminOnMember.res.statusCode, 403);
    assert.equal(adminOnMember.reachedController, false);

    const adminOnAdmin = await runMiddleware('adminOnly', { ...baseUser, admin: 1 });
    assert.equal(adminOnAdmin.reachedController, true);
    assert.equal(adminOnAdmin.req.user.admin, true);

    const memberOnMember = await runMiddleware('memberOnly', baseUser);
    assert.equal(memberOnMember.reachedController, true);
    assert.equal(memberOnMember.req.user.admin, false);
});

test('middleware recusa ausência de autenticação e token_version revogado', async () => {
    const middlewares = createAuthMiddlewares({
        database: createDatabase(baseUser),
        jwtLibrary: { verify: () => ({ id: 'user-1', tv: 1 }) },
        getSecret: () => 'test-secret'
    });

    const missingResponse = createResponse();
    await middlewares.adminOnly({ cookies: {}, headers: {} }, missingResponse, () => assert.fail('não deve autorizar'));
    assert.equal(missingResponse.statusCode, 401);

    const revokedResponse = createResponse();
    await middlewares.adminOnly({ cookies: { token: 'old-token' }, headers: {} }, revokedResponse, () => assert.fail('não deve autorizar'));
    assert.equal(revokedResponse.statusCode, 401);
});

test('contratos administrativos não aceitam elevação no cadastro nem expõem segredo na listagem', () => {
    const auth = read('backend', 'controllers', 'authController.js');
    const admin = read('backend', 'controllers', 'adminController.js');
    const routes = read('backend', 'routes', 'adminRoutes.js');
    const dataContext = read('src', 'contexts', 'DataContext.jsx');

    assert.match(auth, /INSERT INTO usuarios .* admin\) VALUES .* 0\)/);
    assert.match(auth, /admin: Boolean\(user\.admin\)/);
    assert.doesNotMatch(auth.match(/const userDto[\s\S]*?\n\}\);/)[0], /senha|token_version/);
    assert.match(admin, /WHERE u\.admin = 0/);
    assert.match(admin, /token_version = token_version \+ 1/);
    assert.match(admin, /senha_redefinida/);
    assert.match(admin, /bcrypt\.compare\(adminPassword/);
    assert.match(routes, /router\.use\(adminOnly\)/);
    assert.match(routes, /Cache-Control', 'no-store/);
    assert.match(dataContext, /!usuario \|\| usuario\.admin/);
});
