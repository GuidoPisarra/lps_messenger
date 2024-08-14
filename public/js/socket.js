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
            console.log('object');
            console.log(document.getElementById('input').value);
            const message = {
                text: document.getElementById('input').value,
                userSend: window.username,
                userRecept: document.getElementById('recept').value // Asegúrate de tener un campo para el receptor
            };
            socket.emit('chat message', message);
            document.getElementById('input').value = '';
        });

        // Manejo de la recepción de mensajes
        socket.on('chat message', (message) => {
            if (message.userSend === window.username || message.userRecept === window.username) {
                displayMessage(message); // Función para mostrar el mensaje en la interfaz
            }
        });
    })
    .catch(error => {
        console.error('Error fetching user:', error);
        window.location.href = '/login';
    });

// Definir la función displayMessage
function displayMessage(message) {
    const messageContainer = document.getElementById('messages');
    const messageElement = document.createElement('li');

    // Determina si el mensaje es enviado o recibido
    const messageType = message.userSend === window.username ? 'sent' : 'received';
    messageElement.className = `message ${messageType}`;
    messageElement.innerHTML = `
        <strong>${message.userSend}</strong>: ${message.text}
    `;

    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}
