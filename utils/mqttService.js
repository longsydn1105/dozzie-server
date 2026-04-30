const mqtt = require("mqtt");

// 1. Thiết lập kết nối lên HiveMQ
const client = mqtt.connect("mqtts://5653d5f2e0414799b77d163d0c6c7e26.s1.eu.hivemq.cloud", {
  username: "dozzieiot",
  password: "Dozzie123@",
});

// Lắng nghe các sự kiện trạng thái
client.on("connect", () => {
  console.log("✅ Kết nối HiveMQ thành công! Cổng IoT đã mở.");
});

client.on("error", (err) => {
  console.error("❌ Lỗi kết nối MQTT:", err);
});

client.on("reconnect", () => {
  console.log("🔄 Đang thử kết nối lại với HiveMQ...");
});

// 2. Tạo một hàm dùng chung để các file khác (như API) gọi vào
const sendCommandToRoom = (topic, payload) => {
  // Kiểm tra xem có đang kết nối không mới cho gửi
  if (client.connected) {
    // Ưu tiên lấy riêng field command nếu payload là object có cấu trúc { command, ... }
    const command = (() => {
      if (payload && typeof payload === "object") {
        if (payload.command !== undefined && payload.command !== null) {
          return payload.command;
        }

        return payload;
      }

      return payload;
    })();

    // Nếu command vẫn là object thì stringify, còn lại ép về chuỗi
    const message = typeof command === "object" ? JSON.stringify(command) : String(command);

    // qos: 1 đảm bảo lệnh ít nhất phải tới được Kén 1 lần
    client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        console.error(`❌ Lỗi khi gửi lệnh tới [${topic}]:`, err);
      } else {
        console.log(`🚀 Đã bắn lệnh thành công tới topic [${topic}]`);
      }
    });
  } else {
    console.error("⚠️ Không thể gửi lệnh: Hệ thống đang rớt kết nối với HiveMQ!");
  }
};

// 3. Xuất hàm này ra để file API của ông xài
module.exports = {
  sendCommandToRoom,
};
