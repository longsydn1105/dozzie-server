// server/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Thằng gác cổng này sẽ đứng giữa request và controller
const authMiddleware = (req, res, next) => {
    // 1. Check xem thằng client có gửi vé không
    // Nó phải gửi trong Header kiểu: Authorization: "Bearer <token...>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // 401 Unauthorized
        return res.status(401).json({ message: 'Vé đâu? Không có vé sao vào?' });
    }

    // 2. Tách cái token ra khỏi chữ Bearer
    const token = authHeader.split(' ')[1]; // Lấy phần thứ 2

    try {
        // 3. Giải mã cái vé dùng mực bí mật
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Ngon! Vé xịn. Gắn info user vào request
        // Để controller biết thằng nào vừa gửi
        req.user = decodedPayload; // { userId: '...', email: '...', role: '...' }

        // 5. Cho request đi tiếp vào controller
        next(); 
        
    } catch (error) {
        // Toang! Vé giả hoặc hết hạn
        return res.status(401).json({ message: 'Vé giả hoặc hết hạn!' });
    }
};

module.exports = authMiddleware;