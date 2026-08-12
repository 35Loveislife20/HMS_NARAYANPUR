const express = require("express");

const {
    addPatient,
    getPatients,
    getPatient,
    editPatient,
    removePatient,
} = require("../controllers/patient.controller");

const router = express.Router();

router.post("/", addPatient);

router.get("/", getPatients);

router.get("/:id", getPatient);

router.put("/:id", editPatient);

router.delete("/:id", removePatient);

module.exports = router;