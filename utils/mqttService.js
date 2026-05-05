const mqtt = require("mqtt");

const client = mqtt.connect("mqtts://5653d5f2e0414799b77d163d0c6c7e26.s1.eu.hivemq.cloud", {
  username: "dozzieiot",
  password: "Dozzie123@",
});

client.on("connect", () => {
  console.log("✅ Kết nối HiveMQ thành công! Cổng IoT đã mở.");
});

client.on("error", (err) => {
  console.error("❌ Lỗi kết nối MQTT:", err);
});

client.on("reconnect", () => {
  console.log("🔄 Đang thử kết nối lại với HiveMQ...");
});

/**
 * Publish MQTT command to IoT device - Input: topic, payload - Output: success/error
 */
const sendCommandToRoom = (topic, payload) => {
  if (client.connected) {
    const command = (() => {
      if (payload && typeof payload === "object") {
        if (payload.command !== undefined && payload.command !== null) {
          return payload.command;
        }

        return payload;
      }

      return payload;
    })();

    const message = typeof command === "object" ? JSON.stringify(command) : String(command);

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

module.exports = {
  sendCommandToRoom,
};
