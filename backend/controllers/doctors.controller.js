const { pool } = require("../config/db");

// =====================================================
// CONSTANTS
// =====================================================

const ALLOWED_STATUS = ["available", "busy", "offline"];

// =====================================================
// HELPERS
// =====================================================

const cleanString = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    const valueString = String(value).trim();

    return valueString === "" ? null : valueString;
};

// -----------------------------------------------------
// EMAIL VALIDATION
// -----------------------------------------------------

const isValidEmail = (email) => {
    if (!email) return true;

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// -----------------------------------------------------
// PHONE VALIDATION
// -----------------------------------------------------

const isValidPhone = (phone) => {
    if (!phone) return true;

    return /^[0-9]{10,15}$/.test(phone);
};

// -----------------------------------------------------
// STATUS
// -----------------------------------------------------

const normalizeStatus = (status) => {
    if (!status) {
        return "available";
    }

    return String(status).trim().toLowerCase();
};

// -----------------------------------------------------
// NUMBER
// -----------------------------------------------------

const normalizeNumber = (value, defaultValue = 0) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return defaultValue;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
};

// -----------------------------------------------------
// ID VALIDATION
// -----------------------------------------------------

const isValidId = (id) => {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
};

// =====================================================
// FIND DOCTOR BY ID
// =====================================================

const findDoctorById = async (id, connection = pool) => {
    const [rows] = await connection.execute(
        `
        SELECT
            id,
            doctor_code,
            name,
            specialization,
            qualification,
            phone,
            email,
            experience_years,
            consultation_fee,
            department_id,
            hospital_id,
            status,
            created_at,
            updated_at
        FROM doctors
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows.length > 0 ? rows[0] : null;
};

// =====================================================
// GENERATE DOCTOR CODE
//
// Format:
// D-20260001
// D-20260002
// D-20260003
// =====================================================

const generateDoctorCode = async (connection = pool) => {
    const currentYear = new Date().getFullYear();

    const prefix = `D-${currentYear}`;

    const [rows] = await connection.execute(
        `
        SELECT doctor_code
        FROM doctors
        WHERE doctor_code LIKE ?
        ORDER BY doctor_code DESC
        LIMIT 1
        `,
        [`${prefix}%`]
    );

    if (rows.length === 0) {
        return `${prefix}0001`;
    }

    const lastCode = rows[0].doctor_code;

    const numberPart = lastCode.substring(prefix.length);

    const lastNumber = parseInt(numberPart, 10);

    if (!Number.isFinite(lastNumber)) {
        return `${prefix}0001`;
    }

    return `${prefix}${String(lastNumber + 1).padStart(4, "0")}`;
};

// =====================================================
// CHECK DUPLICATE EMAIL
// =====================================================

const checkDuplicateEmail = async (
    email,
    doctorId = null,
    connection = pool
) => {
    if (!email) {
        return null;
    }

    let query = `
        SELECT
            id,
            doctor_code,
            name
        FROM doctors
        WHERE LOWER(email) = LOWER(?)
    `;

    const params = [email];

    if (doctorId !== null) {
        query += ` AND id != ?`;
        params.push(doctorId);
    }

    query += ` LIMIT 1`;

    const [rows] = await connection.execute(query, params);

    return rows.length > 0 ? rows[0] : null;
};

// =====================================================
// CHECK DUPLICATE PHONE
// =====================================================

const checkDuplicatePhone = async (
    phone,
    doctorId = null,
    connection = pool
) => {
    if (!phone) {
        return null;
    }

    let query = `
        SELECT
            id,
            doctor_code,
            name
        FROM doctors
        WHERE phone = ?
    `;

    const params = [phone];

    if (doctorId !== null) {
        query += ` AND id != ?`;
        params.push(doctorId);
    }

    query += ` LIMIT 1`;

    const [rows] = await connection.execute(query, params);

    return rows.length > 0 ? rows[0] : null;
};

// =====================================================
// CHECK DUPLICATE DOCTOR CODE
// =====================================================

const doctorCodeExists = async (
    doctorCode,
    connection = pool
) => {
    const [rows] = await connection.execute(
        `
        SELECT id
        FROM doctors
        WHERE doctor_code = ?
        LIMIT 1
        `,
        [doctorCode]
    );

    return rows.length > 0;
};

// =====================================================
// GET ALL DOCTORS
// =====================================================

const getDoctors = async (req, res) => {
    try {
        const [doctors] = await pool.execute(
            `
            SELECT
                id,
                doctor_code,
                name,
                specialization,
                qualification,
                phone,
                email,
                experience_years,
                consultation_fee,
                department_id,
                hospital_id,
                status,
                created_at,
                updated_at
            FROM doctors
            ORDER BY id DESC
            `
        );

        return res.status(200).json({
            success: true,
            message: "Doctors loaded successfully.",
            count: doctors.length,
            doctors,
        });

    } catch (error) {
        console.error("Get Doctors Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load doctors.",
        });
    }
};

// =====================================================
// GET DOCTOR BY ID
// =====================================================

const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID.",
            });
        }

        const doctor = await findDoctorById(id);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Doctor loaded successfully.",
            doctor,
        });

    } catch (error) {
        console.error("Get Doctor Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load doctor.",
        });
    }
};

// =====================================================
// CREATE DOCTOR
// =====================================================

const createDoctor = async (req, res) => {
    let connection;

    try {
        const {
            name,
            specialization,
            qualification,
            phone,
            email,
            experience_years,
            consultation_fee,
            department_id,
            hospital_id,
            status,
        } = req.body;

        // -------------------------------------------------
        // CLEAN DATA
        // -------------------------------------------------

        const cleanName = cleanString(name);

        const cleanSpecialization =
            cleanString(specialization);

        const cleanQualification =
            cleanString(qualification);

        const cleanPhone =
            cleanString(phone);

        const cleanEmail =
            cleanString(email)?.toLowerCase();

        const cleanStatus =
            normalizeStatus(status);

        // -------------------------------------------------
        // NAME
        // -------------------------------------------------

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: "Doctor name is required.",
            });
        }

        if (cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor name must contain at least 2 characters.",
            });
        }

        // -------------------------------------------------
        // SPECIALIZATION
        // -------------------------------------------------

        if (!cleanSpecialization) {
            return res.status(400).json({
                success: false,
                message: "Doctor specialization is required.",
            });
        }

        // -------------------------------------------------
        // EMAIL
        // -------------------------------------------------

        if (!isValidEmail(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        // -------------------------------------------------
        // PHONE
        // -------------------------------------------------

        if (!isValidPhone(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message:
                    "Phone number must contain 10 to 15 digits.",
            });
        }

        // -------------------------------------------------
        // STATUS
        // -------------------------------------------------

        if (!ALLOWED_STATUS.includes(cleanStatus)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid doctor status. Allowed values: available, busy, offline.",
            });
        }

        // -------------------------------------------------
        // EXPERIENCE
        // -------------------------------------------------

        const experience = normalizeNumber(
            experience_years,
            0
        );

        if (
            experience === null ||
            !Number.isInteger(experience) ||
            experience < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Experience years must be a valid non-negative integer.",
            });
        }

        // -------------------------------------------------
        // CONSULTATION FEE
        // -------------------------------------------------

        const consultationFee =
            normalizeNumber(
                consultation_fee,
                0
            );

        if (
            consultationFee === null ||
            consultationFee < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Consultation fee must be a valid non-negative number.",
            });
        }

        // -------------------------------------------------
        // DEPARTMENT ID
        //
        // departments table does NOT exist currently.
        // Therefore we only validate the value format.
        // -------------------------------------------------

        let departmentId = null;

        if (
            department_id !== undefined &&
            department_id !== null &&
            department_id !== ""
        ) {
            departmentId = Number(department_id);

            if (
                !Number.isInteger(departmentId) ||
                departmentId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department_id.",
                });
            }
        }

        // -------------------------------------------------
        // HOSPITAL ID
        // -------------------------------------------------

        let hospitalId = null;

        if (
            hospital_id !== undefined &&
            hospital_id !== null &&
            hospital_id !== ""
        ) {
            hospitalId = Number(hospital_id);

            if (
                !Number.isInteger(hospitalId) ||
                hospitalId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid hospital_id.",
                });
            }
        }

        // -------------------------------------------------
        // CONNECTION
        // -------------------------------------------------

        connection = await pool.getConnection();

        await connection.beginTransaction();

        // -------------------------------------------------
        // DUPLICATE EMAIL
        // -------------------------------------------------

        const existingEmail =
            await checkDuplicateEmail(
                cleanEmail,
                null,
                connection
            );

        if (existingEmail) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "A doctor with this email already exists.",
                field: "email",
                existing_doctor: {
                    id: existingEmail.id,
                    doctor_code:
                        existingEmail.doctor_code,
                    name: existingEmail.name,
                },
            });
        }

        // -------------------------------------------------
        // DUPLICATE PHONE
        // -------------------------------------------------

        const existingPhone =
            await checkDuplicatePhone(
                cleanPhone,
                null,
                connection
            );

        if (existingPhone) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "A doctor with this phone number already exists.",
                field: "phone",
                existing_doctor: {
                    id: existingPhone.id,
                    doctor_code:
                        existingPhone.doctor_code,
                    name: existingPhone.name,
                },
            });
        }

        // -------------------------------------------------
        // SAFE DOCTOR CODE GENERATION
        // -------------------------------------------------

        let doctorCode;

        let attempts = 0;

        const MAX_ATTEMPTS = 5;

        while (attempts < MAX_ATTEMPTS) {
            doctorCode =
                await generateDoctorCode(connection);

            const exists =
                await doctorCodeExists(
                    doctorCode,
                    connection
                );

            if (!exists) {
                break;
            }

            attempts++;
        }

        if (attempts >= MAX_ATTEMPTS) {
            await connection.rollback();

            return res.status(500).json({
                success: false,
                message:
                    "Unable to generate a unique doctor code. Please try again.",
            });
        }

        // -------------------------------------------------
        // INSERT DOCTOR
        // -------------------------------------------------

        let result;

        try {
            [result] = await connection.execute(
                `
                INSERT INTO doctors (
                    doctor_code,
                    name,
                    specialization,
                    qualification,
                    phone,
                    email,
                    experience_years,
                    consultation_fee,
                    department_id,
                    hospital_id,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    doctorCode,
                    cleanName,
                    cleanSpecialization,
                    cleanQualification,
                    cleanPhone,
                    cleanEmail,
                    experience,
                    consultationFee,
                    departmentId,
                    hospitalId,
                    cleanStatus,
                ]
            );

        } catch (insertError) {

            // -------------------------------------------------
            // DUPLICATE ENTRY
            // -------------------------------------------------

            if (insertError.code === "ER_DUP_ENTRY") {

                await connection.rollback();

                const errorMessage =
                    String(
                        insertError.message || ""
                    ).toLowerCase();

                if (
                    errorMessage.includes("email")
                ) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "A doctor with this email already exists.",
                        field: "email",
                    });
                }

                if (
                    errorMessage.includes("phone")
                ) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "A doctor with this phone number already exists.",
                        field: "phone",
                    });
                }

                if (
                    errorMessage.includes("doctor_code")
                ) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "Doctor code conflict. Please try again.",
                        field: "doctor_code",
                    });
                }

                return res.status(409).json({
                    success: false,
                    message:
                        "Doctor already exists.",
                });
            }

            throw insertError;
        }

        // -------------------------------------------------
        // GET CREATED DOCTOR
        // -------------------------------------------------

        const doctor =
            await findDoctorById(
                result.insertId,
                connection
            );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message:
                "Doctor created successfully.",
            doctor,
        });

    } catch (error) {

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Rollback Error:",
                    rollbackError.message
                );
            }
        }

        console.error(
            "Create Doctor Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create doctor.",
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
};

// =====================================================
// UPDATE DOCTOR
// =====================================================

const updateDoctor = async (req, res) => {
    let connection;

    try {
        const { id } = req.params;

        // -------------------------------------------------
        // ID VALIDATION
        // -------------------------------------------------

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID.",
            });
        }

        const {
            name,
            specialization,
            qualification,
            phone,
            email,
            experience_years,
            consultation_fee,
            department_id,
            hospital_id,
            status,
        } = req.body;

        // -------------------------------------------------
        // CLEAN DATA
        // -------------------------------------------------

        const cleanName =
            cleanString(name);

        const cleanSpecialization =
            cleanString(specialization);

        const cleanQualification =
            cleanString(qualification);

        const cleanPhone =
            cleanString(phone);

        const cleanEmail =
            cleanString(email)?.toLowerCase();

        const cleanStatus =
            normalizeStatus(status);

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: "Doctor name is required.",
            });
        }

        if (cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor name must contain at least 2 characters.",
            });
        }

        if (!cleanSpecialization) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor specialization is required.",
            });
        }

        if (!isValidEmail(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid email address.",
            });
        }

        if (!isValidPhone(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message:
                    "Phone number must contain 10 to 15 digits.",
            });
        }

        if (!ALLOWED_STATUS.includes(cleanStatus)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid doctor status. Allowed values: available, busy, offline.",
            });
        }

        // -------------------------------------------------
        // EXPERIENCE
        // -------------------------------------------------

        const experience =
            normalizeNumber(
                experience_years,
                0
            );

        if (
            experience === null ||
            !Number.isInteger(experience) ||
            experience < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Experience years must be a valid non-negative integer.",
            });
        }

        // -------------------------------------------------
        // CONSULTATION FEE
        // -------------------------------------------------

        const consultationFee =
            normalizeNumber(
                consultation_fee,
                0
            );

        if (
            consultationFee === null ||
            consultationFee < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Consultation fee must be a valid non-negative number.",
            });
        }

        // -------------------------------------------------
        // DEPARTMENT ID
        // -------------------------------------------------

        let departmentId = null;

        if (
            department_id !== undefined &&
            department_id !== null &&
            department_id !== ""
        ) {
            departmentId = Number(department_id);

            if (
                !Number.isInteger(departmentId) ||
                departmentId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid department_id.",
                });
            }
        }

        // -------------------------------------------------
        // HOSPITAL ID
        // -------------------------------------------------

        let hospitalId = null;

        if (
            hospital_id !== undefined &&
            hospital_id !== null &&
            hospital_id !== ""
        ) {
            hospitalId = Number(hospital_id);

            if (
                !Number.isInteger(hospitalId) ||
                hospitalId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid hospital_id.",
                });
            }
        }

        // -------------------------------------------------
        // CONNECTION
        // -------------------------------------------------

        connection =
            await pool.getConnection();

        await connection.beginTransaction();

        // -------------------------------------------------
        // CHECK DOCTOR
        // -------------------------------------------------

        const [existingDoctors] =
            await connection.execute(
                `
                SELECT
                    id,
                    doctor_code
                FROM doctors
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (existingDoctors.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Doctor not found.",
            });
        }

        // -------------------------------------------------
        // DUPLICATE EMAIL
        // -------------------------------------------------

        const existingEmail =
            await checkDuplicateEmail(
                cleanEmail,
                Number(id),
                connection
            );

        if (existingEmail) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "Another doctor is already using this email.",
                field: "email",
                existing_doctor: {
                    id: existingEmail.id,
                    doctor_code:
                        existingEmail.doctor_code,
                    name:
                        existingEmail.name,
                },
            });
        }

        // -------------------------------------------------
        // DUPLICATE PHONE
        // -------------------------------------------------

        const existingPhone =
            await checkDuplicatePhone(
                cleanPhone,
                Number(id),
                connection
            );

        if (existingPhone) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "Another doctor is already using this phone number.",
                field: "phone",
                existing_doctor: {
                    id: existingPhone.id,
                    doctor_code:
                        existingPhone.doctor_code,
                    name:
                        existingPhone.name,
                },
            });
        }

        // -------------------------------------------------
        // UPDATE
        //
        // doctor_code is intentionally NOT changed.
        // -------------------------------------------------

        try {
            await connection.execute(
                `
                UPDATE doctors
                SET
                    name = ?,
                    specialization = ?,
                    qualification = ?,
                    phone = ?,
                    email = ?,
                    experience_years = ?,
                    consultation_fee = ?,
                    department_id = ?,
                    hospital_id = ?,
                    status = ?
                WHERE id = ?
                `,
                [
                    cleanName,
                    cleanSpecialization,
                    cleanQualification,
                    cleanPhone,
                    cleanEmail,
                    experience,
                    consultationFee,
                    departmentId,
                    hospitalId,
                    cleanStatus,
                    id,
                ]
            );

        } catch (updateError) {

            if (
                updateError.code ===
                "ER_DUP_ENTRY"
            ) {
                await connection.rollback();

                const errorMessage =
                    String(
                        updateError.message || ""
                    ).toLowerCase();

                if (
                    errorMessage.includes(
                        "email"
                    )
                ) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "Another doctor is already using this email.",
                        field: "email",
                    });
                }

                if (
                    errorMessage.includes(
                        "phone"
                    )
                ) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "Another doctor is already using this phone number.",
                        field: "phone",
                    });
                }

                return res.status(409).json({
                    success: false,
                    message:
                        "Doctor information already exists.",
                });
            }

            throw updateError;
        }

        // -------------------------------------------------
        // GET UPDATED DOCTOR
        // -------------------------------------------------

        const doctor =
            await findDoctorById(
                id,
                connection
            );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message:
                "Doctor updated successfully.",
            doctor,
        });

    } catch (error) {

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Rollback Error:",
                    rollbackError.message
                );
            }
        }

        console.error(
            "Update Doctor Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update doctor.",
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
};

// =====================================================
// DELETE DOCTOR
// =====================================================

const deleteDoctor = async (req, res) => {
    let connection;

    try {
        const { id } = req.params;

        // -------------------------------------------------
        // ID VALIDATION
        // -------------------------------------------------

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid doctor ID.",
            });
        }

        connection =
            await pool.getConnection();

        await connection.beginTransaction();

        // -------------------------------------------------
        // FIND DOCTOR
        // -------------------------------------------------

        const [doctors] =
            await connection.execute(
                `
                SELECT
                    id,
                    doctor_code,
                    name
                FROM doctors
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (doctors.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Doctor not found.",
            });
        }

        const doctor = doctors[0];

        // -------------------------------------------------
        // DELETE
        // -------------------------------------------------

        await connection.execute(
            `
            DELETE FROM doctors
            WHERE id = ?
            `,
            [id]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message:
                "Doctor deleted successfully.",
            deleted_doctor: {
                id: doctor.id,
                doctor_code:
                    doctor.doctor_code,
                name: doctor.name,
            },
        });

    } catch (error) {

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Rollback Error:",
                    rollbackError.message
                );
            }
        }

        console.error(
            "Delete Doctor Error:",
            error
        );

        // -------------------------------------------------
        // FOREIGN KEY
        // -------------------------------------------------

        if (
            error.code ===
            "ER_ROW_IS_REFERENCED_2" ||
            error.code ===
            "ER_ROW_IS_REFERENCED"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Doctor cannot be deleted because this doctor is linked to other hospital records.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete doctor.",
        });

    } finally {

        if (connection) {
            connection.release();
        }
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