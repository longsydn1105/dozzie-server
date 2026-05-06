const cron = require("node-cron");
const Booking = require("../models/Booking");
const Invoice = require("../models/Invoice");
const FCMService = require("../utils/fcmService");

const startCronJobs = () => {
  console.log("⏳ [CronJob] Hệ thống chạy ngầm đã được kích hoạt!");

  // =========================================================
  // JOB 1: HỦY ĐƠN CHƯA THANH TOÁN QUÁ 15 PHÚT (MỖI PHÚT)
  // =========================================================
  cron.schedule("* * * * *", async () => {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      const expiredInvoices = await Invoice.find({
        paymentStatus: "pending",
        createdAt: { $lte: fifteenMinutesAgo },
      });

      if (expiredInvoices.length > 0) {
        const invoiceIds = expiredInvoices.map((inv) => inv._id);
        const bookingIds = expiredInvoices.map((inv) => inv.bookingId);

        await Invoice.updateMany({ _id: { $in: invoiceIds } }, { $set: { paymentStatus: "cancelled" } });
        await Booking.updateMany({ _id: { $in: bookingIds } }, { $set: { status: "cancelled" } });

        console.log(`[CronJob] ❌ Đã tự hủy ${expiredInvoices.length} đơn quá hạn thanh toán.`);
      }
    } catch (error) {
      console.error("[CronJob] Lỗi hủy đơn:", error);
    }
  });

  // =========================================================
  // JOB 2: TỰ ĐỘNG CHECK-OUT PHÒNG HẾT GIỜ (MỖI 10 PHÚT)
  // =========================================================
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const result = await Booking.updateMany(
        {
          status: "active",
          endTime: {
            $gte: twoDaysAgo,
            $lte: now,
          },
        },
        {
          $set: { status: "completed" },
        },
      );

      if (result.modifiedCount > 0) {
        console.log(`[CronJob] ✅ Đã check-out thành công ${result.modifiedCount} phòng.`);
      }
    } catch (error) {
      console.error("[CronJob] Lỗi check-out:", error);
    }
  });

  // =========================================================
  // JOB 3: BÁO THỨC TRƯỚC 10 PHÚT HẾT GIỜ QUA FCM (MỖI PHÚT)
  // =========================================================
  cron.schedule("* * * * *", async () => {
    try {
      const tenMinsFromNow = new Date(Date.now() + 10 * 60 * 1000);

      const bookingsToRemind = await Booking.find({
        status: "active",
        isReminded10Min: false,
        endTime: { $lte: tenMinsFromNow },
      }).populate("userId");

      if (bookingsToRemind.length > 0) {
        for (let booking of bookingsToRemind) {
          if (booking.userId && booking.userId.fcmToken) {
            await FCMService.sendDataMessage(booking.userId.fcmToken, {
              action: "ALARM_TIMEOUT",
              roomId: booking.roomId.toString(),
            });
          }

          booking.isReminded10Min = true;
          await booking.save();
        }

        console.log(`[CronJob] ⏰ Đã kích hoạt báo thức cho ${bookingsToRemind.length} phòng sắp hết hạn.`);
      }
    } catch (error) {
      console.error("[CronJob] Lỗi gửi báo thức hết giờ:", error);
    }
  });
};

module.exports = startCronJobs;
