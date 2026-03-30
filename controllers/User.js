const User = require("../models/User");
const bcrypt = require("bcryptjs"); // Nhớ cài: npm install bcryptjs
const { hashPassword } = require("../utils/passwordHelper");

// --- 1. LẤY TẤT CẢ USER (Admin only) ---
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách user." });
  }
};

// --- 2. LẤY CHI TIẾT 1 USER THEO ID (Admin) ---
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User không tồn tại." });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống." });
  }
};

// --- 3. USER TỰ CẬP NHẬT PROFILE (Chính chủ) ---
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, password } = req.body;
    const userId = req.user.id; // Lấy từ Token, bao an toàn

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;

    if (password) {
      updateData.password = await hashPassword(password);
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select(
      "-password",
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật profile thành công!",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi cập nhật profile:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi cập nhật profile." });
  }
};

// --- 4. ADMIN CẬP NHẬT USER ---
exports.adminUpdateUser = async (req, res) => {
  try {
    const { fullName, phone, role, status } = req.body;
    const targetId = req.params.id;

    // Admin có thể đổi cả role và status
    const updatedUser = await User.findByIdAndUpdate(
      targetId,
      { fullName, phone, role, status },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ success: false, message: "Không tìm thấy user." });

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Admin cập nhật thất bại." });
  }
};

// --- 5. XÓA USER (Admin only) ---
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User không tồn tại." });
    res.status(200).json({ success: true, message: "Đã xóa user thành công." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi xóa user." });
  }
};
