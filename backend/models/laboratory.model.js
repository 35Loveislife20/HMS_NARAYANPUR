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

const normalizePrice = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    const price = Number(value);

    if (!Number.isFinite(price) || price < 0) {
        throw new Error("Invalid price");
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

/*
=====================================================
GENERATE LABORATORY TEST CODE
=====================================================

Format:

LAB-YYYY-0001

For hospital-scoped records, numbering is scoped
to that hospital.
=====================================================
*/

const generateTestCode = async (
    hospitalId = null
) => {
    const normalizedHospitalId =
        normalizeHospitalId(hospitalId);

    const currentYear =
        new Date().getFullYear();

    const prefix =
        `LAB-${currentYear}-`;

    let query = `
        SELECT test_code
        FROM laboratory_tests
        WHERE test_code LIKE ?
    `;

    const params = [
        `${prefix}%`,
    ];

    if (
        normalizedHospitalId !== null
    ) {
        query += `
            AND hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
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

    if (!rows.length) {
        return `${prefix}0001`;
    }

    const lastCode =
        String(
            rows[0].test_code || ""
        );

    const lastNumber =
        parseInt(
            lastCode.replace(
                prefix,
                ""
            ),
            10
        );

    const nextNumber =
        Number.isNaN(lastNumber)
            ? 1
            : lastNumber + 1;

    return (
        `${prefix}` +
        String(nextNumber).padStart(
            4,
            "0"
        )
    );
};

/*
=====================================================
CREATE LABORATORY TEST
=====================================================
*/

const createLaboratoryTest = async (
    test,
    hospitalId = null
) => {
    if (
        !test ||
        typeof test !== "object"
    ) {
        throw new Error(
            "Laboratory test data is required"
        );
    }

    const normalizedHospitalId =
        normalizeHospitalId(
            hospitalId
        );

    const testName =
        normalizeText(
            test.test_name,
            "Test name",
            {
                required: true,
                maxLength: 150,
            }
        );

    const category =
        normalizeText(
            test.category,
            "Category",
            {
                maxLength: 100,
            }
        );

    const description =
        normalizeText(
            test.description,
            "Description",
            {
                maxLength: 1000,
            }
        );

    const price =
        normalizePrice(
            test.price
        );

    const status =
        normalizeStatus(
            test.status
        );

    const testCode =
        await generateTestCode(
            normalizedHospitalId
        );

    const [result] =
        await pool.query(
            `
            INSERT INTO laboratory_tests
            (
                hospital_id,
                test_code,
                test_name,
                category,
                description,
                price,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                normalizedHospitalId,
                testCode,
                testName,
                category,
                description,
                price,
                status,
            ]
        );

    return result.insertId;
};

/*
=====================================================
GET ALL LABORATORY TESTS
=====================================================
*/

const getAllLaboratoryTests = async (
    hospitalId = null
) => {
    const normalizedHospitalId =
        normalizeHospitalId(
            hospitalId
        );

    let query = `
        SELECT
            id,
            hospital_id,
            test_code,
            test_name,
            category,
            description,
            price,
            status,
            created_at,
            updated_at
        FROM laboratory_tests
    `;

    const params = [];

    if (
        normalizedHospitalId !== null
    ) {
        query += `
            WHERE hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
    }

    query += `
        ORDER BY
            created_at DESC,
            id DESC
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
GET LABORATORY TEST BY ID
=====================================================
*/

const getLaboratoryTestById = async (
    id,
    hospitalId = null
) => {
    const normalizedId =
        normalizeId(
            id,
            "test id"
        );

    const normalizedHospitalId =
        normalizeHospitalId(
            hospitalId
        );

    let query = `
        SELECT
            id,
            hospital_id,
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
    `;

    const params = [
        normalizedId,
    ];

    if (
        normalizedHospitalId !== null
    ) {
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
UPDATE LABORATORY TEST
=====================================================
*/

const updateLaboratoryTest = async (
    id,
    test,
    hospitalId = null
) => {
    const normalizedId =
        normalizeId(
            id,
            "test id"
        );

    if (
        !test ||
        typeof test !== "object"
    ) {
        throw new Error(
            "Laboratory test data is required"
        );
    }

    const normalizedHospitalId =
        normalizeHospitalId(
            hospitalId
        );

    const testName =
        normalizeText(
            test.test_name,
            "Test name",
            {
                required: true,
                maxLength: 150,
            }
        );

    const category =
        normalizeText(
            test.category,
            "Category",
            {
                maxLength: 100,
            }
        );

    const description =
        normalizeText(
            test.description,
            "Description",
            {
                maxLength: 1000,
            }
        );

    const price =
        normalizePrice(
            test.price
        );

    const status =
        normalizeStatus(
            test.status
        );

    let query = `
        UPDATE laboratory_tests
        SET
            test_name = ?,
            category = ?,
            description = ?,
            price = ?,
            status = ?
        WHERE id = ?
    `;

    const params = [
        testName,
        category,
        description,
        price,
        status,
        normalizedId,
    ];

    if (
        normalizedHospitalId !== null
    ) {
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
DELETE LABORATORY TEST
=====================================================
*/

const deleteLaboratoryTest = async (
    id,
    hospitalId = null
) => {
    const normalizedId =
        normalizeId(
            id,
            "test id"
        );

    const normalizedHospitalId =
        normalizeHospitalId(
            hospitalId
        );

    let query = `
        DELETE FROM laboratory_tests
        WHERE id = ?
    `;

    const params = [
        normalizedId,
    ];

    if (
        normalizedHospitalId !== null
    ) {
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
LABORATORY STATISTICS
=====================================================
*/

const getLaboratoryStats = async (
    hospitalId = null
) => {
    const normalizedHospitalId =
        normalizeHospitalId(
            hospitalId
        );

    let query = `
        SELECT
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

        FROM laboratory_tests
    `;

    const params = [];

    if (
        normalizedHospitalId !== null
    ) {
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
        totalTests:
            Number(
                row.totalTests
            ) || 0,

        activeTests:
            Number(
                row.activeTests
            ) || 0,

        inactiveTests:
            Number(
                row.inactiveTests
            ) || 0,

        totalTestValue:
            Number(
                row.totalTestValue
            ) || 0,
    };
};

/*
=====================================================
EXPORT
=====================================================
*/

module.exports = {
    generateTestCode,
    createLaboratoryTest,
    getAllLaboratoryTests,
    getLaboratoryTestById,
    updateLaboratoryTest,
    deleteLaboratoryTest,
    getLaboratoryStats,
};