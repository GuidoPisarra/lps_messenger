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

            const fileInput = document.getElementById('fileInput');
            const messageInput = document.getElementById('input-message');
            const message = {
                text: messageInput.value,
                userSend: window.username,
                userRecept: document.getElementById('recept').value
            };

            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const reader = new FileReader();

                reader.onload = function (event) {
                    message.fileName = file.name;
                    message.fileType = file.type;
                    message.fileData = event.target.result; // Contenido del archivo en base64
                    message.filePath = '/uploads/' + file.name
                    // Enviar el mensaje con el archivo adjunto
                    socket.emit('chat message', message);
                };

                reader.readAsDataURL(file);
            } else {
                // Enviar el mensaje sin archivo adjunto
                socket.emit('chat message', message);
            }

            messageInput.value = '';
            fileInput.value = ''; // Limpia el campo de archivo
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
    const messageType = message.userSend === window.username ? 'sent' : 'received';

    messageElement.className = `message ${messageType}`;
    let fileLink = '';

    if (message.fileName && message.filePath) {
        const fileUrl = `/uploads/${message.fileName}`;
        fileLink = `<br/><a href="${fileUrl}" download="${message.fileName}">${message.fileName}</a>`;
    }

    messageElement.innerHTML = `
        <strong>${message.userSend}</strong>: ${message.text} ${fileLink}
    `;

    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}