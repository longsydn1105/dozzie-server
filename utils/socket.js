const { Server } = require("socket.io");
const Message = require("../models/Message");

let io;

module.exports = {
  /**
   * Initialize Socket.io - Input: httpServer - Output: io instance
   */
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: { origin: "*" },
    });

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

  /**
   * Get Socket.io instance - Output: io instance
   */
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io chưa được khởi tạo!");
    }
    return io;
  },
};
