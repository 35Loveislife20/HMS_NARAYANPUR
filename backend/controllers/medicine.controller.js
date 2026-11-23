const medicineModel = require("../models/medicine.model");

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
            message: "No valid hospital is assigned to this account.",
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

    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(`${value}T00:00:00Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.getUTCFullYear() === year &&
        date.getUTCMonth() + 1 === month &&
        date.getUTCDate() === day
    );
};

const isValidStatus = (status) => {
    if (
        status === undefined ||
        status === null ||
        status === ""
    ) {
        return true;
    }

    return ["active", "inactive"].includes(
        String(status).trim().toLowerCase()
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

const normalizeQuantity = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return 0;
    }

    return Number(value);
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
            hospital_id,
        } = req.body || {};

        if (
            typeof medicine_name !== "string" ||
            !medicine_name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Medicine name is required.",
            });
        }

        const medicineName = medicine_name.trim();

        if (medicineName.length > 150) {
            return res.status(400).json({
                success: false,
                message:
                    "Medicine name must not exceed 150 characters.",
            });
        }

        const numericQuantity = normalizeQuantity(quantity);

        if (
            !Number.isFinite(numericQuantity) ||
            numericQuantity < 0 ||
            !Number.isInteger(numericQuantity)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a valid non-negative integer.",
            });
        }

        const numericPrice = normalizePrice(unit_price);

        if (
            !Number.isFinite(numericPrice) ||
            numericPrice < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Unit price must be a valid non-negative number.",
            });
        }

        if (!isValidDate(expiry_date)) {
            return res.status(400).json({
                success: false,
                message:
                    "Expiry date must be a valid YYYY-MM-DD date.",
            });
        }

        if (!isValidStatus(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be active or inactive.",
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
            hospitalId = requireHospitalScope(req, res);

            if (hospitalId === undefined) {
                return;
            }
        }

        const medicineId = await medicineModel.createMedicine(
            {
                medicine_name: medicineName,
                category: normalizeOptionalText(category),
                manufacturer: normalizeOptionalText(manufacturer),
                batch_number: normalizeOptionalText(batch_number),
                quantity: numericQuantity,
                unit_price: numericPrice,
                expiry_date: expiry_date || null,
                description: normalizeOptionalText(description),
                status:
                    String(status || "active")
                        .trim()
                        .toLowerCase(),
            },
            hospitalId
        );

        const medicine =
            await medicineModel.getMedicineById(
                medicineId,
                hospitalId
            );

        return res.status(201).json({
            success: true,
            message: "Medicine created successfully.",
            medicine,
        });
    } catch (error) {
        console.error("Create Medicine Error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Medicine code already exists. Please try again.",
            });
        }

        if (
            error.code === "ER_NO_REFERENCED_ROW_2" ||
            error.code === "ER_ROW_IS_REFERENCED_2"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid hospital or related record.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create medicine.",
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
        const hospitalId = requireHospitalScope(req, res);

        if (
            hospitalId === undefined &&
            !isSuperAdmin(req)
        ) {
            return;
        }

        const medicines =
            await medicineModel.getAllMedicines(hospitalId);

        return res.status(200).json({
            success: true,
            medicines,
        });
    } catch (error) {
        console.error("Get Medicines Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load medicines.",
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

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid medicine ID.",
            });
        }

        const hospitalId = requireHospitalScope(req, res);

        if (
            hospitalId === undefined &&
            !isSuperAdmin(req)
        ) {
            return;
        }

        const medicine =
            await medicineModel.getMedicineById(
                Number(id),
                hospitalId
            );

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found.",
            });
        }

        return res.status(200).json({
            success: true,
            medicine,
        });
    } catch (error) {
        console.error("Get Medicine Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load medicine.",
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

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid medicine ID.",
            });
        }

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
        } = req.body || {};

        if (
            typeof medicine_name !== "string" ||
            !medicine_name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Medicine name is required.",
            });
        }

        const medicineName = medicine_name.trim();

        if (medicineName.length > 150) {
            return res.status(400).json({
                success: false,
                message:
                    "Medicine name must not exceed 150 characters.",
            });
        }

        const numericQuantity = normalizeQuantity(quantity);

        if (
            !Number.isFinite(numericQuantity) ||
            numericQuantity < 0 ||
            !Number.isInteger(numericQuantity)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a valid non-negative integer.",
            });
        }

        const numericPrice = normalizePrice(unit_price);

        if (
            !Number.isFinite(numericPrice) ||
            numericPrice < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Unit price must be a valid non-negative number.",
            });
        }

        if (!isValidDate(expiry_date)) {
            return res.status(400).json({
                success: false,
                message:
                    "Expiry date must be a valid YYYY-MM-DD date.",
            });
        }

        if (!isValidStatus(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be active or inactive.",
            });
        }

        const hospitalId = requireHospitalScope(req, res);

        if (
            hospitalId === undefined &&
            !isSuperAdmin(req)
        ) {
            return;
        }

        const affectedRows =
            await medicineModel.updateMedicine(
                Number(id),
                {
                    medicine_name: medicineName,
                    category: normalizeOptionalText(category),
                    manufacturer:
                        normalizeOptionalText(manufacturer),
                    batch_number:
                        normalizeOptionalText(batch_number),
                    quantity: numericQuantity,
                    unit_price: numericPrice,
                    expiry_date: expiry_date || null,
                    description:
                        normalizeOptionalText(description),
                    status:
                        String(status || "active")
                            .trim()
                            .toLowerCase(),
                },
                hospitalId
            );

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found.",
            });
        }

        const medicine =
            await medicineModel.getMedicineById(
                Number(id),
                hospitalId
            );

        return res.status(200).json({
            success: true,
            message: "Medicine updated successfully.",
            medicine,
        });
    } catch (error) {
        console.error("Update Medicine Error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Medicine code or batch number already exists.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update medicine.",
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

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid medicine ID.",
            });
        }

        const hospitalId = requireHospitalScope(req, res);

        if (
            hospitalId === undefined &&
            !isSuperAdmin(req)
        ) {
            return;
        }

        const affectedRows =
            await medicineModel.deleteMedicine(
                Number(id),
                hospitalId
            );

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Medicine deleted successfully.",
        });
    } catch (error) {
        console.error("Delete Medicine Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete medicine.",
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
        const hospitalId = requireHospitalScope(req, res);

        if (
            hospitalId === undefined &&
            !isSuperAdmin(req)
        ) {
            return;
        }

        const stats =
            await medicineModel.getMedicineStats(
                hospitalId
            );

        return res.status(200).json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error("Medicine Stats Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load medicine statistics.",
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