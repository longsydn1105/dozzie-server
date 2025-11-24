// server/routes/Blog.js
const express = require('express');
const router = express.Router();
const blogController = require('../controllers/Blog');
const authMiddleware = require('../middleware/auth'); // "Lôi" "thằng" "gác" "cổng" "vào"

// --- 1. GET /api/blogs (Lấy list, "Ai" "cũng" "vào" "được") ---
router.get('/', blogController.getBlogs);

// --- 2. POST /api/blogs (Tạo mới, "PHẢI" "CÓ" "VÉ") ---
// "Đây"! "Nhét" "thằng" "gác" "cổng" (authMiddleware) "vào" "giữa"
// "Request" -> "authMiddleware" -> "OK" -> "blogController.createBlog"
router.post('/', authMiddleware, blogController.createBlog);

module.exports = router;