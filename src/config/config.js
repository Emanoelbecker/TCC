require('dotenv').config();

const common = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
    },
};

module.exports = {
    development: { ...common },
    test: { ...common },
    production: { ...common },
};