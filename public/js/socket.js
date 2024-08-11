const socket = io();

// Obtener el nombre de usuario desde el servidor
fetch('/user')
    .then(response => response.json())
    .then(data => {
        const username = data.username; // Obtén el nombre de usuario desde la respuesta
        socket.emit('set username', username);

        // Manejar el envío de mensajes
        document.getElementById('form').addEventListener('submit', function (e) {
            e.preventDefault();
            const input = document.getElementById('input');
            const message = input.value;
            if (message) {
                socket.emit('chat message', { text: message });
                input.value = '';
            }
        });

        // Manejar la recepción de mensajes
        socket.on('chat message', function (msg) {
            const item = document.createElement('li');
            item.classList.add('message');
            item.classList.add(msg.user === username ? 'sent' : 'received');
            item.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
            document.getElementById('messages').appendChild(item);
        });
    })
    .catch(error => {
        console.error('Error fetching user:', error);
        // Redirigir al usuario a la página de inicio de sesión si no está autenticado
        window.location.href = '/login';
    });
