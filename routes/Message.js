const express = require("express");
const router = express.Router();
const chatController = require("../controllers/Message");
const { isAuth } = require("../middleware/auth");

// API: GET /api/chat/history/:bookingId
router.get("/history/:bookingId", isAuth, chatController.getChatHistory);

module.exports = router;
