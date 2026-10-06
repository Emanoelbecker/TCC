const sequelize = require('../config/sequelize');
const { DataTypes } = require('sequelize');

const Administrador = sequelize.define('Administrador', {
    idAdministrador: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    nomeUsuario: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: 'uq_administrador_nomeUsuario',
        validate: { notEmpty: true, len: [1, 50] },
    },
    senhaHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 255] },
    },
}, {
    tableName: 'Administrador',
    timestamps: false,
});

module.exports = Administrador;