const assert = require('node:assert/strict');
const test = require('node:test');
const ejs = require('ejs');
const path = require('node:path');
const { Cliente, Produto, Venda } = require('../src/models');
const controller = require('../src/controllers/homeController');

const originalMethods = {
    clienteCount: Cliente.count,
    produtoCount: Produto.count,
    vendaCount: Venda.count,
    vendaSum: Venda.sum,
    vendaFindAll: Venda.findAll,
};

test.afterEach(() => {
    Cliente.count = originalMethods.clienteCount;
    Produto.count = originalMethods.produtoCount;
    Venda.count = originalMethods.vendaCount;
    Venda.sum = originalMethods.vendaSum;
    Venda.findAll = originalMethods.vendaFindAll;
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
        send(message) {
            this.message = message;
            return this;
        },
    };
}

test('carrega indicadores e vendas recentes do banco para o painel', async () => {
    const ultimasVendas = [{ idVenda: 8, dataPedido: '2026-10-05', valorTotal: '42.50', cliente: { nome: 'Ana' } }];
    Cliente.count = async () => 12;
    Produto.count = async () => 7;
    Venda.count = async () => 20;
    Venda.sum = async (field) => {
        assert.equal(field, 'valorTotal');
        return '1250.75';
    };
    Venda.findAll = async (options) => {
        assert.equal(options.include[0].as, 'cliente');
        assert.deepEqual(options.order, [['dataPedido', 'DESC'], ['idVenda', 'DESC']]);
        assert.equal(options.limit, 5);
        return ultimasVendas;
    };
    const res = makeResponse();

    await controller.renderHome({}, res);

    assert.equal(res.view, 'index');
    assert.equal(res.data.quantidadeClientes, 12);
    assert.equal(res.data.quantidadeProdutos, 7);
    assert.equal(res.data.quantidadeVendas, 20);
    assert.equal(res.data.valorTotalVendido, '1250.75');
    assert.equal(res.data.ultimasVendas, ultimasVendas);
});

test('renderiza os indicadores e a tabela de últimas vendas', async () => {
    const template = await ejs.renderFile(path.join(__dirname, '../src/views/index.ejs'), {
        quantidadeClientes: 842,
        quantidadeProdutos: 127,
        quantidadeVendas: 1532,
        valorTotalVendido: '245820.00',
        ultimasVendas: [{
            idVenda: 9,
            dataPedido: '2026-10-05',
            valorTotal: '125.50',
            cliente: { nome: 'Ana', nomeFantasia: 'Doces Ana' },
        }],
    });

    assert.match(template, /245\.820,00/);
    assert.match(template, /Doces Ana/);
    assert.match(template, /R\$\s*125,50/);
});

test('responde com erro controlado quando uma consulta falha', async () => {
    Cliente.count = async () => { throw new Error('database unavailable'); };
    Produto.count = async () => 0;
    Venda.count = async () => 0;
    Venda.sum = async () => 0;
    Venda.findAll = async () => [];
    const res = makeResponse();

    await controller.renderHome({}, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.view, 'errors/status');
    assert.equal(res.data.message, 'Não foi possível carregar o painel administrativo.');
});