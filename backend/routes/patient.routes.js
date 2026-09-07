const express = require("express");

const {
    getPatients,
    searchPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
    registerPatient,
} = require("../controllers/patient.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();


/*
=====================================================
PUBLIC PATIENT REGISTRATION
=====================================================

Used by:
- Patient Registration Page
- Public Patient Services

NO LOGIN REQUIRED

POST /api/patients/register
=====================================================
*/

router.post(
    "/register",
    registerPatient
);


/*
=====================================================
PUBLIC PATIENT SEARCH
=====================================================

Used by:
- Old Patient Appointment
- Public Patient Services

NO LOGIN REQUIRED

Search by:
- Patient ID
- Patient Code
- Name
- Phone
- Email

Example:
GET /api/patients/public/search?query=P-1001
=====================================================
*/

router.get(
    "/public/search",
    searchPatients
);


/*
=====================================================
AUTHENTICATION
=====================================================

Everything below this point requires login.
=====================================================
*/

router.use(authMiddleware);


/*
=====================================================
GET ALL PATIENTS
GET /api/patients
=====================================================
*/

router.get(
    "/",
    getPatients
);


/*
=====================================================
GET PATIENT BY ID
GET /api/patients/:id
=====================================================
*/

router.get(
    "/:id",
    getPatientById
);


/*
=====================================================
CREATE PATIENT
POST /api/patients
=====================================================
*/

router.post(
    "/",
    createPatient
);


/*
=====================================================
UPDATE PATIENT
PUT /api/patients/:id
=====================================================
*/

router.put(
    "/:id",
    updatePatient
);


/*
=====================================================
DELETE PATIENT
DELETE /api/patients/:id
=====================================================
*/

router.delete(
    "/:id",
    deletePatient
);


module.exports = router;