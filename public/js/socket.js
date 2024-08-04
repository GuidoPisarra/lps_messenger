// Archivo: public/js/socket.js

const socket = io();

// Prompt for username
const username = prompt('Enter your username:');
socket.emit('set username', username);

// Handle form submission
document.getElementById('form').addEventListener('submit', function (e) {
    e.preventDefault();
    const input = document.getElementById('input');
    const message = input.value;
    if (message) {
        socket.emit('chat message', { text: message });
        input.value = '';
    }
});

// Receive messages
socket.on('chat message', function (msg) {
    const item = document.createElement('li');
    item.classList.add('message');
    item.classList.add(msg.user === username ? 'sent' : 'received');
    item.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
    document.getElementById('messages').appendChild(item);
});
