const express = require("express");
const router = express.Router();
const chatController = require("../controllers/Message");
const { isAuth } = require("../middleware/auth");

router.get("/history/:bookingId", isAuth, chatController.getChatHistory);

module.exports = router;
