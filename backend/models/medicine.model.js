const { pool } = require("../config/db");

// =====================================================
// GENERATE MEDICINE CODE
// =====================================================

const generateMedicineCode = async () => {
    const currentYear = new Date().getFullYear();
    const prefix = `MED-${currentYear}`;

    const [rows] = await pool.query(
        `SELECT medicine_code
         FROM medicines
         WHERE medicine_code LIKE ?
         ORDER BY medicine_code DESC
         LIMIT 1`,
        [`${prefix}%`]
    );

    if (rows.length === 0) {
        return `${prefix}0001`;
    }

    const lastCode = rows[0].medicine_code;
    const lastNumber = parseInt(
        lastCode.replace(prefix, ""),
        10
    );

    const nextNumber = lastNumber + 1;

    return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};


// =====================================================
// CREATE MEDICINE
// =====================================================

const createMedicine = async (medicine) => {
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
    } = medicine;

    const medicine_code = await generateMedicineCode();

    const [result] = await pool.query(
        `INSERT INTO medicines
        (
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            medicine_code,
            medicine_name,
            category || null,
            manufacturer || null,
            batch_number || null,
            Number(quantity) || 0,
            Number(unit_price) || 0,
            expiry_date || null,
            description || null,
            status || "active",
        ]
    );

    return result.insertId;
};


// =====================================================
// GET ALL MEDICINES
// =====================================================

const getAllMedicines = async () => {
    const [rows] = await pool.query(
        `SELECT
            id,
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
        ORDER BY created_at DESC`
    );

    return rows;
};


// =====================================================
// GET MEDICINE BY ID
// =====================================================

const getMedicineById = async (id) => {
    const [rows] = await pool.query(
        `SELECT
            id,
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
        LIMIT 1`,
        [id]
    );

    return rows[0];
};


// =====================================================
// UPDATE MEDICINE
// =====================================================

const updateMedicine = async (id, medicine) => {
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
    } = medicine;

    const [result] = await pool.query(
        `UPDATE medicines SET
            medicine_name = ?,
            category = ?,
            manufacturer = ?,
            batch_number = ?,
            quantity = ?,
            unit_price = ?,
            expiry_date = ?,
            description = ?,
            status = ?
        WHERE id = ?`,
        [
            medicine_name,
            category || null,
            manufacturer || null,
            batch_number || null,
            Number(quantity) || 0,
            Number(unit_price) || 0,
            expiry_date || null,
            description || null,
            status || "active",
            id,
        ]
    );

    return result.affectedRows;
};


// =====================================================
// DELETE MEDICINE
// =====================================================

const deleteMedicine = async (id) => {
    const [result] = await pool.query(
        `DELETE FROM medicines
         WHERE id = ?`,
        [id]
    );

    return result.affectedRows;
};


// =====================================================
// MEDICINE STATS
// =====================================================

const getMedicineStats = async () => {
    const [rows] = await pool.query(
        `SELECT
            COUNT(*) AS totalMedicines,

            SUM(
                CASE
                    WHEN status = 'active'
                    THEN 1
                    ELSE 0
                END
            ) AS activeMedicines,

            SUM(
                CASE
                    WHEN quantity <= 10
                    THEN 1
                    ELSE 0
                END
            ) AS lowStockMedicines,

            SUM(
                CASE
                    WHEN expiry_date IS NOT NULL
                    AND expiry_date < CURDATE()
                    THEN 1
                    ELSE 0
                END
            ) AS expiredMedicines

        FROM medicines`
    );

    return {
        totalMedicines: Number(rows[0].totalMedicines) || 0,
        activeMedicines: Number(rows[0].activeMedicines) || 0,
        lowStockMedicines: Number(rows[0].lowStockMedicines) || 0,
        expiredMedicines: Number(rows[0].expiredMedicines) || 0,
    };
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    createMedicine,
    getAllMedicines,
    getMedicineById,
    updateMedicine,
    deleteMedicine,
    getMedicineStats,
};