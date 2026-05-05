const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/Review");
const { isAuth, isAdmin } = require("../middleware/auth");

router.get("/", reviewController.getReviews);
router.get("/my-reviews", isAuth, reviewController.getMyReviews);
router.post("/", isAuth, reviewController.createReview);
router.put("/:id", isAuth, reviewController.updateReview);
router.delete("/:id", isAuth, reviewController.deleteReview);
router.delete("/admin/:id", isAuth, isAdmin, reviewController.adminDeleteReview);

module.exports = router;
