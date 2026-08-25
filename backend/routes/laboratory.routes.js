const express = require("express");

const router = express.Router();

const {
    createLaboratoryTest,
    getLaboratoryTests,
    getLaboratoryTest,
    updateLaboratoryTest,
    deleteLaboratoryTest,
    getLaboratoryStats,
} = require("../controllers/laboratory.controller");

// GET all laboratory tests
router.get("/", getLaboratoryTests);

// GET statistics
router.get("/stats", getLaboratoryStats);

// GET single test
router.get("/:id", getLaboratoryTest);

// CREATE
router.post("/", createLaboratoryTest);

// UPDATE
router.put("/:id", updateLaboratoryTest);

// DELETE
router.delete("/:id", deleteLaboratoryTest);

module.exports = router;