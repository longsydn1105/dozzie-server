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
    const packageInfo = await ServicePackages.findById(packageId);
    if (!packageInfo) {
      return res.status(404).json({ success: false, message: "Gói dịch vụ không tồn tại." });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + packageInfo.hours * 60 * 60 * 1000);

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
      totalPrice: packageInfo.price,
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

// --- API QUẢN LÝ ĐƠN ĐẶT PHÒNG (Dành cho Admin) ---
exports.getAllBookingsForAdmin = async (req, res) => {
  try {
    // Nhận tham số từ Frontend (ví dụ: /api/bookings/admin?timeFilter=today&status=cancelled)
    const { timeFilter, status } = req.query;
    let query = {};

    // 1. Xử lý bộ lọc Trạng thái (Status)
    if (status) {
      // Nếu Frontend muốn xem đơn hủy, mình lấy luôn cả đơn khách tự hủy và admin hủy
      if (status === "cancelled") {
        query.status = { $in: ["cancelled", "admin_cancelled"] };
      } else {
        query.status = status;
      }
    }

    // 2. Xử lý bộ lọc Thời gian (Dựa trên ngày tạo đơn - createdAt)
    if (timeFilter) {
      const now = new Date();
      let start, end;

      if (timeFilter === "today") {
        // Từ 00:00:00 đến 23:59:59 của ngày hôm nay
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
      } else if (timeFilter === "week") {
        // Từ Thứ 2 đến Chủ Nhật tuần này
        const dayOfWeek = now.getDay();
        const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Fix lỗi Chủ nhật là ngày 0

        start = new Date(now);
        start.setDate(now.getDate() + distanceToMonday);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else if (timeFilter === "month") {
        // Từ mùng 1 đến ngày cuối cùng của tháng này
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      // Đẩy điều kiện vào object query của Mongoose
      if (start && end) {
        query.createdAt = { $gte: start, $lte: end };
      }
    }

    // 3. Thực thi truy vấn và "Join" bảng (Populate)
    const bookings = await Booking.find(query)
      .populate("userId", "fullName email phone") // Lấy thông tin khách hàng (Sửa lại trường cho khớp với User model của ông)
      .populate("packageId", "name hours price") // Lấy thông tin gói dịch vụ
      .populate("roomId", "label floor") // Lấy thông tin phòng (Ref bằng String vẫn populate được nếu khớp _id)
      .sort({ createdAt: -1 }); // Sắp xếp: Đơn mới nhất lên đầu tiên

    // 4. Trả kết quả về Frontend
    res.status(200).json({
      success: true,
      count: bookings.length, // Bắn thêm cái count để Frontend show số lượng lên Badge
      data: bookings,
    });
  } catch (error) {
    console.error("Lỗi tại getAllBookingsForAdmin:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lấy danh sách booking.",
    });
  }
};
