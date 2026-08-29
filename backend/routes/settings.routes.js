const express = require("express");

const {
    getSettings,
    updateSettings,
} = require("../controllers/settings.controller");

const router = express.Router();

// =====================================================
// GET SETTINGS
// GET /api/settings
// =====================================================

router.get("/", getSettings);

// =====================================================
// UPDATE SETTINGS
// PUT /api/settings
// =====================================================

router.put("/", updateSettings);

module.exports = router;