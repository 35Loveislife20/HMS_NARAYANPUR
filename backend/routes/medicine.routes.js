const express = require("express");

const {
    createMedicine,
    getMedicines,
    getMedicine,
    updateMedicine,
    deleteMedicine,
    getMedicineStats,
} = require("../controllers/medicine.controller");

const authMiddleware = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/role.middleware");

const router = express.Router();

/*
=====================================================
AUTHENTICATION
All medicine routes require login
=====================================================
*/

router.use(authMiddleware);

/*
=====================================================
MEDICINE PERMISSION
Allowed roles:
- super_admin
- hospital_admin
- pharmacist
- accountant
=====================================================
*/

router.use(requirePermission("pharmacy"));

/*
=====================================================
GET ALL MEDICINES
GET /api/medicines
=====================================================
*/

router.get("/", getMedicines);

/*
=====================================================
GET MEDICINE STATS
GET /api/medicines/stats
=====================================================
*/

router.get("/stats", getMedicineStats);

/*
=====================================================
GET SINGLE MEDICINE
GET /api/medicines/:id
=====================================================
*/

router.get("/:id", getMedicine);

/*
=====================================================
CREATE MEDICINE
POST /api/medicines
=====================================================
*/

router.post("/", createMedicine);

/*
=====================================================
UPDATE MEDICINE
PUT /api/medicines/:id
=====================================================
*/

router.put("/:id", updateMedicine);

/*
=====================================================
DELETE MEDICINE
DELETE /api/medicines/:id
=====================================================
*/

router.delete("/:id", deleteMedicine);

module.exports = router;