const sequelize = require('../config/sequelize');
const { DataTypes } = require('sequelize');
const { validateMoney } = require('../utils/validators');

const ItemVenda = sequelize.define('ItemVenda', {
    idItemVenda: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    idVenda: { type: DataTypes.INTEGER, allowNull: false },
    idProduto: { type: DataTypes.INTEGER, allowNull: false },
    quantidade: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    valorUnitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { validateMoney } },
}, {
    tableName: 'ItemVenda',
    timestamps: false,
});

ItemVenda.associate = (models) => {
    ItemVenda.belongsTo(models.Venda, {
        as: 'venda',
        foreignKey: { name: 'idVenda', allowNull: false },
        targetKey: 'idVenda',
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
    });
    ItemVenda.belongsTo(models.Produto, {
        as: 'produto',
        foreignKey: { name: 'idProduto', allowNull: false },
        targetKey: 'idProduto',
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
    });
};

module.exports = ItemVenda;