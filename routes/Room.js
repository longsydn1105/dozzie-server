// server/routes/Room.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/Room');

// GET /api/rooms/
router.get('/', roomController.getRooms);

// (Tí nữa "thêm" "các" "route" "khác" "vào" "đây")
// POST /api/rooms/
// router.post('/', roomController.createRoom);

module.exports = router;