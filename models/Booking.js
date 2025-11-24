// server/models/booking.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookingSchema = new Schema({
    // Liên kết tới _id (String "M-01") của Room
    roomIds: [{ 
        type: String, 
        ref: 'Room', 
        required: true 
    }],
    
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    
    // Info người đặt (kể cả vãng lai)
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },

    // Liên kết tới User nếu đã login (Mongoose tự tạo _id ObjectId)
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }
}, {
    timestamps: true // Tự thêm createdAt, updatedAt
});

// Tên Model là 'Booking', Mongoose sẽ tự tạo collection là 'bookings'
module.exports = mongoose.model('Booking', bookingSchema);