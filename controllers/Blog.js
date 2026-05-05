const Blog = require("../models/Blog");

/**
 * Tạo bài viết blog mới
 * Input: title, content, slug, tags, img_url | Output: New blog data
 */
exports.createBlog = async (req, res) => {
  try {
    const { title, content, slug, tags, img_url } = req.body;

    const authorId = req.user.userId;

    if (!title || !content || !slug) {
      return res.status(400).json({ message: "Thiếu title, content hoặc slug!" });
    }

    const existingSlug = await Blog.findOne({ slug: slug.toLowerCase() });
    if (existingSlug) {
      return res.status(409).json({ message: "Cái slug (đường dẫn) này trùng rồi." });
    }

    const newBlog = new Blog({
      title,
      content,
      slug: slug.toLowerCase(),
      tags: tags || [],
      img_url: img_url,
      authorId: authorId,
    });

    await newBlog.save();

    res.status(201).json({
      message: "Đăng blog thành công!",
      data: newBlog,
    });
  } catch (error) {
    console.error("Lỗi khi createBlog:", error);
    res.status(500).json({ message: "Server ngủm khi tạo blog." });
  }
};

/**
 * Lấy danh sách blog (có lọc theo tag)
 * Input: tag (optional) | Output: Blog list với author info
 */
exports.getBlogs = async (req, res) => {
  try {
    const filter = {};
    const { tag } = req.query;

    if (tag) {
      filter.tags = { $in: [tag.toLowerCase()] };
    }

    const blogs = await Blog.find(filter).sort({ publishedAt: -1 }).populate("authorId", "displayName email");

    res.status(200).json({
      message: "Lấy blogs thành công",
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    console.error("Lỗi khi getBlogs:", error);
    res.status(500).json({ message: "Server ngủm khi lấy blogs." });
  }
};
