const express = require("express");

const {
    getAppointments,
    getAppointment,
    addAppointment,
    editAppointment,
    removeAppointment,
} = require("../controllers/appointment.controller");

const router = express.Router();

// =====================================================
// GET ALL APPOINTMENTS
// GET /api/appointments
// =====================================================

router.get("/", getAppointments);

// =====================================================
// GET APPOINTMENT BY ID
// GET /api/appointments/:id
// =====================================================

router.get("/:id", getAppointment);

// =====================================================
// CREATE APPOINTMENT
// POST /api/appointments
// =====================================================

router.post("/", addAppointment);

// =====================================================
// UPDATE APPOINTMENT
// PUT /api/appointments/:id
// =====================================================

router.put("/:id", editAppointment);

// =====================================================
// DELETE APPOINTMENT
// DELETE /api/appointments/:id
// =====================================================

router.delete("/:id", removeAppointment);

module.exports = router;