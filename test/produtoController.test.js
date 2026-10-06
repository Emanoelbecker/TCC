const assert = require('node:assert/strict');
const test = require('node:test');
const Produto = require('../src/models/Produto');
const Venda = require('../src/models/Venda');
const ItemVenda = require('../src/models/ItemVenda');
const controller = require('../src/controllers/produtoController');

const originalMethods = {};
const methodNames = ['findAll', 'findByPk', 'create'];

test.beforeEach(() => {
    methodNames.forEach((method) => {
        originalMethods[method] = Produto[method];
    });
});

test.afterEach(() => {
    methodNames.forEach((method) => {
        Produto[method] = originalMethods[method];
    });
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
        send(message) {
            this.message = message;
            return this;
        },
    };
}

test('lista produtos em ordem e renderiza a listagem', async () => {
    const produtos = [{ idProduto: 1, nome: 'Produto A' }];
    Produto.findAll = async (options) => {
        assert.deepEqual(options.order, [['nome', 'ASC'], ['idProduto', 'ASC']]);
        return produtos;
    };
    const res = makeResponse();

    await controller.getAllProdutos({}, res);

    assert.equal(res.view, 'produtos/index');
    assert.equal(res.data.produtos, produtos);
});

test('cria produto com campos normalizados e redireciona aos detalhes', async () => {
    let received;
    Produto.create = async (data) => {
        received = data;
        return { idProduto: 12 };
    };
    const req = {
        body: { nome: '  Chá  ', valor: '12.50', observacao: '  lote novo ' },
        session: {},
    };
    const res = makeResponse();

    await controller.createProduto(req, res);

    assert.equal(received.nome, 'Chá');
    assert.equal(received.valor, '12.50');
    assert.equal(received.observacao, 'lote novo');
    assert.equal(received.ingredientes, null);
    assert.equal(res.location, '/produtos/12');
    assert.equal(req.session.successMessage, 'Produto cadastrado com sucesso.');
});

test('retorna erros de validação no formulário sem perder os dados', async () => {
    const validationError = new Error('invalid');
    validationError.name = 'SequelizeValidationError';
    validationError.errors = [{ path: 'nome', validatorKey: 'notNull' }];
    Produto.create = async () => { throw validationError; };
    const req = { body: { nome: '' }, session: {} };
    const res = makeResponse();

    await controller.createProduto(req, res);

    assert.equal(res.statusCode, 422);
    assert.equal(res.view, 'produtos/create');
    assert.equal(res.data.produto.nome, null);
    assert.deepEqual(res.data.errors, ['Nome é obrigatório.']);
});

test('recusa valores monetários inválidos no cadastro', async () => {
    Produto.create = async (data) => Produto.build(data).validate();
    const req = { body: { nome: 'Produto', valor: '1.234' }, session: {} };
    const res = makeResponse();

    await controller.createProduto(req, res);

    assert.equal(res.statusCode, 422);
    assert.equal(res.view, 'produtos/create');
    assert.deepEqual(res.data.errors, ['Valor deve ser não negativo e ter no máximo duas casas decimais.']);
});

test('responde 404 para identificador inválido sem consultar o banco', async () => {
    Produto.findByPk = async () => { throw new Error('Não deveria consultar'); };
    const res = makeResponse();

    await controller.getProdutoById({ params: { id: 'abc' } }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.view, 'errors/status');
    assert.equal(res.data.message, 'Produto não encontrado.');
});

test('atualiza produto existente e redireciona aos detalhes', async () => {
    let updated;
    Produto.findByPk = async () => ({
        idProduto: 8,
        update: async (data) => { updated = data; },
    });
    const req = { params: { id: '8' }, body: { nome: 'Produto atualizado' }, session: {} };
    const res = makeResponse();

    await controller.updateProduto(req, res);

    assert.equal(updated.idProduto, 8);
    assert.equal(updated.nome, 'Produto atualizado');
    assert.equal(res.location, '/produtos/8');
    assert.equal(req.session.successMessage, 'Produto atualizado com sucesso.');
});

test('visualiza produto existente e exclui produto sem vínculos', async () => {
    let destroyed = false;
    Produto.findByPk = async (id) => ({
        idProduto: Number(id),
        nome: 'Produto A',
        destroy: async () => { destroyed = true; },
    });
    const showResponse = makeResponse();
    const deleteRequest = { params: { id: '8' }, session: {} };
    const deleteResponse = makeResponse();

    await controller.getProdutoById({ params: { id: '8' } }, showResponse);
    await controller.deleteProduto(deleteRequest, deleteResponse);

    assert.equal(showResponse.view, 'produtos/show');
    assert.equal(showResponse.data.produto.nome, 'Produto A');
    assert.equal(destroyed, true);
    assert.equal(deleteResponse.location, '/produtos');
    assert.equal(deleteRequest.session.successMessage, 'Produto excluído com sucesso.');
});

test('não exclui produto que tenha itens de venda vinculados', async () => {
    Produto.findByPk = async () => ({
        destroy: async () => {
            const error = new Error('foreign key');
            error.name = 'SequelizeForeignKeyConstraintError';
            throw error;
        },
    });
    const req = { params: { id: '4' }, session: {} };
    const res = makeResponse();

    await controller.deleteProduto(req, res);

    assert.equal(res.location, '/produtos');
    assert.equal(req.session.errorMessage, 'Este produto possui vendas vinculadas e não pode ser excluído.');
});

test('model valida URL da foto e limites de valores monetários', async () => {
    const invalidPhoto = Produto.build({ nome: 'Produto', foto: 'javascript:alert(1)' });
    await assert.rejects(invalidPhoto.validate(), (error) => (
        error.name === 'SequelizeValidationError' && error.errors.some((item) => item.path === 'foto')
    ));

    for (const value of ['abc', '1.234', '100000000', '-1']) {
        const invalidValue = Produto.build({ nome: 'Produto', valor: value });
        await assert.rejects(invalidValue.validate(), (error) => (
            error.name === 'SequelizeValidationError' && error.errors.some((item) => item.path === 'valor')
        ));
    }

    for (const [model, data] of [
        [Venda, { idCliente: 1, dataPedido: '2026-10-05', valorTotal: '1.234' }],
        [ItemVenda, { idVenda: 1, idProduto: 1, quantidade: 1, valorUnitario: '1.234' }],
    ]) {
        await assert.rejects(model.build(data).validate(), (error) => (
            error.name === 'SequelizeValidationError' && error.errors.some((item) => (
                item.validatorKey === 'validateMoney'
            ))
        ));
    }
});
