// server/controllers/Review.js
const Review = require("../models/Review");
const User = require("../models/User"); // Cần cái này để check user nếu muốn kĩ hơn

// --- 1. TẠO REVIEW MỚI ---
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Lấy userId từ token (do authMiddleware gắn vào req.user)
    // Nếu ông chưa gắn middleware thì tạm thời lấy từ body (nhưng không bảo mật)
    // Giả sử ông đã có authMiddleware như bài trước:
    const userId = req.user ? req.user.userId : req.body.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Bạn cần đăng nhập để đánh giá!" });
    }

    if (!rating || !comment) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đủ sao và nội dung." });
    }

    const newReview = new Review({
      userId,
      rating,
      comment,
    });

    await newReview.save();

    res.status(201).json({
      message: "Cảm ơn bạn đã đánh giá!",
      data: newReview,
    });
  } catch (error) {
    console.error("Lỗi createReview:", error);
    res.status(500).json({ message: "Lỗi server khi tạo review." });
  }
};

// --- 2. LẤY DANH SÁCH REVIEW ---
exports.getReviews = async (req, res) => {
  try {
    // Lấy tất cả review có isShow = true
    // Sắp xếp mới nhất lên đầu (createdAt: -1)
    // .populate('userId', 'displayName email') -> Lấy tên và email của người review từ bảng User
    const reviews = await Review.find({ isShow: true })
      .sort({ createdAt: -1 })
      .populate("userId", "displayName");

    res.status(200).json({
      message: "Lấy danh sách review thành công",
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("Lỗi getReviews:", error);
    res.status(500).json({ message: "Lỗi server khi lấy review." });
  }
};
