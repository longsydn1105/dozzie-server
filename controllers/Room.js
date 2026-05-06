const Booking = require("../models/Booking");
const Room = require("../models/Room");
const { sendCommandToRoom } = require("../utils/mqttService");
/**
 * Lấy tất cả phòng
 * Input: N/A | Output: All rooms sorted by ID
 */
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({}).sort({ _id: 1 });

    res.status(200).json({
      message: "Lấy list phòng thành công",
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    console.error("Lỗi khi getRooms:", error);
    res.status(500).json({ message: "Server ngủm khi lấy phòng." });
  }
};

/**
 * Tạo phòng mới
 * Input: _id, label, gender, floor, status, iotConfig | Output: New room
 */
exports.createRoom = async (req, res) => {
  try {
    const { _id, label, gender, floor, status, iotConfig } = req.body;
    const count = await Room.countDocuments({ floor });

    if (count >= 20) {
      return res.status(400).json({
        success: false,
        message: `Tầng ${floor} đã đạt giới hạn tối đa 20 phòng.`,
      });
    }

    const existingRoom = await Room.findById(_id);
    if (existingRoom) {
      return res.status(400).json({ success: false, message: "Mã phòng này đã tồn tại!" });
    }

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
/**
 * Cập nhật thông tin phòng
 * Input: roomId, updateData | Output: Updated room
 */
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

/**
 * Xóa phòng
 * Input: roomId | Output: Deleted room
 */
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

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
 * Lấy chi tiết một phòng theo ID
 * Input: roomId | Output: Room details
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

/**
 * Gửi lệnh điều khiển phòng - mở khóa số, bật/tắt đèn, v.v
 * Input: topic, payload, roomId, digitalKey | Output: Command execution status
 */
exports.sendIoTCommand = async (req, res) => {
  try {
    const { topic, payload, roomId, digitalKey } = req.body;

    if (!roomId || !digitalKey || !payload) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin điều khỂn!" });
    }

    const booking = await Booking.findOne({
      roomId: roomId,
      digitalKey: digitalKey,
      status: "active",
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        message: "Chìa khóa không hợp lệ hoặc Booking chưa được kích hoạt (Pending)!",
      });
    }

    const now = new Date();
    if (now < booking.startTime || now > booking.endTime) {
      return res.status(403).json({
        success: false,
        message: "Chìa khóa đã hết hạn hoặc chưa đến giờ sử dụng!",
      });
    }

    await sendCommandToRoom(topic, payload);
    return res.status(200).json({ success: true, message: "Đã gửi lệnh thành công." });
  } catch (error) {
    console.error("Lỗi xác thực IoT:", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
  }
};
