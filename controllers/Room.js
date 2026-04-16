// server/controllers/Room.js
const Room = require("../models/Room"); // "Lôi" model Room vào

// Hàm "lấy" "tất cả" "phòng"
exports.getRooms = async (req, res) => {
  try {
    // 1. "Tìm" "tất cả" (find "rỗng" {}) "và" "sắp xếp" "theo" "_id" "cho" "đẹp"
    const rooms = await Room.find({}).sort({ _id: 1 }); // "sort 1" = A-Z

    // 2. "Trả" "về"
    res.status(200).json({
      message: "Lấy list phòng thành công",
      count: rooms.length, // "Tút" "thêm" "cái" "số lượng" "cho" "pro"
      data: rooms,
    });
  } catch (error) {
    console.error("Lỗi khi getRooms:", error);
    res.status(500).json({ message: "Server ngủm khi lấy phòng." });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { _id, label, gender, floor, status, iotConfig } = req.body;
    // Đếm số phòng hiện có ở tầng đó
    const count = await Room.countDocuments({ floor });

    if (count >= 20) {
      return res.status(400).json({
        success: false,
        message: `Tầng ${floor} đã đạt giới hạn tối đa 20 phòng.`,
      });
    }

    // Kiểm tra xem ID (M-01, F-01) đã tồn tại chưa
    const existingRoom = await Room.findById(_id);
    if (existingRoom) {
      return res.status(400).json({ success: false, message: "Mã phòng này đã tồn tại!" });
    }

    // Tạo phòng mới
    const newRoom = new Room({
      _id,
      label,
      gender,
      floor,
      status: status || "available",
      iotConfig: iotConfig || {
        deviceId: "PENDING_" + _id,
        topicDoor: `hotel/room/${_id}/door`,
        topicPower: `hotel/room/${_id}/power`,
      },
    });

    await newRoom.save();
    res.status(201).json({ success: true, message: "Khởi tạo phòng thành công!", data: newRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi tạo phòng: " + error.message });
  }
};
// --- 2. CẬP NHẬT THÔNG TIN PHÒNG ---
exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedRoom = await Room.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

    if (!updatedRoom) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phòng." });
    }

    res.status(200).json({ success: true, message: "Cập nhật thông tin thành công!", data: updatedRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi cập nhật: " + error.message });
  }
};

// --- 3. XÓA (ẨN) PHÒNG ---
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // Cách 1: Xóa thật khỏi DB
    const deletedRoom = await Room.findByIdAndDelete(id);

    if (!deletedRoom) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phòng." });
    }

    res.status(200).json({ success: true, message: "Đã xóa phòng khỏi hệ thống." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xóa phòng: " + error.message });
  }
};

/**
 * Truy vấn thông tin chi tiết của một phòng dựa trên ID
 */
exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Cảnh báo: Không tìm thấy dữ liệu cho mã phòng này.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Truy vấn dữ liệu chi tiết thành công.",
      data: room,
    });
  } catch (error) {
    console.error("Hệ thống lỗi tại getRoomById:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống: Không thể truy xuất dữ liệu phòng.",
    });
  }
};
