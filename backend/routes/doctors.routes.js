const express = require("express");

const {
    getDoctors,
    getDoctor,
    getNextDoctorCode,
    addDoctor,
    editDoctor,
    removeDoctor,
} = require("../controllers/doctors.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

/*
=====================================================
GET ALL DOCTORS
GET /api/doctors
=====================================================
*/

router.get(
    "/",
    authMiddleware,
    getDoctors
);

/*
=====================================================
GET NEXT DOCTOR CODE
IMPORTANT:
Must come before /:id
=====================================================
*/

router.get(
    "/next-code",
    authMiddleware,
    getNextDoctorCode
);

/*
=====================================================
GET SINGLE DOCTOR
GET /api/doctors/:id
=====================================================
*/

router.get(
    "/:id",
    authMiddleware,
    getDoctor
);

/*
=====================================================
CREATE DOCTOR
POST /api/doctors
=====================================================
*/

router.post(
    "/",
    authMiddleware,
    addDoctor
);

/*
=====================================================
UPDATE DOCTOR
PUT /api/doctors/:id
=====================================================
*/

router.put(
    "/:id",
    authMiddleware,
    editDoctor
);

/*
=====================================================
DELETE DOCTOR
DELETE /api/doctors/:id
=====================================================
*/

router.delete(
    "/:id",
    authMiddleware,
    removeDoctor
);

module.exports = router;