'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Produto', {
            idProduto: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            nome: { type: Sequelize.STRING(150), allowNull: false },
            dataLote: { type: Sequelize.DATEONLY, allowNull: true },
            dataValidade: { type: Sequelize.DATEONLY, allowNull: true },
            dataFabricacao: { type: Sequelize.DATEONLY, allowNull: true },
            observacao: { type: Sequelize.TEXT, allowNull: true },
            foto: { type: Sequelize.STRING(2048), allowNull: true },
            valor: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
            valorUnidade: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
            ingredientes: { type: Sequelize.TEXT, allowNull: true },
        }, {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('Produto');
    },
};