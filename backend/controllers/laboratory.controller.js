const laboratoryModel = require("../models/laboratory.model");

/*
=====================================================
HELPERS
=====================================================
*/

const isSuperAdmin = (req) => {
    return (
        String(req.user?.role || "").toLowerCase() ===
        "super_admin"
    );
};

const getHospitalScope = (req) => {
    if (isSuperAdmin(req)) {
        return null;
    }

    const hospitalId = Number(req.user?.hospital_id);

    if (!Number.isInteger(hospitalId) || hospitalId <= 0) {
        return null;
    }

    return hospitalId;
};

const requireHospitalScope = (req, res) => {
    if (isSuperAdmin(req)) {
        return null;
    }

    const hospitalId = getHospitalScope(req);

    if (!hospitalId) {
        res.status(403).json({
            success: false,
            message:
                "No valid hospital is assigned to this account.",
        });

        return undefined;
    }

    return hospitalId;
};

const isValidId = (value) => {
    const id = Number(value);

    return Number.isInteger(id) && id > 0;
};

const isValidDate = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return true;
    }

    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const [year, month, day] =
        value.split("-").map(Number);

    const date =
        new Date(`${value}T00:00:00Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.getUTCFullYear() === year &&
        date.getUTCMonth() + 1 === month &&
        date.getUTCDate() === day
    );
};

const normalizeOptionalText = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    return typeof value === "string"
        ? value.trim()
        : String(value).trim();
};

const normalizePrice = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return 0;
    }

    return Number(value);
};

const normalizeStatus = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "active";
    }

    return String(value)
        .trim()
        .toLowerCase();
};

/*
=====================================================
VALIDATE LABORATORY TEST
=====================================================
*/

const validateLaboratoryTest = ({
    test_name,
    price,
    status,
}) => {
    if (
        typeof test_name !== "string" ||
        !test_name.trim()
    ) {
        return "Test name is required.";
    }

    if (test_name.trim().length > 150) {
        return "Test name must not exceed 150 characters.";
    }

    const numericPrice = normalizePrice(price);

    if (
        !Number.isFinite(numericPrice) ||
        numericPrice < 0
    ) {
        return "Price must be a valid non-negative number.";
    }

    const normalizedStatus =
        normalizeStatus(status);

    if (
        !["active", "inactive"].includes(
            normalizedStatus
        )
    ) {
        return "Status must be active or inactive.";
    }

    return null;
};

/*
=====================================================
CREATE LABORATORY TEST
=====================================================
*/

const createLaboratoryTest = async (req, res) => {
    try {
        const {
            test_name,
            category,
            description,
            price,
            status,
            hospital_id,
        } = req.body || {};

        const validationError =
            validateLaboratoryTest({
                test_name,
                price,
                status,
            });

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        let hospitalId;

        if (isSuperAdmin(req)) {
            if (!isValidId(hospital_id)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "hospital_id is required for Super Admin.",
                });
            }

            hospitalId = Number(hospital_id);
        } else {
            hospitalId =
                requireHospitalScope(
                    req,
                    res
                );

            if (hospitalId === undefined) {
                return;
            }
        }

        const normalizedStatus =
            normalizeStatus(status);

        const id =
            await laboratoryModel.createLaboratoryTest(
                {
                    test_name:
                        test_name.trim(),

                    category:
                        normalizeOptionalText(
                            category
                        ),

                    description:
                        normalizeOptionalText(
                            description
                        ),

                    price:
                        normalizePrice(price),

                    status:
                        normalizedStatus,
                },
                hospitalId
            );

        const test =
            await laboratoryModel.getLaboratoryTestById(
                id,
                hospitalId
            );

        return res.status(201).json({
            success: true,
            message:
                "Laboratory test created successfully.",
            test,
        });
    } catch (error) {
        console.error(
            "Create Laboratory Test Error:",
            error
        );

        if (
            error.code === "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Laboratory test code already exists. Please try again.",
            });
        }

        if (
            error.code ===
                "ER_NO_REFERENCED_ROW_2" ||
            error.code ===
                "ER_ROW_IS_REFERENCED_2"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid hospital or related record.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to create laboratory test.",
        });
    }
};

/*
=====================================================
GET ALL LABORATORY TESTS
=====================================================
*/

const getLaboratoryTests = async (
    req,
    res
) => {
    try {
        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (
            hospitalId === undefined &&
            !isSuperAdmin(req)
        ) {
            return;
        }

        const tests =
            await laboratoryModel.getAllLaboratoryTests(
                hospitalId
            );

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
            message:
                "Unable to load laboratory tests.",
        });
    }
};

/*
=====================================================
GET LABORATORY TEST BY ID
=====================================================
*/

const getLaboratoryTest = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid laboratory test ID.",
            });
        }

        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (
            hospitalId === undefined &&
            !isSuperAdmin(req)
        ) {
            return;
        }

        const test =
            await laboratoryModel.getLaboratoryTestById(
                Number(id),
                hospitalId
            );

        if (!test) {
            return res.status(404).json({
                success: false,
                message:
                    "Laboratory test not found.",
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
            message:
                "Unable to load laboratory test.",
        });
    }
};

/*
=====================================================
UPDATE LABORATORY TEST
=====================================================
*/

const updateLaboratoryTest = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid laboratory test ID.",
            });
        }

        const {
            test_name,
            category,
            description,
            price,
            status,
        } = req.body || {};

        const validationError =
            validateLaboratoryTest({
                test_name,
                price,
                status,
            });

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (
            hospitalId === undefined &&
            !isSuperAdmin(req)
        ) {
            return;
        }

        const affectedRows =
            await laboratoryModel.updateLaboratoryTest(
                Number(id),
                {
                    test_name:
                        test_name.trim(),

                    category:
                        normalizeOptionalText(
                            category
                        ),

                    description:
                        normalizeOptionalText(
                            description
                        ),

                    price:
                        normalizePrice(price),

                    status:
                        normalizeStatus(status),
                },
                hospitalId
            );

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message:
                    "Laboratory test not found.",
            });
        }

        const test =
            await laboratoryModel.getLaboratoryTestById(
                Number(id),
                hospitalId
            );

        return res.status(200).json({
            success: true,
            message:
                "Laboratory test updated successfully.",
            test,
        });
    } catch (error) {
        console.error(
            "Update Laboratory Test Error:",
            error
        );

        if (
            error.code === "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Laboratory test code already exists.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to update laboratory test.",
        });
    }
};

/*
=====================================================
DELETE LABORATORY TEST
=====================================================
*/

const deleteLaboratoryTest = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid laboratory test ID.",
            });
        }

        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (
            hospitalId === undefined &&
            !isSuperAdmin(req)
        ) {
            return;
        }

        const affectedRows =
            await laboratoryModel.deleteLaboratoryTest(
                Number(id),
                hospitalId
            );

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message:
                    "Laboratory test not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Laboratory test deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Delete Laboratory Test Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete laboratory test.",
        });
    }
};

/*
=====================================================
LABORATORY STATISTICS
=====================================================
*/

const getLaboratoryStats = async (
    req,
    res
) => {
    try {
        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (
            hospitalId === undefined &&
            !isSuperAdmin(req)
        ) {
            return;
        }

        const stats =
            await laboratoryModel.getLaboratoryStats(
                hospitalId
            );

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
            message:
                "Unable to load laboratory statistics.",
        });
    }
};

/*
=====================================================
EXPORT
=====================================================
*/

module.exports = {
    createLaboratoryTest,
    getLaboratoryTests,
    getLaboratoryTest,
    updateLaboratoryTest,
    deleteLaboratoryTest,
    getLaboratoryStats,
};