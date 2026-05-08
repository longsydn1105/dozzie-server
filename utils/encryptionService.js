const crypto = require("crypto");

// Lấy encryption key từ env (hoặc sinh mặc định - chỉ dùng để demo)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, "hex")
  : crypto.scryptSync(process.env.JWT_SECRET, "salt", 32); 

const ALGORITHM = "aes-256-gcm";
const AUTH_TAG_LENGTH = 16; // Byte

/**
 * Mã hoá tin nhắn đối xứng (AES-256-GCM)
 * Input: plaintext (string)
 * Output: { iv, ciphertext, authTag } dạng hex string, object được stringify lưu vào DB
 */
function encryptMessage(plaintext) {
  const iv = crypto.randomBytes(16); // IV ngẫu nhiên mỗi tin
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag(); // GCM tag xác thực

  return JSON.stringify({
    iv: iv.toString("hex"),
    ciphertext: encrypted,
    authTag: authTag.toString("hex"),
  });
}

/**
 * Giải mã tin nhắn
 * Input: encryptedData (string JSON từ DB)
 * Output: plaintext (string)
 */
function decryptMessage(encryptedData) {
  try {
    const { iv, ciphertext, authTag } = JSON.parse(encryptedData);

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(iv, "hex"));

    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Lỗi giải mã tin nhắn:", error);
    throw new Error("Không thể giải mã tin nhắn - dữ liệu bị hỏng hoặc key sai");
  }
}

module.exports = {
  encryptMessage,
  decryptMessage,
};
