const assert = require('node:assert/strict');
const test = require('node:test');
process.env.NODE_ENV = 'test';

const User = require('../src/models/userModel');
const Categoria = require('../src/models/categoriaModel');
const userController = require('../src/controllers/userController');
const categoriaController = require('../src/controllers/categoriaController');

const originalUserMethods = {};
const originalCategoriaMethods = {};
const userMethodNames = ['create', 'getAll', 'findById', 'delete'];
const categoriaMethodNames = ['create', 'findById', 'update', 'delete'];

test.beforeEach(() => {
    userMethodNames.forEach((method) => { originalUserMethods[method] = User[method]; });
    categoriaMethodNames.forEach((method) => { originalCategoriaMethods[method] = Categoria[method]; });
});

test.afterEach(() => {
    userMethodNames.forEach((method) => { User[method] = originalUserMethods[method]; });
    categoriaMethodNames.forEach((method) => { Categoria[method] = originalCategoriaMethods[method]; });
});

function makeResponse() {
    return {
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
        redirect(location) {
            this.location = location;
            return this;
        },
    };
}

test('não expõe erro do banco ao carregar usuários', () => {
    User.getAll = (callback) => callback(new Error('SQL private details'));
    const res = makeResponse();

    userController.getAllUsers({}, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.view, 'errors/status');
    assert.equal(res.data.message, 'Não foi possível carregar os usuários.');
});

test('cadastra usuário sem cargo e define perfil de administrador', () => {
    let createdUser;
    User.create = (user, callback) => {
        createdUser = user;
        callback(null, 1);
    };
    const res = makeResponse();

    userController.createUser({ body: { username: 'novo', password: 'senha-segura-123' } }, res);

    assert.equal(createdUser.username, 'novo');
    assert.equal(createdUser.role, 'admin');
    assert.equal(res.location, '/users');
});

test('retorna 404 ao excluir usuário inexistente', () => {
    User.delete = (id, callback) => callback(null, { affectedRows: 0 });
    const res = makeResponse();

    userController.deleteUser({ params: { id: '42' } }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.data.message, 'Usuário não encontrado.');
});

test('não expõe erro do banco ao cadastrar categoria', () => {
    Categoria.create = (categoria, callback) => callback(new Error('SQL private details'));
    const res = makeResponse();

    categoriaController.createCategoria({ body: { nome: 'Biscoitos' } }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.data.message, 'Não foi possível cadastrar a categoria.');
});

test('retorna 404 ao editar categoria inexistente sem tentar atualizar', () => {
    let updateCalled = false;
    Categoria.findById = (id, callback) => callback(null, undefined);
    Categoria.update = () => { updateCalled = true; };
    const res = makeResponse();

    categoriaController.updateCategoria({ params: { id: '42' }, body: { nome: 'Biscoitos' } }, res);

    assert.equal(updateCalled, false);
    assert.equal(res.statusCode, 404);
    assert.equal(res.data.message, 'Categoria não encontrada.');
});