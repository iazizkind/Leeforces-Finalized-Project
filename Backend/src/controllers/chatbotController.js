const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const buildSystemPrompt = (problemTitle, problemDescription) => {
    let prompt = `You are a helpful coding tutor embedded in a LeetCode-style practice platform called LeetForces.
Help the user understand concepts, debug their code, and reason through problems.
Prefer nudging with hints and questions over giving away a full working solution outright,
unless the user explicitly asks for the complete solution or has clearly been stuck a while.
Keep answers concise and focused on the user's actual question.`;

    if (problemTitle && problemDescription) {
        prompt += `\n\nThe user is currently working on this problem:
Title: ${problemTitle}
Description: ${problemDescription}

Use this context when relevant, but don't repeat the full problem statement back to them unless asked.`;
    }

    return prompt;
};

const askChatbot = async (req, res) => {
    try {
        const { message, problemTitle, problemDescription, history } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ error: "Message is required" });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3.6-flash",
            systemInstruction: buildSystemPrompt(problemTitle, problemDescription)
        });

        const geminiHistory = Array.isArray(history)
            ? history.map((m) => ({
                  role: m.role === "assistant" ? "model" : "user",
                  parts: [{ text: m.content }]
              }))
            : [];

        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessage(message);
        const reply = result.response.text();

        res.status(200).json({ reply });
    } catch (err) {
        console.error("Chatbot error:", err);
        res.status(500).json({ error: "Error: " + err.message });
    }
};

module.exports = { askChatbot };