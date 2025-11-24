// server/models/user.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true 
    },
    // *THÊM*: Bắt buộc phải có để 'auth.js' (login) "chạy" được
    password: { 
        type: String, 
        required: true,
    },
    displayName: { type: String },
    role: { 
        type: String, 
        enum: ['customer', 'admin'], 
        default: 'customer' 
    },
    diem: { type: Number, default: 0 } // "Trường 'điểm' của ông"
}, {
    timestamps: true // Tự thêm createdAt, updatedAt
});

// Tên Model là 'User', Mongoose sẽ tự tạo collection là 'users'
module.exports = mongoose.model('User', userSchema);