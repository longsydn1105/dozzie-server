// server/utils/sendMail.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const sendBookingEmail = async (toEmail, bookingData) => {
  // 0. Kiểm tra biến môi trường trước cho chắc
  if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
    console.error(
      "❌ LỖI: Chưa cấu hình MAIL_USER hoặc MAIL_PASSWORD trong file .env"
    );
    return false;
  }

  try {
    // 1. Tạo "Shipper" (Transporter) - CẤU HÌNH MẠNH TAY
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465, // Dùng cổng 465 (SSL) chuẩn bảo mật
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000, // 10 giây không được thì báo lỗi luôn
      greetingTimeout: 10000,
      socketTimeout: 10000,
      // Bật log chi tiết để nếu lỗi thì biết ngay tại sao
      logger: true,
      debug: true,
    });

    // 2. Format dữ liệu cho đẹp
    const startTime = new Date(bookingData.startTime).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const endTime = new Date(bookingData.endTime).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    // Xử lý danh sách phòng (Check mảng cho an toàn)
    const roomList = Array.isArray(bookingData.roomIds)
      ? bookingData.roomIds.join(", ")
      : bookingData.roomId || "Không xác định";

    // 3. Thiết kế nội dung Email (HTML + CSS inline)
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
                        <a href="http://localhost:5173" style="display: inline-block; background-color: #229ebd; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold;">Về trang chủ</a>
                    </div>
                </div>

                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #888;">
                    &copy; 2025 Dozzie Capsule Hotel. All rights reserved.<br>
                    Liên hệ: 0909 090 909 | help@dozzie.com
                </div>
            </div>
        `;

    // 4. Gửi thôi!
    const info = await transporter.sendMail({
      from: '"Dozzie Hotel 🏨" <no-reply@dozzie.com>', // Tên người gửi cho oách
      to: toEmail, // Email khách
      subject: `[Dozzie] Xác nhận đặt phòng thành công`, // Tiêu đề
      html: htmlContent, // Nội dung
    });

    console.log("📧 Email sent: " + info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Gửi mail thất bại:", error);
    return false; // Không để lỗi mail làm crash server
  }
};

module.exports = sendBookingEmail;
