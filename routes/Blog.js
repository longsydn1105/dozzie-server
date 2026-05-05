const express = require("express");
const router = express.Router();
const blogController = require("../controllers/Blog");
const { isAuth } = require("../middleware/auth");

router.get("/", blogController.getBlogs);
router.post("/", isAuth, blogController.createBlog);

module.exports = router;
