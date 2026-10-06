'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Venda', {
            idVenda: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            idCliente: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            localEntrega: { type: Sequelize.STRING(255), allowNull: true },
            dataPedido: { type: Sequelize.DATEONLY, allowNull: false },
            dataEntrega: { type: Sequelize.DATEONLY, allowNull: true },
            valorTotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            observacao: { type: Sequelize.TEXT, allowNull: true },
        }, {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });

        await queryInterface.addConstraint('Venda', {
            fields: ['idCliente'],
            type: 'foreign key',
            name: 'fk_venda_cliente',
            references: { table: 'Cliente', field: 'idCliente' },
            onUpdate: 'RESTRICT',
            onDelete: 'RESTRICT',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('Venda');
    },
};