const messageRepository = require('../repositories/chatRepository');

const getMessagesBetweenUsers = async (user1, user2) => {
    return await messageRepository.getMessagesBetweenUsers(user1, user2);
};

const createMessage = async (messageData) => {
    return await messageRepository.createMessage(messageData);
};

module.exports = {
    getMessagesBetweenUsers,
    createMessage
};
