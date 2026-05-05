const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Review schema - đánh giá phòng
 */
const reviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    isShow: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Review", reviewSchema);
