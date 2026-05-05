const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * User schema - người dùng hệ thống
 */
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["active", "banned"], default: "active" },
    fcmToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
