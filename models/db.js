const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  database: isProduction ? process.env.LIVE_DB_NAME : process.env.LOCAL_DB_NAME,
  username: isProduction ? process.env.LIVE_DB_USER : process.env.LOCAL_DB_USER,
  password: isProduction ? process.env.LIVE_DB_PASS : (process.env.LOCAL_DB_PASS || ''),
  host: isProduction ? process.env.LIVE_DB_HOST : process.env.LOCAL_DB_HOST,
  dialect: process.env.DB_DIALECT || 'mysql'
};

const sequelizeOptions = {
  host: config.host,
  dialect: config.dialect,
  logging: false,
  dialectOptions: { connectTimeout: 60000 }
};

if (isProduction) {
  sequelizeOptions.dialectOptions.socketPath = '/var/lib/mysql/mysql.sock';
}

const sequelize = new Sequelize(config.database, config.username, config.password, sequelizeOptions);

module.exports = { sequelize, config };