// models/ServicePackage.js
const mongoose = require("mongoose");

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
