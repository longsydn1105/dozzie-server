const cron = require("node-cron");
const Booking = require("../models/Booking");
const Invoice = require("../models/Invoice");

// Hàm này sẽ chạy ngầm mỗi phút 1 lần
const startCronJobs = () => {
  cron.schedule("* * * * *", async () => {
    try {
      // 1. Tính mốc thời gian cách đây 15 phút
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      // 2. Tìm tất cả Invoice đang pending VÀ được tạo trước mốc 15 phút
      const expiredInvoices = await Invoice.find({
        paymentStatus: "pending",
        createdAt: { $lte: fifteenMinutesAgo },
      });

      if (expiredInvoices.length > 0) {
        // Lấy danh sách các ID của Invoice và Booking để hủy
        const invoiceIds = expiredInvoices.map((inv) => inv._id);
        const bookingIds = expiredInvoices.map((inv) => inv.bookingId);

        // 3. Đổi trạng thái 1 loạt sang 'cancelled' (Hủy)
        await Invoice.updateMany({ _id: { $in: invoiceIds } }, { $set: { paymentStatus: "cancelled" } });

        await Booking.updateMany({ _id: { $in: bookingIds } }, { $set: { status: "cancelled" } });

        console.log(`[CronJob] Đã hủy tự động ${expiredInvoices.length} đơn quá hạn thanh toán.`);
      }
    } catch (error) {
      console.error("[CronJob] Lỗi khi dọn dẹp đơn hết hạn:", error);
    }
  });
};

module.exports = startCronJobs;
