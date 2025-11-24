// server/routes/Booking.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/Booking');

// POST /api/bookings/
router.post('/', bookingController.createBooking);

// GET /api/bookings/
router.get('/', bookingController.getBookings);

// Tí nữa ông có thể thêm các route khác ở đây:
// router.get('/', bookingController.getAllBookings);
// router.get('/:id', bookingController.getBookingById);

module.exports = router;