const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false, // Puedes activar esto si deseas ver las consultas SQL en la consola
});

module.exports = sequelize;