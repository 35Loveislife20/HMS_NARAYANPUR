const { pool } = require("../config/db");

/* =========================================================
   HELPERS
========================================================= */

const normalizeId = (value, fieldName = "ID") => {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error(
            `${fieldName} must be a valid positive integer.`
        );
    }

    return id;
};

const normalizeOptionalId = (value, fieldName = "ID") => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    return normalizeId(value, fieldName);
};

const normalizeNumber = (
    value,
    {
        fieldName = "Value",
        defaultValue = 0,
        min = null,
    } = {}
) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return defaultValue;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error(
            `${fieldName} must be a valid number.`
        );
    }

    if (min !== null && number < min) {
        throw new Error(
            `${fieldName} cannot be less than ${min}.`
        );
    }

    return number;
};

const normalizeText = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const text = String(value).trim();

    return text === "" ? null : text;
};


/* =========================================================
   GET ALL DOCTORS
========================================================= */

const getAllDoctors = async (hospitalId = null) => {
    let query = `
        SELECT
            id,
            doctor_code,
            name,
            photo,
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
    `;

    const params = [];

    if (hospitalId !== null) {
        query += `
            WHERE hospital_id = ?
        `;

        params.push(
            normalizeId(
                hospitalId,
                "Hospital ID"
            )
        );
    }

    query += `
        ORDER BY id DESC
    `;

    const [rows] = await pool.query(
        query,
        params
    );

    return rows;
};


/* =========================================================
   GET DOCTOR BY ID
========================================================= */

const getDoctorById = async (
    id,
    hospitalId = null
) => {
    const doctorId = normalizeId(
        id,
        "Doctor ID"
    );

    let query = `
        SELECT
            id,
            doctor_code,
            name,
            photo,
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
    `;

    const params = [doctorId];

    if (hospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(
            normalizeId(
                hospitalId,
                "Hospital ID"
            )
        );
    }

    query += `
        LIMIT 1
    `;

    const [rows] = await pool.query(
        query,
        params
    );

    return rows[0] || null;
};


/* =========================================================
   SEARCH DOCTORS
========================================================= */

const searchDoctors = async (
    search,
    hospitalId = null
) => {
    const searchValue =
        String(search || "").trim();

    const keyword =
        `%${searchValue}%`;

    let query = `
        SELECT
            id,
            doctor_code,
            name,
            photo,
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
        WHERE
            (
                name LIKE ?
                OR doctor_code LIKE ?
                OR specialization LIKE ?
                OR qualification LIKE ?
                OR phone LIKE ?
                OR email LIKE ?
            )
    `;

    const params = [
        keyword,
        keyword,
        keyword,
        keyword,
        keyword,
        keyword,
    ];

    if (hospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(
            normalizeId(
                hospitalId,
                "Hospital ID"
            )
        );
    }

    query += `
        ORDER BY id DESC
        LIMIT 100
    `;

    const [rows] = await pool.query(
        query,
        params
    );

    return rows;
};


/* =========================================================
   GENERATE DOCTOR CODE
========================================================= */

const generateDoctorCode = async (
    hospitalId = null
) => {
    const year =
        new Date().getFullYear();

    let query = `
        SELECT doctor_code
        FROM doctors
        WHERE doctor_code LIKE ?
    `;

    const params = [
        `D-${year}%`,
    ];

    if (hospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(
            normalizeId(
                hospitalId,
                "Hospital ID"
            )
        );
    }

    query += `
        ORDER BY id DESC
        LIMIT 1
    `;

    const [rows] = await pool.query(
        query,
        params
    );

    let nextNumber = 1;

    if (
        rows.length > 0 &&
        rows[0].doctor_code
    ) {
        const match =
            String(
                rows[0].doctor_code
            ).match(
                /^D-(\d{4})(\d+)$/
            );

        if (match) {
            nextNumber =
                parseInt(
                    match[2],
                    10
                ) + 1;
        }
    }

    return (
        `D-${year}` +
        String(nextNumber).padStart(
            4,
            "0"
        )
    );
};


/* =========================================================
   CREATE DOCTOR
========================================================= */

const createDoctor = async (
    doctorData,
    hospitalId
) => {
    if (
        hospitalId === null ||
        hospitalId === undefined ||
        hospitalId === ""
    ) {
        throw new Error(
            "Hospital ID is required to create a doctor."
        );
    }

    const normalizedHospitalId =
        normalizeId(
            hospitalId,
            "Hospital ID"
        );

    const data = doctorData || {};

    const doctorCode =
        String(
            data.doctor_code || ""
        ).trim();

    const name =
        String(
            data.name || ""
        ).trim();

    if (!doctorCode) {
        throw new Error(
            "Doctor code is required."
        );
    }

    if (!name) {
        throw new Error(
            "Doctor name is required."
        );
    }

    const experienceYears =
        normalizeNumber(
            data.experience_years,
            {
                fieldName:
                    "Experience years",
                defaultValue: 0,
                min: 0,
            }
        );

    const consultationFee =
        normalizeNumber(
            data.consultation_fee,
            {
                fieldName:
                    "Consultation fee",
                defaultValue: 0,
                min: 0,
            }
        );

    const departmentId =
        normalizeOptionalId(
            data.department_id,
            "Department ID"
        );

    const status =
        String(
            data.status || "available"
        ).trim();

    const photo =
        normalizeText(
            data.photo
        );

    const specialization =
        normalizeText(
            data.specialization
        );

    const qualification =
        normalizeText(
            data.qualification
        );

    const phone =
        normalizeText(
            data.phone
        );

    const email =
        normalizeText(
            data.email
        );

    const [result] = await pool.query(
        `
        INSERT INTO doctors (
            doctor_code,
            name,
            photo,
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
        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )
        `,
        [
            doctorCode,
            name,
            photo,
            specialization,
            qualification,
            phone,
            email,
            experienceYears,
            consultationFee,
            departmentId,
            normalizedHospitalId,
            status,
        ]
    );

    return {
        id: result.insertId,
        doctor_code: doctorCode,
    };
};


/* =========================================================
   UPDATE DOCTOR
========================================================= */

const updateDoctor = async (
    id,
    doctorData,
    hospitalId = null
) => {
    const doctorId =
        normalizeId(
            id,
            "Doctor ID"
        );

    const data =
        doctorData || {};

    const doctorCode =
        String(
            data.doctor_code || ""
        ).trim();

    const name =
        String(
            data.name || ""
        ).trim();

    if (!doctorCode) {
        throw new Error(
            "Doctor code is required."
        );
    }

    if (!name) {
        throw new Error(
            "Doctor name is required."
        );
    }

    const experienceYears =
        normalizeNumber(
            data.experience_years,
            {
                fieldName:
                    "Experience years",
                defaultValue: 0,
                min: 0,
            }
        );

    const consultationFee =
        normalizeNumber(
            data.consultation_fee,
            {
                fieldName:
                    "Consultation fee",
                defaultValue: 0,
                min: 0,
            }
        );

    const departmentId =
        normalizeOptionalId(
            data.department_id,
            "Department ID"
        );

    const status =
        String(
            data.status || "available"
        ).trim();

    const photo =
        normalizeText(
            data.photo
        );

    const specialization =
        normalizeText(
            data.specialization
        );

    const qualification =
        normalizeText(
            data.qualification
        );

    const phone =
        normalizeText(
            data.phone
        );

    const email =
        normalizeText(
            data.email
        );

    let query = `
        UPDATE doctors
        SET
            doctor_code = ?,
            name = ?,
            photo = ?,
            specialization = ?,
            qualification = ?,
            phone = ?,
            email = ?,
            experience_years = ?,
            consultation_fee = ?,
            department_id = ?,
            status = ?
        WHERE id = ?
    `;

    const params = [
        doctorCode,
        name,
        photo,
        specialization,
        qualification,
        phone,
        email,
        experienceYears,
        consultationFee,
        departmentId,
        status,
        doctorId,
    ];

    if (hospitalId !== null) {
        query = `
            UPDATE doctors
            SET
                doctor_code = ?,
                name = ?,
                photo = ?,
                specialization = ?,
                qualification = ?,
                phone = ?,
                email = ?,
                experience_years = ?,
                consultation_fee = ?,
                department_id = ?,
                status = ?
            WHERE
                id = ?
                AND hospital_id = ?
        `;

        params.push(
            normalizeId(
                hospitalId,
                "Hospital ID"
            )
        );
    }

    const [result] =
        await pool.query(
            query,
            params
        );

    return result;
};


/* =========================================================
   DELETE DOCTOR
========================================================= */

const deleteDoctorById = async (
    id,
    hospitalId = null
) => {
    const doctorId =
        normalizeId(
            id,
            "Doctor ID"
        );

    let query = `
        DELETE FROM doctors
        WHERE id = ?
    `;

    const params = [
        doctorId,
    ];

    if (hospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(
            normalizeId(
                hospitalId,
                "Hospital ID"
            )
        );
    }

    const [result] =
        await pool.query(
            query,
            params
        );

    return result;
};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    getAllDoctors,
    getDoctorById,
    searchDoctors,
    generateDoctorCode,
    createDoctor,
    updateDoctor,
    deleteDoctorById,
};