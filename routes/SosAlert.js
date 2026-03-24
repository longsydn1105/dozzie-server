const express = require("express");
const router = express.Router();
const sosController = require("../controllers/SosAlert");
const { isAuth, isAdmin } = require("../middleware/auth");

// Khách bấm nút SOS (Phải đăng nhập mới biết ai đang kêu cứu)
router.post("/emergency", isAuth, sosController.createAlert);

// Admin lấy danh sách các ca SOS để đi xử lý
router.get("/list", isAuth, isAdmin, sosController.getAlerts);

// Admin cập nhật trạng thái đã xử lý xong (Resolved)
router.patch("/resolve/:id", isAuth, isAdmin, sosController.resolveAlert);

module.exports = router;
