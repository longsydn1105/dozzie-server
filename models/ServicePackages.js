const mongoose = require("mongoose");

/**
 * ServicePackage schema - gói dịch vụ phòng
 */
const servicePackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hours: { type: Number, required: true },
    price: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ServicePackage", servicePackageSchema);
