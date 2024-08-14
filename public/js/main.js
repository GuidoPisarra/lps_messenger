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
