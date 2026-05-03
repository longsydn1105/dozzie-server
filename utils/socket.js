// utils/socket.js
const { Server } = require("socket.io");
const Message = require("../models/Message");

// Biến lưu trữ instance của Socket.io
let io;

module.exports = {
  // 1. Hàm khởi tạo Socket (Chỉ gọi 1 lần ở server.js)
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: { origin: "*" },
    });

    // Gom toàn bộ logic lắng nghe sự kiện vào đây
    io.on("connection", (socket) => {
      console.log(`⚡ Client kết nối Socket thành công: ${socket.id}`);

      socket.on("join_chat", ({ bookingId, role }) => {
        socket.join(bookingId);
        console.log(`[${role}] đã tham gia phòng: ${bookingId}`);
      });

      socket.on("send_message", async (data) => {
        try {
          const { bookingId, roomId, senderRole, text } = data;

          const savedMessage = await Message.create({
            bookingId,
            roomId,
            senderRole,
            text,
          });

          io.to(bookingId).emit("receive_message", savedMessage);

          if (senderRole !== "admin") {
            // Bắn một tín hiệu ra ngoài không gian ảo, app Admin sẽ hứng cái này
            io.emit("admin_global_notification", savedMessage);
          }
        } catch (error) {
          console.error("Lỗi khi gửi tin nhắn Socket:", error);
        }
      });

      socket.on("disconnect", () => {
        console.log(`❌ Client đã ngắt kết nối: ${socket.id}`);
      });
    });

    return io;
  },

  // 2. Hàm lấy instance io để xài ở các Controller khác
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io chưa được khởi tạo!");
    }
    return io;
  },
};
