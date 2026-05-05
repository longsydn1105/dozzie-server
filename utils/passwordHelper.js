const bcrypt = require("bcryptjs");

/**
 * Hash password for secure storage - Input: password string - Output: hashed password
 */
exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare plain password with hashed password - Input: plainPassword, hashedPassword - Output: boolean
 */
exports.comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
