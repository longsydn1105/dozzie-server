const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/Invoice");
const { isAuth, isAdmin } = require("../middleware/auth");

router.get("/my-invoices", isAuth, invoiceController.getMyInvoices);
router.patch("/:id/pay", isAuth, invoiceController.markAsPaid);
router.get("/all", isAuth, isAdmin, invoiceController.getInvoices);
router.post("/create", isAuth, invoiceController.createInvoice);
router.patch("/:id/refund", isAuth, isAdmin, invoiceController.refundInvoice);

module.exports = router;
