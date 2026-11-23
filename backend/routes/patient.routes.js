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
const {
    requirePermission,
    requireRole,
} = require("../middleware/role.middleware");

const router = express.Router();

/*
=====================================================
PUBLIC PATIENT REGISTRATION
=====================================================

NO LOGIN REQUIRED

POST /api/patients/register

Used by:
- Patient Registration
- Patient Portal
=====================================================
*/

router.post(
    "/register",
    registerPatient
);


/*
=====================================================
PUBLIC PATIENT REGISTRATION ALIAS
=====================================================

NO LOGIN REQUIRED

POST /api/patients/public

Kept for compatibility with existing public flows.
=====================================================
*/

router.post(
    "/public",
    registerPatient
);


/*
=====================================================
PUBLIC PATIENT SEARCH
=====================================================

NO LOGIN REQUIRED

GET /api/patients/public/search

Optional:
hospital_id

Examples:

GET /api/patients/public/search?query=P-1001

GET /api/patients/public/search?query=P-1001&hospital_id=2
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
=====================================================

GET /api/patients

Allowed:
- Super Admin
- Hospital Admin
- Receptionist
- Doctor
- Nurse
=====================================================
*/

router.get(
    "/",
    requirePermission("patients"),
    getPatients
);


/*
=====================================================
GET PATIENT BY ID
=====================================================

GET /api/patients/:id

Allowed:
- Super Admin
- Hospital Admin
- Receptionist
- Doctor
- Nurse
=====================================================
*/

router.get(
    "/:id",
    requirePermission("patients"),
    getPatientById
);


/*
=====================================================
CREATE PATIENT
=====================================================

POST /api/patients

Allowed:
- Super Admin
- Hospital Admin
- Receptionist
- Doctor
- Nurse

Hospital users:
- Hospital comes from JWT

Super Admin:
- hospital_id comes from request
=====================================================
*/

router.post(
    "/",
    requirePermission("patients"),
    createPatient
);


/*
=====================================================
UPDATE PATIENT
=====================================================

PUT /api/patients/:id

Allowed:
- Super Admin
- Hospital Admin
- Receptionist
- Doctor
- Nurse
=====================================================
*/

router.put(
    "/:id",
    requirePermission("patients"),
    updatePatient
);


/*
=====================================================
DELETE PATIENT
=====================================================

DELETE /api/patients/:id

More sensitive operation.

Allowed:
- Super Admin
- Hospital Admin

Receptionist/Doctor/Nurse cannot delete patients.
=====================================================
*/

router.delete(
    "/:id",
    requireRole(
        "super_admin",
        "hospital_admin"
    ),
    deletePatient
);


module.exports = router;