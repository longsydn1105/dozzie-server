// server/models/room.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const roomSchema = new Schema({
    // Ông tự đặt ID ("M-01", "F-01") nên ta định nghĩa _id là String
    _id: { 
        type: String, 
        required: true,
        uppercase: true, // "Tút" lại cho nó "pro"
        trim: true 
    },
    label: { type: String, required: true }, // Tên/Nhãn (vd: "Kén số 01")
    gender: { type: String, required: true, enum: ['Nam', 'Nữ'] }, // Khu Nam/Nữ
    floor: { type: Number, required: true },
    status: { type: String, default: 'available', enum: ['available', 'occupied'] }
}, {
    // Tắt _id tự động của Mongoose vì ta đã dùng _id custom ở trên
    _id: false,
    timestamps: true // Vẫn nên có
});

// Tên Model là 'Room', Mongoose sẽ tự tạo collection là 'rooms'
module.exports = mongoose.model('Room', roomSchema);