// server/routes/Booking.js
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/Booking");
const { isAuth, isAdmin } = require("../middleware/auth");

// POST /api/bookings/
router.post("/", isAuth, bookingController.createBooking);

// GET /api/bookings/
router.get("/", bookingController.getBookings);

// GET /api/bookings/admin
router.get("/admin", isAuth, isAdmin, bookingController.getAllBookingsForAdmin);

// GET chi tiết 1 booking
router.get("/:id", bookingController.getBookingById);

// PUT (hoặc PATCH) để update booking (Chỉ admin mới được sửa)
router.put("/:id", isAuth, isAdmin, bookingController.updateBooking);

// DELETE để xóa cứng booking (Chỉ admin mới được xóa)
router.delete("/:id", isAuth, isAdmin, bookingController.deleteBookingById);

// PATCH /api/bookings/123/cancel để khách có thể hủy phòng
router.patch("/:id/cancel", isAuth, bookingController.cancelBooking);

// Get /api/bookings/my-bookings
router.get("/my-bookings", isAuth, bookingController.getMyBookings);
module.exports = router;
