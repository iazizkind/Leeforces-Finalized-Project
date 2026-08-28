const express = require("express");
const chatbotRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const { askChatbot } = require("../controllers/chatbotController");

chatbotRouter.post("/ask", userMiddleware, askChatbot);

module.exports = chatbotRouter;