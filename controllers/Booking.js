// server/controllers/Booking.js
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const sendBookingEmail = require("../utils/sendMail");

// --- 1. TẠO BOOKING (NHIỀU PHÒNG 1 LÚC) ---
exports.createBooking = async (req, res) => {
  try {
    const {
      roomIds, // Bây giờ nhận vào là mảng ["M-01", "M-02"]
      startTime,
      endTime,
      name,
      email,
      phone,
    } = req.body;

    // Parse ngày
    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    // ⭐️ LOGIC CHECK KẸT GIỜ (NÂNG CẤP) ⭐️
    // Tìm xem có booking nào trong DB mà:
    // 1. Có chứa ÍT NHẤT 1 phòng trong danh sách khách đang chọn ($in)
    // 2. VÀ Thời gian bị trùng (Overlap)
    const conflictBooking = await Booking.findOne({
      roomIds: { $in: roomIds }, // Check mảng này có đụng mảng kia không
      $or: [{ startTime: { $lt: newEndTime }, endTime: { $gt: newStartTime } }],
    });

    if (conflictBooking) {
      // Tìm ra cụ thể phòng nào bị kẹt để báo lỗi cho xịn
      // (Logic đơn giản: Báo chung chung trước)
      return res.status(409).json({
        message:
          "Opps! Một trong các phòng bạn chọn đã bị người khác nhanh tay đặt mất trong khung giờ này. Vui lòng chọn phòng khác hoặc giờ khác.",
      });
    }

    // --- NGON! KHÔNG KẸT ---
    const newBooking = new Booking({
      roomIds, // Lưu mảng
      startTime: newStartTime,
      endTime: newEndTime,
      name,
      email,
      phone,
    });

    await newBooking.save();
    // 2. GỌI HÀM GỬI MAIL (Chạy ngầm - Fire and Forget)
    // Mình không dùng 'await' ở đây để khách nhận phản hồi ngay lập tức, mail cứ từ từ gửi sau
    sendBookingEmail(email, newBooking).catch((err) =>
      console.error("Lỗi gửi mail ngầm:", err)
    );
    // (Tại đây ông có thể gọi hàm gửi mail xác nhận luôn)
    // const sendBookingEmail = require('../utils/sendMail');
    // sendBookingEmail(email, newBooking).catch(console.error);

    res.status(201).json({
      message: 'Booking "chốt đơn" thành công! Kiểm tra email nhé.',
      data: newBooking,
    });
  } catch (error) {
    console.error("Lỗi createBooking:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// --- 2. LẤY BOOKING (ĐỂ VẼ TIMELINE) ---
exports.getBookings = async (req, res) => {
  try {
    const filter = {};
    const { roomId, date } = req.query;

    // Logic tìm kiếm:
    // Nếu client hỏi lịch của phòng "M-01"
    // Ta phải tìm các Booking mà trong mảng roomIds CÓ CHỨA "M-01"
    if (roomId) {
      filter.roomIds = roomId; // Mongoose tự hiểu là "tìm mảng có chứa phần tử này"
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      filter.startTime = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const bookings = await Booking.find(filter).sort({ startTime: 1 });

    res.status(200).json({
      message: "Lấy data thành công",
      data: bookings,
    });
  } catch (error) {
    console.error("Lỗi getBookings:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
