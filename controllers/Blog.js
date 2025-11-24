// server/controllers/Blog.js
const Blog = require('../models/Blog');

// --- 1. Tạo Bài Viết Mới (POST) ---
// Hàm này CHỈ chạy SAU khi thằng gác cổng authMiddleware cho phép
exports.createBlog = async (req, res) => {
    try {
        const { title, content, slug, tags, img_url } = req.body;

        // Lấy info user từ đâu? Từ thằng gác cổng nhét vào
        const authorId = req.user.userId; // req.user do authMiddleware cung cấp

        if (!title || !content || !slug) {
            return res.status(400).json({ message: 'Thiếu title, content hoặc slug!' });
        }

        // (Logic pro): Check trùng slug
        const existingSlug = await Blog.findOne({ slug: slug.toLowerCase() });
        if (existingSlug) {
            return res.status(409).json({ message: 'Cái slug (đường dẫn) này trùng rồi.' });
        }

        const newBlog = new Blog({
            title,
            content,
            slug: slug.toLowerCase(),
            tags: tags || [], // Nếu không gửi thì là mảng rỗng
            img_url: img_url,
            authorId: authorId // Tác giả chính là thằng gửi token
        });

        await newBlog.save();

        res.status(201).json({
            message: 'Đăng blog thành công!',
            data: newBlog
        });

    } catch (error) {
        console.error('Lỗi khi createBlog:', error);
        res.status(500).json({ message: 'Server ngủm khi tạo blog.' });
    }
};


// --- 2. Lấy Blog (GET) (có lọc theo tag) ---
// Cửa này thì ai cũng vào được, không cần gác cổng
exports.getBlogs = async (req, res) => {
    try {
        const filter = {};
        const { tag } = req.query; // Lấy ?tag=ten-tag từ URL

        // Nếu có gửi tag, thêm vào bộ lọc
        if (tag) {
            // Logic Mongoose: Tìm tất cả blog mà cái mảng tags
            // có chứa ("$in") cái tag này
            filter.tags = { $in: [tag.toLowerCase()] };
        }

        // Tìm theo filter, sort ngày mới nhất lên trên
        const blogs = await Blog.find(filter).sort({ publishedAt: -1 })
                                .populate('authorId', 'displayName email'); // Bonus skill

        // Cái 'Tại sao' của .populate():
        // Mặc định, authorId chỉ là 1 cái ObjectId vô hồn.
        // .populate('authorId', 'displayName email') bảo Mongoose:
        // "Mày lấy cái Id đó, chạy qua collection users,
        // tìm thằng user tương ứng, rồi lôi cái displayName và email của nó
        // gắn thay vào trường authorId luôn".
        // Kết quả: Client nhận được tên tác giả luôn, quá tiện.

        res.status(200).json({
            message: 'Lấy blogs thành công',
            count: blogs.length,
            data: blogs
        });

    } catch (error) {
        console.error('Lỗi khi getBlogs:', error);
        res.status(500).json({ message: 'Server ngủm khi lấy blogs.' });
    }
};