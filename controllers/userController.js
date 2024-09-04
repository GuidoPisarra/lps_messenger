const userService = require('../services/userService');

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await userService.loginUser(username, password);
        if (user) {
            req.session.user = { username: user.username };
            res.redirect('/chat');
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error iniciando sesión:', error);
        res.redirect('/login');
    }
};

const register = async (req, res) => {
    const { username, password, repeatPassword } = req.body;
    if (password !== repeatPassword) {
        res.redirect('/register');
        return;
    }
    try {
        await userService.registerUser(username, password);
        req.session.user = { username };
        res.redirect('/chat');
    } catch (error) {
        console.error('Error registrando usuario:', error);
        res.redirect('/register');
    }
};

const getChat = async (req, res) => {
    if (req.session.user) {
        try {
            const users = await userService.getAllUsers();
            const filteredUsers = users.filter(user => user.username !== req.session.user.username);
            res.render('chat', {
                username: req.session.user.username,
                messages: [],
                users: filteredUsers
            });
        } catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).send('Error fetching users');
        }
    } else {
        res.redirect('/');
    }
};

module.exports = {
    login,
    register,
    getChat
};
