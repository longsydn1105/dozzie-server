const Invoice = require("../models/Invoice");

// Tạo hóa đơn (Thường gọi nội bộ sau khi Booking thành công)
exports.createInvoice = async (req, res) => {
  try {
    const { bookingId, userId, roomCharge, extraFee } = req.body;

    // Tạo mã hóa đơn duy nhất: INV-NgàyTháng-SốNgẫu Nhiên
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

// Khách xem hóa đơn của chính mình
exports.getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user.id }).populate("bookingId").sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- DÀNH CHO ADMIN: LẤY TOÀN BỘ HÓA ĐƠN HỆ THỐNG ---
exports.getInvoices = async (req, res) => {
  try {
    // Lấy tất cả, sắp xếp cái mới nhất lên đầu
    // Populate để xem tên khách và chi tiết phòng đã đặt
    const invoices = await Invoice.find()
      .populate({
        path: "userId",
        select: "fullName email phone", // Chỉ lấy các field cần thiết
      })
      .populate({
        path: "bookingId",
        select: "roomId startTime endTime",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      results: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error("Lỗi getInvoices Admin:", error);
    res.status(500).json({
      success: false,
      message: "Không thể truy xuất danh sách hóa đơn toàn hệ thống.",
    });
  }
};
