const express = require("express");
const router = express.Router();
const { chatwithAI, getConversations, getConversationMessages, getAvailableModules, deleteConversation, clearAllConversations } = require("../controllers/aicontroller");
const { authenticateJWT } = require("../middlewares/auth");

router.post("/chat", authenticateJWT, chatwithAI);
router.get("/conversations", authenticateJWT, getConversations);
router.get("/modules", authenticateJWT, getAvailableModules);
router.get("/conversations/:id", authenticateJWT, getConversationMessages);
router.delete("/conversations", authenticateJWT, clearAllConversations);
router.delete("/conversations/:id", authenticateJWT, deleteConversation);
module.exports = router;