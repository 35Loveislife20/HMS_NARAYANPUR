const { pool } = require("../config/db");

/* =====================================================
   ROUND MONEY
===================================================== */

const roundMoney = (value) => {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
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
    const consultation = Math.max(
        0,
        Number(consultation_fee) || 0
    );

    const medicine = Math.max(
        0,
        Number(medicine_amount) || 0
    );

    const laboratory = Math.max(
        0,
        Number(laboratory_amount) || 0
    );

    const other = Math.max(
        0,
        Number(other_charges) || 0
    );

    /* Discount and Tax are percentages */

    const discountPercent = Math.min(
        100,
        Math.max(0, Number(discount) || 0)
    );

    const taxPercent = Math.max(
        0,
        Number(tax) || 0
    );

    /* =================================================
       SUBTOTAL
    ================================================= */

    const subtotal = roundMoney(
        consultation +
        medicine +
        laboratory +
        other
    );

    /* =================================================
       DISCOUNT
    ================================================= */

    const discountAmount = roundMoney(
        subtotal * discountPercent / 100
    );

    /* =================================================
       TAXABLE AMOUNT
    ================================================= */

    const taxableAmount = roundMoney(
        Math.max(0, subtotal - discountAmount)
    );

    /* =================================================
       TAX
    ================================================= */

    const taxAmount = roundMoney(
        taxableAmount * taxPercent / 100
    );

    /* =================================================
       GRAND TOTAL
    ================================================= */

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
    const currentYear = new Date().getFullYear();
    const prefix = `BILL-${currentYear}-`;

    const [rows] = await pool.query(
        `SELECT bill_number
         FROM billing
         WHERE bill_number LIKE ?
         ORDER BY bill_number DESC
         LIMIT 1`,
        [`${prefix}%`]
    );

    if (rows.length === 0) {
        return `${prefix}0001`;
    }

    const lastBillNumber = rows[0].bill_number;

    const lastNumber = parseInt(
        lastBillNumber.replace(prefix, ""),
        10
    ) || 0;

    const nextNumber = lastNumber + 1;

    return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};


/* =====================================================
   CREATE BILL
===================================================== */

const createBilling = async (bill) => {
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

    const bill_number = await generateBillNumber();

    const calculation = calculateBill({
        consultation_fee,
        medicine_amount,
        laboratory_amount,
        other_charges,
        discount,
        tax,
    });

    const [result] = await pool.query(
        `INSERT INTO billing
        (
            bill_number,
            patient_id,
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            bill_number,
            patient_id,
            bill_date || new Date(),

            calculation.consultation,
            calculation.medicine,
            calculation.laboratory,
            calculation.other,

            calculation.discountPercent,
            calculation.taxPercent,

            calculation.totalAmount,

            payment_method || "cash",
            payment_status || "pending",
            notes || null,
        ]
    );

    return result.insertId;
};


/* =====================================================
   GET ALL BILLS
===================================================== */

const getAllBilling = async () => {
    const [rows] = await pool.query(
        `SELECT
            b.id,
            b.bill_number,
            b.patient_id,
            p.patient_code,
            p.name AS patient_name,
            p.phone,
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
        ORDER BY b.created_at DESC`
    );

    return rows;
};


/* =====================================================
   GET BILL BY ID
===================================================== */

const getBillingById = async (id) => {
    const [rows] = await pool.query(
        `SELECT
            b.id,
            b.bill_number,
            b.patient_id,
            p.patient_code,
            p.name AS patient_name,
            p.phone,
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
        LIMIT 1`,
        [id]
    );

    return rows[0];
};


/* =====================================================
   UPDATE BILL
===================================================== */

const updateBilling = async (id, bill) => {
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

    const calculation = calculateBill({
        consultation_fee,
        medicine_amount,
        laboratory_amount,
        other_charges,
        discount,
        tax,
    });

    const [result] = await pool.query(
        `UPDATE billing SET
            patient_id = ?,
            bill_date = ?,
            consultation_fee = ?,
            medicine_amount = ?,
            laboratory_amount = ?,
            other_charges = ?,
            discount = ?,
            tax = ?,
            total_amount = ?,
            payment_method = ?,
            payment_status = ?,
            notes = ?
        WHERE id = ?`,
        [
            patient_id,
            bill_date || new Date(),

            calculation.consultation,
            calculation.medicine,
            calculation.laboratory,
            calculation.other,

            calculation.discountPercent,
            calculation.taxPercent,

            calculation.totalAmount,

            payment_method || "cash",
            payment_status || "pending",
            notes || null,

            id,
        ]
    );

    return result.affectedRows;
};


/* =====================================================
   DELETE BILL
===================================================== */

const deleteBilling = async (id) => {
    const [result] = await pool.query(
        `DELETE FROM billing WHERE id = ?`,
        [id]
    );

    return result.affectedRows;
};


/* =====================================================
   BILLING STATS
===================================================== */

const getBillingStats = async () => {
    const [rows] = await pool.query(
        `SELECT
            COUNT(*) AS totalBills,

            COALESCE(
                SUM(total_amount),
                0
            ) AS totalRevenue,

            COALESCE(
                SUM(
                    CASE
                        WHEN payment_status = 'paid'
                        THEN total_amount
                        ELSE 0
                    END
                ),
                0
            ) AS paidAmount,

            COALESCE(
                SUM(
                    CASE
                        WHEN payment_status = 'pending'
                        THEN total_amount
                        ELSE 0
                    END
                ),
                0
            ) AS pendingAmount

        FROM billing`
    );

    return {
        totalBills:
            Number(rows[0].totalBills) || 0,

        totalRevenue:
            Number(rows[0].totalRevenue) || 0,

        paidAmount:
            Number(rows[0].paidAmount) || 0,

        pendingAmount:
            Number(rows[0].pendingAmount) || 0,
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
};