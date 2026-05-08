const Message = require("../models/Message");
const { decryptMessage } = require("../utils/encryptionService"); // Thêm import


/**
 * Lấy lịch sử chat/tin nhắn
 * Input: bookingId | Output: Messages sorted by creation time\n */
exports.getChatHistory = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const messages = await Message.find({ bookingId: bookingId }).sort({ createdAt: 1 }).lean();

    const decryptedMessages = messages.map((msg) => ({
      ...msg,
      text: decryptMessage(msg.text), // Giải mã text
    }));

    return res.status(200).json({
      success: true,
      data: decryptedMessages,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử chat:", error);
    return res.status(500).json({ success: false, message: "Lỗi Server!" });
  }
};
