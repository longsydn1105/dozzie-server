const express = require("express");
const router = express.Router();
const controller = require("../controllers/ServicePackage");
const { isAuth, isAdmin } = require("../middleware/auth");

router.get("/", controller.getAllActivePackages);
router.get("/all", isAuth, isAdmin, controller.getAllPackages); // Chỉ Admin mới được xem tất cả gói (kể cả gói không hoạt động)
router.post("/", isAuth, isAdmin, controller.createPackage); // Chỉ Admin mới được tạo gói
router.put("/:id", isAuth, isAdmin, controller.updatePackage);
router.delete("/:id", isAuth, isAdmin, controller.deletePackage);

module.exports = router;
