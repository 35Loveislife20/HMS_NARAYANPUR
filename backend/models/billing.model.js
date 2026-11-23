const { pool } = require("../config/db");

/* =====================================================
   HELPERS
===================================================== */

const normalizeId = (value, fieldName = "ID") => {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error(
            `${fieldName} must be a valid positive integer.`
        );
    }

    return id;
};

const normalizeMoney = (value, fieldName = "Amount") => {
    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(
            `${fieldName} must be a valid non-negative number.`
        );
    }

    return roundMoney(amount);
};

const normalizePercentage = (
    value,
    fieldName,
    max = 100
) => {
    const percentage = Number(value);

    if (
        !Number.isFinite(percentage) ||
        percentage < 0 ||
        percentage > max
    ) {
        throw new Error(
            `${fieldName} must be between 0 and ${max}.`
        );
    }

    return percentage;
};

const normalizeText = (
    value,
    fieldName,
    maxLength = 1000
) => {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const text = String(value).trim();

    if (text.length > maxLength) {
        throw new Error(
            `${fieldName} cannot exceed ${maxLength} characters.`
        );
    }

    return text || null;
};

/* =====================================================
   ROUND MONEY
===================================================== */

const roundMoney = (value) => {
    return (
        Math.round(
            (Number(value) + Number.EPSILON) * 100
        ) / 100
    );
};

/* =====================================================
   CALCULATE BILL TOTAL
===================================================== */

const calculateBill = ({
    consultation_fee,
    medicine_amount,
    laboratory_amount,
    other_charges,
    discount,
    tax,
}) => {
    const consultation = normalizeMoney(
        consultation_fee || 0,
        "Consultation fee"
    );

    const medicine = normalizeMoney(
        medicine_amount || 0,
        "Medicine amount"
    );

    const laboratory = normalizeMoney(
        laboratory_amount || 0,
        "Laboratory amount"
    );

    const other = normalizeMoney(
        other_charges || 0,
        "Other charges"
    );

    const discountPercent = normalizePercentage(
        discount || 0,
        "Discount"
    );

    const taxPercent = normalizePercentage(
        tax || 0,
        "Tax",
        1000
    );

    const subtotal = roundMoney(
        consultation +
        medicine +
        laboratory +
        other
    );

    const discountAmount = roundMoney(
        subtotal * discountPercent / 100
    );

    const taxableAmount = roundMoney(
        Math.max(
            0,
            subtotal - discountAmount
        )
    );

    const taxAmount = roundMoney(
        taxableAmount * taxPercent / 100
    );

    const totalAmount = roundMoney(
        taxableAmount + taxAmount
    );

    return {
        consultation,
        medicine,
        laboratory,
        other,
        discountPercent,
        discountAmount,
        subtotal,
        taxableAmount,
        taxPercent,
        taxAmount,
        totalAmount,
    };
};

/* =====================================================
   GENERATE BILL NUMBER
===================================================== */

const generateBillNumber = async () => {
    const currentYear =
        new Date().getFullYear();

    const prefix =
        `BILL-${currentYear}-`;

    const [rows] = await pool.query(
        `
        SELECT bill_number
        FROM billing
        WHERE bill_number LIKE ?
        ORDER BY bill_number DESC
        LIMIT 1
        `,
        [`${prefix}%`]
    );

    if (!rows.length) {
        return `${prefix}0001`;
    }

    const lastBillNumber =
        String(rows[0].bill_number || "");

    const lastNumber =
        parseInt(
            lastBillNumber.replace(
                prefix,
                ""
            ),
            10
        ) || 0;

    return (
        prefix +
        String(lastNumber + 1).padStart(4, "0")
    );
};

/* =====================================================
   FIND PATIENT
===================================================== */

const findPatientById = async (
    patientId
) => {
    const id = normalizeId(
        patientId,
        "Patient ID"
    );

    const [rows] = await pool.query(
        `
        SELECT
            id,
            hospital_id,
            patient_code,
            name,
            phone,
            email
        FROM patients
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
};

/* =====================================================
   CREATE BILL
===================================================== */

const createBilling = async (bill) => {
    if (
        !bill ||
        typeof bill !== "object"
    ) {
        throw new Error(
            "Billing data is required."
        );
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
    } = bill;

    const patientId = normalizeId(
        patient_id,
        "Patient ID"
    );

    const calculation =
        calculateBill({
            consultation_fee,
            medicine_amount,
            laboratory_amount,
            other_charges,
            discount,
            tax,
        });

    const normalizedPaymentMethod =
        String(
            payment_method || "cash"
        )
            .trim()
            .toLowerCase();

    const normalizedPaymentStatus =
        String(
            payment_status || "pending"
        )
            .trim()
            .toLowerCase();

    const normalizedNotes =
        normalizeText(
            notes,
            "Notes",
            2000
        );

    const billNumber =
        await generateBillNumber();

    const [result] = await pool.query(
        `
        INSERT INTO billing
        (
            bill_number,
            patient_id,
            hospital_id,
            bill_date,
            consultation_fee,
            medicine_amount,
            laboratory_amount,
            other_charges,
            discount,
            tax,
            total_amount,
            payment_method,
            payment_status,
            notes
        )
        VALUES (
            ?, ?,
            (SELECT hospital_id FROM patients WHERE id = ?),
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        `,
        [
            billNumber,
            patientId,
            patientId,
            bill_date || new Date(),

            calculation.consultation,
            calculation.medicine,
            calculation.laboratory,
            calculation.other,

            calculation.discountPercent,
            calculation.taxPercent,

            calculation.totalAmount,

            normalizedPaymentMethod,
            normalizedPaymentStatus,
            normalizedNotes,
        ]
    );

    return result.insertId;
};

/* =====================================================
   GET ALL BILLS
===================================================== */

const getAllBilling = async (
    hospitalId = null
) => {
    let sql = `
        SELECT
            b.id,
            b.bill_number,
            b.patient_id,

            p.patient_code,
            p.name AS patient_name,
            p.phone,
            p.hospital_id,

            b.bill_date,
            b.consultation_fee,
            b.medicine_amount,
            b.laboratory_amount,
            b.other_charges,
            b.discount,
            b.tax,
            b.total_amount,
            b.payment_method,
            b.payment_status,
            b.notes,
            b.created_at,
            b.updated_at

        FROM billing b

        LEFT JOIN patients p
            ON b.patient_id = p.id
    `;

    const params = [];

    if (hospitalId !== null) {
        const normalizedHospitalId =
            normalizeId(
                hospitalId,
                "Hospital ID"
            );

        sql += `
            WHERE p.hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
    }

    sql += `
        ORDER BY
            b.created_at DESC
    `;

    const [rows] = await pool.query(
        sql,
        params
    );

    return rows;
};

/* =====================================================
   GET BILL BY ID
===================================================== */

const getBillingById = async (
    id,
    hospitalId = null
) => {
    const billingId = normalizeId(
        id,
        "Billing ID"
    );

    let sql = `
        SELECT
            b.id,
            b.bill_number,
            b.patient_id,

            p.patient_code,
            p.name AS patient_name,
            p.phone,
            p.hospital_id,

            b.bill_date,
            b.consultation_fee,
            b.medicine_amount,
            b.laboratory_amount,
            b.other_charges,
            b.discount,
            b.tax,
            b.total_amount,
            b.payment_method,
            b.payment_status,
            b.notes,
            b.created_at,
            b.updated_at

        FROM billing b

        LEFT JOIN patients p
            ON b.patient_id = p.id

        WHERE b.id = ?
    `;

    const params = [billingId];

    if (hospitalId !== null) {
        const normalizedHospitalId =
            normalizeId(
                hospitalId,
                "Hospital ID"
            );

        sql += `
            AND p.hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
    }

    sql += `
        LIMIT 1
    `;

    const [rows] = await pool.query(
        sql,
        params
    );

    return rows[0] || null;
};

/* =====================================================
   UPDATE BILL
===================================================== */

const updateBilling = async (
    id,
    bill,
    hospitalId = null
) => {
    const billingId = normalizeId(
        id,
        "Billing ID"
    );

    if (
        !bill ||
        typeof bill !== "object"
    ) {
        throw new Error(
            "Billing data is required."
        );
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
    } = bill;

    const patientId = normalizeId(
        patient_id,
        "Patient ID"
    );

    const calculation =
        calculateBill({
            consultation_fee,
            medicine_amount,
            laboratory_amount,
            other_charges,
            discount,
            tax,
        });

    const normalizedPaymentMethod =
        String(
            payment_method || "cash"
        )
            .trim()
            .toLowerCase();

    const normalizedPaymentStatus =
        String(
            payment_status || "pending"
        )
            .trim()
            .toLowerCase();

    const normalizedNotes =
        normalizeText(
            notes,
            "Notes",
            2000
        );

    let sql = `
        UPDATE billing b
        JOIN patients p
            ON b.patient_id = p.id

        SET
            b.patient_id = ?,
            b.bill_date = ?,
            b.consultation_fee = ?,
            b.medicine_amount = ?,
            b.laboratory_amount = ?,
            b.other_charges = ?,
            b.discount = ?,
            b.tax = ?,
            b.total_amount = ?,
            b.payment_method = ?,
            b.payment_status = ?,
            b.notes = ?

        WHERE b.id = ?
    `;

    const params = [
        patientId,
        bill_date || new Date(),

        calculation.consultation,
        calculation.medicine,
        calculation.laboratory,
        calculation.other,

        calculation.discountPercent,
        calculation.taxPercent,

        calculation.totalAmount,

        normalizedPaymentMethod,
        normalizedPaymentStatus,
        normalizedNotes,

        billingId,
    ];

    if (hospitalId !== null) {
        const normalizedHospitalId =
            normalizeId(
                hospitalId,
                "Hospital ID"
            );

        sql += `
            AND p.hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
    }

    const [result] = await pool.query(
        sql,
        params
    );

    return result.affectedRows;
};

/* =====================================================
   DELETE BILL
===================================================== */

const deleteBilling = async (
    id,
    hospitalId = null
) => {
    const billingId = normalizeId(
        id,
        "Billing ID"
    );

    let sql = `
        DELETE b
        FROM billing b

        LEFT JOIN patients p
            ON b.patient_id = p.id

        WHERE b.id = ?
    `;

    const params = [billingId];

    if (hospitalId !== null) {
        const normalizedHospitalId =
            normalizeId(
                hospitalId,
                "Hospital ID"
            );

        sql += `
            AND p.hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
    }

    const [result] = await pool.query(
        sql,
        params
    );

    return result.affectedRows;
};

/* =====================================================
   BILLING STATS
===================================================== */

const getBillingStats = async (
    hospitalId = null
) => {
    let sql = `
        SELECT
            COUNT(*) AS totalBills,

            COALESCE(
                SUM(b.total_amount),
                0
            ) AS totalRevenue,

            COALESCE(
                SUM(
                    CASE
                        WHEN b.payment_status = 'paid'
                        THEN b.total_amount
                        ELSE 0
                    END
                ),
                0
            ) AS paidAmount,

            COALESCE(
                SUM(
                    CASE
                        WHEN b.payment_status = 'pending'
                        THEN b.total_amount
                        ELSE 0
                    END
                ),
                0
            ) AS pendingAmount

        FROM billing b

        LEFT JOIN patients p
            ON b.patient_id = p.id
    `;

    const params = [];

    if (hospitalId !== null) {
        const normalizedHospitalId =
            normalizeId(
                hospitalId,
                "Hospital ID"
            );

        sql += `
            WHERE p.hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
    }

    const [rows] = await pool.query(
        sql,
        params
    );

    return {
        totalBills:
            Number(
                rows[0]?.totalBills
            ) || 0,

        totalRevenue:
            Number(
                rows[0]?.totalRevenue
            ) || 0,

        paidAmount:
            Number(
                rows[0]?.paidAmount
            ) || 0,

        pendingAmount:
            Number(
                rows[0]?.pendingAmount
            ) || 0,
    };
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
    calculateBill,
    findPatientById,
};