const contenedorArchivos = document.getElementById('contenedor-archivos');
const btnAgregarArchivo = document.getElementById('btnAgregarArchivo');
const fileInput = document.getElementById('fileInput');


function startChat(recipient) {
    const username = window.username;

    fetch(`/chat/messages?username=${encodeURIComponent(username)}&recipient=${encodeURIComponent(recipient)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const messageContainer = document.getElementById('messages');
            const user = document.getElementById('usuario-chat');
            const formChat = document.getElementById('form');
            const inputRecept = document.getElementById('recept');
            inputRecept.value = recipient;
            formChat.style.display = 'block';
            user.innerHTML = recipient;
            messageContainer.innerHTML = '';
            data.messages.forEach(message => {
                displayMessage(message);

            })
        })
        .catch(error => {
            console.error('Error fetching messages:', error);
        });
}


fileInput.addEventListener('change', (event) => {
    const archivos = event.target.files; // Obtén los archivos seleccionados

    // Limpiar el contenedor antes de agregar nuevas miniaturas
    contenedorArchivos.innerHTML = '';
    contenedorArchivos.style.display = 'block';
    Array.from(archivos).forEach(archivo => {
        const miniatura = document.createElement('div');
        miniatura.classList.add('miniatura');

        // Verifica si el archivo es una imagen
        if (archivo.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(archivo); // Crea una URL temporal para la imagen
            img.onload = () => URL.revokeObjectURL(img.src); // Libera la memoria cuando ya no es necesario
            img.classList.add('miniatura-imagen');
            miniatura.appendChild(img);
        } else {
            // Si no es una imagen, muestra un ícono genérico o el nombre del archivo
            miniatura.textContent = archivo.name;
            miniatura.classList.add('miniatura-archivo');
        }

        // Agrega la miniatura al contenedor
        contenedorArchivos.appendChild(miniatura);
    });
});

const formChat = document.getElementById('form');
formChat.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('input-message');
    const message = input.value;
    const recipient = document.getElementById('recept').value;

    if (message.trim() !== '') {
        const mensaje = {
            userSend: window.username,
            userRecept: recipient,
            text: message,
        };
        socket.emit('chat message', mensaje);
        displayMessage(mensaje);

        input.value = '';
    }
});