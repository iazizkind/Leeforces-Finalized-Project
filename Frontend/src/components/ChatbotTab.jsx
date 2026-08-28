import { useState, useRef, useEffect } from "react";
import axiosClient from "../utils/axios";
import "../styles/ChatbotTab.css";

// Embedded inline version of the chatbot for the "Chatbot" tab on the
// problem page — always visible (no toggle), fills the available tab space.
// Pass the current problem's title/description so answers are scoped to it.
function ChatbotTab({ problemTitle, problemDescription }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage = { role: "user", content: trimmed };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setInput("");
        setError("");
        setIsLoading(true);

        try {
            const recentHistory = messages.slice(-10);

            const response = await axiosClient.post("/chatbot/ask", {
                message: trimmed,
                problemTitle,
                problemDescription,
                history: recentHistory
            });

            setMessages([
                ...updatedMessages,
                { role: "assistant", content: response.data.reply }
            ]);
        } catch (err) {
            setError("Something went wrong. Please try again.");
            console.error("Chatbot error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chatbot-tab">
            <div className="chatbot-tab-messages">
                {messages.length === 0 && (
                    <div className="chatbot-tab-empty-state">
                        {problemTitle
                            ? `Ask me anything about "${problemTitle}" or coding in general.`
                            : "Ask me anything about coding."}
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`chatbot-tab-message chatbot-tab-message-${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {isLoading && (
                    <div className="chatbot-tab-message chatbot-tab-message-assistant chatbot-tab-typing">
                        Thinking...
                    </div>
                )}
                {error && <div className="chatbot-tab-error">{error}</div>}
                <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-tab-input-row">
                <textarea
                    className="chatbot-tab-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question..."
                    rows={1}
                />
                <button
                    className="chatbot-tab-send-btn"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default ChatbotTab;
