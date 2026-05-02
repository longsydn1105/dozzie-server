// models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    roomId: { type: String, required: true }, // VD: "M-01" để Admin dễ nhìn
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Khách gửi
    senderRole: { type: String, enum: ["customer", "admin"], required: true },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", messageSchema);
