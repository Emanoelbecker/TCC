const sequelize = require('../config/sequelize');
const { DataTypes } = require('sequelize');

const Cliente = sequelize.define('Cliente', {
    idCliente: {
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
    cpf: {
        type: DataTypes.STRING(11),
        allowNull: true,
        unique: 'uq_cliente_cpf',
        validate: { is: /^\d{11}$/ },
    },
    cnpj: {
        type: DataTypes.STRING(14),
        allowNull: true,
        unique: 'uq_cliente_cnpj',
        validate: { is: /^\d{14}$/ },
    },
    representante: { type: DataTypes.STRING(150), allowNull: true, validate: { len: [0, 150] } },
    email: { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: true, len: [0, 150] } },
    telefone: { type: DataTypes.STRING(20), allowNull: true, validate: { len: [0, 20] } },
    nomeFantasia: { type: DataTypes.STRING(150), allowNull: true, validate: { len: [0, 150] } },
    observacao: { type: DataTypes.TEXT, allowNull: true },
    rua: { type: DataTypes.STRING(150), allowNull: true, validate: { len: [0, 150] } },
    numero: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
    cep: { type: DataTypes.CHAR(8), allowNull: true, validate: { is: /^\d{8}$/ } },
    uf: { type: DataTypes.CHAR(2), allowNull: true, validate: { is: /^[A-Za-z]{2}$/ } },
    bairro: { type: DataTypes.STRING(100), allowNull: true, validate: { len: [0, 100] } },
}, {
    tableName: 'Cliente',
    timestamps: false,
    validate: {
        cpfOrCnpj() {
            if (!this.cpf && !this.cnpj) {
                throw new Error('Informe o CPF ou CNPJ do cliente.');
            }
        },
    },
});

Cliente.associate = (models) => {
    Cliente.hasMany(models.Venda, {
        as: 'vendas',
        foreignKey: { name: 'idCliente', allowNull: false },
        sourceKey: 'idCliente',
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
    });
};

module.exports = Cliente;