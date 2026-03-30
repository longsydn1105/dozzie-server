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
      message: "Cảm ơn Đại Ca đã đánh giá!",
      data: newReview,
    });
  } catch (error) {
    console.error("Lỗi createReview:", error);
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
