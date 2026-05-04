const SosAlert = require("../models/SosAlert");
const { getIO } = require("../utils/socket");
// Khách tạo yêu cầu SOS
exports.createAlert = async (req, res) => {
  try {
    const { roomId, message } = req.body;

    const userId = req.user.id; // Lấy từ Token

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

// Admin lấy danh sách các ca SOS chưa xử lý
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await SosAlert.find().populate("userId", "fullName phone").sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- DÀNH CHO ADMIN: ĐÁNH DẤU ĐÃ XỬ LÝ SOS ---
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params; // ID của bản ghi SOS

    const updatedAlert = await SosAlert.findByIdAndUpdate(
      id,
      { status: "resolved" },
      { new: true }, // Trả về bản ghi sau khi đã update
    );

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
