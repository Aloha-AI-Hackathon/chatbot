document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const voiceButton = document.getElementById('voice-button');

    // Function to add a message to the chat
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to show thinking animation
    function showThinking() {
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'thinking';
        thinkingDiv.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(thinkingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return thinkingDiv;
    }

    // Function to remove thinking animation
    function removeThinking(thinkingDiv) {
        thinkingDiv.remove();
    }

    // Handle send button click
    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';

            // Show thinking animation
            const thinkingDiv = showThinking();

            // Simulate bot response (replace with actual API call)
            setTimeout(() => {
                removeThinking(thinkingDiv);
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

    // Handle voice button click (placeholder for voice input functionality)
    voiceButton.addEventListener('click', () => {
        alert('Voice input functionality will be implemented here');
    });

    // Make suggestion items clickable
    document.querySelectorAll('.suggestions li').forEach(item => {
        item.addEventListener('click', () => {
            userInput.value = item.textContent;
            userInput.focus();
        });
    });
}); 