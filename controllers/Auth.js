// server/controllers/Auth.js
const User = require('../models/User'); // "Lôi" model User vào
const jwt = require('jsonwebtoken'); // "Lôi" "máy" "in" "vé" "vào"
require('dotenv').config(); // "Lôi" "dotenv" "vào" "để" "lấy" "JWT_SECRET"

exports.register = async (req, res) => {
    try {
        // 1. "Lấy" data từ client
        const { email, password, displayName } = req.body;

        // 2. "Check" "thiếu" "đồ"
        if (!email || !password) {
            // 400 Bad Request
            return res.status(400).json({ 
                message: '"Thiếu" email hoặc password .' 
            });
        }

        // 3. "Check" "trùng" email
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            // 409 Conflict
            return res.status(409).json({ 
                message: 'Email này đã có người dùng.' 
            });
        }

        // 4. "Ngon", "tạo" user mới (pass "lưu chay" như ông "muốn")
        const newUser = new User({
            email: email.toLowerCase(),
            password: password, // "Lưu chay"
            displayName: displayName
        });

        await newUser.save(); // "Lưu" vào DB

        // 5. "Trả" data về client (KHÔNG "bao giờ" "trả" "pass" về)
        // 201 Created
        res.status(201).json({
            message: 'Tạo tài khoản "thành công"!',
            data: {
                _id: newUser._id,
                email: newUser.email,
                displayName: newUser.displayName,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Lỗi khi register:', error);
        res.status(500).json({ message: 'Server "ngủm" khi register.', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        // 1. "Lấy" data
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'email hoặc password không được trống' });
        }

        // 2. "Tìm" user
        // "Lưu ý": Vì "pass" "lưu chay", "ta" "không" "cần" ".select('+password')"
        // Nhưng nếu ông "set" `select: false` "trong" `User.js` "thì" "phải" "thêm"
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // 404 Not Found
            return res.status(404).json({ message: 'Email không tồn tại' });
        }

        // 3. "Check" "pass" (Kiểu "lưu chay")
        if (password !== user.password) {
            // 401 Unauthorized
            return res.status(401).json({ message: 'Sai mật khẩu' });
        }

        // 4. "NGON"! "Pass" "đúng". "In" "vé" (JWT Token)
        // "Nội dung" "cái" "vé": "Ghi" "_id" "của" "user" "vào"
        const payload = {
            userId: user._id,
            email: user.email,
            role: user.role
        };
        
        // "Ký" "tên" "lên" "vé", "dùng" "mực" "bí mật"
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '3d' } // "Vé" "có" "hạn" 3 "ngày"
        );

        // 5. "Trả" "vé" (token) "và" "info" "user" "về" "cho" "client"
        res.status(200).json({
            message: 'Login "thành công"!',
            token: token, // "Cái" "vé" "quan trọng" "nhất" "đây"
            user: {
                _id: user._id,
                email: user.email,
                displayName: user.displayName,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Lỗi khi login:', error);
        res.status(500).json({ message: 'Server "ngủm" khi login.', error: error.message });
    }
};