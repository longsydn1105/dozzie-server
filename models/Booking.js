const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    packageId: { type: Schema.Types.ObjectId, ref: "ServicePackage", required: true },

    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled", "admin_cancelled"],
      default: "pending",
    },

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    actualCheckIn: { type: Date }, // Updated when the digital key is used for the first time

    totalPrice: { type: Number, required: true },
    digitalKey: { type: String, required: true }, // Hash string for door unlocking
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Booking", bookingSchema);
