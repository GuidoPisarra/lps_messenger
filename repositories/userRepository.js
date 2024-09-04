const User = require('../models/user');

const getAllUsers = async () => {
    return await User.findAll();
};

const getUserByUsername = async (username) => {
    return await User.findOne({ where: { username } });
};

const createUser = async (userData) => {
    return await User.create(userData);
};

module.exports = {
    getAllUsers,
    getUserByUsername,
    createUser
};
