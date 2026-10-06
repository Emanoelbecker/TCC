'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('ItemVenda', {
            idItemVenda: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            idVenda: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            idProduto: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            quantidade: { type: Sequelize.INTEGER, allowNull: false },
            valorUnitario: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        }, {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });

        await queryInterface.addConstraint('ItemVenda', {
            fields: ['idVenda'],
            type: 'foreign key',
            name: 'fk_itemVenda_venda',
            references: { table: 'Venda', field: 'idVenda' },
            onUpdate: 'RESTRICT',
            onDelete: 'RESTRICT',
        });
        await queryInterface.addConstraint('ItemVenda', {
            fields: ['idProduto'],
            type: 'foreign key',
            name: 'fk_itemVenda_produto',
            references: { table: 'Produto', field: 'idProduto' },
            onUpdate: 'RESTRICT',
            onDelete: 'RESTRICT',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('ItemVenda');
    },
};