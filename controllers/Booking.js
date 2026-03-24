const Booking = require("../models/Booking");
const Room = require("../models/Room");
const { v4: uuidv4 } = require("uuid"); // npm install uuid để tạo Key mở cửa
const ServicePackages = require("../models/ServicePackages");

// --- 1. TẠO BOOKING MỚI ---
exports.createBooking = async (req, res) => {
  try {
    const {
      roomId, // "M-01"
      packageId, // ID của gói 3h, 6h...
      startTime, // ISO String từ Client gửi lên
    } = req.body;

    // Lấy userId từ Middleware Auth (Sau khi ông đã đăng nhập)
    const userId = req.user.id;

    // 1. Kiểm tra gói dịch vụ để tính giá và thời gian kết thúc
    const ServicePackages = await ServicePackages.findById(packageId);
    if (!ServicePackages) {
      return res.status(404).json({ success: false, message: "Gói dịch vụ không tồn tại." });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + ServicePackages.hours * 60 * 60 * 1000);

    // 2. CHECK TRÙNG LỊCH (Overlap Logic)
    const isRoomBusy = await Booking.findOne({
      roomId: roomId,
      status: { $ne: "cancelled" }, // Không tính các đơn đã hủy
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
    });

    if (isRoomBusy) {
      return res.status(409).json({
        success: false,
        message: "Phòng này đã có người đặt trong khung giờ bạn chọn.",
      });
    }

    // 3. TẠO MÃ KHÓA KỸ THUẬT SỐ (Digital Key)
    // Thực tế sẽ là một chuỗi Hash, ở đây ta tạo chuỗi ngẫu nhiên 6 số cho dễ demo
    const digitalKey = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. LƯU BOOKING
    const newBooking = new Booking({
      userId,
      roomId,
      packageId,
      startTime: start,
      endTime: end,
      totalPrice: ServicePackages.price,
      digitalKey, // Đây là cái khách sẽ dùng để mở cửa qua MQTT
      status: "pending",
    });

    await newBooking.save();

    // 5. CẬP NHẬT TRẠNG THÁI PHÒNG (Optional - tùy logic của ông)
    // Thường thì khi khách Check-in mới đổi sang 'occupied'

    res.status(201).json({
      success: true,
      message: "Đặt phòng thành công! Mã mở cửa sẽ khả dụng khi đến giờ nhận phòng.",
      data: newBooking,
    });
  } catch (error) {
    console.error("Lỗi createBooking:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi đặt phòng." });
  }
};

// --- 2. LẤY DANH SÁCH BOOKING (Dành cho Admin hoặc Lịch sử khách) ---
exports.getBookings = async (req, res) => {
  try {
    const { roomId, userId, status } = req.query;
    const filter = {};

    if (roomId) filter.roomId = roomId;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("userId", "fullName email") // Lấy thêm tên khách
      .populate("packageId", "name hours") // Lấy thêm tên gói
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không thể lấy danh sách đặt phòng." });
  }
};
