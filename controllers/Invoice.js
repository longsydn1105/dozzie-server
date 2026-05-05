const Booking = require("../models/Booking");
const Invoice = require("../models/Invoice");

/**
 * Tạo hóa đơn cho booking
 * Input: bookingId, userId, roomCharge, extraFee | Output: New invoice
 */
exports.createInvoice = async (req, res) => {
  try {
    const { bookingId, userId, roomCharge, extraFee } = req.body;

    const invoiceCode = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const newInvoice = new Invoice({
      bookingId,
      userId,
      invoiceCode,
      roomCharge,
      extraFee: extraFee || 0,
      totalAmount: roomCharge + (extraFee || 0),
      paymentStatus: "pending",
    });

    await newInvoice.save();
    res.status(201).json({ success: true, data: newInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy hóa đơn của người dùng
 * Input: userId (from token) | Output: User's invoices with booking details
 */
exports.getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user.id })
      .populate({
        path: "bookingId",
        populate: [{ path: "roomId" }, { path: "packageId", select: "name hours", model: "ServicePackage" }],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy tất cả hóa đơn (Admin)
 * Input: N/A | Output: All invoices with user & booking details
 */
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate({
        path: "userId",
        select: "fullName email phone",
      })
      .populate({
        path: "bookingId",
        populate: [{ path: "roomId" }, { path: "packageId", select: "name hours", model: "ServicePackage" }],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      results: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error("Lỗi getInvoices Admin:", error);
    res.status(500).json({ success: false, message: "Không thể truy xuất danh sách hóa đơn." });
  }
};

/**
 * Người dùng thanh toán hóa đơn
 * Input: invoiceId | Output: Marked invoice as paid, booking activated
 */
exports.markAsPaid = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const userId = req.user.id;

    const invoice = await Invoice.findOne({ _id: invoiceId, userId: userId });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hóa đơn của bạn." });
    }

    if (invoice.paymentStatus !== "pending") {
      return res.status(400).json({ success: false, message: "Hóa đơn này đã được xử lý từ trước!" });
    }

    invoice.paymentStatus = "paid";
    invoice.paidAt = new Date();
    await invoice.save();

    await Booking.findByIdAndUpdate(invoice.bookingId, { status: "active" });

    res.status(200).json({
      success: true,
      message: "Thanh toán thành công! Chúc bạn có trải nghiệm tuyệt vời.",
      data: invoice,
    });
  } catch (error) {
    console.error("Lỗi markAsPaid:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi thanh toán." });
  }
};

/**
 * Admin hoàn tiền cho khách
 * Input: invoiceId | Output: Invoice marked as refunded
 */
exports.refundInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hóa đơn trên hệ thống." });
    }

    if (invoice.paymentStatus !== "paid") {
      return res.status(400).json({ success: false, message: "Chỉ có thể hoàn tiền cho hóa đơn ĐÃ THANH TOÁN." });
    }

    invoice.paymentStatus = "refunded";

    await invoice.save();

    res.status(200).json({
      success: true,
      message: "Đã hoàn tiền (Refund) cho khách hàng thành công.",
      data: invoice,
    });
  } catch (error) {
    console.error("Lỗi refundInvoice:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi xử lý hoàn tiền." });
  }
};
