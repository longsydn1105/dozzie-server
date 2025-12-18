// server/utils/sendMail.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const sendBookingEmail = async (toEmail, bookingData) => {
  // 0. Kiểm tra biến môi trường
  if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
    console.error(
      "❌ LỖI: Thiếu biến môi trường Mail (MAIL_USER / MAIL_PASSWORD)"
    );
    return false;
  }

  try {
    // 1. Tạo "Shipper" (Transporter) - CẤU HÌNH CHUẨN RENDER
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587, // 👉 Dùng cổng 465 (SSL/SMTPS) thay vì 587
      secure: true, // 👉 true đi cặp với cổng 465
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        // Không check chứng chỉ SSL (Giúp kết nối nhanh hơn trên Server ảo)
        rejectUnauthorized: false,
      },
      // 👇 VẪN GIỮ CÁI NÀY (Bùa hộ mệnh IPv4)
      family: 4,

      // Tăng thời gian chờ lên 30 giây (mặc định có 10s hơi ít)
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,

      logger: false, // Tắt log cho gọn
      debug: false,
    });

    // 2. Format dữ liệu
    const startTime = new Date(bookingData.startTime).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const endTime = new Date(bookingData.endTime).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const roomList = Array.isArray(bookingData.roomIds)
      ? bookingData.roomIds.join(", ")
      : bookingData.roomId || "Phòng M-01";

    // 👉 Thay link này bằng link Web Vercel của ông (hoặc để biến môi trường)
    const HOME_URL = "https://dozzie-client.vercel.app";

    // 3. Nội dung HTML
    const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #229ebd; padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Dozzie Capsule Hotel</h1>
                    <p style="margin: 10px 0 0;">Cảm ơn bạn đã chọn nghỉ ngơi tại Dozzie!</p>
                </div>
                
                <div style="padding: 20px; background-color: #ffffff;">
                    <h2 style="color: #18233B; margin-top: 0;">Xác nhận đặt phòng thành công ✅</h2>
                    <p>Xin chào <strong>${bookingData.name}</strong>,</p>
                    <p>Booking của bạn đã được hệ thống ghi nhận. Dưới đây là chi tiết:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8faff; border-radius: 8px;">
                        <tr>
                            <td style="padding: 12px; color: #666; border-bottom: 1px solid #eee;">Mã phòng:</td>
                            <td style="padding: 12px; font-weight: bold; color: #18233B; border-bottom: 1px solid #eee;">${roomList}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; color: #666; border-bottom: 1px solid #eee;">Check-in:</td>
                            <td style="padding: 12px; font-weight: bold; color: #18233B; border-bottom: 1px solid #eee;">${startTime}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; color: #666; border-bottom: 1px solid #eee;">Check-out:</td>
                            <td style="padding: 12px; font-weight: bold; color: #18233B; border-bottom: 1px solid #eee;">${endTime}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; color: #666;">Trạng thái:</td>
                            <td style="padding: 12px; font-weight: bold; color: #229ebd;">Thanh toán tại quầy</td>
                        </tr>
                    </table>

                    <p style="color: #666; font-size: 14px; line-height: 1.5;">
                        <strong>Lưu ý:</strong> Vui lòng mang theo CCCD/Hộ chiếu và mã booking này khi đến nhận phòng. 
                        Hệ thống giữ phòng tối đa 30 phút so với giờ check-in dự kiến.
                    </p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${HOME_URL}" style="display: inline-block; background-color: #229ebd; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold;">Về trang chủ</a>
                    </div>
                </div>

                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #888;">
                    &copy; 2025 Dozzie Capsule Hotel. All rights reserved.<br>
                    Liên hệ: 0909 090 909 | help@dozzie.com
                </div>
            </div>
        `;

    // 4. Gửi mail
    const info = await transporter.sendMail({
      from: '"Dozzie Hotel 🏨" <no-reply@dozzie.com>',
      to: toEmail,
      subject: `[Dozzie] Xác nhận đặt phòng thành công`,
      html: htmlContent,
    });

    console.log("📧 Email sent successfully: " + info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Gửi mail thất bại:", error);
    return false;
  }
};

module.exports = sendBookingEmail;
