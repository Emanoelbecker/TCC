const { Cliente, Produto, Venda } = require('../models');
const { internalError } = require('../utils/httpResponses');

const homeController = {
    renderLanding(req, res) {
        return res.render('landing', { publicPage: true, currentPage: 'home' });
    },

    async renderProducts(req, res) {
        try {
            const produtos = await Produto.findAll({ order: [['nome', 'ASC'], ['idProduto', 'ASC']] });
            return res.render('public-products', {
                produtos,
                publicPage: true,
                currentPage: 'products',
            });
        } catch (error) {
            return internalError(res, 'Não foi possível carregar os produtos.');
        }
    },

    async renderHome(req, res) {
        try {
            const [quantidadeClientes, quantidadeProdutos, quantidadeVendas, valorTotalVendido, ultimasVendas] = await Promise.all([
                Cliente.count(),
                Produto.count(),
                Venda.count(),
                Venda.sum('valorTotal'),
                Venda.findAll({
                    include: [{ model: Cliente, as: 'cliente', attributes: ['idCliente', 'nome', 'nomeFantasia'] }],
                    order: [['dataPedido', 'DESC'], ['idVenda', 'DESC']],
                    limit: 5,
                }),
            ]);

            return res.render('index', {
                quantidadeClientes,
                quantidadeProdutos,
                quantidadeVendas,
                valorTotalVendido: valorTotalVendido || 0,
                ultimasVendas,
            });
        } catch (error) {
            return internalError(res, 'Não foi possível carregar o painel administrativo.');
        }
    },
};

module.exports = homeController;