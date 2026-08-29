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

// =====================================================
// LABORATORY TEST ROUTES
// =====================================================

// GET all tests
router.get("/", getLaboratoryTests);

// GET statistics
router.get("/stats", getLaboratoryStats);

// GET single test
router.get("/:id", getLaboratoryTest);

// CREATE test
router.post("/", createLaboratoryTest);

// UPDATE test
router.put("/:id", updateLaboratoryTest);

// DELETE test
router.delete("/:id", deleteLaboratoryTest);

module.exports = router;