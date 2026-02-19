/**
 * ShopManager AI Chat Assistant
 * Powered by DeepSeek R1 via OpenRouter
 */

const CHAT_CONFIG = {
    endpoint: `${window.location.origin}/ai/chat`,
    siteName: 'ShopManager AI'
};

function initChat() {
    // Inject Styles
    const style = document.createElement('style');
    style.textContent = `
        #ai-chat-widget {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 9999;
            font-family: 'Manrope', sans-serif;
        }
        #chat-button {
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 1rem;
            background: #13ec80;
            color: #102219;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 10px 25px rgba(19, 236, 128, 0.3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
        }
        #chat-button:hover {
            transform: scale(1.1) rotate(5deg);
        }
        #chat-window {
            position: absolute;
            bottom: 4.5rem;
            right: 0;
            width: 22rem;
            height: 32rem;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px border rgba(19, 236, 128, 0.2);
            border-radius: 1.5rem;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform-origin: bottom right;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            transform: scale(0.8) translateY(20px);
            pointer-events: none;
        }
        #chat-window.active {
            opacity: 1;
            transform: scale(1) translateY(0);
            pointer-events: auto;
        }
        .dark #chat-window {
            background: rgba(16, 34, 25, 0.95);
            border-color: rgba(19, 236, 128, 0.1);
        }
        #chat-header {
            padding: 1.25rem;
            background: linear-gradient(135deg, #13ec80 0%, #0fc76d 100%);
            color: #102219;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        #chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .message {
            max-width: 85%;
            padding: 0.75rem 1rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            line-height: 1.5;
            position: relative;
        }
        .message.ai {
            align-self: flex-start;
            background: #f1f5f9;
            color: #334155;
            border-bottom-left-radius: 0.25rem;
        }
        .dark .message.ai {
            background: #1e293b;
            color: #e2e8f0;
        }
        .message.user {
            align-self: flex-end;
            background: #13ec80;
            color: #102219;
            border-bottom-right-radius: 0.25rem;
            font-weight: 600;
        }
        #chat-input-container {
            padding: 1rem;
            border-top: 1px solid rgba(0,0,0,0.05);
            display: flex;
            gap: 0.5rem;
        }
        .dark #chat-input-container {
            border-top-color: rgba(255,255,255,0.05);
        }
        #chat-input {
            flex: 1;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.75rem;
            padding: 0.6rem 1rem;
            font-size: 0.875rem;
            color: #1e293b;
            outline: none;
        }
        .dark #chat-input {
            background: #0a1610;
            border-color: #1e293b;
            color: #f1f5f9;
        }
        #chat-send {
            background: #13ec80;
            color: #102219;
            border: none;
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        #chat-send:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 4px 8px;
        }
        .dot {
            width: 4px;
            height: 4px;
            background: #94a3b8;
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out;
        }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1.0); }
        }
    `;
    document.head.appendChild(style);

    // Create Widget HTML
    const widget = document.createElement('div');
    widget.id = 'ai-chat-widget';
    widget.innerHTML = `
        <button id="chat-button">
            <span class="material-symbols-outlined">auto_awesome</span>
        </button>
        <div id="chat-window">
            <div id="chat-header">
                <span class="material-symbols-outlined">auto_awesome</span>
                <div>
                    <h4 class="font-extrabold text-sm m-0">AI Assistant</h4>
                    <p class="text-[10px] m-0 opacity-70">Always Here to Help</p>
                </div>
                <button id="close-chat" class="ml-auto bg-transparent border-none text-background-dark/50 hover:text-background-dark cursor-pointer">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>
            <div id="chat-messages">
                <div class="message ai">
                    Hello! I'm your AI assistant. How can I help you optimize your business today?
                </div>
            </div>
            <div id="chat-input-container">
                <input type="text" id="chat-input" placeholder="Ask about inventory, sales..." autocomplete="off">
                <button id="chat-send">
                    <span class="material-symbols-outlined">send</span>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    // Event Listeners
    const chatBtn = document.getElementById('chat-button');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.getElementById('close-chat');
    const sendBtn = document.getElementById('chat-send');
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');

    chatBtn.onclick = () => chatWindow.classList.toggle('active');
    closeBtn.onclick = () => chatWindow.classList.remove('active');

    const formatAIText = (text) => {
        // Remove DeepSeek thinking blocks if present
        let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

        // Handle basic bolding: **text** -> <strong>text</strong>
        cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Handle line breaks
        cleaned = cleaned.replace(/\n/g, '<br>');

        return cleaned;
    };

    const addMessage = (text, type) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        if (type === 'ai') {
            msgDiv.innerHTML = formatAIText(text);
        } else {
            msgDiv.textContent = text;
        }
        messages.appendChild(msgDiv);
        messages.scrollTop = messages.scrollHeight;
        return msgDiv;
    };

    const showTyping = () => {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai typing-container';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
        messages.appendChild(typingDiv);
        messages.scrollTop = messages.scrollHeight;
        return typingDiv;
    };

    const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        addMessage(text, 'user');

        const typing = showTyping();
        sendBtn.disabled = true;

        try {
            const response = await fetch(CHAT_CONFIG.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            typing.remove();

            if (data.choices && data.choices[0]) {
                addMessage(data.choices[0].message.content, 'ai');
            } else {
                addMessage("I'm sorry, I'm having trouble connecting right now. Please try again later.", 'ai');
                console.error("Chat Error:", data);
            }
        } catch (err) {
            typing.remove();
            addMessage("Error connecting to AI service.", 'ai');
            console.error("Chat Error:", err);
        } finally {
            sendBtn.disabled = false;
        }
    };

    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
} else {
    initChat();
}
