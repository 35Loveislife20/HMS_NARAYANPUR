const express = require("express");

const {
    getAppointments,
    getAppointment,
    addAppointment,
    editAppointment,
    removeAppointment,
    getPublicAppointments,
    addPublicAppointment,
} = require("../controllers/appointment.controller");

const router = express.Router();

// =====================================================
// PUBLIC APPOINTMENT ROUTES
// IMPORTANT: These must come BEFORE /:id
// =====================================================

// GET /api/appointments/public
// Check booked slots for public patient appointment
router.get(
    "/public",
    getPublicAppointments
);

// POST /api/appointments/public
// Book appointment without HMS staff login
router.post(
    "/public",
    addPublicAppointment
);

// =====================================================
// PROTECTED / HMS APPOINTMENT ROUTES
// =====================================================

// GET /api/appointments
router.get(
    "/",
    getAppointments
);

// GET /api/appointments/:id
router.get(
    "/:id",
    getAppointment
);

// POST /api/appointments
router.post(
    "/",
    addAppointment
);

// PUT /api/appointments/:id
router.put(
    "/:id",
    editAppointment
);

// DELETE /api/appointments/:id
router.delete(
    "/:id",
    removeAppointment
);

module.exports = router;