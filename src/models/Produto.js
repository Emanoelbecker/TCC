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
    dataLote: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: true } },
    dataValidade: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: true } },
    dataFabricacao: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: true } },
    observacao: { type: DataTypes.TEXT, allowNull: true },
    foto: {
        type: DataTypes.STRING(2048),
        allowNull: true,
        validate: {
            len: [0, 2048],
            isUrl: { args: { protocols: ['http', 'https'], require_protocol: true } },
        },
    },
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: { validateMoney },
    },
    valorUnidade: {
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