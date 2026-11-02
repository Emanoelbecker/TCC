const sequelize = require('../config/sequelize');
const { DataTypes } = require('sequelize');
const { validateMoney } = require('../utils/validators');

const Produto = sequelize.define('Produto', {
    idProduto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    nome: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 150] },
    },
    observacao: { type: DataTypes.TEXT, allowNull: true },
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: { validateMoney },
    },
    ingredientes: { type: DataTypes.TEXT, allowNull: true },
}, {
    tableName: 'Produto',
    timestamps: false,
});

Produto.associate = (models) => {
    Produto.hasMany(models.ItemVenda, {
        as: 'itensVenda',
        foreignKey: { name: 'idProduto', allowNull: false },
        sourceKey: 'idProduto',
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
    });
};

module.exports = Produto;