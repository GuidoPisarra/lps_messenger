const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key', // TODO Falta secret-key
    resave: false,
    saveUninitialized: true,
}));

// Configuracion del motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'templates'));

app.get('', (req, res) => {
    if (req.session.user) {
        res.redirect('/chat');
    } else {
        res.render('index');
    }
});
// Rutas

app.get('/login', (req, res) => {
    res.render('login');
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
        res.render('chat', { username: req.session.user.username });
    } else {
        res.redirect('/');
    }
});


let users = {};

io.on('connection', (socket) => {
    console.log('Nuevo usuario conectado');

    socket.on('set username', (username) => {
        users[socket.id] = username;
        io.emit('update users', Object.values(users));
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', { text: msg.text, user: users[socket.id] });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update users', Object.values(users));
        console.log('Usuario desconectado');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});