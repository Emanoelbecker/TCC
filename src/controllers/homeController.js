const { Cliente, Produto, Venda } = require('../models');
const { internalError } = require('../utils/httpResponses');

const homeController = {
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