const {
    getAllPatients,
    searchPatientsModel,
    findPatientForPublicLookup,
    getPatientByIdModel,
    createPatientModel,
    updatePatientModel,
    deletePatientModel,
} = require("../models/patient.model");

const {
    findHospitalById,
} = require("../models/hospital.model");

const {
    sendPatientRegistrationSMS,
} = require("../services/sms.service");

const {
    transporter,
} = require("../services/email.service");

const SUPER_ADMIN = "super_admin";

const VALID_GENDERS = ["male", "female", "other"];

const normalizeId = (value) => {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
};

const normalizeText = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
};

const normalizeOptionalText = (value) => {
    const text = normalizeText(value);
    return text || null;
};

const normalizeEmail = (value) => {
    const email = normalizeText(value);

    if (!email) {
        return null;
    }

    return email.toLowerCase();
};

const isValidEmail = (email) => {
    if (!email) {
        return true;
    }

    if (email.length > 100) {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const normalizePhone = (value) => {
    const phone = normalizeText(value);

    if (!phone) {
        return null;
    }

    return phone;
};

const isValidPhone = (phone) => {
    if (!phone) {
        return true;
    }

    return /^\d{10}$/.test(phone);
};

const isValidDate = (value) => {
    if (!value) {
        return true;
    }

    const dateString = String(value).trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return false;
    }

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const [year, month, day] = dateString
        .split("-")
        .map(Number);

    if (
        date.getFullYear() !== year ||
        date.getMonth() + 1 !== month ||
        date.getDate() !== day
    ) {
        return false;
    }

    // Date of birth cannot be in the future.
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return date <= today;
};

const validateGender = (gender) => {
    return VALID_GENDERS.includes(
        normalizeText(gender).toLowerCase()
    );
};

const validatePatientInput = ({
    name,
    gender,
    date_of_birth,
    phone,
    email,
    patient_code,
    address,
    blood_group,
    emergency_contact,
}) => {
    const errors = [];

    const cleanName = normalizeText(name);
    const cleanGender = normalizeText(gender).toLowerCase();
    const cleanPhone = normalizePhone(phone);
    const cleanEmail = normalizeEmail(email);
    const cleanPatientCode = normalizeOptionalText(patient_code);
    const cleanAddress = normalizeOptionalText(address);
    const cleanEmergencyContact =
        normalizeOptionalText(emergency_contact);

    if (!cleanName) {
        errors.push("Patient name is required");
    } else if (cleanName.length > 100) {
        errors.push("Patient name cannot exceed 100 characters");
    }

    if (!cleanGender) {
        errors.push("Gender is required");
    } else if (!validateGender(cleanGender)) {
        errors.push("Gender must be male, female or other");
    }

    if (date_of_birth && !isValidDate(date_of_birth)) {
        errors.push(
            "Date of birth must be a valid date and cannot be in the future"
        );
    }

    if (cleanPhone && !isValidPhone(cleanPhone)) {
        errors.push("Mobile number must contain exactly 10 digits");
    }

    if (cleanEmail && !isValidEmail(cleanEmail)) {
        errors.push("Please enter a valid email address");
    }

    if (cleanPatientCode && cleanPatientCode.length > 20) {
        errors.push("Patient code cannot exceed 20 characters");
    }

    if (cleanEmergencyContact && cleanEmergencyContact.length > 150) {
        errors.push("Emergency contact cannot exceed 150 characters");
    }

    return {
        errors,
        data: {
            patient_code: cleanPatientCode,
            name: cleanName,
            gender: cleanGender,
            date_of_birth: date_of_birth
                ? String(date_of_birth).trim()
                : null,
            phone: cleanPhone,
            email: cleanEmail,
            address: cleanAddress,
            blood_group: normalizeOptionalText(blood_group),
            emergency_contact: cleanEmergencyContact,
        },
    };
};

/**
 * Returns:
 *   null => Super Admin / global scope
 *   hospital ID => hospital-specific scope
 */
const getHospitalScope = (req) => {
    if (
        String(req.user?.role || "").toLowerCase() ===
        SUPER_ADMIN
    ) {
        return null;
    }

    return normalizeId(req.user?.hospital_id);
};

const isSuperAdmin = (req) => {
    return (
        String(req.user?.role || "").toLowerCase() ===
        SUPER_ADMIN
    );
};

/**
 * For non-Super Admin users, hospital_id must exist.
 */
const requireHospitalScope = (req, res) => {
    if (isSuperAdmin(req)) {
        return null;
    }

    const hospitalId = getHospitalScope(req);

    if (!hospitalId) {
        res.status(403).json({
            success: false,
            message:
                "Hospital access is not assigned to this user",
        });

        return undefined;
    }

    return hospitalId;
};

const ensureActiveHospital = async (hospitalId) => {
    const hospital = await findHospitalById(hospitalId);

    if (!hospital) {
        return {
            valid: false,
            message: "Hospital not found",
        };
    }

    if (
        String(hospital.status || "").toLowerCase() !==
        "active"
    ) {
        return {
            valid: false,
            message: "Selected hospital is inactive",
        };
    }

    return {
        valid: true,
        hospital,
    };
};

/* =========================================================
   REGISTRATION NOTIFICATION (SMS + EMAIL)
   Background mein chalta hai. Failure registration ko
   fail nahi karta, sirf log hota hai.
========================================================= */

const notifyPatientRegistration = async (
    patient,
    hospitalName
) => {
    const regNo =
        patient.patient_code || patient.id;

    // SMS
    if (patient.phone) {
        try {
            const smsResult =
                await sendPatientRegistrationSMS(patient);

            console.log(
                "REGISTRATION SMS RESULT:",
                smsResult
            );
        } catch (error) {
            console.error(
                "REGISTRATION SMS ERROR:",
                error.message
            );
        }
    }

    // EMAIL
    if (patient.email) {
        try {
            await transporter.sendMail({
                from:
                    process.env.EMAIL_FROM ||
                    process.env.GMAIL_USER,
                to: patient.email,
                subject: `Registration Successful - ${hospitalName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #111;">
                        <p>Namaste <b>${patient.name}</b>,</p>
                        <p>
                            Aapka registration <b>${hospitalName}</b>
                            mein safaltapoorvak ho gaya hai.
                        </p>
                        <p>
                            Registration Number:
                            <b style="font-size: 18px;">${regNo}</b>
                        </p>
                        <p>
                            Appointment ke din yeh Registration Number
                            zaroor laayein.
                        </p>
                        <p>Dhanyavaad,<br/>${hospitalName}</p>
                    </div>
                `,
            });

            console.log(
                "REGISTRATION EMAIL SENT:",
                patient.email
            );
        } catch (error) {
            console.error(
                "REGISTRATION EMAIL ERROR:",
                error.message
            );
        }
    }
};

/**
 * GET /api/patients
 */
const getPatients = async (req, res) => {
    try {
        const hospitalId = requireHospitalScope(req, res);

        if (hospitalId === undefined && !isSuperAdmin(req)) {
            return;
        }

        const patients = await getAllPatients(hospitalId);

        return res.status(200).json({
            success: true,
            count: patients.length,
            patients,
        });
    } catch (error) {
        console.error("GET PATIENTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load patients",
        });
    }
};

/**
 * GET /api/patients/public/search
 *
 * Used by the Patient Portal.
 */
const searchPatients = async (req, res) => {
    try {
        const query = normalizeText(req.query.query);

        if (!query || query.length < 4) {
            return res.status(400).json({
                success: false,
                message:
                    "Enter the full patient ID or mobile number",
                patients: [],
            });
        }

        // Public search: hospital is mandatory
        const hospitalId = normalizeId(req.query.hospital_id);

        if (!hospitalId) {
            return res.status(400).json({
                success: false,
                message: "Valid hospital_id is required",
                patients: [],
            });
        }

        const hospitalResult =
            await ensureActiveHospital(hospitalId);

        if (!hospitalResult.valid) {
            return res.status(400).json({
                success: false,
                message: hospitalResult.message,
                patients: [],
            });
        }

        const patients = await findPatientForPublicLookup(
            query,
            hospitalId
        );

        return res.status(200).json({
            success: true,
            count: patients.length,
            patients,
        });
    } catch (error) {
        console.error("PUBLIC PATIENT SEARCH ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to search patients",
            patients: [],
        });
    }
};

/**
 * POST /api/patients/register
 * POST /api/patients/public
 *
 * Public patient registration.
 * Registration ke baad SMS aur email bhejta hai.
 */
const registerPatient = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            gender,
            date_of_birth,
            address,
            blood_group,
            hospital_id,
            emergency_contact,
        } = req.body;

        const hospitalId = normalizeId(hospital_id);

        if (!hospitalId) {
            return res.status(400).json({
                success: false,
                message: "Valid hospital_id is required",
            });
        }

        const hospitalResult =
            await ensureActiveHospital(hospitalId);

        if (!hospitalResult.valid) {
            return res.status(400).json({
                success: false,
                message: hospitalResult.message,
            });
        }

        const cleanName = normalizeText(name);
        const cleanGender = normalizeText(gender).toLowerCase();
        const cleanPhone = normalizePhone(phone);
        const cleanEmail = normalizeEmail(email);
        const cleanAddress = normalizeText(address);
        const cleanEmergencyContact =
            normalizeOptionalText(emergency_contact);

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: "Patient name is required",
            });
        }

        if (cleanName.length > 100) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient name cannot exceed 100 characters",
            });
        }

        if (!cleanPhone) {
            return res.status(400).json({
                success: false,
                message: "Mobile number is required",
            });
        }

        if (!isValidPhone(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message:
                    "Mobile number must contain exactly 10 digits",
            });
        }

        if (!validateGender(cleanGender)) {
            return res.status(400).json({
                success: false,
                message:
                    "Gender must be male, female or other",
            });
        }

        if (!date_of_birth) {
            return res.status(400).json({
                success: false,
                message: "Date of birth is required",
            });
        }

        if (!isValidDate(date_of_birth)) {
            return res.status(400).json({
                success: false,
                message:
                    "Date of birth must be a valid date and cannot be in the future",
            });
        }

        if (!cleanAddress) {
            return res.status(400).json({
                success: false,
                message: "Address is required",
            });
        }

        if (cleanEmail && !isValidEmail(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }

        if (
            cleanEmergencyContact &&
            cleanEmergencyContact.length > 150
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Emergency contact cannot exceed 150 characters",
            });
        }

        const result = await createPatientModel(
            {
                patient_code: null,
                name: cleanName,
                gender: cleanGender,
                date_of_birth: String(date_of_birth).trim(),
                phone: cleanPhone,
                email: cleanEmail,
                address: cleanAddress,
                blood_group: normalizeOptionalText(blood_group),
                emergency_contact: cleanEmergencyContact,
                hospital_id: hospitalId,
                user_id: null,
            },
            hospitalId
        );

        const patient = await getPatientByIdModel(
            result.insertId,
            hospitalId
        );

        // Notification background mein — response ko block nahi karega
        notifyPatientRegistration(
            patient,
            hospitalResult.hospital.name || "Hospital"
        ).catch((error) => {
            console.error(
                "REGISTRATION NOTIFY FAILED:",
                error.message
            );
        });

        return res.status(201).json({
            success: true,
            message: "Patient registered successfully",
            patient,
        });
    } catch (error) {
        console.error(
            "PUBLIC PATIENT REGISTRATION ERROR:",
            error
        );

        if (
            error.code === "ER_DUP_ENTRY" ||
            error.code === "1062"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Patient already exists or a unique patient value already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to register patient",
        });
    }
};

/**
 * GET /api/patients/:id
 */
const getPatientById = async (req, res) => {
    try {
        const patientId = normalizeId(req.params.id);

        if (!patientId) {
            return res.status(400).json({
                success: false,
                message: "Invalid patient ID",
            });
        }

        const hospitalId = requireHospitalScope(req, res);

        if (hospitalId === undefined && !isSuperAdmin(req)) {
            return;
        }

        const patient = await getPatientByIdModel(
            patientId,
            hospitalId
        );

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        return res.status(200).json({
            success: true,
            patient,
        });
    } catch (error) {
        console.error("GET PATIENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load patient",
        });
    }
};

/**
 * POST /api/patients
 */
const createPatient = async (req, res) => {
    try {
        const hospitalScope = requireHospitalScope(req, res);

        if (hospitalScope === undefined && !isSuperAdmin(req)) {
            return;
        }

        let targetHospitalId = hospitalScope;

        if (isSuperAdmin(req)) {
            targetHospitalId = normalizeId(req.body.hospital_id);

            if (!targetHospitalId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "hospital_id is required for Super Admin",
                });
            }
        }

        const hospitalResult =
            await ensureActiveHospital(targetHospitalId);

        if (!hospitalResult.valid) {
            return res.status(400).json({
                success: false,
                message: hospitalResult.message,
            });
        }

        const {
            patient_code,
            name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            blood_group,
            emergency_contact,
            user_id,
        } = req.body;

        const cleanName = normalizeText(name);
        const cleanGender = normalizeText(gender).toLowerCase();

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: "Patient name is required",
            });
        }

        if (!cleanGender) {
            return res.status(400).json({
                success: false,
                message: "Gender is required",
            });
        }

        if (!validateGender(cleanGender)) {
            return res.status(400).json({
                success: false,
                message:
                    "Gender must be male, female or other",
            });
        }

        if (cleanName.length > 100) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient name cannot exceed 100 characters",
            });
        }

        if (
            patient_code !== undefined &&
            patient_code !== null &&
            normalizeText(patient_code).length > 20
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient code cannot exceed 20 characters",
            });
        }

        if (date_of_birth && !isValidDate(date_of_birth)) {
            return res.status(400).json({
                success: false,
                message:
                    "Date of birth must be a valid date and cannot be in the future",
            });
        }

        const cleanPhone = normalizePhone(phone);

        if (cleanPhone && !isValidPhone(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message:
                    "Mobile number must contain exactly 10 digits",
            });
        }

        const cleanEmail = normalizeEmail(email);

        if (cleanEmail && !isValidEmail(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address",
            });
        }

        const cleanEmergencyContact =
            normalizeOptionalText(emergency_contact);

        if (
            cleanEmergencyContact &&
            cleanEmergencyContact.length > 150
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Emergency contact cannot exceed 150 characters",
            });
        }

        let cleanUserId = null;

        if (
            user_id !== undefined &&
            user_id !== null &&
            normalizeText(user_id) !== ""
        ) {
            cleanUserId = normalizeId(user_id);

            if (!cleanUserId) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user_id",
                });
            }
        }

        const result = await createPatientModel(
            {
                patient_code: normalizeOptionalText(patient_code),
                name: cleanName,
                gender: cleanGender,
                date_of_birth: date_of_birth
                    ? String(date_of_birth).trim()
                    : null,
                phone: cleanPhone,
                email: cleanEmail,
                address: normalizeOptionalText(address),
                blood_group: normalizeOptionalText(blood_group),
                emergency_contact: cleanEmergencyContact,
                user_id: cleanUserId,
                hospital_id: targetHospitalId,
            },
            targetHospitalId
        );

        const patient = await getPatientByIdModel(
            result.insertId,
            targetHospitalId
        );

        return res.status(201).json({
            success: true,
            message: "Patient created successfully",
            patient,
        });
    } catch (error) {
        console.error("CREATE PATIENT ERROR:", error);

        if (
            error.code === "ER_DUP_ENTRY" ||
            error.code === "1062"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Patient code, user association, or another unique patient value already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create patient",
        });
    }
};

/**
 * PUT /api/patients/:id
 */
const updatePatient = async (req, res) => {
    try {
        const patientId = normalizeId(req.params.id);

        if (!patientId) {
            return res.status(400).json({
                success: false,
                message: "Invalid patient ID",
            });
        }

        const hospitalId = requireHospitalScope(req, res);

        if (hospitalId === undefined && !isSuperAdmin(req)) {
            return;
        }

        const existingPatient = await getPatientByIdModel(
            patientId,
            hospitalId
        );

        if (!existingPatient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        const {
            patient_code,
            name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            blood_group,
            emergency_contact,
        } = req.body;

        const cleanName = normalizeText(name);
        const cleanGender = normalizeText(gender).toLowerCase();

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: "Patient name is required",
            });
        }

        if (!cleanGender) {
            return res.status(400).json({
                success: false,
                message: "Gender is required",
            });
        }

        if (!validateGender(cleanGender)) {
            return res.status(400).json({
                success: false,
                message:
                    "Gender must be male, female or other",
            });
        }

        if (cleanName.length > 100) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient name cannot exceed 100 characters",
            });
        }

        const cleanPatientCode =
            normalizeOptionalText(patient_code);

        if (cleanPatientCode && cleanPatientCode.length > 20) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient code cannot exceed 20 characters",
            });
        }

        if (date_of_birth && !isValidDate(date_of_birth)) {
            return res.status(400).json({
                success: false,
                message:
                    "Date of birth must be a valid date and cannot be in the future",
            });
        }

        const cleanPhone = normalizePhone(phone);

        if (cleanPhone && !isValidPhone(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message:
                    "Mobile number must contain exactly 10 digits",
            });
        }

        const cleanEmail = normalizeEmail(email);

        if (cleanEmail && !isValidEmail(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address",
            });
        }

        const cleanEmergencyContact =
            normalizeOptionalText(emergency_contact);

        if (
            cleanEmergencyContact &&
            cleanEmergencyContact.length > 150
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Emergency contact cannot exceed 150 characters",
            });
        }

        await updatePatientModel(
            patientId,
            {
                patient_code: cleanPatientCode,
                name: cleanName,
                gender: cleanGender,
                date_of_birth: date_of_birth
                    ? String(date_of_birth).trim()
                    : null,
                phone: cleanPhone,
                email: cleanEmail,
                address: normalizeOptionalText(address),
                blood_group: normalizeOptionalText(blood_group),
                emergency_contact: cleanEmergencyContact,
            },
            hospitalId
        );

        const patient = await getPatientByIdModel(
            patientId,
            hospitalId
        );

        return res.status(200).json({
            success: true,
            message: "Patient updated successfully",
            patient,
        });
    } catch (error) {
        console.error("UPDATE PATIENT ERROR:", error);

        if (
            error.code === "ER_DUP_ENTRY" ||
            error.code === "1062"
        ) {
            return res.status(409).json({
                success: false,
                message: "Patient code already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update patient",
        });
    }
};

/**
 * DELETE /api/patients/:id
 */
const deletePatient = async (req, res) => {
    try {
        const patientId = normalizeId(req.params.id);

        if (!patientId) {
            return res.status(400).json({
                success: false,
                message: "Invalid patient ID",
            });
        }

        const hospitalId = requireHospitalScope(req, res);

        if (hospitalId === undefined && !isSuperAdmin(req)) {
            return;
        }

        const existingPatient = await getPatientByIdModel(
            patientId,
            hospitalId
        );

        if (!existingPatient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        await deletePatientModel(patientId, hospitalId);

        return res.status(200).json({
            success: true,
            message: "Patient deleted successfully",
        });
    } catch (error) {
        console.error("DELETE PATIENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete patient",
        });
    }
};

module.exports = {
    getPatients,
    searchPatients,
    registerPatient,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
};