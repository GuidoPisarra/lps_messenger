const socket = io();

// Pusuario (esto es provisorio)
const username = prompt('Enter your username:');
socket.emit('set username', username);

// submit mensaje
document.getElementById('form').addEventListener('submit', function (e) {
    e.preventDefault();
    const input = document.getElementById('input');
    const message = input.value;
    if (message) {
        socket.emit('chat message', { text: message });
        input.value = '';
    }
});

// mensajes recibidos
socket.on('chat message', function (msg) {
    const item = document.createElement('li');
    item.classList.add('message');
    item.classList.add(msg.user === username ? 'sent' : 'received');
    item.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
    document.getElementById('messages').appendChild(item);
});
