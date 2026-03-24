const bcrypt = require("bcryptjs");

/**
 * Mã hóa mật khẩu (Dùng khi Register)
 */
exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * So sánh mật khẩu (Dùng khi Login)
 */
exports.comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
