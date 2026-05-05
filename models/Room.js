const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Room schema - phòng hotel
 */
const roomSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    label: { type: String, required: true },
    gender: { type: String, required: true, enum: ["Nam", "Nữ"] },
    floor: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance", "cleaning"],
      default: "available",
    },
    iotConfig: {
      deviceId: { type: String, required: true },
      topicDoor: { type: String, required: true },
      topicPower: { type: String, required: true },
      isOnline: { type: Boolean, default: false },
      lastPing: { type: Date },
    },
  },
  {
    _id: false,
    timestamps: true,
  },
);

module.exports = mongoose.model("Room", roomSchema);
