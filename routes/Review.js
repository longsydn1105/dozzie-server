// server/routes/Review.js
const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/Review");
const authMiddleware = require("../middleware/auth"); // Nhập kho thằng gác cổng

// 1. GET /api/reviews (Ai cũng xem được)
router.get("/", reviewController.getReviews);

// 2. POST /api/reviews (Phải đăng nhập mới được viết)
router.post("/", authMiddleware, reviewController.createReview);

module.exports = router;
