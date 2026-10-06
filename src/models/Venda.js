const sequelize = require('../config/sequelize');
const { DataTypes } = require('sequelize');
const { validateMoney } = require('../utils/validators');

const Venda = sequelize.define('Venda', {
    idVenda: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    idCliente: { type: DataTypes.INTEGER, allowNull: false },
    localEntrega: { type: DataTypes.STRING(255), allowNull: true, validate: { len: [0, 255] } },
    dataPedido: { type: DataTypes.DATEONLY, allowNull: false, validate: { isDate: true } },
    dataEntrega: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: true } },
    valorTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { validateMoney } },
    observacao: { type: DataTypes.TEXT, allowNull: true },
}, {
    tableName: 'Venda',
    timestamps: false,
});

Venda.associate = (models) => {
    Venda.belongsTo(models.Cliente, {
        as: 'cliente',
        foreignKey: { name: 'idCliente', allowNull: false },
        targetKey: 'idCliente',
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
    });
    Venda.hasMany(models.ItemVenda, {
        as: 'itensVenda',
        foreignKey: { name: 'idVenda', allowNull: false },
        sourceKey: 'idVenda',
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
    });
};

module.exports = Venda;