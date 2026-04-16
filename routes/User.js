const express = require("express");
const router = express.Router();
const userController = require("../controllers/User");
const { isAuth, isAdmin } = require("../middleware/auth");

// --- Tuyến đường cho User ---
// User tự sửa profile của mình
router.put("/profile", isAuth, userController.updateProfile);

// --- Tuyến đường cho Admin ---
router.get("/", isAuth, isAdmin, userController.getAllUsers);
router.get("/:id", isAuth, isAdmin, userController.getUserById);
router.put("/:id", isAuth, isAdmin, userController.adminUpdateUser);
router.delete("/:id", isAuth, isAdmin, userController.deleteUser);

module.exports = router;
