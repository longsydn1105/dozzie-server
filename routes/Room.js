// server/routes/Room.js
const express = require("express");
const router = express.Router();
const roomController = require("../controllers/Room");

// GET /api/rooms/
router.get("/", roomController.getRooms);

router.post("/", isAuth, isAdmin, roomController.createRoom);
router.put("/:id", isAuth, isAdmin, roomController.updateRoom);
router.delete("/:id", isAuth, isAdmin, roomController.deleteRoom);

module.exports = router;
