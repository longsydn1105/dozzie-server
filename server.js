// server/server.js
require("dotenv").config(); // "Load" file .env
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // "Chìa khoá" để client gọi được server

const bookingRoutes = require("./routes/Booking"); // Import route ta sắp tạo
const authRoutes = require("./routes/Auth");
const roomRoutes = require("./routes/Room");
const blogRoutes = require("./routes/Blog");
const reviewRoutes = require("./routes/Review");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares (Các "trạm gác") ---
app.use(cors()); // Cho phép client gọi API
app.use(express.json()); // "Dịch" req.body từ JSON (quan trọng)

// --- Routes (Các "cổng" API) ---
// Bất cứ request nào tới "/api/bookings" sẽ được "chuyển" cho bookingRoutes xử lý
app.use("/api/bookings", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/reviews", reviewRoutes);
// --- Khởi động Server & DB ---
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB "đã kết nối".');
    app.listen(PORT, () => {
      console.log(`Server "đang cháy" tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB "toang":', err);
  });
