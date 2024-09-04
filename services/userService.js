const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcrypt');

const getAllUsers = async () => {
    return await userRepository.getAllUsers();
};

const loginUser = async (username, password) => {
    const user = await userRepository.getUserByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) {
        return user;
    }
    return null;
};

const registerUser = async (username, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await userRepository.createUser({ username, password: hashedPassword });
};

module.exports = {
    getAllUsers,
    loginUser,
    registerUser
};
