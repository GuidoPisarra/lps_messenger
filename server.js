const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const sequelize = require('./config/database');
const userController = require('./controllers/userController');
const chatController = require('./controllers/chatController');
const Message = require('./models/Message');
const User = require('./models/user');

// Define la variable users para almacenar la información de los usuarios
const users = {};

// Cargar todos los usuarios desde la base de datos al iniciar el servidor
async function loadUsers() {
    try {
        const allUsers = await User.findAll();
        allUsers.forEach(user => {
            users[user.username] = { isOnline: false, socketId: null };
        });
    } catch (err) {
        console.error('Error cargando usuarios:', err);
    }
}

// BBDD
sequelize.authenticate()
    .then(() => {
        console.log('Conexión a la base de datos establecida correctamente.');
        loadUsers();
    })
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

// Configuración del motor de plantillas EJS
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

app.post('/login', userController.login);

app.get('/register', (req, res) => {
    if (req.session.user) {
        res.redirect('/chat');
    } else {
        res.render('register');
    }
});

app.post('/register', userController.register);

app.get('/chat', userController.getChat);

app.get('/chat/messages', chatController.getMessages);

app.get('/user', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).send('Unauthorized');
    }
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

io.on('connection', (socket) => {
    // Enviar la lista actualizada de usuarios cuando un nuevo cliente se conecta
    socket.emit('update users', getOnlineUsers());

    setInterval(() => {
        socket.emit('ping');
    }, 10000);

    socket.on('pong', () => { });

    socket.on('set username', (username) => {
        // Asegurarse de que el usuario existe en la lista
        if (!users[username]) {
            users[username] = { isOnline: false, socketId: null };
        }
        users[username].isOnline = true;
        users[username].socketId = socket.id;
        io.emit('update users', getOnlineUsers());
    });

    // Manejo del mensaje
    socket.on('chat message', async (msg) => {
        const messageData = {
            text: msg.text,
            userSend: msg.userSend,
            userRecept: msg.userRecept,
            files: []
        };

        // Verificar si hay archivos adjuntos
        if (Array.isArray(msg.files) && msg.files.length > 0) {
            const uploadsDir = path.join(__dirname, 'uploads');

            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const file = msg.files[0];
            if (file.fileName && file.fileData) {
                const base64Data = file.fileData.replace(/^data:[a-z\/]+;base64,/, '');
                const filePath = path.join(uploadsDir, file.fileName);

                try {
                    await fs.promises.writeFile(filePath, base64Data, 'base64');

                    messageData.fileName = file.fileName;
                    messageData.fileType = file.fileType || 'unknown';
                    messageData.filePath = `/uploads/${file.fileName}`;
                } catch (err) {
                    console.error('Error saving file:', err);
                    return;
                }
            } else {
                console.error('Invalid file object:', file);
                return;
            }
        }

        try {
            await Message.create(messageData);

            const receiverSocketId = users[msg.userRecept]?.socketId;
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('chat message', messageData);
            }
            socket.emit('chat message', messageData);

        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    // Manejo de desconexión
    socket.on('disconnect', () => {
        console.log('Un usuario se ha desconectado');
        const username = Object.keys(users).find(key => users[key].socketId === socket.id);
        if (username) {
            users[username].isOnline = false;
            users[username].socketId = null;
            io.emit('update users', getOnlineUsers());
        }
    });
});

// Función para obtener los usuarios en línea y desconectados
function getOnlineUsers() {
    return Object.keys(users).map(username => ({
        username: username,
        isOnline: users[username].isOnline
    }));
}

// Configuración del servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
