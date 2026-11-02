'use strict';

module.exports = {
    async up(queryInterface) {
        await queryInterface.removeColumn('Produto', 'dataLote');
        await queryInterface.removeColumn('Produto', 'dataValidade');
        await queryInterface.removeColumn('Produto', 'dataFabricacao');
        await queryInterface.removeColumn('Produto', 'valorUnidade');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('Produto', 'dataLote', { type: Sequelize.DATEONLY, allowNull: true });
        await queryInterface.addColumn('Produto', 'dataValidade', { type: Sequelize.DATEONLY, allowNull: true });
        await queryInterface.addColumn('Produto', 'dataFabricacao', { type: Sequelize.DATEONLY, allowNull: true });
        await queryInterface.addColumn('Produto', 'valorUnidade', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
    },
};