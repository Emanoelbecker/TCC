'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        let tableExists = true;
        try { await queryInterface.describeTable('ItemVenda'); } catch (_) { tableExists = false; }

        if (!tableExists) await queryInterface.createTable('ItemVenda', {
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

        for (const constraint of [
            { fields: ['idVenda'], name: 'fk_itemVenda_venda', references: { table: 'Venda', field: 'idVenda' } },
            { fields: ['idProduto'], name: 'fk_itemVenda_produto', references: { table: 'Produto', field: 'idProduto' } },
        ]) {
            try {
                await queryInterface.addConstraint('ItemVenda', {
                    ...constraint,
                    type: 'foreign key',
                    onUpdate: 'RESTRICT',
                    onDelete: 'RESTRICT',
                });
            } catch (error) {
                if (!/Duplicate (key name|foreign key constraint name)/i.test(error.message || '') && error.original?.errno !== 1061 && error.original?.errno !== 1826) throw error;
            }
        }
    },

    async down(queryInterface) {
        await queryInterface.dropTable('ItemVenda');
    },
};