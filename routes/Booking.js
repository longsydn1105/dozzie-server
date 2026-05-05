const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/Booking");
const { isAuth, isAdmin } = require("../middleware/auth");

router.post("/", isAuth, bookingController.createBooking);
router.get("/", bookingController.getBookings);
router.get("/admin", isAuth, isAdmin, bookingController.getAllBookingsForAdmin);
router.get("/my-bookings", isAuth, bookingController.getMyBookings);
router.get("/my-status", isAuth, bookingController.getMyStatus);
router.get("/:id", bookingController.getBookingById);
router.put("/:id", isAuth, isAdmin, bookingController.updateBooking);
router.delete("/:id", isAuth, isAdmin, bookingController.deleteBookingById);
router.patch("/:id/cancel", isAuth, bookingController.cancelBooking);

module.exports = router;
