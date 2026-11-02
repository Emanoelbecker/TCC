const assert = require('node:assert/strict');
const test = require('node:test');
const ejs = require('ejs');
const path = require('node:path');
const { Cliente, Produto, Venda } = require('../src/models');
const controller = require('../src/controllers/homeController');

const originalMethods = {
    clienteCount: Cliente.count,
    produtoCount: Produto.count,
    produtoFindAll: Produto.findAll,
    vendaCount: Venda.count,
    vendaSum: Venda.sum,
    vendaFindAll: Venda.findAll,
};

test.afterEach(() => {
    Cliente.count = originalMethods.clienteCount;
    Produto.count = originalMethods.produtoCount;
    Produto.findAll = originalMethods.produtoFindAll;
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

test('renderiza a página pública inicial', () => {
    const res = makeResponse();

    controller.renderLanding({}, res);

    assert.equal(res.view, 'landing');
    assert.equal(res.data.publicPage, true);
    assert.equal(res.data.currentPage, 'home');
});

test('carrega produtos cadastrados para o catálogo público', async () => {
    const produtos = [{ idProduto: 3, nome: 'Produto C', valor: '19.90', observacao: 'Descrição breve' }];
    Produto.findAll = async (options) => {
        assert.deepEqual(options.order, [['nome', 'ASC'], ['idProduto', 'ASC']]);
        return produtos;
    };
    const res = makeResponse();

    await controller.renderProducts({}, res);

    assert.equal(res.view, 'public-products');
    assert.equal(res.data.produtos, produtos);
    assert.equal(res.data.publicPage, true);
    assert.equal(res.data.currentPage, 'products');
});

test('catálogo público apresenta estado vazio e dados dos produtos', async () => {
    const template = await ejs.renderFile(path.join(__dirname, '../src/views/public-products.ejs'), {
        produtos: [
            { nome: 'Produto real', valor: '19.90', observacao: 'Descrição breve', ingredientes: 'Informação complementar' },
        ],
    });
    const emptyTemplate = await ejs.renderFile(path.join(__dirname, '../src/views/public-products.ejs'), { produtos: [] });

    assert.match(template, /Produto real/);
    assert.match(template, /R\$\s*19,90/);
    assert.match(template, /Imagem não disponível/);
    assert.match(template, /Informação complementar/);
    assert.match(emptyTemplate, /Nenhum produto disponível no momento/);
});

test('catálogo público retorna erro controlado quando a consulta falha', async () => {
    Produto.findAll = async () => { throw new Error('database unavailable'); };
    const res = makeResponse();

    await controller.renderProducts({}, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.view, 'errors/status');
    assert.equal(res.data.message, 'Não foi possível carregar os produtos.');
});

test('layout público usa navegação própria e não expõe links administrativos', async () => {
    const template = await ejs.renderFile(path.join(__dirname, '../src/views/layout.ejs'), {
        body: '<p>Catálogo</p>',
        publicPage: true,
        currentPage: 'products',
    });

    assert.match(template, /aria-label="Navegação pública"/);
    assert.match(template, /navbar-expand-lg navbar-light public-navbar/);
    assert.match(template, /href="\/catalogo" aria-current="page">Produtos/);
    assert.match(template, /Área administrativa/);
    assert.doesNotMatch(template, /\/clientes|\/vendas|Cadastrar Produto/);
});

test('template público inclui slides, controles e seções editáveis', async () => {
    const template = await ejs.renderFile(path.join(__dirname, '../src/views/landing.ejs'));

    assert.match(template, /id="publicShowcase"/);
    assert.match(template, /Slide anterior/);
    assert.match(template, /Próximo slide/);
    assert.match(template, /data-slide-to="2"/);
    assert.match(template, /Lorem ipsum/);
    assert.match(template, /Visão do negócio/);
});