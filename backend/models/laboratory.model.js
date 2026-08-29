const { pool } = require("../config/db");

/*
=====================================================
GENERATE LABORATORY TEST CODE
=====================================================
*/

const generateTestCode = async () => {
    const currentYear = new Date().getFullYear();
    const prefix = `LAB-${currentYear}-`;

    const [rows] = await pool.query(
        `SELECT test_code
         FROM laboratory_tests
         WHERE test_code LIKE ?
         ORDER BY id DESC
         LIMIT 1`,
        [`${prefix}%`]
    );

    if (rows.length === 0) {
        return `${prefix}0001`;
    }

    const lastCode = rows[0].test_code;

    const lastNumber = parseInt(
        lastCode.replace(prefix, ""),
        10
    );

    const nextNumber = Number.isNaN(lastNumber)
        ? 1
        : lastNumber + 1;

    return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

/*
=====================================================
CREATE LABORATORY TEST
=====================================================
*/

const createLaboratoryTest = async (test) => {
    const {
        test_name,
        category,
        description,
        price,
        status,
    } = test;

    const test_code =
        await generateTestCode();

    const [result] = await pool.query(
        `INSERT INTO laboratory_tests
        (
            test_code,
            test_name,
            category,
            description,
            price,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            test_code,
            test_name,
            category || null,
            description || null,
            Number(price) || 0,
            status || "active",
        ]
    );

    return result.insertId;
};

/*
=====================================================
GET ALL LABORATORY TESTS
=====================================================
*/

const getAllLaboratoryTests = async () => {
    const [rows] = await pool.query(
        `SELECT
            id,
            test_code,
            test_name,
            category,
            description,
            price,
            status,
            created_at,
            updated_at
         FROM laboratory_tests
         ORDER BY created_at DESC`
    );

    return rows;
};

/*
=====================================================
GET LABORATORY TEST BY ID
=====================================================
*/

const getLaboratoryTestById = async (id) => {
    const [rows] = await pool.query(
        `SELECT
            id,
            test_code,
            test_name,
            category,
            description,
            price,
            status,
            created_at,
            updated_at
         FROM laboratory_tests
         WHERE id = ?
         LIMIT 1`,
        [id]
    );

    return rows[0];
};

/*
=====================================================
UPDATE LABORATORY TEST
=====================================================
*/

const updateLaboratoryTest = async (id, test) => {
    const {
        test_name,
        category,
        description,
        price,
        status,
    } = test;

    const [result] = await pool.query(
        `UPDATE laboratory_tests
         SET
            test_name = ?,
            category = ?,
            description = ?,
            price = ?,
            status = ?
         WHERE id = ?`,
        [
            test_name,
            category || null,
            description || null,
            Number(price) || 0,
            status || "active",
            id,
        ]
    );

    return result.affectedRows;
};

/*
=====================================================
DELETE LABORATORY TEST
=====================================================
*/

const deleteLaboratoryTest = async (id) => {
    const [result] = await pool.query(
        `DELETE FROM laboratory_tests
         WHERE id = ?`,
        [id]
    );

    return result.affectedRows;
};

/*
=====================================================
LABORATORY STATISTICS
=====================================================
*/

const getLaboratoryStats = async () => {
    const [rows] = await pool.query(
        `SELECT
            COUNT(*) AS totalTests,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'active'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS activeTests,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'inactive'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS inactiveTests,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'active'
                        THEN price
                        ELSE 0
                    END
                ),
                0
            ) AS totalTestValue

         FROM laboratory_tests`
    );

    return {
        totalTests:
            Number(rows[0].totalTests) || 0,

        activeTests:
            Number(rows[0].activeTests) || 0,

        inactiveTests:
            Number(rows[0].inactiveTests) || 0,

        totalTestValue:
            Number(rows[0].totalTestValue) || 0,
    };
};

/*
=====================================================
EXPORT
=====================================================
*/

module.exports = {
    createLaboratoryTest,
    getAllLaboratoryTests,
    getLaboratoryTestById,
    updateLaboratoryTest,
    deleteLaboratoryTest,
    getLaboratoryStats,
};