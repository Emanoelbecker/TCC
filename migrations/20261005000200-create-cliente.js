'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Cliente', {
            idCliente: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            nome: { type: Sequelize.STRING(150), allowNull: false },
            cpf: { type: Sequelize.STRING(11), allowNull: true },
            cnpj: { type: Sequelize.STRING(14), allowNull: true },
            representante: { type: Sequelize.STRING(150), allowNull: true },
            email: { type: Sequelize.STRING(150), allowNull: true },
            telefone: { type: Sequelize.STRING(20), allowNull: true },
            nomeFantasia: { type: Sequelize.STRING(150), allowNull: true },
            observacao: { type: Sequelize.TEXT, allowNull: true },
            rua: { type: Sequelize.STRING(150), allowNull: true },
            numero: { type: Sequelize.INTEGER, allowNull: true },
            cep: { type: Sequelize.CHAR(8), allowNull: true },
            uf: { type: Sequelize.CHAR(2), allowNull: true },
            bairro: { type: Sequelize.STRING(100), allowNull: true },
        }, {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });

        await queryInterface.addConstraint('Cliente', {
            fields: ['cpf'],
            type: 'unique',
            name: 'uq_cliente_cpf',
        });
        await queryInterface.addConstraint('Cliente', {
            fields: ['cnpj'],
            type: 'unique',
            name: 'uq_cliente_cnpj',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('Cliente');
    },
};