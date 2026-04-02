const Review = require("../models/Review");
const Booking = require("../models/Booking"); // Nhớ import thêm Booking để check nếu cần

// --- 1. TẠO REVIEW MỚI ---
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

// --- 2. LẤY DANH SÁCH REVIEW (1 Hàm Cân Tất Cả Filter) ---
exports.getReviews = async (req, res) => {
  try {
    // Hứng các query từ URL (VD: /api/reviews?rating=5&userId=123)
    const { rating, userId, bookingId, isShow } = req.query;

    // Mặc định khách hàng chỉ xem được review đang hiển thị
    const filter = { isShow: true };

    // Nếu Admin muốn xem cả review bị ẩn (truyền isShow=all)
    if (isShow === "all") {
      delete filter.isShow;
    } else if (isShow === "false") {
      filter.isShow = false;
    }

    // Nhét thêm các điều kiện lọc nếu có truyền lên
    if (rating) filter.rating = Number(rating);
    if (userId) filter.userId = userId;
    if (bookingId) filter.bookingId = bookingId;

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      // Sửa lỗi 2: Dùng fullName thay vì displayName
      .populate("userId", "fullName email")
      // Lấy thêm thông tin phòng từ Booking để biết khách đang review phòng nào
      .populate({
        path: "bookingId",
        select: "roomId",
        populate: { path: "roomId", select: "label" }, // Lấy tên phòng (label)
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

// --- 1. LẤY REVIEW CỦA CHÍNH MÌNH (Cho App Mobile của Khách) ---
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

// --- 2. SỬA REVIEW CỦA CHÍNH MÌNH (Cho Khách) ---
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

// --- 3. XÓA REVIEW CỦA CHÍNH MÌNH (Cho Khách) ---
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

// --- 4. ADMIN XÓA REVIEW BẤT KỲ (Cho Admin Web) ---
exports.adminDeleteReview = async (req, res) => {
  try {
    const deletedReview = await Review.findByIdAndDelete(req.params.id);
    if (!deletedReview) return res.status(404).json({ success: false, message: "Đánh giá không tồn tại." });

    res.status(200).json({ success: true, message: "Admin đã xóa đánh giá thành công." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi Admin xóa đánh giá." });
  }
};
