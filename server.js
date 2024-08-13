const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const sequelize = require('./config/database');
const Message = require('./public/models/Message'); // Ajusta la ruta
const User = require('./public/models/user'); // Ajusta la ruta
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');


// BBDD
sequelize.authenticate()
    .then(() => console.log('Conexión a la base de datos establecida correctamente.'))
    .catch(err => console.error('Error conectando a la base de datos:', err));



// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key', //TODO Cambiar esto a una clave secreta segura
    resave: false,
    saveUninitialized: true,
}));

// Configuracion del motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'templates'));


// Rutas
app.get('', (req, res) => {
    if (req.session.user) {
        res.redirect('/chat');
    } else {
        res.render('index');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ where: { username } });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = { username };
            res.redirect('/chat');
        } else {
            // Aquí podrías agregar un mensaje de error para el usuario
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error iniciando sesión:', error);
        res.redirect('/login');
    }
});

app.get('/register', (req, res) => {
    // Si el usuario está autenticado, redirigir a /chat
    if (req.session.user) {
        res.redirect('/chat');
    } else {
        res.render('register', {
            username: req.session.user ? req.session.user.username : null
        });
    }
});

app.post('/register', async (req, res) => {
    const { username, password, repeatPassword } = req.body;
    if (password === repeatPassword) {
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            const user = await User.create({ username, password: hashedPassword });
            console.log('Usuario creado:', user); // Añade un log para verificar
            req.session.user = { username };
            res.redirect('/chat');
        } catch (error) {
            console.error('Error registrando usuario:', error);
            res.redirect('/register');
        }
    } else {
        res.redirect('/register');
    }
});

app.get('/chat', (req, res) => {
    if (req.session.user) {
        // Recuperar mensajes de la base de datos para el usuario actual
        Message.findAll({
            where: {
                [Op.or]: [
                    { userSend: req.session.user.username },
                    { userRecept: req.session.user.username }
                ]
            },
            order: [['timestamp', 'ASC']]
        })
            .then(messages => {
                // Recuperar usuarios de la base de datos
                User.findAll()
                    .then(users => {
                        const filteredUsers = users.filter(user => user.username !== req.session.user.username);
                        res.render('chat', {
                            username: req.session.user.username,
                            messages,
                            users: filteredUsers
                        });
                    })
                    .catch(err => {
                        console.error('Error fetching users:', err);
                        res.status(500).send('Error fetching users');
                    });
            })
            .catch(err => {
                console.error('Error fetching messages:', err);
                res.redirect('/');
            });
    } else {
        res.redirect('/');
    }
});

app.get('/user', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).send('Unauthorized');
    }
});

let users = {};
let userSocketIds = {};

// Manejo del socket
io.on('connection', (socket) => {
    console.log('Nuevo usuario conectado');

    // Asignar nombre de usuario al socket
    socket.on('set username', (username) => {
        userSocketIds[username] = socket.id;
        io.emit('update users', Object.keys(userSocketIds));
    });

    // Manejo del mensaje
    socket.on('chat message', (msg) => {
        const message = {
            text: msg.text,
            userSend: msg.userSend,
            userRecept: msg.userRecept
        };

        // Guarda el mensaje en la base de datos
        Message.create(message)
            .then(() => {
                io.to(userSocketIds[msg.userRecept]).emit('chat message', message); // Enviar solo al destinatario
                io.to(userSocketIds[msg.userSend]).emit('chat message', message); // Enviar al remitente también
            })
            .catch(err => console.error('Error saving message:', err));
    });

    // Manejo de desconexión
    socket.on('disconnect', () => {
        const username = Object.keys(userSocketIds).find(key => userSocketIds[key] === socket.id);
        if (username) {
            delete userSocketIds[username];
            io.emit('update users', Object.keys(userSocketIds));
        }
        console.log('Usuario desconectado');
    });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});