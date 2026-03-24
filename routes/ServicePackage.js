const express = require("express");
const router = express.Router();
const controller = require("../controllers/ServicePackage"); // Trỏ đúng file
const { isAuth, isAdmin } = require("../middleware/auth"); // Middleware check token

router.get("/", controller.getPackages);
router.post("/", isAuth, isAdmin, controller.createPackage); // Chỉ Admin mới được tạo gói

module.exports = router;
