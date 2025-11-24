// server/models/blog.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const blogSchema = new Schema({
    title: { type: String, required: true, trim: true },
    // "cach-ngu-ngon"
    slug: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    content: { type: String, required: true },
    
    // Liên kết tới người viết (Admin/User)
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    
    publishedAt: { type: Date, default: Date.now },
    tags: [{ type: String }], // Mảng các tag
    img_url: { type: String, required: false } // Ảnh bìa
}, {
    timestamps: true
});

// Tên Model là 'Blog', Mongoose sẽ tự tạo collection là 'blogs'
module.exports = mongoose.model('Blog', blogSchema);