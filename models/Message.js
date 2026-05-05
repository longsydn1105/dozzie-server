const mongoose = require("mongoose");

/**
 * Message schema - tin nhắn chat
 */
const messageSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    roomId: { type: String, required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    senderRole: { type: String, enum: ["customer", "admin"], required: true },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", messageSchema);
