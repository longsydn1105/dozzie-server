const mongoose = require("mongoose");
const { Schema } = mongoose;

const sosAlertSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },

    status: { type: String, enum: ["pending", "resolved"], default: "pending" },
    message: { type: String, required: true }, // Reason for SOS
    resolvedAt: { type: Date }, // Timestamp when admin clicks "Resolve"
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("SosAlert", sosAlertSchema);
