const SosAlert = require("../models/SosAlert");

// Khách tạo yêu cầu SOS
exports.createAlert = async (req, res) => {
  try {
    const { roomId, message } = req.body;
    const userId = req.user.id; // Lấy từ Token

    const newAlert = new SosAlert({
      userId,
      roomId, // Lưu ý:roomId ở đây là String (M-01) như đã chốt
      message,
      status: "pending",
    });

    await newAlert.save();
    // Chỗ này sau này ông có thể thêm Socket.io để bắn thông báo Real-time cho Admin
    res.status(201).json({ success: true, message: "Yêu cầu cứu hộ đã được gửi!" });
  } catch (error) {
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
