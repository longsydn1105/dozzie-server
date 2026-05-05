const SosAlert = require("../models/SosAlert");
const { getIO } = require("../utils/socket");

/**
 * Tạo yêu cầu SOS
 * Input: roomId, message | Output: SOS alert created
 */
exports.createAlert = async (req, res) => {
  try {
    const { roomId, message } = req.body;

    const userId = req.user.id;

    const newAlert = new SosAlert({
      userId,
      roomId,
      message,
      status: "pending",
    });

    await newAlert.save();

    const io = getIO();
    io.emit("ADMIN_SOS_ALERT", {
      sosId: newAlert._id,
      roomId: roomId,
      message: message,
      time: newAlert.createdAt,
    });

    const responseData = { success: true, message: "Yêu cầu cứu hộ đã được gửi!" };
    res.status(201).json(responseData);
  } catch (error) {
    console.error("❌ Error in createAlert:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy danh sách SOS chưa xử lý
 * Input: N/A | Output: All SOS alerts with user info
 */
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await SosAlert.find().populate("userId", "fullName phone").sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin đánh dấu SOS đã xử lý
 * Input: sosId | Output: Updated SOS alert
 */
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedAlert = await SosAlert.findByIdAndUpdate(id, { status: "resolved" }, { new: true });

    if (!updatedAlert) {
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu SOS này." });
    }

    res.status(200).json({
      success: true,
      message: "Đã xác nhận xử lý xong yêu cầu cứu hộ.",
      data: updatedAlert,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái SOS." });
  }
};
