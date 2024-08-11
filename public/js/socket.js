const socket = io();

fetch('/user')
    .then(response => response.json())
    .then(data => {
        const username = data.username; // Se obtiene el usuario
        window.username = username;
        socket.emit('set username', username);

        // Manejo del envío de mensajes
        document.getElementById('form').addEventListener('submit', function (e) {
            e.preventDefault();
            const message = {
                text: document.getElementById('input').value,
                userSend: window.username,
                userRecept: document.getElementById('recept').value // Asegúrate de tener un campo para el receptor
            };
            socket.emit('chat message', message);
            document.getElementById('input').value = '';
        });

        // Manejo de la recepción de mensajes
        socket.on('chat message', (msg) => {
            const messageElement = document.createElement('li');
            messageElement.className = `message ${msg.userSend === window.username ? 'sent' : 'received'}`;
            messageElement.innerHTML = `<strong>${msg.userSend}:</strong> ${msg.text}`;
            document.getElementById('messages').appendChild(messageElement);
        });
    })
    .catch(error => {
        console.error('Error fetching user:', error);
        window.location.href = '/login';
    });

