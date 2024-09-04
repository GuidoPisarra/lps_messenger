const Message = require('../models/Message');
const { Op } = require('sequelize');

const getMessagesBetweenUsers = async (user1, user2) => {
    return await Message.findAll({
        where: {
            [Op.or]: [
                { userSend: user1, userRecept: user2 },
                { userSend: user2, userRecept: user1 }
            ]
        },
        order: [['timestamp', 'ASC']]
    });
};

const createMessage = async (messageData) => {
    return await Message.create(messageData);
};

module.exports = {
    getMessagesBetweenUsers,
    createMessage
};
