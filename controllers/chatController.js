const chatService = require('../services/chatService');

const getMessages = async (req, res) => {
    const username = req.query.username;
    const recipient = req.query.recipient;
    try {
        const messages = await chatService.getMessagesBetweenUsers(username, recipient);
        res.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error fetching messages' });
    }
};

module.exports = {
    getMessages
};
