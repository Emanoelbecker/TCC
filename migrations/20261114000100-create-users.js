'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('users', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            username: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true,
            },
            password: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            role: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
        }, {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('users');
    },
};
