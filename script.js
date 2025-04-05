document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Function to add a message to the chat
    function addMessage(text, isUser = false) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${isUser ? 'user-message-container' : 'bot-message-container'}`;

        // Add the label
        const label = document.createElement('div');
        label.className = 'message-label';
        label.textContent = isUser ? 'You' : 'KiloKōkua';
        messageContainer.appendChild(label);

        const messageElement = document.createElement('div');
        messageElement.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageElement.textContent = text;

        messageContainer.appendChild(messageElement);
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

    function handleUserInput() {
        const text = userInput.value.trim();
        if (text) {
            addMessage(text, true);
            userInput.value = '';
            
            // Show thinking animation
            const thinkingContainer = showThinking();
            
            // Simulate bot response
            setTimeout(() => {
                removeThinking(thinkingContainer);
                addMessage("I'm processing your request about Hawaii's climate...");
            }, 1000);
        }
    }

    // Handle send button click
    sendButton.addEventListener('click', handleUserInput);

    // Handle enter key press
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput();
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