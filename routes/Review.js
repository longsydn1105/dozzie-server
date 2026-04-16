// server/routes/Review.js
const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/Review");
const { isAuth, isAdmin } = require("../middleware/auth");
// Nhập kho thằng gác cổng

// 1. GET /api/reviews (Ai cũng xem được)
router.get("/", reviewController.getReviews);

// --- DÀNH CHO KHÁCH HÀNG (App Mobile) ---
router.get("/my-reviews", isAuth, reviewController.getMyReviews); // Khách xem review của mình
router.post("/", isAuth, reviewController.createReview); // Khách tạo mới
router.put("/:id", isAuth, reviewController.updateReview); // Khách sửa của mình
router.delete("/:id", isAuth, reviewController.deleteReview); // Khách xóa của mình

// --- DÀNH CHO ADMIN (Dashboard Web) ---
// Admin xóa bất kỳ ai, kẹp thêm isAdmin vào cho chắc cú
router.delete("/admin/:id", isAuth, isAdmin, reviewController.adminDeleteReview);

module.exports = router;
