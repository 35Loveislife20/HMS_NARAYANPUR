const express = require("express");

const {
    getPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
} = require("../controllers/patient.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();


/*
=====================================================
AUTHENTICATION
=====================================================
*/

router.use(authMiddleware);


/*
=====================================================
GET ALL
=====================================================
*/

router.get(
    "/",
    getPatients
);


/*
=====================================================
GET ONE
=====================================================
*/

router.get(
    "/:id",
    getPatientById
);


/*
=====================================================
CREATE
=====================================================
*/

router.post(
    "/",
    createPatient
);


/*
=====================================================
UPDATE
=====================================================
*/

router.put(
    "/:id",
    updatePatient
);


/*
=====================================================
DELETE
=====================================================
*/

router.delete(
    "/:id",
    deletePatient
);


module.exports = router;