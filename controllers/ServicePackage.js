const ServicePackages = require("../models/ServicePackages");

// Tạo gói mới (Admin dùng)
exports.createPackage = async (req, res) => {
  try {
    const { name, hours, price } = req.body;
    const newPackage = new ServicePackages({ name, hours, price });
    await newPackage.save();
    res.status(201).json({ success: true, data: newPackage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách gói đang hoạt động (Khách dùng để chọn khi đặt phòng)
exports.getPackages = async (req, res) => {
  try {
    const packages = await ServicePackage.find({ isActive: true }).sort({ hours: 1 });
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
