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
const Message = require('./models/Message'); // Ajusta la ruta
const User = require('./models/user'); // Ajusta la ruta
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const fs = require('fs');


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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
        // Recuperar usuarios de la base de datos
        User.findAll()
            .then(users => {
                const filteredUsers = users.filter(user => user.username !== req.session.user.username);
                res.render('chat', {
                    username: req.session.user.username,
                    messages: [], // No pasamos ningún mensaje al inicio
                    users: filteredUsers
                });
            })
            .catch(err => {
                console.error('Error fetching users:', err);
                res.status(500).send('Error fetching users');
            });
    } else {
        res.redirect('/');
    }
});

app.get('/chat/messages', async (req, res) => {
    const username = req.query.username;  // Usuario logueado
    const recipient = req.query.recipient; // Usuario seleccionado

    try {
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    {
                        userSend: username,
                        userRecept: recipient
                    },
                    {
                        userSend: recipient,
                        userRecept: username
                    }
                ]
            },
            order: [['timestamp', 'ASC']]
        });
        res.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error fetching messages' });
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


(async () => {
    try {
        const allUsers = await User.findAll();
        allUsers.forEach(user => {
            users[user.username] = false; // Inicialmente, todos están desconectados
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    }
})();

// Manejo del socket
io.on('connection', (socket) => {
    // Enviar la lista actual de usuarios cuando un nuevo cliente se conecta
    socket.emit('update users', Object.keys(users).map(username => ({
        username,
        isOnline: users[username]
    })));

    setInterval(() => {
        socket.emit('ping');
    }, 10000);

    socket.on('pong', () => { });

    socket.on('set username', (username) => {
        users[username] = true; // Marcar al usuario como conectado
        userSocketIds[username] = socket.id; // Registrar el socket ID
        const updatedUsers = Object.keys(users).map(user => ({
            username: user,
            isOnline: users[user]
        }));
        io.emit('update users', updatedUsers); // Enviar la lista actualizada
    });

    // Manejo del mensaje
    socket.on('chat message', async (msg) => {
        const message = {
            text: msg.text,
            userSend: msg.userSend,
            userRecept: msg.userRecept,
            files: [] // Array para guardar información de los archivos
        };

        if (msg.files && msg.files.length > 0) {
            const uploadsDir = path.join(__dirname, 'uploads');

            // Verificar que el directorio de uploads exista, si no, crearlo
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            for (let file of msg.files) {
                const base64Data = file.fileData.replace(/^data:[a-z\/]+;base64,/, '');
                const filePath = path.join(uploadsDir, file.fileName);

                try {
                    // Guardar el archivo en el sistema de archivos
                    await fs.promises.writeFile(filePath, base64Data, 'base64');
                    message.files.push({
                        fileName: file.fileName,
                        fileType: file.fileType,
                        filePath: `/uploads/${file.fileName}`
                    });
                } catch (err) {
                    console.error('Error saving file:', err);
                    return; // Detener el flujo si ocurre un error al guardar el archivo
                }
            }
        }

        try {
            await Message.create(message);

            const receiverSocketId = userSocketIds[msg.userRecept];
            // Emitir el mensaje solo al receptor
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('chat message', message);
            }
            // Enviar al emisor para actualizar su propio chat sin duplicar
            socket.emit('chat message', message);

        } catch (err) {
            console.error('Error saving message:', err);
        }
    });


    // Manejo de desconexión
    socket.on('disconnect', () => {
        const username = Object.keys(userSocketIds).find(key => userSocketIds[key] === socket.id);
        if (username) {
            users[username] = false; // Marcar al usuario como desconectado
            delete userSocketIds[username]; // Eliminar el socket ID
            const updatedUsers = Object.keys(users).map(user => ({
                username: user,
                isOnline: users[user]
            }));
            io.emit('update users', updatedUsers); // Enviar la lista actualizada
        }
    });
});

// Función para obtener los usuarios en línea
function getOnlineUsers() {
    return Object.keys(userSocketIds).map(username => ({
        username: username,
        isOnline: userSocketIds[username].isOnline
    }));
}


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});