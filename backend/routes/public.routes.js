const express = require("express");
const { getPublicDoctors } = require("../controllers/public.controller");

const dbModule = require("../config/db");
const db =
    dbModule.pool ||
    dbModule.db ||
    dbModule.connection ||
    dbModule.default ||
    dbModule;

const run = async (sql, params = []) => {
    const fn =
        typeof db.query === "function"
            ? db.query.bind(db)
            : db.execute.bind(db);

    const result = await fn(sql, params);

    if (
        Array.isArray(result) &&
        result.length === 2 &&
        (result[1] === undefined || Array.isArray(result[1]))
    ) {
        return result[0];
    }

    return result;
};

const router = express.Router();

/* ---------- helpers ---------- */

const isValidId = (value) => /^\d+$/.test(String(value ?? ""));

// Table name hamesha hardcoded constant se aata hai (user input nahi)
const countFor = async (table, hospitalId) => {
    try {
        const rows = await run(
            `SELECT COUNT(*) AS total FROM ${table} WHERE hospital_id = ?`,
            [hospitalId]
        );
        return Number(rows?.[0]?.total || 0);
    } catch (error) {
        console.warn(`Public stats: ${table} count fail:`, error.message);
        return 0;
    }
};

const buildStats = async (hospitalId) => ({
    totalDoctors: await countFor("doctors", hospitalId),
    totalPatients: await countFor("patients", hospitalId),
    totalDepartments: await countFor("departments", hospitalId),
    totalAppointments: await countFor("appointments", hospitalId),
});

const fetchDepartments = async (hospitalId) => {
    try {
        const rows = await run(
            "SELECT * FROM departments WHERE hospital_id = ?",
            [hospitalId]
        );
        return Array.isArray(rows) ? rows : [];
    } catch (error) {
        console.warn("Public departments fail:", error.message);
        return [];
    }
};

/* ---------- PUBLIC DOCTORS (unchanged) ---------- */

// GET /api/public/doctors
router.get("/doctors", getPublicDoctors);

/* ---------- PUBLIC STATS ---------- */

// GET /api/public/hospitals/:id/stats
router.get("/hospitals/:id/stats", async (req, res) => {
    const hospitalId = req.params.id;

    if (!isValidId(hospitalId)) {
        return res.status(400).json({ success: false, message: "Invalid hospital id." });
    }

    try {
        res.json({ success: true, data: await buildStats(hospitalId) });
    } catch (error) {
        console.error("Public hospital stats error:", error);
        res.status(500).json({ success: false, message: "Unable to load stats." });
    }
});

// GET /api/public/stats?hospital_id=1
router.get("/stats", async (req, res) => {
    const hospitalId = req.query.hospital_id;

    if (!isValidId(hospitalId)) {
        return res.status(400).json({ success: false, message: "Invalid hospital id." });
    }

    try {
        res.json({ success: true, data: await buildStats(hospitalId) });
    } catch (error) {
        console.error("Public stats error:", error);
        res.status(500).json({ success: false, message: "Unable to load stats." });
    }
});

/* ---------- PUBLIC DEPARTMENTS ---------- */

// GET /api/public/hospitals/:id/departments
router.get("/hospitals/:id/departments", async (req, res) => {
    const hospitalId = req.params.id;

    if (!isValidId(hospitalId)) {
        return res.status(400).json({ success: false, message: "Invalid hospital id." });
    }

    res.json({ success: true, data: await fetchDepartments(hospitalId) });
});

// GET /api/public/departments?hospital_id=1
router.get("/departments", async (req, res) => {
    const hospitalId = req.query.hospital_id;

    if (!isValidId(hospitalId)) {
        return res.status(400).json({ success: false, message: "Invalid hospital id." });
    }

    res.json({ success: true, data: await fetchDepartments(hospitalId) });
});

module.exports = router;