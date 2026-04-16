const Booking = require("../models/Booking");
const Room = require("../models/Room");
const { v4: uuidv4 } = require("uuid"); // npm install uuid để tạo Key mở cửa
const ServicePackages = require("../models/ServicePackages");
const Invoice = require("../models/Invoice");

// --- 1. TẠO BOOKING MỚI ---
exports.createBooking = async (req, res) => {
  try {
    const { roomId, packageId, startTime } = req.body;
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
      status: { $ne: "cancelled" }, // Bỏ qua mấy đơn bùng/đã hủy
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
    });

    if (isRoomBusy) {
      return res.status(409).json({
        success: false,
        message: "Phòng này đã có người đặt trong khung giờ bạn chọn.",
      });
    }

    // 3. TẠO MÃ KHÓA KỸ THUẬT SỐ (Digital Key)
    const digitalKey = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. LƯU BOOKING (Giữ chỗ - Pending)
    const newBooking = new Booking({
      userId,
      roomId,
      packageId,
      startTime: start,
      endTime: end,
      totalPrice: packageInfo.price,
      digitalKey,
      status: "pending", // Đợi thanh toán
    });

    await newBooking.save();

    // 5. TẠO HÓA ĐƠN ĐI KÈM (Cũng Pending luôn)
    // Mã hóa đơn: INV-ThờiGian-SốNgẫuNhiên
    const invoiceCode = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newInvoice = new Invoice({
      bookingId: newBooking._id,
      userId: userId,
      invoiceCode: invoiceCode,
      roomCharge: packageInfo.price,
      totalAmount: packageInfo.price, // Tiền phòng gốc (chưa có phụ phí)
      paymentStatus: "pending", // Đợi tiền ting ting
    });

    await newInvoice.save();

    // 6. TRẢ VỀ CẢ 2 CHO CLIENT
    res.status(201).json({
      success: true,
      message: "Giữ chỗ thành công! Bạn có có 15 phút để hoàn tất thanh toán.",
      data: {
        booking: newBooking,
        invoice: newInvoice,
      },
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

// --- LẤY CHI TIẾT 1 BOOKING ---
exports.getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId)
      .populate("userId", "fullName email phone")
      .populate("packageId", "name hours price")
      .populate("roomId", "label floor");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng này." });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Lỗi getBookingById:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy chi tiết đơn." });
  }
};

// --- CẬP NHẬT BOOKING ---
exports.updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const updateData = req.body;

    // findByIdAndUpdate: Tìm và update luôn.
    // - new: true -> Trả về data MỚI SAU KHI UPDATE (chứ không phải data cũ)
    // - runValidators: true -> Ép Mongoose phải check lại Enum của status (chống việc update bậy bạ status thành "abc")
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, updateData, { new: true, runValidators: true });

    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng để cập nhật." });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật đơn đặt phòng thành công!",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Lỗi updateBooking:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi cập nhật đơn. Có thể sai format dữ liệu." });
  }
};

// --- XÓA BOOKING ---
exports.deleteBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;

    const deletedBooking = await Booking.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng để xóa." });
    }

    res.status(200).json({
      success: true,
      message: `Đã xóa vĩnh viễn đơn đặt phòng ${bookingId}.`,
    });
  } catch (error) {
    console.error("Lỗi deleteBookingById:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi xóa đơn." });
  }
};

// --- USER TỰ HỦY ĐƠN (Self-Service Cancel) ---
exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn này." });
    }

    if (booking.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Không thể hủy đơn của người khác",
      });
    }

    // 3. Kiểm tra điều kiện hủy (Ví dụ: Chỉ cho hủy nếu đơn đang 'pending' hoặc chưa đến giờ)
    if (booking.status === "active" || booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy phòng đang dùng hoặc đã dùng xong",
      });
    }

    // 4. Tiến hành cập nhật trạng thái thành 'cancelled'
    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Đã hủy đơn thành công. Hẹn gặp lại lần sau!",
      data: booking,
    });
  } catch (error) {
    console.error("Lỗi cancelBooking:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi hủy đơn." });
  }
};

// --- LẤY TẤT CẢ BOOKING CỦA CHÍNH MÌNH (Lịch sử cá nhân) ---
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.find({ userId: userId })
      .populate("packageId", "name hours price") // Lấy thông tin gói để show ra UI
      .populate("roomId", "label floor") // Lấy tên phòng
      .sort({ createdAt: -1 }); // Đơn mới nhất xếp lên đầu

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Lỗi getMyBookings:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy lịch sử đặt phòng." });
  }
};
