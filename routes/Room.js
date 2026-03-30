// server/routes/Room.js
const express = require("express");
const router = express.Router();
const roomController = require("../controllers/Room");
const { isAuth, isAdmin } = require("../middleware/auth");
// GET /api/rooms/
router.get("/", roomController.getRooms);
router.get("/:id", isAuth, roomController.getRoomById);
router.post("/", isAuth, isAdmin, roomController.createRoom);
router.put("/:id", isAuth, isAdmin, roomController.updateRoom);
router.delete("/:id", isAuth, isAdmin, roomController.deleteRoom);

module.exports = router;
