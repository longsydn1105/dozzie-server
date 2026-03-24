// server/routes/Blog.js
const express = require('express');
const router = express.Router();
const blogController = require('../controllers/Blog');
const { isAuth } = require('../middleware/auth');

// --- 1. GET /api/blogs (Lấy list, "Ai" "cũng" "vào" "được") ---
router.get('/', blogController.getBlogs);

// --- 2. POST /api/blogs (Tạo mới, "PHẢI" "CÓ" "VÉ") ---
// "Đây"! "Nhét" "thằng" "gác" "cổng" (authMiddleware) "vào" "giữa"
// "Request" -> "authMiddleware" -> "OK" -> "blogController.createBlog"
router.post('/', isAuth, blogController.createBlog);

module.exports = router;