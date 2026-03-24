const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/Invoice");
const { isAuth, isAdmin } = require("../middleware/auth");

// --- DÀNH CHO KHÁCH ---
// Khách chỉ lấy được danh sách hóa đơn của chính họ
router.get("/my-invoices", isAuth, invoiceController.getMyInvoices);

// --- DÀNH CHO ADMIN ---
// Admin lấy toàn bộ hóa đơn hệ thống để thống kê
router.get("/all", isAuth, isAdmin, invoiceController.getInvoices);

// Admin hoặc hệ thống tự động tạo hóa đơn
router.post("/create", isAuth, invoiceController.createInvoice);

module.exports = router;
