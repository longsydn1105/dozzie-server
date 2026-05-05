const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let serviceAccount;

const renderSecretPath = "/etc/secrets/firebase-service-account.json";
const localConfigPath = path.join(__dirname, "../config/firebase-service-account.json");

if (fs.existsSync(renderSecretPath)) {
  serviceAccount = require(renderSecretPath);
  console.log("🟢 [FCM] Đang đọc Firebase Key từ Render Secret");
} else {
  serviceAccount = require(localConfigPath);
  console.log("💻 [FCM] Đang đọc Firebase Key từ máy Local");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/**
 * Send FCM data message (silent notification with payload)
 * Input: token (device token), dataPayload (object with string values)
 */
const sendDataMessage = async (token, dataPayload) => {
  try {
    const message = {
      data: dataPayload,
      token: token,
    };
    const response = await admin.messaging().send(message);
    console.log("✅ [FCM] Đã gửi lệnh báo thức thành công:", response);
    return response;
  } catch (error) {
    console.error("❌ [FCM] Lỗi gửi mật lệnh Data Message:", error.message);
  }
};

/**
 * Send FCM notification message (visible notification on screen)
 * Input: token (device token), title, body - Output: FCM response
 */
const sendNotification = async (token, title, body) => {
  try {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: token,
    };
    const response = await admin.messaging().send(message);
    console.log("✅ [FCM] Đã gửi thông báo thành công:", response);
    return response;
  } catch (error) {
    console.error("❌ [FCM] Lỗi gửi Notification Message:", error.message);
  }
};

module.exports = {
  sendDataMessage,
  sendNotification,
};
