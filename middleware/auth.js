const jwt = require("jsonwebtoken");

// 1. Hàm isAuth: Kiểm tra xem User đã đăng nhập (có Token xịn) chưa
exports.isAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Hành động yêu cầu đăng nhập. Vui lòng gửi kèm mã xác thực (Token).",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Lưu thông tin giải mã (id, role) vào đối tượng req để dùng ở Controller
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Phiên làm việc đã hết hạn hoặc mã xác thực không hợp lệ.",
    });
  }
};

// 2. Hàm isAdmin: Kiểm tra xem User có quyền Admin không
// Lưu ý: Hàm này phải đứng SAU isAuth trong Route
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next(); // Là Admin thì cho qua
  } else {
    return res.status(403).json({
      success: false,
      message: "Truy cập bị từ chối. Khu vực này chỉ dành cho quản trị viên.",
    });
  }
};
