// server/utils/sendMail.js
const { Resend } = require("resend");
require("dotenv").config();

// Khởi tạo Resend với API Key
const resend = new Resend(process.env.RESEND_API_KEY);

const sendBookingEmail = async (toEmail, bookingData) => {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ LỖI: Thiếu RESEND_API_KEY");
    return false;
  }

  try {
    // 1. Format dữ liệu (Giữ nguyên logic cũ)
    const startTime = new Date(bookingData.startTime).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const endTime = new Date(bookingData.endTime).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const roomList = Array.isArray(bookingData.roomIds)
      ? bookingData.roomIds.join(", ")
      : bookingData.roomId || "Phòng M-01";
    const HOME_URL = "https://dozzie-client.vercel.app";

    // 2. Nội dung HTML (Giữ nguyên form đẹp của ông)
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #229ebd; padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">Dozzie Capsule Hotel</h1>
              <p style="margin: 10px 0 0;">Cảm ơn bạn đã chọn nghỉ ngơi tại Dozzie!</p>
          </div>
          <div style="padding: 20px; background-color: #ffffff;">
              <h2 style="color: #18233B; margin-top: 0;">Xác nhận đặt phòng thành công ✅</h2>
              <p>Xin chào <strong>${bookingData.name}</strong>,</p>
              <p>Booking của bạn đã được hệ thống ghi nhận:</p>
              <table style="width: 100%; background-color: #f8faff; border-radius: 8px; margin: 20px 0;">
                  <tr><td style="padding: 10px;">Phòng:</td><td style="font-weight:bold;">${roomList}</td></tr>
                  <tr><td style="padding: 10px;">Check-in:</td><td style="font-weight:bold;">${startTime}</td></tr>
                  <tr><td style="padding: 10px;">Check-out:</td><td style="font-weight:bold;">${endTime}</td></tr>
              </table>
              <div style="text-align: center; margin-top: 30px;">
                  <a href="${HOME_URL}" style="background-color: #229ebd; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold;">Về trang chủ</a>
              </div>
          </div>
      </div>
    `;

    // 3. Gửi Mail bằng Resend API
    const data = await resend.emails.send({
      // ⚠️ QUAN TRỌNG: Không có domain riêng thì BẮT BUỘC phải dùng mail này
      from: "Dozzie Hotel <onboarding@resend.dev>",

      // ⚠️ QUAN TRỌNG: Chỉ gửi được cho chính ông (mail chủ tài khoản Resend)
      to: toEmail,

      subject: "[Dozzie] Xác nhận đặt phòng thành công 🏨",
      html: htmlContent,
    });

    if (data.error) {
      console.error("❌ Resend Error:", data.error);
      return false;
    }

    console.log("📧 Email sent successfully ID:", data.data.id);
    return true;
  } catch (error) {
    console.error("❌ Gửi mail thất bại:", error);
    return false;
  }
};

module.exports = sendBookingEmail;
