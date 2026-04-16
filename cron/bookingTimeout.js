const cron = require("node-cron");
const Booking = require("../models/Booking");
const Invoice = require("../models/Invoice");

const startCronJobs = () => {
  console.log("⏳ [CronJob] Hệ thống chạy ngầm đã được kích hoạt!");

  // =========================================================
  // JOB 1: HỦY ĐƠN CHƯA THANH TOÁN (Chạy ngầm MỖI PHÚT)
  // =========================================================
  cron.schedule("* * * * *", async () => {
    try {
      // Tính mốc thời gian cách đây 15 phút
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      const expiredInvoices = await Invoice.find({
        paymentStatus: "pending",
        createdAt: { $lte: fifteenMinutesAgo },
      });

      if (expiredInvoices.length > 0) {
        const invoiceIds = expiredInvoices.map((inv) => inv._id);
        const bookingIds = expiredInvoices.map((inv) => inv.bookingId);

        // Hủy hóa đơn
        await Invoice.updateMany({ _id: { $in: invoiceIds } }, { $set: { paymentStatus: "cancelled" } });
        // Hủy booking
        await Booking.updateMany({ _id: { $in: bookingIds } }, { $set: { status: "cancelled" } });

        console.log(`[CronJob - Timeout] ❌ Đã tự động hủy ${expiredInvoices.length} đơn quá 15p không thanh toán.`);
      }
    } catch (error) {
      console.error("[CronJob - Timeout] Lỗi:", error);
    }
  });

  // =========================================================
  // JOB 2: TỰ ĐỘNG CHECK-OUT PHÒNG HẾT GIỜ (Chạy MỖI 10 PHÚT)
  // =========================================================
  cron.schedule("*/10 * * * *", async () => {
    try {
      const now = new Date();
      // Quét lùi lại 2 ngày trước để tối ưu DB
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const result = await Booking.updateMany(
        {
          status: "active", // Đang dùng phòng
          endTime: {
            $gte: twoDaysAgo, // Nằm trong phạm vi 2 ngày đổ lại
            $lte: now, // VÀ thời gian kết thúc đã trôi qua (<= hiện tại)
          },
        },
        {
          $set: { status: "completed" }, // Đổi thành hoàn thành
        },
      );

      if (result.modifiedCount > 0) {
        console.log(
          `[CronJob - AutoCheckout] ✅ Đã dọn dẹp và hoàn thành ${result.modifiedCount} phòng lúc ${now.toLocaleTimeString("vi-VN")}`,
        );
      }
    } catch (error) {
      console.error("[CronJob - AutoCheckout] Lỗi:", error);
    }
  });
};

module.exports = startCronJobs;
