// server/controllers/Auth.js
const User = require("../models/User"); // "Lôi" model User vào
const jwt = require("jsonwebtoken"); // "Lôi" "máy" "in" "vé" "vào"
const { hashPassword, comparePassword } = require("../utils/passwordHelper");
require("dotenv").config(); // "Lôi" "dotenv" "vào" "để" "lấy" "JWT_SECRET"

exports.register = async (req, res) => {
  try {
    // 1. Tiếp nhận dữ liệu từ request body
    const { fullName, email, password } = req.body;

    // 2. Kiểm tra các trường bắt buộc (Validation cơ bản)
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu.",
      });
    }

    // 3. Chuẩn hóa email và kiểm tra trùng lặp
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email này đã được đăng ký trên hệ thống.",
      });
    }

    // 4. Mã hóa mật khẩu trước khi lưu (Bảo mật tối thượng)
    const encryptedPassword = await hashPassword(password);

    // 5. Khởi tạo và lưu User mới
    const newUser = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: encryptedPassword,
    });

    await newUser.save();

    // 6. Phản hồi thành công (Không gửi lại password cho client)
    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công.",
      data: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    // Log lỗi chi tiết ở server để dev check, nhưng gửi thông báo chung cho user
    console.error("Critical Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    // 1. "Lấy" data
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email hoặc password không được trống" });
    }

    // 2. "Tìm" user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // 404 Not Found
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Mật khẩu sai rồi Đại Ca!" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "3d" });

    // 5. "Trả" "vé" (token) "và" "info" "user" "về" "cho" "client"
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
