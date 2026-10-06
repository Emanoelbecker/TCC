const Administrador = require('./Administrador');
const Cliente = require('./Cliente');
const Produto = require('./Produto');
const Venda = require('./Venda');
const ItemVenda = require('./ItemVenda');

const models = { Administrador, Cliente, Produto, Venda, ItemVenda };

Object.values(models).forEach((model) => {
    if (model.associate) {
        model.associate(models);
    }
});

module.exports = models;