const express = require("express");

const {
    createLaboratoryTest,
    getLaboratoryTests,
    getLaboratoryTest,
    updateLaboratoryTest,
    deleteLaboratoryTest,
    getLaboratoryStats,
} = require("../controllers/laboratory.controller");

const authMiddleware = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/role.middleware");

const router = express.Router();

/*
=====================================================
AUTHENTICATION
All laboratory routes require login
=====================================================
*/

router.use(authMiddleware);

/*
=====================================================
LABORATORY PERMISSION
Allowed roles:
- super_admin
- hospital_admin
- doctor
- lab_technician
=====================================================
*/

router.use(requirePermission("laboratory"));

/*
=====================================================
GET ALL LABORATORY TESTS
GET /api/laboratory
=====================================================
*/

router.get("/", getLaboratoryTests);

/*
=====================================================
GET LABORATORY STATISTICS
GET /api/laboratory/stats
=====================================================

Must remain before /:id
*/

router.get("/stats", getLaboratoryStats);

/*
=====================================================
GET SINGLE LABORATORY TEST
GET /api/laboratory/:id
=====================================================
*/

router.get("/:id", getLaboratoryTest);

/*
=====================================================
CREATE LABORATORY TEST
POST /api/laboratory
=====================================================
*/

router.post("/", createLaboratoryTest);

/*
=====================================================
UPDATE LABORATORY TEST
PUT /api/laboratory/:id
=====================================================
*/

router.put("/:id", updateLaboratoryTest);

/*
=====================================================
DELETE LABORATORY TEST
DELETE /api/laboratory/:id
=====================================================
*/

router.delete("/:id", deleteLaboratoryTest);

module.exports = router;