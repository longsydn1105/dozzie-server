const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Booking schema - đơn đặt phòng
 */
const bookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roomId: { type: String, ref: "Room", required: true },
    packageId: { type: Schema.Types.ObjectId, ref: "ServicePackage", required: true },

    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled", "admin_cancelled"],
      default: "pending",
    },

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    actualCheckIn: { type: Date },
    totalPrice: { type: Number, required: true },
    digitalKey: { type: String, required: true },
    isReminded10Min: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Booking", bookingSchema);
