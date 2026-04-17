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
    // 1. Nhận thêm các tham số Custom mới từ Frontend
    const { timeFilter, status, customDate, customWeek, customMonth } = req.query;
    let query = {};

    // 2. Giữ nguyên logic Trạng thái của ông
    if (status) {
      if (status === "cancelled") {
        query.status = { $in: ["cancelled", "admin_cancelled"] };
      } else {
        query.status = status;
      }
    }

    // 3. Xử lý bộ lọc Thời gian (Dựa trên ngày tạo đơn - createdAt)
    let start, end;
    const now = new Date();

    // Ưu tiên bộ lọc Custom từ UI mới (Ngày, Tuần, Tháng)
    if (customDate) {
      // Đầu ngày đến cuối ngày
      start = new Date(`${customDate}T00:00:00.000Z`);
      end = new Date(`${customDate}T23:59:59.999Z`);
    } else if (customMonth) {
      // customMonth dạng "2024-04" -> Tách ra lấy năm và tháng
      const [year, month] = customMonth.split("-");
      start = new Date(year, month - 1, 1); // Ngày 1 đầu tháng
      end = new Date(year, month, 0, 23, 59, 59, 999); // Ngày cuối cùng của tháng
    } else if (customWeek) {
      // customWeek dạng "2024-W16". (Tính toán theo chuẩn ISO-8601: Tuần bắt đầu từ Thứ 2)
      const [year, week] = customWeek.split("-W");
      const d = new Date(year, 0, 1);
      const days = d.getDay() || 7; // Nếu chủ nhật (0) thì gán thành 7

      d.setDate(d.getDate() + 4 - days); // Dời về Thứ 5 của tuần đầu tiên
      d.setDate(d.getDate() + (week - 1) * 7); // Nhảy tới tuần cần tìm

      start = new Date(d);
      start.setDate(d.getDate() - 3); // Lùi về Thứ 2 (Đầu tuần)
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6); // Tiến tới Chủ Nhật (Cuối tuần)
      end.setHours(23, 59, 59, 999);
    }
    // Fallback: Nếu không có filter mới, chạy logic timeFilter cũ 
    else if (timeFilter) {
      if (timeFilter === "today") {
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
      } else if (timeFilter === "week") {
        const dayOfWeek = now.getDay();
        const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        start = new Date(now);
        start.setDate(now.getDate() + distanceToMonday);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else if (timeFilter === "month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
    }

    // Nếu tính toán ra được khoảng thời gian thì nhét vào query
    if (start && end) {
      query.createdAt = { $gte: start, $lte: end };
    }

    // 4. Thực thi truy vấn (Giữ nguyên y hệt của ông)
    const bookings = await Booking.find(query)
      .populate("userId", "fullName email phone")
      .populate("packageId", "name hours price")
      .populate("roomId", "label floor")
      .sort({ createdAt: -1 });

    // 5. Trả kết quả (Giữ nguyên)
    res.status(200).json({
      success: true,
      count: bookings.length,
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
