const socket = io();

fetch('/user')
    .then(response => response.json())
    .then(data => {
        const username = data.username;
        window.username = username;
        socket.emit('set username', username);

        socket.on('chat message', (message) => {
            if (message.userSend === window.username || message.userRecept === window.username) {
                displayMessage(message);
            }
        });

        socket.on('ping', () => {
            socket.emit('pong');
        });

        // Manejo de la actualización de usuarios
        socket.on('update users', (users) => {
            const userList = document.getElementById('user-list');
            userList.innerHTML = '';
            // Filtrar para excluir al propio usuario
            const filteredUsers = users.filter(user => user.username !== window.username);

            filteredUsers.forEach(user => {
                const userItem = document.createElement('li');
                userItem.className = 'user-item';
                userItem.innerHTML = `
                    <a href="#" onclick="startChat('${user.username}')">
                        <div class="user-avatar">
                            <img src="/assets/icons/${user.isOnline ? 'user-online' : 'user-offline'}.svg" alt="${user.username}" class="avatar">
                        </div>
                        <div class="user-info">
                            <span class="username">${user.username}</span>
                            <span class="online-status ${user.isOnline ? 'online' : 'offline'}">
                                ${user.isOnline ? 'En línea' : 'Desconectado'}
                            </span>
                        </div>
                    </a>
                `;
                userList.appendChild(userItem);
            });
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

    const fechaFormateada = formatoFecha(message.timestamp);

    messageElement.innerHTML = `
    <strong>${message.userSend}</strong> 
    <p class="texto-mensaje">${message.text} ${fileLink}</p>
    <div>
    <p class="hora-fecha-envio">${fechaFormateada}</p>
    </div>
`;

    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

function formatoFecha(timestamp) {
    const fecha = new Date(timestamp);
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const anio = fecha.getUTCFullYear();
    const hora = String(fecha.getUTCHours()).padStart(2, '0');
    const minutos = String(fecha.getUTCMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${anio} ${hora}:${minutos}`;
}