const billingModel = require("../models/billing.model");

/* =====================================================
   HELPERS
===================================================== */

const isSuperAdmin = (req) => {
    return (
        String(req.user?.role || "")
            .trim()
            .toLowerCase() === "super_admin"
    );
};

const getHospitalScope = (req) => {
    if (isSuperAdmin(req)) {
        return null;
    }

    const hospitalId = Number(
        req.user?.hospital_id
    );

    if (
        !Number.isInteger(hospitalId) ||
        hospitalId <= 0
    ) {
        return undefined;
    }

    return hospitalId;
};

const requireHospitalScope = (
    req,
    res
) => {
    const hospitalId =
        getHospitalScope(req);

    if (hospitalId === undefined) {
        res.status(403).json({
            success: false,
            message:
                "Hospital access is not assigned to this user.",
        });

        return undefined;
    }

    return hospitalId;
};

const handleModelError = (
    res,
    error,
    fallbackMessage
) => {
    console.error(
        fallbackMessage,
        error
    );

    const message = String(
        error?.message || ""
    ).toLowerCase();

    if (
        message.includes("required") ||
        message.includes("must be") ||
        message.includes("cannot exceed") ||
        message.includes("valid")
    ) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }

    return res.status(500).json({
        success: false,
        message: fallbackMessage,
    });
};

/* =====================================================
   CREATE BILL
===================================================== */

const createBilling = async (
    req,
    res
) => {
    try {
        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (hospitalId === undefined) {
            return;
        }

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
        } = req.body || {};

        if (
            patient_id === undefined ||
            patient_id === null ||
            patient_id === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Patient is required.",
            });
        }

        const patient =
            await billingModel.findPatientById(
                patient_id
            );

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found.",
            });
        }

        if (
            hospitalId !== null &&
            Number(patient.hospital_id) !==
                Number(hospitalId)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Patient does not belong to your hospital.",
            });
        }

        const id =
            await billingModel.createBilling({
                patient_id,
                hospital_id: patient.hospital_id,
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
            await billingModel.getBillingById(
                id,
                hospitalId
            );

        return res.status(201).json({
            success: true,
            message:
                "Bill created successfully.",
            billing,
        });
    } catch (error) {
        return handleModelError(
            res,
            error,
            "Failed to create bill."
        );
    }
};

/* =====================================================
   GET ALL BILLS
===================================================== */

const getAllBilling = async (
    req,
    res
) => {
    try {
        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (hospitalId === undefined) {
            return;
        }

        const billing =
            await billingModel.getAllBilling(
                hospitalId
            );

        return res.status(200).json({
            success: true,
            billing,
        });
    } catch (error) {
        return handleModelError(
            res,
            error,
            "Failed to fetch billing records."
        );
    }
};

/* =====================================================
   GET BILL BY ID
===================================================== */

const getBillingById = async (
    req,
    res
) => {
    try {
        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (hospitalId === undefined) {
            return;
        }

        const { id } = req.params;

        const billing =
            await billingModel.getBillingById(
                id,
                hospitalId
            );

        if (!billing) {
            return res.status(404).json({
                success: false,
                message: "Bill not found.",
            });
        }

        return res.status(200).json({
            success: true,
            billing,
        });
    } catch (error) {
        return handleModelError(
            res,
            error,
            "Failed to fetch bill."
        );
    }
};

/* =====================================================
   UPDATE BILL
===================================================== */

const updateBilling = async (
    req,
    res
) => {
    try {
        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (hospitalId === undefined) {
            return;
        }

        const { id } = req.params;

        const existingBilling =
            await billingModel.getBillingById(
                id,
                hospitalId
            );

        if (!existingBilling) {
            return res.status(404).json({
                success: false,
                message: "Bill not found.",
            });
        }

        if (
            req.body?.patient_id ===
                undefined ||
            req.body?.patient_id === null ||
            req.body?.patient_id === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Patient is required.",
            });
        }

        const patient =
            await billingModel.findPatientById(
                req.body.patient_id
            );

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found.",
            });
        }

        if (
            hospitalId !== null &&
            Number(patient.hospital_id) !==
                Number(hospitalId)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Patient does not belong to your hospital.",
            });
        }

        const affectedRows =
            await billingModel.updateBilling(
                id,
                req.body,
                hospitalId
            );

        if (!affectedRows) {
            return res.status(400).json({
                success: false,
                message:
                    "Bill was not updated.",
            });
        }

        const billing =
            await billingModel.getBillingById(
                id,
                hospitalId
            );

        return res.status(200).json({
            success: true,
            message:
                "Bill updated successfully.",
            billing,
        });
    } catch (error) {
        return handleModelError(
            res,
            error,
            "Failed to update bill."
        );
    }
};

/* =====================================================
   DELETE BILL
===================================================== */

const deleteBilling = async (
    req,
    res
) => {
    try {
        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (hospitalId === undefined) {
            return;
        }

        const { id } = req.params;

        const existingBilling =
            await billingModel.getBillingById(
                id,
                hospitalId
            );

        if (!existingBilling) {
            return res.status(404).json({
                success: false,
                message: "Bill not found.",
            });
        }

        const affectedRows =
            await billingModel.deleteBilling(
                id,
                hospitalId
            );

        if (!affectedRows) {
            return res.status(400).json({
                success: false,
                message:
                    "Bill was not deleted.",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Bill deleted successfully.",
        });
    } catch (error) {
        return handleModelError(
            res,
            error,
            "Failed to delete bill."
        );
    }
};

/* =====================================================
   BILLING STATS
===================================================== */

const getBillingStats = async (
    req,
    res
) => {
    try {
        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (hospitalId === undefined) {
            return;
        }

        const stats =
            await billingModel.getBillingStats(
                hospitalId
            );

        return res.status(200).json({
            success: true,
            stats,
        });
    } catch (error) {
        return handleModelError(
            res,
            error,
            "Failed to fetch billing statistics."
        );
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