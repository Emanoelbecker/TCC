'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Administrador', {
            idAdministrador: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            nomeUsuario: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: 'uq_administrador_nomeUsuario',
            },
            senhaHash: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
        }, {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('Administrador');
    },
};