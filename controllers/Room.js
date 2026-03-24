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
