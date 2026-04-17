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

exports.getAllPackages = async (req, res) => {
  try {
    const packages = await ServicePackages.find({}).sort({ hours: 1 });
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllActivePackages = async (req, res) => {
  try {
    const packages = await ServicePackages.find({ isActive: true }).sort({ hours: 1 });
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SỬA GÓI DỊCH VỤ (Chỉ Admin) ---
exports.updatePackage = async (req, res) => {
  try {
    const { name, hours, price, isActive } = req.body;
    const packageId = req.params.id;

    // Dùng { new: true } để Mongoose trả về object MỚI SAU KHI sửa
    const updatedPackage = await ServicePackages.findByIdAndUpdate(
      packageId,
      { name, hours, price, isActive },
      { new: true, runValidators: true },
    );

    if (!updatedPackage) {
      return res.status(404).json({ success: false, message: "Không tìm thấy gói dịch vụ này!" });
    }

    res.status(200).json({ success: true, data: updatedPackage });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi cập nhật gói: " + error.message });
  }
};

// --- XÓA GÓI DỊCH VỤ (Chỉ Admin) ---
exports.deletePackage = async (req, res) => {
  try {
    const packageId = req.params.id;

    // Xóa cứng (Hard Delete) khỏi database
    const deletedPackage = await ServicePackages.findByIdAndDelete(packageId);

    if (!deletedPackage) {
      return res.status(404).json({ success: false, message: "Không tìm thấy gói dịch vụ này!" });
    }

    res.status(200).json({ success: true, message: "Đã xóa gói dịch vụ thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi xóa gói: " + error.message });
  }
};
