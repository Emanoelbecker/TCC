const assert = require('node:assert/strict');
const test = require('node:test');
const ejs = require('ejs');
const path = require('node:path');
const Cliente = require('../src/models/Cliente');
const controller = require('../src/controllers/clienteController');

const originalCreate = Cliente.create;
const originalFindAll = Cliente.findAll;
const originalFindByPk = Cliente.findByPk;

test.afterEach(() => {
    Cliente.create = originalCreate;
    Cliente.findAll = originalFindAll;
    Cliente.findByPk = originalFindByPk;
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
        redirect(location) {
            this.location = location;
            return this;
        },
    };
}

test('recusa cliente sem CPF ou CNPJ com mensagem clara', async () => {
    Cliente.create = async (data) => Cliente.build(data).validate();
    const req = { body: { nome: 'Cliente sem documento' }, session: {} };
    const res = makeResponse();

    await controller.create(req, res);

    assert.equal(res.statusCode, 422);
    assert.equal(res.view, 'clientes/create');
    assert.deepEqual(res.data.errors, ['Informe o CPF ou CNPJ do cliente.']);
});

test('aceita cliente com CPF válido', async () => {
    Cliente.create = async (data) => Cliente.build(data).validate();
    const req = { body: { nome: 'Cliente com CPF', cpf: '12345678901' }, session: {} };
    const res = makeResponse();

    await controller.create(req, res);

    assert.equal(res.location, '/clientes');
    assert.equal(req.session.successMessage, 'Cliente cadastrado com sucesso.');
});

test('aceita cliente com CNPJ válido', async () => {
    Cliente.create = async (data) => Cliente.build(data).validate();
    const req = { body: { nome: 'Empresa', cnpj: '12345678000199' }, session: {} };
    const res = makeResponse();

    await controller.create(req, res);

    assert.equal(res.location, '/clientes');
});

test('recusa CPF duplicado com mensagem compreensível', async () => {
    const error = new Error('duplicate key');
    error.name = 'SequelizeUniqueConstraintError';
    error.errors = [{ path: 'cpf' }];
    Cliente.create = async () => { throw error; };
    const req = { body: { nome: 'Cliente repetido', cpf: '12345678901' }, session: {} };
    const res = makeResponse();

    await controller.create(req, res);

    assert.equal(res.statusCode, 422);
    assert.deepEqual(res.data.errors, ['CPF já cadastrado.']);
});

test('recusa CNPJ duplicado com mensagem compreensível', async () => {
    const error = new Error('duplicate key');
    error.name = 'SequelizeUniqueConstraintError';
    error.errors = [{ path: 'cnpj' }];
    Cliente.create = async () => { throw error; };
    const req = { body: { nome: 'Empresa repetida', cnpj: '12345678000199' }, session: {} };
    const res = makeResponse();

    await controller.create(req, res);

    assert.equal(res.statusCode, 422);
    assert.deepEqual(res.data.errors, ['CNPJ já cadastrado.']);
});

test('recusa e-mail e UF inválidos com mensagens compreensíveis', async () => {
    Cliente.create = async (data) => Cliente.build(data).validate();
    const req = {
        body: { nome: 'Cliente', cpf: '12345678901', email: 'email-invalido', uf: 'S' },
        session: {},
    };
    const res = makeResponse();

    await controller.create(req, res);

    assert.equal(res.statusCode, 422);
    assert.deepEqual(res.data.errors, ['Informe um e-mail válido.', 'UF deve conter 2 letras.']);
});

test('recusa CPF e CNPJ com quantidade incorreta de dígitos', async () => {
    Cliente.create = async (data) => Cliente.build(data).validate();
    const req = {
        body: { nome: 'Cliente inválido', cpf: '1234567890', cnpj: '1234567800019' },
        session: {},
    };
    const res = makeResponse();

    await controller.create(req, res);

    assert.equal(res.statusCode, 422);
    assert.deepEqual(res.data.errors, ['CPF deve conter 11 números.', 'CNPJ deve conter 14 números.']);
});

test('lista clientes em ordem e renderiza a listagem', async () => {
    const clientes = [{ idCliente: 1, nome: 'Ana' }];
    Cliente.findAll = async (options) => {
        assert.deepEqual(options.order, [['nome', 'ASC'], ['idCliente', 'ASC']]);
        return clientes;
    };
    const res = makeResponse();

    await controller.index({}, res);

    assert.equal(res.view, 'clientes/index');
    assert.equal(res.data.clientes, clientes);
});

test('renderiza a lista de clientes com campo de busca por nome', async () => {
    const html = await ejs.renderFile(path.join(__dirname, '../src/views/clientes/index.ejs'), {
        csrfToken: 'test-token',
        clientes: [{ idCliente: 1, nome: 'Ana', cpf: '12345678901', email: null, telefone: null }],
    });

    assert.match(html, /id="clientSearch"/);
    assert.match(html, /Ana/);
    assert.match(html, /clientTableBody/);
});

test('visualiza e carrega edição de cliente existente', async () => {
    const cliente = { idCliente: 5, nome: 'Ana' };
    Cliente.findByPk = async (id) => {
        assert.equal(id, '5');
        return cliente;
    };
    const showResponse = makeResponse();
    const editResponse = makeResponse();

    await controller.show({ params: { id: '5' } }, showResponse);
    await controller.editForm({ params: { id: '5' } }, editResponse);

    assert.equal(showResponse.view, 'clientes/show');
    assert.equal(showResponse.data.cliente, cliente);
    assert.equal(editResponse.view, 'clientes/edit');
    assert.equal(editResponse.data.cliente, cliente);
});

test('atualiza e exclui cliente existente', async () => {
    let updated;
    let destroyed = false;
    Cliente.findByPk = async () => ({
        idCliente: 5,
        update: async (data) => { updated = data; },
        destroy: async () => { destroyed = true; },
    });
    const updateRequest = {
        params: { id: '5' }, body: { nome: '  Ana atualizada  ', cpf: '12345678901' }, session: {},
    };
    const updateResponse = makeResponse();
    const deleteRequest = { params: { id: '5' }, session: {} };
    const deleteResponse = makeResponse();

    await controller.update(updateRequest, updateResponse);
    await controller.delete(deleteRequest, deleteResponse);

    assert.equal(updated.nome, 'Ana atualizada');
    assert.equal(updated.idCliente, 5);
    assert.equal(updateResponse.location, '/clientes/5');
    assert.equal(updateRequest.session.successMessage, 'Cliente atualizado com sucesso.');
    assert.equal(destroyed, true);
    assert.equal(deleteResponse.location, '/clientes');
    assert.equal(deleteRequest.session.successMessage, 'Cliente excluído com sucesso.');
});

test('impede excluir cliente com vendas vinculadas', async () => {
    const error = new Error('foreign key');
    error.name = 'SequelizeForeignKeyConstraintError';
    Cliente.findByPk = async () => ({ destroy: async () => { throw error; } });
    const req = { params: { id: '5' }, session: {} };
    const res = makeResponse();

    await controller.delete(req, res);

    assert.equal(res.location, '/clientes');
    assert.equal(req.session.errorMessage, 'Este cliente possui vendas vinculadas e não pode ser excluído.');
});