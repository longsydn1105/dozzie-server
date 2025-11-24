// server/controllers/Room.js
const Room = require('../models/Room'); // "Lôi" model Room vào

// Hàm "lấy" "tất cả" "phòng"
exports.getRooms = async (req, res) => {
    try {
        // 1. "Tìm" "tất cả" (find "rỗng" {}) "và" "sắp xếp" "theo" "_id" "cho" "đẹp"
        const rooms = await Room.find({}).sort({ _id: 1 }); // "sort 1" = A-Z

        // 2. "Trả" "về"
        res.status(200).json({
            message: 'Lấy list phòng thành công',
            count: rooms.length, // "Tút" "thêm" "cái" "số lượng" "cho" "pro"
            data: rooms
        });

    } catch (error) {
        console.error('Lỗi khi getRooms:', error);
        res.status(500).json({ message: 'Server ngủm khi lấy phòng.' });
    }
};

// (Tí nữa ông "thích" "thì" "thêm" "hàm" "tạo" "phòng" "vào" "đây")
// exports.createRoom = async (req, res) => { ... }