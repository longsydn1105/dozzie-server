const Message = require("../models/Message");

exports.getChatHistory = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Lấy tin nhắn cũ, sắp xếp từ cũ tới mới (tăng dần theo thời gian)
    const messages = await Message.find({ bookingId: bookingId }).sort({ createdAt: 1 }).lean(); // Dùng .lean() cho nhẹ server vì chỉ cần đọc data

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử chat:", error);
    return res.status(500).json({ success: false, message: "Lỗi Server!" });
  }
};
