const express = require("express");
const router = express.Router();
const sosController = require("../controllers/SosAlert");
const { isAuth, isAdmin } = require("../middleware/auth");

router.post("/emergency", isAuth, sosController.createAlert);
router.get("/list", isAuth, isAdmin, sosController.getAlerts);
router.patch("/resolve/:id", isAuth, isAdmin, sosController.resolveAlert);

module.exports = router;
