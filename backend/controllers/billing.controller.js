const billingModel = require("../models/billing.model");


/* =====================================================
   CREATE BILL
===================================================== */

const createBilling = async (req, res) => {
    try {
        const {
            patient_id,
            bill_date,
            consultation_fee,
            medicine_amount,
            laboratory_amount,
            other_charges,
            discount,
            tax,
            payment_method,
            payment_status,
            notes,
        } = req.body;

        if (!patient_id) {
            return res.status(400).json({
                success: false,
                message: "Patient is required",
            });
        }

        const id = await billingModel.createBilling({
            patient_id,
            bill_date,
            consultation_fee,
            medicine_amount,
            laboratory_amount,
            other_charges,
            discount,
            tax,
            payment_method,
            payment_status,
            notes,
        });

        const billing =
            await billingModel.getBillingById(id);

        return res.status(201).json({
            success: true,
            message: "Bill created successfully",
            billing,
        });

    } catch (error) {
        console.error(
            "Create billing error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create bill",
            error: error.message,
        });
    }
};


/* =====================================================
   GET ALL BILLS
===================================================== */

const getAllBilling = async (req, res) => {
    try {
        const billing =
            await billingModel.getAllBilling();

        return res.status(200).json({
            success: true,
            billing,
        });

    } catch (error) {
        console.error(
            "Get billing error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch billing records",
            error: error.message,
        });
    }
};


/* =====================================================
   GET BILL BY ID
===================================================== */

const getBillingById = async (req, res) => {
    try {
        const { id } = req.params;

        const billing =
            await billingModel.getBillingById(id);

        if (!billing) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }

        return res.status(200).json({
            success: true,
            billing,
        });

    } catch (error) {
        console.error(
            "Get billing by ID error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch bill",
            error: error.message,
        });
    }
};


/* =====================================================
   UPDATE BILL
===================================================== */

const updateBilling = async (req, res) => {
    try {
        const { id } = req.params;

        const existingBilling =
            await billingModel.getBillingById(id);

        if (!existingBilling) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }

        if (
            req.body.patient_id === undefined ||
            req.body.patient_id === null ||
            req.body.patient_id === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Patient is required",
            });
        }

        const affectedRows =
            await billingModel.updateBilling(
                id,
                req.body
            );

        if (!affectedRows) {
            return res.status(400).json({
                success: false,
                message: "Bill was not updated",
            });
        }

        const billing =
            await billingModel.getBillingById(id);

        return res.status(200).json({
            success: true,
            message: "Bill updated successfully",
            billing,
        });

    } catch (error) {
        console.error(
            "Update billing error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update bill",
            error: error.message,
        });
    }
};


/* =====================================================
   DELETE BILL
===================================================== */

const deleteBilling = async (req, res) => {
    try {
        const { id } = req.params;

        const existingBilling =
            await billingModel.getBillingById(id);

        if (!existingBilling) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }

        const affectedRows =
            await billingModel.deleteBilling(id);

        if (!affectedRows) {
            return res.status(400).json({
                success: false,
                message: "Bill was not deleted",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Bill deleted successfully",
        });

    } catch (error) {
        console.error(
            "Delete billing error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to delete bill",
            error: error.message,
        });
    }
};


/* =====================================================
   BILLING STATS
===================================================== */

const getBillingStats = async (req, res) => {
    try {
        const stats =
            await billingModel.getBillingStats();

        return res.status(200).json({
            success: true,
            stats,
        });

    } catch (error) {
        console.error(
            "Billing stats error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch billing statistics",
            error: error.message,
        });
    }
};


/* =====================================================
   EXPORT
===================================================== */

module.exports = {
    createBilling,
    getAllBilling,
    getBillingById,
    updateBilling,
    deleteBilling,
    getBillingStats,
};