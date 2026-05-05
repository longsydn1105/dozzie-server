const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * SosAlert schema - cảnh báo SOS/yêu cầu cứu hộ
 */
const sosAlertSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roomId: { type: String, ref: "Room", required: true },

    status: { type: String, enum: ["pending", "resolved"], default: "pending" },
    message: { type: String, required: true },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("SosAlert", sosAlertSchema);
