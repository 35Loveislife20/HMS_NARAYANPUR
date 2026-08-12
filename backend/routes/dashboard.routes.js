const express = require("express");

const {
    getStats,
    getRecentAppointmentsController,
} = require("../controllers/dashboard.controller");

const router = express.Router();

// Dashboard statistics
router.get("/stats", getStats);

// Recent appointments
router.get(
    "/recent-appointments",
    getRecentAppointmentsController
);

module.exports = router;