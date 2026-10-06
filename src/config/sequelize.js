const { Sequelize } = require('sequelize');
const configurations = require('./config');

const environment = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(configurations[environment]);

module.exports = sequelize;