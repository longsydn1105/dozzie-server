const express = require("express");
const router = express.Router();
const controller = require("../controllers/ServicePackage");
const { isAuth, isAdmin } = require("../middleware/auth");

router.get("/", controller.getAllActivePackages);
router.get("/all", isAuth, isAdmin, controller.getAllPackages);
router.post("/", isAuth, isAdmin, controller.createPackage);
router.put("/:id", isAuth, isAdmin, controller.updatePackage);
router.delete("/:id", isAuth, isAdmin, controller.deletePackage);

module.exports = router;
