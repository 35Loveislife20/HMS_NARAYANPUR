const express = require("express");

const {
    createBilling,
    getAllBilling,
    getBillingById,
    updateBilling,
    deleteBilling,
    getBillingStats,
} = require("../controllers/billing.controller");

const router = express.Router();

/* =====================================================
   BILLING ROUTES
===================================================== */

/*
   GET /api/billing
   Get all bills
*/
router.get("/", getAllBilling);


/*
   GET /api/billing/stats
   Get billing statistics

   IMPORTANT:
   This route must come BEFORE /:id
*/
router.get("/stats", getBillingStats);


/*
   GET /api/billing/:id
   Get single bill
*/
router.get("/:id", getBillingById);


/*
   POST /api/billing
   Create new bill
*/
router.post("/", createBilling);


/*
   PUT /api/billing/:id
   Update bill
*/
router.put("/:id", updateBilling);


/*
   DELETE /api/billing/:id
   Delete bill
*/
router.delete("/:id", deleteBilling);


module.exports = router;