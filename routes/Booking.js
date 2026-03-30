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

module.exports = router;
