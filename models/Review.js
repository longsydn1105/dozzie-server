// server/models/Review.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    timestamps: true, // Tự động có createdAt, updatedAt
  }
);

module.exports = mongoose.model("Review", reviewSchema);
