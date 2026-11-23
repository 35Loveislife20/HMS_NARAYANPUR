const express = require("express");

const {
    createBilling,
    getAllBilling,
    getBillingById,
    updateBilling,
    deleteBilling,
    getBillingStats,
} = require("../controllers/billing.controller");

const authMiddleware = require("../middleware/auth.middleware");
const {
    requirePermission,
} = require("../middleware/role.middleware");

const router = express.Router();

/*
=====================================================
AUTHENTICATION
All billing routes require login
=====================================================
*/

router.use(authMiddleware);

/*
=====================================================
BILLING PERMISSION
Allowed roles:
- super_admin
- hospital_admin
- pharmacist
- accountant
=====================================================
*/

router.use(
    requirePermission("billing")
);

/*
=====================================================
GET ALL BILLING
GET /api/billing
=====================================================
*/

router.get(
    "/",
    getAllBilling
);

/*
=====================================================
GET BILLING STATS
GET /api/billing/stats
=====================================================
*/

router.get(
    "/stats",
    getBillingStats
);

/*
=====================================================
GET SINGLE BILL
GET /api/billing/:id
=====================================================
*/

router.get(
    "/:id",
    getBillingById
);

/*
=====================================================
CREATE BILL
POST /api/billing
=====================================================
*/

router.post(
    "/",
    createBilling
);

/*
=====================================================
UPDATE BILL
PUT /api/billing/:id
=====================================================
*/

router.put(
    "/:id",
    updateBilling
);

/*
=====================================================
DELETE BILL
DELETE /api/billing/:id
=====================================================
*/

router.delete(
    "/:id",
    deleteBilling
);

module.exports = router;