require("dotenv").config();
require("./utils/mqttService");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const socketConfig = require("./utils/socket");
const startCronJobs = require("./cron/bookingTimeout");
const http = require("http");

const bookingRoutes = require("./routes/Booking");
const authRoutes = require("./routes/Auth");
const roomRoutes = require("./routes/Room");
const blogRoutes = require("./routes/Blog");
const reviewRoutes = require("./routes/Review");
const serviceRoutes = require("./routes/ServicePackage");
const invoiceRoutes = require("./routes/Invoice");
const sosAlert = require("./routes/SosAlert");
const user = require("./routes/User");
const messageRoutes = require("./routes/Message");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/bookings", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/service-packages", serviceRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/sos", sosAlert);
app.use("/api/users", user);
app.use("/api/chat", messageRoutes);

const server = http.createServer(app);

socketConfig.init(server);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
    startCronJobs();
  })
  .catch((err) => {
    console.error("MongoDB fail to connect:", err);
  });
