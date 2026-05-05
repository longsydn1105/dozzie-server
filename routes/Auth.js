const express = require("express");
const router = express.Router();
const authController = require("../controllers/Auth");
const { isAuth } = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.patch("/update-fcm-token", authController.updateFcmToken);
router.post("/logout", isAuth, authController.logout);

module.exports = router;
