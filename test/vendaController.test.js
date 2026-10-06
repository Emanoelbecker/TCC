const assert = require('node:assert/strict');
const test = require('node:test');
const ejs = require('ejs');
const path = require('node:path');
const Cliente = require('../src/models/Cliente');
const Produto = require('../src/models/Produto');
const Venda = require('../src/models/Venda');
const ItemVenda = require('../src/models/ItemVenda');
const sequelize = require('../src/config/sequelize');
const controller = require('../src/controllers/vendaController');

const originalClienteMethods = {};
const originalProdutoMethods = {};
const originalVendaCreate = Venda.create;
const originalVendaFindAll = Venda.findAll;
const originalVendaFindByPk = Venda.findByPk;
const originalItemVendaBulkCreate = ItemVenda.bulkCreate;
const originalItemVendaDestroy = ItemVenda.destroy;
const originalTransaction = sequelize.transaction;

test.beforeEach(() => {
    originalClienteMethods.findAll = Cliente.findAll;
    originalClienteMethods.findByPk = Cliente.findByPk;
    originalProdutoMethods.findAll = Produto.findAll;
    Produto.findAll = async () => [];
    sequelize.transaction = async (callback) => callback({});
    ItemVenda.bulkCreate = async () => [];
});

test.afterEach(() => {
    Cliente.findAll = originalClienteMethods.findAll;
    Cliente.findByPk = originalClienteMethods.findByPk;
    Produto.findAll = originalProdutoMethods.findAll;
    Venda.create = originalVendaCreate;
    Venda.findAll = originalVendaFindAll;
    Venda.findByPk = originalVendaFindByPk;
    ItemVenda.bulkCreate = originalItemVendaBulkCreate;
    ItemVenda.destroy = originalItemVendaDestroy;
    sequelize.transaction = originalTransaction;
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

test('formulário carrega clientes existentes para seleção', async () => {
    const clientes = [{ idCliente: 3, nome: 'Ana' }];
    Cliente.findAll = async (options) => {
        assert.deepEqual(options.order, [['nome', 'ASC'], ['idCliente', 'ASC']]);
        return clientes;
    };
    const res = makeResponse();

    await controller.renderCreateForm({}, res);

    assert.equal(res.view, 'vendas/create');
    assert.equal(res.data.clientes, clientes);
    assert.match(res.data.venda.dataPedido, /^\d{4}-\d{2}-\d{2}$/);
});

test('lista vendas com seus dados relacionados', async () => {
    const vendas = [{ idVenda: 7, cliente: { nome: 'Ana' }, itensVenda: [] }];
    Venda.findAll = async (options) => {
        assert.equal(options.include[0].as, 'cliente');
        assert.equal(options.include[1].as, 'itensVenda');
        return vendas;
    };
    const res = makeResponse();

    await controller.index({}, res);

    assert.equal(res.view, 'vendas/index');
    assert.equal(res.data.vendas, vendas);
});

test('cria venda associada a um cliente existente', async () => {
    let foundId;
    let createdSale;
    let createdItems;
    Cliente.findByPk = async (id) => {
        foundId = id;
        return { idCliente: id, nome: 'Ana' };
    };
    Produto.findAll = async () => [
        { idProduto: 11, nome: 'Produto A', valorUnidade: '20.00' },
        { idProduto: 12, nome: 'Produto B', valorUnidade: '30.00' },
    ];
    Venda.create = async (data, options) => {
        assert.deepEqual(options, { transaction: {} });
        createdSale = data;
        return { idVenda: 7 };
    };
    ItemVenda.bulkCreate = async (items, options) => {
        assert.deepEqual(options, { transaction: {} });
        createdItems = items;
    };
    const req = {
        body: {
            idCliente: '3',
            localEntrega: '  Rua A, 10  ',
            dataPedido: '2026-10-05',
            dataEntrega: '2026-10-10',
            observacao: '  Entregar pela manhã  ',
            idProduto: ['11', '12'],
            quantidade: ['10', '5'],
            valorUnitario: ['0.01', '0.01'],
        },
        session: {},
    };
    const res = makeResponse();

    await controller.createVenda(req, res);

    assert.equal(foundId, 3);
    assert.deepEqual(createdSale, {
        idCliente: 3,
        localEntrega: 'Rua A, 10',
        dataPedido: '2026-10-05',
        dataEntrega: '2026-10-10',
        valorTotal: '350.00',
        observacao: 'Entregar pela manhã',
    });
    assert.deepEqual(createdItems, [
        { idProduto: 11, quantidade: 10, valorUnitario: '20.00', idVenda: 7 },
        { idProduto: 12, quantidade: 5, valorUnitario: '30.00', idVenda: 7 },
    ]);
    assert.equal(res.location, '/vendas/new');
    assert.equal(req.session.successMessage, 'Venda cadastrada com sucesso.');
});

test('carrega detalhes da venda com subtotal calculado pelo valor histórico', async () => {
    const venda = {
        idVenda: 7,
        valorTotal: '39.80',
        cliente: { nome: 'Ana' },
        itensVenda: [{
            idProduto: 11,
            quantidade: 2,
            valorUnitario: '19.90',
            produto: { nome: 'Produto A' },
        }],
    };
    Venda.findByPk = async (id, options) => {
        assert.equal(id, '7');
        assert.equal(options.include[0].as, 'cliente');
        assert.equal(options.include[1].as, 'itensVenda');
        return venda;
    };
    const res = makeResponse();

    await controller.show({ params: { id: '7' } }, res);

    assert.equal(res.view, 'vendas/show');
    assert.equal(res.data.venda.itensVenda[0].subtotal, '39.80');
});

test('retorna 404 ao consultar ou excluir venda inexistente', async () => {
    Venda.findByPk = async () => null;
    const showResponse = makeResponse();
    const deleteRequest = { params: { id: '404' }, session: {} };
    const deleteResponse = makeResponse();

    await controller.show({ params: { id: '404' } }, showResponse);
    await controller.delete(deleteRequest, deleteResponse);

    assert.equal(showResponse.statusCode, 404);
    assert.equal(showResponse.view, 'errors/status');
    assert.equal(showResponse.data.message, 'Venda não encontrada.');
    assert.equal(deleteResponse.statusCode, 404);
    assert.equal(deleteResponse.data.message, 'Venda não encontrada.');
});

test('atualiza os dados e substitui itens dentro de uma transação', async () => {
    const transaction = {};
    const operations = [];
    const sale = {
        idVenda: 7,
        update: async (data, options) => {
            operations.push(['update', data, options]);
        },
    };
    Venda.findByPk = async () => sale;
    Cliente.findByPk = async () => ({ idCliente: 3 });
    Produto.findAll = async () => [{ idProduto: 11, nome: 'Produto A', valorUnidade: '20.00' }];
    ItemVenda.destroy = async (options) => operations.push(['remove-items', options]);
    ItemVenda.bulkCreate = async (items, options) => operations.push(['create-items', items, options]);
    sequelize.transaction = async (callback) => callback(transaction);
    const req = {
        params: { id: '7' },
        body: {
            idCliente: '3',
            localEntrega: 'Rua B',
            dataPedido: '2026-10-05',
            dataEntrega: '2026-10-11',
            observacao: 'Atualizada',
            idProduto: ['11'],
            quantidade: ['2'],
        },
        session: {},
    };
    const res = makeResponse();

    await controller.update(req, res);

    assert.equal(operations[0][0], 'remove-items');
    assert.equal(operations[0][1].transaction, transaction);
    assert.equal(operations[1][1].valorTotal, '40.00');
    assert.equal(operations[1][2].transaction, transaction);
    assert.deepEqual(operations[2][1], [{
        idProduto: 11, quantidade: 2, valorUnitario: '20.00', idVenda: 7,
    }]);
    assert.equal(operations[2][2].transaction, transaction);
    assert.equal(res.location, '/vendas/7');
    assert.equal(req.session.successMessage, 'Venda atualizada com sucesso.');
});

test('exclui os itens antes da venda na mesma transação', async () => {
    const transaction = {};
    const operations = [];
    Venda.findByPk = async () => ({
        idVenda: 7,
        destroy: async (options) => operations.push(['delete-sale', options]),
    });
    ItemVenda.destroy = async (options) => operations.push(['delete-items', options]);
    sequelize.transaction = async (callback) => callback(transaction);
    const req = { params: { id: '7' }, session: {} };
    const res = makeResponse();

    await controller.delete(req, res);

    assert.equal(operations[0][0], 'delete-items');
    assert.equal(operations[0][1].transaction, transaction);
    assert.equal(operations[1][0], 'delete-sale');
    assert.equal(operations[1][1].transaction, transaction);
    assert.equal(res.location, '/vendas');
    assert.equal(req.session.successMessage, 'Venda excluída com sucesso.');
});

test('recusa cliente inexistente e mantém o formulário com erro', async () => {
    let saleCreated = false;
    Cliente.findByPk = async () => null;
    Cliente.findAll = async () => [{ idCliente: 8, nome: 'Cliente válido' }];
    Venda.create = async () => { saleCreated = true; };
    const req = {
        body: { idCliente: '999', dataPedido: '2026-10-05', idProduto: '11', quantidade: '1' },
        session: {},
    };
    const res = makeResponse();

    await controller.createVenda(req, res);

    assert.equal(saleCreated, false);
    assert.equal(res.statusCode, 422);
    assert.equal(res.view, 'vendas/create');
    assert.equal(res.data.venda.idCliente, 999);
    assert.deepEqual(res.data.errors, ['O cliente selecionado não existe.']);
});

test('recusa identificador de cliente malformado sem consultar clientes', async () => {
    let clientLookup = false;
    Cliente.findByPk = async () => { clientLookup = true; };
    Cliente.findAll = async () => [];
    const req = { body: { idCliente: '3x', dataPedido: '2026-10-05' }, session: {} };
    const res = makeResponse();

    await controller.createVenda(req, res);

    assert.equal(clientLookup, false);
    assert.equal(res.statusCode, 422);
    assert.deepEqual(res.data.errors, ['Selecione um cliente válido.']);
});

test('recusa quantidade zero sem criar venda ou itens', async () => {
    let saleCreated = false;
    Cliente.findByPk = async (id) => ({ idCliente: id, nome: 'Ana' });
    Cliente.findAll = async () => [{ idCliente: 3, nome: 'Ana' }];
    Venda.create = async () => { saleCreated = true; };
    ItemVenda.bulkCreate = async () => { saleCreated = true; };
    const req = {
        body: { idCliente: '3', dataPedido: '2026-10-05', idProduto: '11', quantidade: '0' },
        session: {},
    };
    const res = makeResponse();

    await controller.createVenda(req, res);

    assert.equal(saleCreated, false);
    assert.equal(res.statusCode, 422);
    assert.deepEqual(res.data.errors, ['A quantidade de cada produto deve ser um número inteiro maior que zero.']);
});

test('recusa venda sem itens com mensagem clara', async () => {
    let clientLookedUp = false;
    Cliente.findByPk = async () => { clientLookedUp = true; };
    Cliente.findAll = async () => [{ idCliente: 3, nome: 'Ana' }];
    const req = { body: { idCliente: '3', dataPedido: '2026-10-05' }, session: {} };
    const res = makeResponse();

    await controller.createVenda(req, res);

    assert.equal(clientLookedUp, false);
    assert.equal(res.statusCode, 422);
    assert.deepEqual(res.data.errors, ['Adicione pelo menos um produto e informe sua quantidade.']);
});

test('recusa produto inexistente antes de criar venda', async () => {
    let saleCreated = false;
    Cliente.findByPk = async (id) => ({ idCliente: id, nome: 'Ana' });
    Cliente.findAll = async () => [{ idCliente: 3, nome: 'Ana' }];
    Produto.findAll = async () => [];
    Venda.create = async () => { saleCreated = true; };
    const req = {
        body: { idCliente: '3', dataPedido: '2026-10-05', idProduto: '99', quantidade: '1' },
        session: {},
    };
    const res = makeResponse();

    await controller.createVenda(req, res);

    assert.equal(saleCreated, false);
    assert.equal(res.statusCode, 422);
    assert.deepEqual(res.data.errors, ['Um ou mais produtos selecionados não existem.']);
});

test('recusa data impossível com mensagem compreensível', async () => {
    Cliente.findByPk = async (id) => ({ idCliente: id, nome: 'Ana' });
    Cliente.findAll = async () => [{ idCliente: 3, nome: 'Ana' }];
    Produto.findAll = async () => [{ idProduto: 11, nome: 'Produto A', valorUnidade: '20.00' }];
    Venda.create = async (data) => Venda.build(data).validate();
    const req = {
        body: { idCliente: '3', dataPedido: '2026-02-30', idProduto: '11', quantidade: '1' },
        session: {},
    };
    const res = makeResponse();

    await controller.createVenda(req, res);

    assert.equal(res.statusCode, 422);
    assert.deepEqual(res.data.errors, ['Data do pedido deve ser uma data válida.']);
});

test('devolve erros de validação da venda para o formulário', async () => {
    Cliente.findByPk = async (id) => ({ idCliente: id, nome: 'Ana' });
    Cliente.findAll = async () => [{ idCliente: 3, nome: 'Ana' }];
    Produto.findAll = async () => [{ idProduto: 11, nome: 'Produto A', valorUnidade: '20.00' }];
    Venda.create = async () => {
        const error = new Error('missing order date');
        error.name = 'SequelizeValidationError';
        error.errors = [{ path: 'dataPedido', validatorKey: 'notNull' }];
        throw error;
    };
    const req = {
        body: { idCliente: '3', dataPedido: '', idProduto: '11', quantidade: '1' },
        session: {},
    };
    const res = makeResponse();

    await controller.createVenda(req, res);

    assert.equal(res.statusCode, 422);
    assert.equal(res.view, 'vendas/create');
    assert.deepEqual(res.data.errors, ['Data do pedido é obrigatório.']);
});

test('renderiza o formulário com seletor e cliente disponível', async () => {
    const html = await ejs.renderFile(path.join(__dirname, '../src/views/vendas/create.ejs'), {
        csrfToken: 'test-token',
        venda: { idCliente: 3, dataPedido: '2026-10-05', itens: [{ idProduto: 11, quantidade: '2' }] },
        clientes: [{ idCliente: 3, nome: 'Ana', nomeFantasia: 'Loja' }],
        produtos: [{ idProduto: 11, nome: 'Produto A', valorUnidade: '20.00' }],
        errors: [],
    });

    assert.match(html, /name="idCliente"/);
    assert.match(html, /name="idProduto\[\]"/);
    assert.match(html, /name="quantidade\[\]"/);
    assert.match(html, /Adicionar produto/);
    assert.match(html, /Total previsto/);
    assert.match(html, /Ana/);
    assert.match(html, /Produto A/);
});

test('renderiza listagem e detalhes com os valores da venda', async () => {
    const indexHtml = await ejs.renderFile(path.join(__dirname, '../src/views/vendas/index.ejs'), {
        csrfToken: 'test-token',
        vendas: [{
            idVenda: 7,
            cliente: { nome: 'Ana' },
            dataPedido: '2026-10-05',
            dataEntrega: '2026-10-10',
            itensVenda: [{}, {}],
            valorTotal: '39.80',
        }],
    });
    const showHtml = await ejs.renderFile(path.join(__dirname, '../src/views/vendas/show.ejs'), {
        venda: {
            idVenda: 7,
            cliente: { nome: 'Ana' },
            dataPedido: '2026-10-05',
            dataEntrega: '2026-10-10',
            localEntrega: 'Rua A, 10',
            itensVenda: [{
                produto: { nome: 'Produto A' },
                quantidade: 2,
                valorUnitario: '19.90',
                subtotal: '39.80',
            }],
            valorTotal: '39.80',
            observacao: 'Entregar pela manhã',
        },
    });

    assert.match(indexHtml, /Ana/);
    assert.match(indexHtml, /R\$ 39\.80/);
    assert.match(showHtml, /Produto A/);
    assert.match(showHtml, /Rua A, 10/);
    assert.match(showHtml, /19\.90/);
    assert.match(showHtml, /39\.80/);
    assert.match(showHtml, /Entregar pela manhã/);
});
