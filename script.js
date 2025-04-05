document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Function to add a message to the chat
    function addMessage(text, isUser = false) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${isUser ? 'user-message-container' : 'bot-message-container'}`;
        
        const label = document.createElement('div');
        label.className = 'message-label';
        label.textContent = isUser ? 'You' : 'KiloKōkua';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.textContent = text;
        
        messageContainer.appendChild(label);
        messageContainer.appendChild(messageDiv);
        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to show thinking animation
    function showThinking() {
        const thinkingContainer = document.createElement('div');
        thinkingContainer.className = 'message-container bot-message-container';
        
        const label = document.createElement('div');
        label.className = 'message-label';
        label.textContent = 'KiloKōkua';
        
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'thinking';
        thinkingDiv.innerHTML = '<span></span><span></span><span></span>';
        
        thinkingContainer.appendChild(label);
        thinkingContainer.appendChild(thinkingDiv);
        chatMessages.appendChild(thinkingContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return thinkingContainer;
    }

    // Function to remove thinking animation
    function removeThinking(thinkingContainer) {
        thinkingContainer.remove();
    }

    // Handle send button click
    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';

            // Show thinking animation
            const thinkingContainer = showThinking();

            // Simulate bot response (replace with actual API call)
            setTimeout(() => {
                removeThinking(thinkingContainer);
                addMessage("I'm processing your question about Hawaiʻi's climate. This is a placeholder response.");
            }, 1500);
        }
    });

    // Handle enter key press
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    // Make suggestion items clickable
    document.querySelectorAll('.suggestions li').forEach(item => {
        item.addEventListener('click', () => {
            userInput.value = item.textContent;
            userInput.focus();
        });
    });
}); 