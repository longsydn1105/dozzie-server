const Booking = require("../models/Booking");
const Room = require("../models/Room");
const { v4: uuidv4 } = require("uuid");
const ServicePackages = require("../models/ServicePackages");
const Invoice = require("../models/Invoice");

/**
 * Tạo booking mới - giữ chỗ phòng trong 15 phút chờ thanh toán
 * Input: roomId, packageId, startTime | Output: Booking & invoice data
 */
exports.createBooking = async (req, res) => {
  try {
    const { roomId, packageId, startTime } = req.body;

    const userId = req.user.id;

    const packageInfo = await ServicePackages.findById(packageId);
    if (!packageInfo) {
      return res.status(404).json({ success: false, message: "Gói dịch vụ không tồn tại." });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + packageInfo.hours * 60 * 60 * 1000);

    const isRoomBusy = await Booking.findOne({
      roomId,
      status: { $in: ["pending", "active"] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (isRoomBusy) {
      return res.status(409).json({
        success: false,
        message: "Phòng này đã có người đặt trong khung giờ bạn chọn.",
      });
    }

    const digitalKey = Math.floor(100000 + Math.random() * 900000).toString();

    const newBooking = new Booking({
      userId,
      roomId,
      packageId,
      startTime: start,
      endTime: end,
      totalPrice: packageInfo.price,
      digitalKey,
      status: "pending",
    });

    await newBooking.save();

    const invoiceCode = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newInvoice = new Invoice({
      bookingId: newBooking._id,
      userId: userId,
      invoiceCode: invoiceCode,
      roomCharge: packageInfo.price,
      totalAmount: packageInfo.price,
      paymentStatus: "pending",
    });

    await newInvoice.save();

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

/**
 * Lấy danh sách booking với bộ lọc
 * Input: roomId, userId, status (optional) | Output: Booking list
 */
exports.getBookings = async (req, res) => {
  try {
    const { roomId, userId, status } = req.query;
    const filter = {};

    if (roomId) filter.roomId = roomId;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("userId", "fullName email")
      .populate("packageId", "name hours")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không thể lấy danh sách đặt phòng." });
  }
};

/**
 * Lấy tất cả booking (Admin) - hỗ trợ lọc theo ngày, tuần, tháng
 * Input: status, customDate, customWeek, customMonth | Output: Filtered bookings
 */
exports.getAllBookingsForAdmin = async (req, res) => {
  try {
    const { timeFilter, status, customDate, customWeek, customMonth } = req.query;
    let query = {};

    if (status) {
      if (status === "cancelled") {
        query.status = { $in: ["cancelled", "admin_cancelled"] };
      } else {
        query.status = status;
      }
    }

    let start, end;
    const now = new Date();

    if (customDate) {
      start = new Date(`${customDate}T00:00:00.000Z`);
      end = new Date(`${customDate}T23:59:59.999Z`);
    } else if (customMonth) {
      const [year, month] = customMonth.split("-");
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0, 23, 59, 59, 999);
    } else if (customWeek) {
      const [year, week] = customWeek.split("-W");
      const d = new Date(year, 0, 1);
      const days = d.getDay() || 7;

      d.setDate(d.getDate() + 4 - days);
      d.setDate(d.getDate() + (week - 1) * 7);

      start = new Date(d);
      start.setDate(d.getDate() - 3);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (timeFilter) {
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

    if (start && end) {
      query.createdAt = { $gte: start, $lte: end };
    }

    const bookings = await Booking.find(query)
      .populate("userId", "fullName email phone")
      .populate("packageId", "name hours price")
      .populate("roomId", "label floor")
      .sort({ createdAt: -1 });

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

/**
 * Lấy chi tiết một booking theo ID
 * Input: bookingId | Output: Booking details
 */
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

/**
 * Cập nhật booking
 * Input: bookingId, updateData | Output: Updated booking
 */
exports.updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const updateData = req.body;

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

/**
 * Xóa booking
 * Input: bookingId | Output: Deleted booking
 */
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

/**
 * Người dùng tự hủy booking của mình
 * Input: bookingId | Output: Cancelled booking
 */
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

    if (booking.status === "active" || booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy phòng đang dùng hoặc đã dùng xong",
      });
    }

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

/**
 * Lấy lịch sử đặt phòng của người dùng
 * Input: userId (from token) | Output: User's bookings
 */
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.find({ userId: userId })
      .populate("packageId", "name hours price")
      .populate("roomId", "label floor")
      .sort({ createdAt: -1 });

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

/**
 * Lấy trạng thái booking hiện tại của user
 * Input: userId (from token) | Output: canBookNew, activeBooking, pendingCount
 */
exports.getMyStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const ongoingBookings = await Booking.find({
      userId: userId,
      status: { $in: ["pending", "active"] },
    });

    const activeBooking = ongoingBookings.find((b) => b.status === "active");

    return res.status(200).json({
      success: true,
      data: {
        canBookNew: ongoingBookings.length === 0,
        activeBooking: activeBooking || null,
        pendingCount: ongoingBookings.filter((b) => b.status === "pending").length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};
