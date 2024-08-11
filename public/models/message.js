const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Message = sequelize.define('Message', {
    text: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userRecept: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userSend: {
        type: DataTypes.STRING,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true
});

module.exports = Message;