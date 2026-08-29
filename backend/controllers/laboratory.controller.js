const laboratoryModel = require("../models/laboratory.model");


// =====================================================
// CREATE LABORATORY TEST
// =====================================================

const createLaboratoryTest = async (req, res) => {
    try {
        const {
            test_name,
            category,
            description,
            price,
            status,
        } = req.body;

        if (!test_name || !test_name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Test name is required",
            });
        }

        const numericPrice = Number(price);

        if (
            price !== undefined &&
            price !== null &&
            price !== "" &&
            (Number.isNaN(numericPrice) || numericPrice < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Price must be a valid positive number",
            });
        }

        const id =
            await laboratoryModel.createLaboratoryTest({
                test_name: test_name.trim(),
                category: category?.trim() || null,
                description: description?.trim() || null,
                price: numericPrice || 0,
                status: status || "active",
            });

        const test =
            await laboratoryModel.getLaboratoryTestById(id);

        return res.status(201).json({
            success: true,
            message: "Laboratory test created successfully",
            test,
        });

    } catch (error) {
        console.error(
            "Create Laboratory Test Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to create laboratory test",
        });
    }
};


// =====================================================
// GET ALL
// =====================================================

const getLaboratoryTests = async (req, res) => {
    try {
        const tests =
            await laboratoryModel.getAllLaboratoryTests();

        return res.status(200).json({
            success: true,
            tests,
        });

    } catch (error) {
        console.error(
            "Get Laboratory Tests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load laboratory tests",
        });
    }
};


// =====================================================
// GET BY ID
// =====================================================

const getLaboratoryTest = async (req, res) => {
    try {
        const { id } = req.params;

        const test =
            await laboratoryModel.getLaboratoryTestById(id);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Laboratory test not found",
            });
        }

        return res.status(200).json({
            success: true,
            test,
        });

    } catch (error) {
        console.error(
            "Get Laboratory Test Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load laboratory test",
        });
    }
};


// =====================================================
// UPDATE
// =====================================================

const updateLaboratoryTest = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            test_name,
            category,
            description,
            price,
            status,
        } = req.body;

        if (!test_name || !test_name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Test name is required",
            });
        }

        const numericPrice = Number(price);

        if (
            price !== undefined &&
            price !== null &&
            price !== "" &&
            (Number.isNaN(numericPrice) || numericPrice < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Price must be a valid positive number",
            });
        }

        const affectedRows =
            await laboratoryModel.updateLaboratoryTest(
                id,
                {
                    test_name: test_name.trim(),
                    category: category?.trim() || null,
                    description: description?.trim() || null,
                    price: numericPrice || 0,
                    status: status || "active",
                }
            );

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Laboratory test not found",
            });
        }

        const test =
            await laboratoryModel.getLaboratoryTestById(id);

        return res.status(200).json({
            success: true,
            message: "Laboratory test updated successfully",
            test,
        });

    } catch (error) {
        console.error(
            "Update Laboratory Test Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to update laboratory test",
        });
    }
};


// =====================================================
// DELETE
// =====================================================

const deleteLaboratoryTest = async (req, res) => {
    try {
        const { id } = req.params;

        const affectedRows =
            await laboratoryModel.deleteLaboratoryTest(id);

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Laboratory test not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Laboratory test deleted successfully",
        });

    } catch (error) {
        console.error(
            "Delete Laboratory Test Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to delete laboratory test",
        });
    }
};


// =====================================================
// STATISTICS
// =====================================================

const getLaboratoryStats = async (req, res) => {
    try {
        const stats =
            await laboratoryModel.getLaboratoryStats();

        return res.status(200).json({
            success: true,
            stats,
        });

    } catch (error) {
        console.error(
            "Laboratory Stats Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load laboratory statistics",
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    createLaboratoryTest,
    getLaboratoryTests,
    getLaboratoryTest,
    updateLaboratoryTest,
    deleteLaboratoryTest,
    getLaboratoryStats,
};