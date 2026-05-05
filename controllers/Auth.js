const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../utils/passwordHelper");
require("dotenv").config();

/**
 * Đăng ký tài khoản mới
 * Input: fullName, email, password | Output: User data & role
 */
exports.register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email này đã được đăng ký trên hệ thống.",
      });
    }

    const encryptedPassword = await hashPassword(password);
    const newUser = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: encryptedPassword,
    });

    await newUser.save();

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
    console.error("Critical Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
      error: error.message,
    });
  }
};

/**
 * Đăng nhập - xác thực email & password, phát token
 * Input: email, password | Output: JWT token & user info
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email hoặc password không được trống" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    if (user.status === "banned") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!",
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Mật khẩu sai rồi hoặc tài khoản rồi!" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

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
