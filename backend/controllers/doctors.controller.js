const pool = require("../config/db");

// =====================================================
// GET ALL DOCTORS
// GET /api/doctors
// =====================================================

const getDoctors = async (req, res) => {
    try {
        const [doctors] = await pool.query(`
            SELECT
                d.id,
                d.user_id,
                d.department_id,
                d.doctor_code,
                d.specialization,
                d.phone,
                d.consultation_fee,
                d.created_at
            FROM doctors d
            ORDER BY d.id DESC
        `);

        return res.status(200).json({
            success: true,
            doctors,
        });

    } catch (error) {
        console.error(
            "Get Doctors Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load doctors.",
        });
    }
};

// =====================================================
// GET DOCTOR BY ID
// GET /api/doctors/:id
// =====================================================

const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;

        const [doctors] = await pool.query(
            `
            SELECT
                d.id,
                d.user_id,
                d.department_id,
                d.doctor_code,
                d.specialization,
                d.phone,
                d.consultation_fee,
                d.created_at
            FROM doctors d
            WHERE d.id = ?
            `,
            [id]
        );

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        return res.status(200).json({
            success: true,
            doctor: doctors[0],
        });

    } catch (error) {
        console.error(
            "Get Doctor Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load doctor.",
        });
    }
};

// =====================================================
// CREATE DOCTOR
// POST /api/doctors
// =====================================================

const createDoctor = async (req, res) => {
    try {
        const {
            user_id,
            department_id,
            doctor_code,
            specialization,
            phone,
            consultation_fee,
        } = req.body;

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!doctor_code) {
            return res.status(400).json({
                success: false,
                message: "Doctor code is required.",
            });
        }

        // -------------------------------------------------
        // CHECK DUPLICATE CODE
        // -------------------------------------------------

        const [existing] = await pool.query(
            `
            SELECT id
            FROM doctors
            WHERE doctor_code = ?
            `,
            [doctor_code]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Doctor code already exists.",
            });
        }

        // -------------------------------------------------
        // INSERT
        // -------------------------------------------------

        const [result] = await pool.query(
            `
            INSERT INTO doctors (
                user_id,
                department_id,
                doctor_code,
                specialization,
                phone,
                consultation_fee
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                user_id || null,
                department_id || null,
                doctor_code,
                specialization || null,
                phone || null,
                consultation_fee || 0,
            ]
        );

        // -------------------------------------------------
        // GET CREATED DOCTOR
        // -------------------------------------------------

        const [doctors] = await pool.query(
            `
            SELECT
                id,
                user_id,
                department_id,
                doctor_code,
                specialization,
                phone,
                consultation_fee,
                created_at
            FROM doctors
            WHERE id = ?
            `,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Doctor created successfully.",
            doctor: doctors[0],
        });

    } catch (error) {
        console.error(
            "Create Doctor Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to create doctor.",
        });
    }
};

// =====================================================
// UPDATE DOCTOR
// PUT /api/doctors/:id
// =====================================================

const updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            user_id,
            department_id,
            doctor_code,
            specialization,
            phone,
            consultation_fee,
        } = req.body;

        // -------------------------------------------------
        // CHECK DOCTOR
        // -------------------------------------------------

        const [existing] = await pool.query(
            `
            SELECT id
            FROM doctors
            WHERE id = ?
            `,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!doctor_code) {
            return res.status(400).json({
                success: false,
                message: "Doctor code is required.",
            });
        }

        // -------------------------------------------------
        // CHECK DUPLICATE CODE
        // -------------------------------------------------

        const [duplicate] = await pool.query(
            `
            SELECT id
            FROM doctors
            WHERE doctor_code = ?
            AND id != ?
            `,
            [
                doctor_code,
                id,
            ]
        );

        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Doctor code already exists.",
            });
        }

        // -------------------------------------------------
        // UPDATE
        // -------------------------------------------------

        await pool.query(
            `
            UPDATE doctors
            SET
                user_id = ?,
                department_id = ?,
                doctor_code = ?,
                specialization = ?,
                phone = ?,
                consultation_fee = ?
            WHERE id = ?
            `,
            [
                user_id || null,
                department_id || null,
                doctor_code,
                specialization || null,
                phone || null,
                consultation_fee || 0,
                id,
            ]
        );

        // -------------------------------------------------
        // GET UPDATED DOCTOR
        // -------------------------------------------------

        const [doctors] = await pool.query(
            `
            SELECT
                id,
                user_id,
                department_id,
                doctor_code,
                specialization,
                phone,
                consultation_fee,
                created_at
            FROM doctors
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Doctor updated successfully.",
            doctor: doctors[0],
        });

    } catch (error) {
        console.error(
            "Update Doctor Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to update doctor.",
        });
    }
};

// =====================================================
// DELETE DOCTOR
// DELETE /api/doctors/:id
// =====================================================

const deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        // -------------------------------------------------
        // CHECK DOCTOR
        // -------------------------------------------------

        const [existing] = await pool.query(
            `
            SELECT id
            FROM doctors
            WHERE id = ?
            `,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        // -------------------------------------------------
        // DELETE
        // -------------------------------------------------

        await pool.query(
            `
            DELETE FROM doctors
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Doctor deleted successfully.",
        });

    } catch (error) {
        console.error(
            "Delete Doctor Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to delete doctor.",
        });
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getDoctors,
    getDoctorById,
    createDoctor,
    updateDoctor,
    deleteDoctor,
};