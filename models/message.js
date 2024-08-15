const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    },
    readed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Nombre del archivo adjunto'
    },
    fileType: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Tipo MIME del archivo'
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Ruta donde se almacena el archivo en el servidor'
    }
}, {
    timestamps: true,
    hooks: {
        beforeCreate: (message) => {
            const now = new Date();
            const offset = -3 * 60; // UTC-3 for Argentina
            const argentinaTime = new Date(now.getTime() + offset * 60 * 1000);
            message.timestamp = argentinaTime;
        }
    }
});

module.exports = Message;
