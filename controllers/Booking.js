// server/controllers/Booking.js
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const sendBookingEmail = require("../utils/sendMail");

// --- 1. TẠO BOOKING (NHIỀU PHÒNG 1 LÚC) ---
exports.createBooking = async (req, res) => {
  try {
    const {
      roomIds, // Mảng phòng ["A-01", "A-02"]
      startTime,
      endTime,
      name,
      email,
      phone,
    } = req.body;

    // 1. Parse ngày giờ
    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    // 2. CHECK KẸT GIỜ (Logic của sếp đang rất ngon)
    const conflictBooking = await Booking.findOne({
      roomIds: { $in: roomIds },
      $or: [{ startTime: { $lt: newEndTime }, endTime: { $gt: newStartTime } }],
    });

    if (conflictBooking) {
      return res.status(409).json({
        message:
          "Opps! Một trong các phòng bạn chọn đã bị người khác đặt mất trong khung giờ này.",
      });
    }

    // 3. TẠO BOOKING MỚI
    const newBooking = new Booking({
      roomIds,
      startTime: newStartTime,
      endTime: newEndTime,
      name,
      email,
      phone,
    });

    // Lưu vào DB
    await newBooking.save();

    // ============================================================
    // 4. GỬI MAIL (Fire and Forget)
    // ============================================================
    // Tạo data đẹp để gửi sang file sendMail
    const mailData = {
      name: name,
      startTime: newStartTime,
      endTime: newEndTime,
      roomIds: roomIds,
    };

    // Gọi hàm gửi mail (Có catch lỗi để ko làm sập server nếu mail lỗi)
    sendBookingEmail(email, mailData)
      .then(() => console.log(`✅ Đã gửi lệnh mail tới: ${email}`))
      .catch((err) => console.error("❌ Lỗi gửi mail ngầm:", err));

    // ============================================================

    // 5. Trả về kết quả ngay cho khách (không cần chờ mail)
    res.status(201).json({
      message: "Booking thành công! Vui lòng kiểm tra email xác nhận.",
      data: newBooking,
    });
  } catch (error) {
    console.error("Lỗi createBooking:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// --- 2. LẤY BOOKING (ĐÃ FIX LOGIC OVERLAP) ---
exports.getBookings = async (req, res) => {
  try {
    const filter = {};
    const { roomId, date } = req.query;

    if (roomId) {
      filter.roomIds = roomId;
    }

    if (date) {
      // Ví dụ date = "2025-11-25"
      const targetDayStart = new Date(date); // 00:00:00 ngày 25
      const targetDayEnd = new Date(date);
      targetDayEnd.setDate(targetDayEnd.getDate() + 1); // 00:00:00 ngày 26

      // ⭐️ LOGIC MỚI: TÌM GIAO NHAU (OVERLAP) ⭐️
      // Một booking được coi là bận trong ngày 25 nếu:
      // 1. Nó bắt đầu TRƯỚC khi ngày 25 kết thúc
      // 2. VÀ Nó kết thúc SAU khi ngày 25 bắt đầu
      filter.startTime = { $lt: targetDayEnd };
      filter.endTime = { $gt: targetDayStart };
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
