const express = require("express");

const router = express.Router();

const {
    createMedicine,
    getMedicines,
    getMedicine,
    updateMedicine,
    deleteMedicine,
    getMedicineStats,
} = require("../controllers/medicine.controller");


// GET /api/medicines
router.get("/", getMedicines);

// GET /api/medicines/stats
router.get("/stats", getMedicineStats);

// GET /api/medicines/:id
router.get("/:id", getMedicine);

// POST /api/medicines
router.post("/", createMedicine);

// PUT /api/medicines/:id
router.put("/:id", updateMedicine);

// DELETE /api/medicines/:id
router.delete("/:id", deleteMedicine);


module.exports = router;