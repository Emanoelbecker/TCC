'use strict';

module.exports = {
    async up(queryInterface) {
        await queryInterface.removeColumn('Produto', 'foto');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('Produto', 'foto', {
            type: Sequelize.STRING(2048),
            allowNull: true,
        });
    },
};