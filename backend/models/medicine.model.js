const { pool } = require("../config/db");

/*
=====================================================
HELPERS
=====================================================
*/

const normalizeId = (value, field = "id") => {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error(`Invalid ${field}`);
    }

    return id;
};

const normalizeHospitalId = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    return normalizeId(value, "hospital_id");
};

const normalizeText = (
    value,
    field,
    {
        required = false,
        maxLength = 255,
    } = {}
) => {
    if (
        value === null ||
        value === undefined
    ) {
        if (required) {
            throw new Error(`${field} is required`);
        }

        return null;
    }

    const text = String(value).trim();

    if (!text) {
        if (required) {
            throw new Error(`${field} is required`);
        }

        return null;
    }

    if (text.length > maxLength) {
        throw new Error(
            `${field} must not exceed ${maxLength} characters`
        );
    }

    return text;
};

const normalizeQuantity = (value) => {
    const quantity = Number(value);

    if (
        !Number.isFinite(quantity) ||
        quantity < 0
    ) {
        throw new Error(
            "Quantity must be a valid non-negative number"
        );
    }

    return Math.floor(quantity);
};

const normalizePrice = (value) => {
    const price = Number(value);

    if (
        !Number.isFinite(price) ||
        price < 0
    ) {
        throw new Error(
            "Unit price must be a valid non-negative number"
        );
    }

    return Math.round(
        (price + Number.EPSILON) * 100
    ) / 100;
};

const normalizeStatus = (value) => {
    const status =
        value === undefined ||
        value === null ||
        value === ""
            ? "active"
            : String(value)
                .trim()
                .toLowerCase();

    if (
        !["active", "inactive"].includes(status)
    ) {
        throw new Error(
            "Status must be active or inactive"
        );
    }

    return status;
};

const normalizeExpiryDate = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const dateString = String(value).trim();

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ) {
        throw new Error(
            "Expiry date must be in YYYY-MM-DD format"
        );
    }

    const date = new Date(
        `${dateString}T00:00:00Z`
    );

    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid expiry date");
    }

    const [year, month, day] =
        dateString.split("-").map(Number);

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() + 1 !== month ||
        date.getUTCDate() !== day
    ) {
        throw new Error("Invalid expiry date");
    }

    return dateString;
};

/*
=====================================================
GENERATE MEDICINE CODE
=====================================================
*/

const generateMedicineCode = async (
    hospitalId = null
) => {
    const currentYear =
        new Date().getFullYear();

    const prefix =
        `MED-${currentYear}-`;

    let query = `
        SELECT medicine_code
        FROM medicines
        WHERE medicine_code LIKE ?
    `;

    const params = [
        `${prefix}%`,
    ];

    if (hospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(hospitalId);
    }

    query += `
        ORDER BY id DESC
        LIMIT 1
    `;

    const [rows] =
        await pool.query(
            query,
            params
        );

    if (rows.length === 0) {
        return `${prefix}0001`;
    }

    const lastCode =
        String(rows[0].medicine_code || "");

    const lastNumber =
        parseInt(
            lastCode.replace(prefix, ""),
            10
        );

    const nextNumber =
        Number.isNaN(lastNumber)
            ? 1
            : lastNumber + 1;

    return (
        `${prefix}` +
        String(nextNumber).padStart(4, "0")
    );
};

/*
=====================================================
CREATE MEDICINE
=====================================================
*/

const createMedicine = async (
    medicine,
    hospitalId = null
) => {
    if (
        !medicine ||
        typeof medicine !== "object"
    ) {
        throw new Error(
            "Medicine data is required"
        );
    }

    const normalizedHospitalId =
        normalizeHospitalId(hospitalId);

    const medicine_name =
        normalizeText(
            medicine.medicine_name,
            "Medicine name",
            {
                required: true,
                maxLength: 150,
            }
        );

    const category =
        normalizeText(
            medicine.category,
            "Category",
            {
                maxLength: 100,
            }
        );

    const manufacturer =
        normalizeText(
            medicine.manufacturer,
            "Manufacturer",
            {
                maxLength: 150,
            }
        );

    const batch_number =
        normalizeText(
            medicine.batch_number,
            "Batch number",
            {
                maxLength: 100,
            }
        );

    const quantity =
        normalizeQuantity(
            medicine.quantity
        );

    const unit_price =
        normalizePrice(
            medicine.unit_price
        );

    const expiry_date =
        normalizeExpiryDate(
            medicine.expiry_date
        );

    const description =
        normalizeText(
            medicine.description,
            "Description",
            {
                maxLength: 1000,
            }
        );

    const status =
        normalizeStatus(
            medicine.status
        );

    const medicine_code =
        await generateMedicineCode(
            normalizedHospitalId
        );

    const [result] =
        await pool.query(
            `
            INSERT INTO medicines
            (
                hospital_id,
                medicine_code,
                medicine_name,
                category,
                manufacturer,
                batch_number,
                quantity,
                unit_price,
                expiry_date,
                description,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                normalizedHospitalId,
                medicine_code,
                medicine_name,
                category,
                manufacturer,
                batch_number,
                quantity,
                unit_price,
                expiry_date,
                description,
                status,
            ]
        );

    return result.insertId;
};

/*
=====================================================
GET ALL MEDICINES
=====================================================
*/

const getAllMedicines = async (
    hospitalId = null
) => {
    const normalizedHospitalId =
        normalizeHospitalId(hospitalId);

    let query = `
        SELECT
            id,
            hospital_id,
            medicine_code,
            medicine_name,
            category,
            manufacturer,
            batch_number,
            quantity,
            unit_price,
            expiry_date,
            description,
            status,
            created_at,
            updated_at
        FROM medicines
    `;

    const params = [];

    if (normalizedHospitalId !== null) {
        query += `
            WHERE hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
    }

    query += `
        ORDER BY created_at DESC, id DESC
    `;

    const [rows] =
        await pool.query(
            query,
            params
        );

    return rows;
};

/*
=====================================================
GET MEDICINE BY ID
=====================================================
*/

const getMedicineById = async (
    id,
    hospitalId = null
) => {
    const normalizedId =
        normalizeId(
            id,
            "medicine id"
        );

    const normalizedHospitalId =
        normalizeHospitalId(hospitalId);

    let query = `
        SELECT
            id,
            hospital_id,
            medicine_code,
            medicine_name,
            category,
            manufacturer,
            batch_number,
            quantity,
            unit_price,
            expiry_date,
            description,
            status,
            created_at,
            updated_at
        FROM medicines
        WHERE id = ?
    `;

    const params = [
        normalizedId,
    ];

    if (normalizedHospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
    }

    query += `
        LIMIT 1
    `;

    const [rows] =
        await pool.query(
            query,
            params
        );

    return rows[0] || null;
};

/*
=====================================================
UPDATE MEDICINE
=====================================================
*/

const updateMedicine = async (
    id,
    medicine,
    hospitalId = null
) => {
    const normalizedId =
        normalizeId(
            id,
            "medicine id"
        );

    if (
        !medicine ||
        typeof medicine !== "object"
    ) {
        throw new Error(
            "Medicine data is required"
        );
    }

    const normalizedHospitalId =
        normalizeHospitalId(hospitalId);

    const medicine_name =
        normalizeText(
            medicine.medicine_name,
            "Medicine name",
            {
                required: true,
                maxLength: 150,
            }
        );

    const category =
        normalizeText(
            medicine.category,
            "Category",
            {
                maxLength: 100,
            }
        );

    const manufacturer =
        normalizeText(
            medicine.manufacturer,
            "Manufacturer",
            {
                maxLength: 150,
            }
        );

    const batch_number =
        normalizeText(
            medicine.batch_number,
            "Batch number",
            {
                maxLength: 100,
            }
        );

    const quantity =
        normalizeQuantity(
            medicine.quantity
        );

    const unit_price =
        normalizePrice(
            medicine.unit_price
        );

    const expiry_date =
        normalizeExpiryDate(
            medicine.expiry_date
        );

    const description =
        normalizeText(
            medicine.description,
            "Description",
            {
                maxLength: 1000,
            }
        );

    const status =
        normalizeStatus(
            medicine.status
        );

    let query = `
        UPDATE medicines
        SET
            medicine_name = ?,
            category = ?,
            manufacturer = ?,
            batch_number = ?,
            quantity = ?,
            unit_price = ?,
            expiry_date = ?,
            description = ?,
            status = ?
        WHERE id = ?
    `;

    const params = [
        medicine_name,
        category,
        manufacturer,
        batch_number,
        quantity,
        unit_price,
        expiry_date,
        description,
        status,
        normalizedId,
    ];

    if (normalizedHospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
    }

    const [result] =
        await pool.query(
            query,
            params
        );

    return result.affectedRows;
};

/*
=====================================================
DELETE MEDICINE
=====================================================
*/

const deleteMedicine = async (
    id,
    hospitalId = null
) => {
    const normalizedId =
        normalizeId(
            id,
            "medicine id"
        );

    const normalizedHospitalId =
        normalizeHospitalId(hospitalId);

    let query = `
        DELETE FROM medicines
        WHERE id = ?
    `;

    const params = [
        normalizedId,
    ];

    if (normalizedHospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
    }

    const [result] =
        await pool.query(
            query,
            params
        );

    return result.affectedRows;
};

/*
=====================================================
MEDICINE STATS
=====================================================
*/

const getMedicineStats = async (
    hospitalId = null
) => {
    const normalizedHospitalId =
        normalizeHospitalId(hospitalId);

    let query = `
        SELECT
            COUNT(*) AS totalMedicines,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'active'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS activeMedicines,

            COALESCE(
                SUM(
                    CASE
                        WHEN quantity > 0
                        AND quantity <= 10
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS lowStockMedicines,

            COALESCE(
                SUM(
                    CASE
                        WHEN quantity = 0
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS outOfStockMedicines,

            COALESCE(
                SUM(
                    CASE
                        WHEN expiry_date IS NOT NULL
                        AND expiry_date < CURDATE()
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS expiredMedicines

        FROM medicines
    `;

    const params = [];

    if (normalizedHospitalId !== null) {
        query += `
            WHERE hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
    }

    const [rows] =
        await pool.query(
            query,
            params
        );

    const row =
        rows[0] || {};

    return {
        totalMedicines:
            Number(
                row.totalMedicines
            ) || 0,

        activeMedicines:
            Number(
                row.activeMedicines
            ) || 0,

        lowStockMedicines:
            Number(
                row.lowStockMedicines
            ) || 0,

        outOfStockMedicines:
            Number(
                row.outOfStockMedicines
            ) || 0,

        expiredMedicines:
            Number(
                row.expiredMedicines
            ) || 0,
    };
};

/*
=====================================================
EXPORT
=====================================================
*/

module.exports = {
    generateMedicineCode,
    createMedicine,
    getAllMedicines,
    getMedicineById,
    updateMedicine,
    deleteMedicine,
    getMedicineStats,
};