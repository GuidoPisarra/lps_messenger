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

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // TODO validar usuario
    req.session.user = { username };
    res.redirect('/chat');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const { username, password, confirmPassword } = req.body;
    // TODO validar registro y almacenar (creo que lo ultimo lo hace pero revisar)
    if (password === confirmPassword) {
        req.session.user = { username };
        res.redirect('/chat');
    } else {
        res.redirect('/register');
    }
});

app.get('/chat', (req, res) => {
    if (req.session.user) {
        // Recuperar mensajes de la base de datos
        Message.findAll({ order: [['timestamp', 'ASC']] })
            .then(messages => {
                res.render('chat', { username: req.session.user.username, messages });
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
                io.emit('chat message', message);
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