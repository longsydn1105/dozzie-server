const Booking = require("../models/Booking");
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
// Thay thế hàm getMyInvoices hiện tại của ông bằng hàm này
exports.getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user.id })
      .populate({
        path: "bookingId",
        populate: [
          { path: "roomId" }, // Cứ để trống vậy, Mongoose sẽ tự hiểu. Nếu có Collection Room nó lấy Object, không có nó trả về chuỗi gốc "M-01"
          { path: "packageId", select: "name hours", model: "ServicePackage" }, // Lấy tên gói và số giờ
        ],
      })
      .sort({ createdAt: -1 });

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

// --- KHÁCH: THANH TOÁN HÓA ĐƠN ---
exports.markAsPaid = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const userId = req.user.id;

    // Tìm hóa đơn. Bắt buộc phải check userId để tránh thằng này thanh toán giùm thằng kia
    const invoice = await Invoice.findOne({ _id: invoiceId, userId: userId });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hóa đơn của bạn." });
    }

    // Chỉ hóa đơn 'pending' mới được thanh toán
    if (invoice.paymentStatus !== "pending") {
      return res.status(400).json({ success: false, message: "Hóa đơn này đã được xử lý từ trước!" });
    }

    // Cập nhật trạng thái và thời gian thanh toán
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

// --- ADMIN: HOÀN TIỀN CHO KHÁCH ---
exports.refundInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hóa đơn trên hệ thống." });
    }

    // Chỉ hoàn tiền cho đơn đã 'paid'
    if (invoice.paymentStatus !== "paid") {
      return res.status(400).json({ success: false, message: "Chỉ có thể hoàn tiền cho hóa đơn ĐÃ THANH TOÁN." });
    }

    // Đổi trạng thái
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
