const Review = require("../models/Review");
const Booking = require("../models/Booking");

/**
 * Tạo review mới
 * Input: bookingId, rating, comment | Output: New review
 */
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const userId = req.user.id;

    if (!bookingId || !rating || !comment) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng truyền đủ bookingId, sao đánh giá và nội dung." });
    }

    const newReview = new Review({
      userId,
      bookingId,
      rating,
      comment,
    });

    await newReview.save();

    res.status(201).json({
      success: true,
      message: "Cảm ơn bạn đã đánh giá!",
      data: newReview,
    });
  } catch (error) {
    console.error("Lỗi tạo review:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi tạo review." });
  }
};

/**
 * Lấy danh sách review (có lọc theo rating, userId, bookingId, isShow)
 * Input: rating, userId, bookingId, isShow (optional) | Output: Reviews with user & room info
 */
exports.getReviews = async (req, res) => {
  try {
    const { rating, userId, bookingId, isShow } = req.query;

    const filter = { isShow: true };

    if (isShow === "all") {
      delete filter.isShow;
    } else if (isShow === "false") {
      filter.isShow = false;
    }

    if (rating) filter.rating = Number(rating);
    if (userId) filter.userId = userId;
    if (bookingId) filter.bookingId = bookingId;

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "fullName email")
      .populate({
        path: "bookingId",
        select: "roomId",
        populate: { path: "roomId", select: "label" },
      });

    res.status(200).json({
      success: true,
      message: "Lấy danh sách review thành công",
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("Lỗi getReviews:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi lấy review." });
  }
};

/**
 * Lấy review của người dùng
 * Input: userId (from token) | Output: User's reviews with room details
 */
exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ Token
    const reviews = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "bookingId",
        select: "roomId",
        populate: { path: "roomId", select: "label" },
      });

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy lịch sử đánh giá." });
  }
};

/**
 * Cập nhật review của người dùng
 * Input: reviewId, rating, comment | Output: Updated review
 */
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const reviewId = req.params.id;
    const userId = req.user.id;

    // Tìm và check xem có phải chủ nhân không
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá." });

    if (review.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Không thể sửa đánh giá của người khác!" });
    }

    // Cập nhật
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    res.status(200).json({ success: true, message: "Đã cập nhật đánh giá!", data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi sửa đánh giá." });
  }
};

/**
 * Xóa review của người dùng
 * Input: reviewId | Output: Deleted review
 */
exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá." });

    if (review.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Không có quyền xóa đánh giá này!" });
    }

    await Review.findByIdAndDelete(reviewId);
    res.status(200).json({ success: true, message: "Đã xóa đánh giá thành công." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi xóa đánh giá." });
  }
};

/**
 * Admin xóa bất kỳ review
 * Input: reviewId | Output: Deleted review
 */
exports.adminDeleteReview = async (req, res) => {
  try {
    const deletedReview = await Review.findByIdAndDelete(req.params.id);
    if (!deletedReview) return res.status(404).json({ success: false, message: "Đánh giá không tồn tại." });

    res.status(200).json({ success: true, message: "Admin đã xóa đánh giá thành công." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi Admin xóa đánh giá." });
  }
};
