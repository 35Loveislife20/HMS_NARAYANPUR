const medicineModel = require("../models/medicine.model");

/*
=====================================================
CREATE MEDICINE
=====================================================
*/

const createMedicine = async (req, res) => {
    try {
        const {
            medicine_name,
            category,
            manufacturer,
            batch_number,
            quantity,
            unit_price,
            expiry_date,
            description,
            status,
        } = req.body;

        /*
        ---------------------------------------------
        VALIDATION
        ---------------------------------------------
        */

        if (
            !medicine_name ||
            typeof medicine_name !== "string" ||
            !medicine_name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Medicine name is required.",
            });
        }

        /*
        ---------------------------------------------
        CREATE
        ---------------------------------------------
        */

        const medicineId =
            await medicineModel.createMedicine({
                medicine_name:
                    medicine_name.trim(),

                category:
                    category?.trim() || null,

                manufacturer:
                    manufacturer?.trim() || null,

                batch_number:
                    batch_number?.trim() || null,

                quantity:
                    Number(quantity) >= 0
                        ? Number(quantity)
                        : 0,

                unit_price:
                    Number(unit_price) >= 0
                        ? Number(unit_price)
                        : 0,

                expiry_date:
                    expiry_date || null,

                description:
                    description?.trim() || null,

                status:
                    status === "inactive"
                        ? "inactive"
                        : "active",
            });

        /*
        ---------------------------------------------
        GET CREATED MEDICINE
        ---------------------------------------------
        */

        const medicine =
            await medicineModel.getMedicineById(
                medicineId
            );

        return res.status(201).json({
            success: true,
            message: "Medicine created successfully.",
            medicine,
        });

    } catch (error) {
        console.error(
            "Create Medicine Error:",
            error
        );

        /*
        Duplicate medicine code / database error
        */

        if (
            error.code === "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Medicine code already exists. Please try again.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to create medicine.",
        });
    }
};


/*
=====================================================
GET ALL MEDICINES
=====================================================
*/

const getMedicines = async (req, res) => {
    try {
        const medicines =
            await medicineModel.getAllMedicines();

        return res.status(200).json({
            success: true,
            medicines,
        });

    } catch (error) {
        console.error(
            "Get Medicines Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load medicines.",
        });
    }
};


/*
=====================================================
GET MEDICINE BY ID
=====================================================
*/

const getMedicine = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Medicine ID is required.",
            });
        }

        const medicine =
            await medicineModel.getMedicineById(
                id
            );

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message:
                    "Medicine not found.",
            });
        }

        return res.status(200).json({
            success: true,
            medicine,
        });

    } catch (error) {
        console.error(
            "Get Medicine Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load medicine.",
        });
    }
};


/*
=====================================================
UPDATE MEDICINE
=====================================================
*/

const updateMedicine = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            medicine_name,
            category,
            manufacturer,
            batch_number,
            quantity,
            unit_price,
            expiry_date,
            description,
            status,
        } = req.body;

        if (
            !medicine_name ||
            typeof medicine_name !== "string" ||
            !medicine_name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Medicine name is required.",
            });
        }

        const affectedRows =
            await medicineModel.updateMedicine(
                id,
                {
                    medicine_name:
                        medicine_name.trim(),

                    category:
                        category?.trim() || null,

                    manufacturer:
                        manufacturer?.trim() || null,

                    batch_number:
                        batch_number?.trim() || null,

                    quantity:
                        Number(quantity) >= 0
                            ? Number(quantity)
                            : 0,

                    unit_price:
                        Number(unit_price) >= 0
                            ? Number(unit_price)
                            : 0,

                    expiry_date:
                        expiry_date || null,

                    description:
                        description?.trim() || null,

                    status:
                        status === "inactive"
                            ? "inactive"
                            : "active",
                }
            );

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Medicine not found.",
            });
        }

        const medicine =
            await medicineModel.getMedicineById(
                id
            );

        return res.status(200).json({
            success: true,
            message:
                "Medicine updated successfully.",
            medicine,
        });

    } catch (error) {
        console.error(
            "Update Medicine Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update medicine.",
        });
    }
};


/*
=====================================================
DELETE MEDICINE
=====================================================
*/

const deleteMedicine = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Medicine ID is required.",
            });
        }

        const affectedRows =
            await medicineModel.deleteMedicine(
                id
            );

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Medicine not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Medicine deleted successfully.",
        });

    } catch (error) {
        console.error(
            "Delete Medicine Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete medicine.",
        });
    }
};


/*
=====================================================
MEDICINE STATISTICS
=====================================================
*/

const getMedicineStats = async (req, res) => {
    try {
        const stats =
            await medicineModel.getMedicineStats();

        return res.status(200).json({
            success: true,
            stats,
        });

    } catch (error) {
        console.error(
            "Medicine Stats Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load medicine statistics.",
        });
    }
};


/*
=====================================================
EXPORT
=====================================================
*/

module.exports = {
    createMedicine,
    getMedicines,
    getMedicine,
    updateMedicine,
    deleteMedicine,
    getMedicineStats,
};