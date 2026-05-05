const Message = require("../models/Message");

/**
 * Lấy lịch sử chat/tin nhắn
 * Input: bookingId | Output: Messages sorted by creation time\n */
exports.getChatHistory = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const messages = await Message.find({ bookingId: bookingId }).sort({ createdAt: 1 }).lean();

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử chat:", error);
    return res.status(500).json({ success: false, message: "Lỗi Server!" });
  }
};
