const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Blog schema - bài viết blog
 */
const blogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date, default: Date.now },
    tags: [{ type: String }],
    img_url: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Blog", blogSchema);
