const express = require("express");

const {
    getStats,
    getRecentAppointmentsController,
} = require("../controllers/dashboard.controller");

const authenticateToken = require("../middleware/auth.middleware");

const router = express.Router();

/*
=====================================================
ALL DASHBOARD ROUTES REQUIRE LOGIN
=====================================================
*/

router.get(
    "/stats",
    authenticateToken,
    getStats
);

router.get(
    "/recent-appointments",
    authenticateToken,
    getRecentAppointmentsController
);

module.exports = router;