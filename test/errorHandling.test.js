const assert = require('node:assert/strict');
const test = require('node:test');
const { Administrador } = require('../src/models');
const authController = require('../src/controllers/authController');
const authMiddleware = require('../src/middlewares/authMiddleware');
const errorMiddleware = require('../src/middlewares/errorMiddleware');
const argon2 = require('argon2');

const originalFindOne = Administrador.findOne;
const originalVerify = argon2.verify;

test.afterEach(() => {
    Administrador.findOne = originalFindOne;
    argon2.verify = originalVerify;
});

function makeResponse(acceptsHtml = true) {
    return {
        locals: {},
        statusCode: 200,
        status(code) {
            this.statusCode = code;
            return this;
        },
        render(view, data) {
            this.view = view;
            this.data = data;
            return this;
        },
        json(data) {
            this.data = data;
            return this;
        },
        clearCookie(name, options) {
            this.clearedCookie = { name, options };
            return this;
        },
        redirect(location) {
            this.location = location;
            return this;
        },
    };
}

function makeRequest(acceptsHtml = true, session = {}) {
    return {
        session,
        accepts: (type) => (type === 'html' ? acceptsHtml : !acceptsHtml),
    };
}

test('renderiza 404 sem revelar detalhes internos da rota', () => {
    const res = makeResponse();
    let routeError;

    errorMiddleware.notFoundHandler({}, res, (error) => { routeError = error; });
    errorMiddleware.errorHandler(routeError, makeRequest(), res, () => {});

    assert.equal(res.statusCode, 404);
    assert.equal(res.view, 'errors/status');
    assert.equal(res.data.title, 'Página não encontrada');
    assert.equal(res.data.message, 'A página solicitada não existe.');
});

test('retorna erro 500 genérico sem expor a mensagem da exceção', () => {
    const res = makeResponse();
    const internalError = new Error('mysql://private-host/password');
    const originalConsoleError = console.error;

    console.error = () => {};
    try {
        errorMiddleware.errorHandler(internalError, makeRequest(), res, () => {});
    } finally {
        console.error = originalConsoleError;
    }

    assert.equal(res.statusCode, 500);
    assert.equal(res.view, 'errors/status');
    assert.doesNotMatch(res.data.message, /private-host|password/);
});

test('responde JSON seguro quando o cliente não aceita HTML', () => {
    const res = makeResponse(false);
    const originalConsoleError = console.error;

    console.error = () => {};
    try {
        errorMiddleware.errorHandler(new Error('SQL details'), makeRequest(false), res, () => {});
    } finally {
        console.error = originalConsoleError;
    }

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.data, { error: 'Ocorreu um erro inesperado. Tente novamente mais tarde.' });
});

test('redireciona sessão ausente e recusa sessão sem papel de administrador', () => {
    const anonymousResponse = makeResponse();
    authMiddleware.ensureAuthenticated(makeRequest(true), anonymousResponse, () => {});
    assert.equal(anonymousResponse.location, '/login');

    let forbiddenError;
    authMiddleware.ensureAuthenticated(
        makeRequest(true, { user: { role: 'user' } }),
        makeResponse(),
        (error) => { forbiddenError = error; },
    );
    assert.equal(forbiddenError.status, 403);
});

test('exibe mensagem própria para credenciais inválidas', async () => {
    Administrador.findOne = async () => null;
    const res = makeResponse();

    await authController.login({ body: { nomeUsuario: 'invalido', senha: 'senha' } }, res, (error) => {
        throw error;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.view, 'login');
    assert.equal(res.data.error, 'Usuário ou senha inválidos.');
});

test('faz login válido regenerando e salvando a sessão', async () => {
    let lookedUp;
    let verified;
    let regenerated = false;
    let saved = false;
    Administrador.findOne = async (options) => {
        lookedUp = options.where.nomeUsuario;
        return { idAdministrador: 4, nomeUsuario: 'admin', senhaHash: 'hash' };
    };
    argon2.verify = async (hash, password) => {
        verified = [hash, password];
        return true;
    };
    const req = {
        body: { nomeUsuario: ' admin ', senha: 'senha-segura' },
        session: {
            regenerate(callback) {
                regenerated = true;
                callback(null);
            },
            save(callback) {
                saved = true;
                callback(null);
            },
        },
    };
    const res = makeResponse();

    await authController.login(req, res, (error) => { throw error; });

    assert.equal(lookedUp, 'admin');
    assert.deepEqual(verified, ['hash', 'senha-segura']);
    assert.equal(regenerated, true);
    assert.equal(saved, true);
    assert.deepEqual(req.session.user, { id: 4, username: 'admin', role: 'admin' });
    assert.equal(res.location, '/dashboard');
});

test('faz logout encerrando sessão e limpando cookie', () => {
    let destroyed = false;
    const req = { session: { destroy(callback) { destroyed = true; callback(null); } } };
    const res = makeResponse();

    authController.logout(req, res, (error) => { throw error; });

    assert.equal(destroyed, true);
    assert.equal(res.clearedCookie.name, 'connect.sid');
    assert.equal(res.clearedCookie.options.httpOnly, true);
    assert.equal(res.location, '/login');
});