const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const {
    getAllDoctors,
    getDoctorById,
    searchDoctors,
    generateDoctorCode,
    createDoctor,
    updateDoctor,
    deleteDoctorById,
} = require("../models/doctor.model");

const {
    findHospitalById,
} = require("../models/hospital.model");

const bcrypt = require("bcryptjs");

const {
    createUser,
    findUserByEmail,
} = require("../models/user.model");

const {
    generatePassword,
    issueCredentials,
} = require("../utils/credentialMailer");

const cloudinary = require("cloudinary").v2;
const { saveImageFile } = require("../utils/imageStore");


/*
=========================================================
CONSTANTS
=========================================================
*/

const SUPER_ADMIN = "super_admin";

const VALID_STATUSES = [
    "available",
    "busy",
    "offline",
    "on_leave",
    "inactive",
];

const ALLOWED_IMAGE_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
];

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 15;
const MAX_EMAIL_LENGTH = 100;


/*
=========================================================
CLOUDINARY CONFIGURATION
=========================================================
*/

const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name:
            process.env.CLOUDINARY_CLOUD_NAME,

        api_key:
            process.env.CLOUDINARY_API_KEY,

        api_secret:
            process.env.CLOUDINARY_API_SECRET,
    });
}


/*
=========================================================
LOCAL DOCTOR PHOTO DIRECTORY
=========================================================
*/

const doctorUploadDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "doctors"
);


/*
=========================================================
HELPERS
=========================================================
*/

const normalizeText = (value) => {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
};


const normalizeOptionalText = (value) => {
    const text = normalizeText(value);

    return text || null;
};


const normalizeId = (value) => {
    const id = Number(value);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return null;
    }

    return id;
};


const normalizeEmail = (value) => {
    const email = normalizeText(value);

    if (!email) {
        return null;
    }

    return email.toLowerCase();
};


const normalizePhone = (value) => {
    const phone = normalizeText(value);

    if (!phone) {
        return null;
    }

    return phone;
};


const isValidEmail = (email) => {
    if (!email) {
        return true;
    }

    if (
        email.length >
        MAX_EMAIL_LENGTH
    ) {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
};


const isValidPhone = (phone) => {
    if (!phone) {
        return true;
    }

    /*
    Indian mobile numbers are normally
    10 digits. We keep the same behavior
    expected by the existing HMS frontend.
    */

    return /^\d{10}$/.test(phone);
};


const normalizeNumber = (
    value,
    defaultValue = 0
) => {
    if (
        value === undefined ||
        value === null ||
        normalizeText(value) === ""
    ) {
        return defaultValue;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return null;
    }

    return number;
};


const validateDoctorInput = ({
    name,
    phone,
    email,
    experience_years,
    consultation_fee,
    status,
}) => {
    const errors = [];

    const cleanName =
        normalizeText(name);

    const cleanPhone =
        normalizePhone(phone);

    const cleanEmail =
        normalizeEmail(email);

    if (!cleanName) {
        errors.push(
            "Doctor name is required."
        );
    } else if (
        cleanName.length >
        MAX_NAME_LENGTH
    ) {
        errors.push(
            "Doctor name cannot exceed 100 characters."
        );
    }

    if (
        cleanPhone &&
        !isValidPhone(cleanPhone)
    ) {
        errors.push(
            "Mobile number must contain exactly 10 digits."
        );
    }

    if (
        cleanPhone &&
        cleanPhone.length >
        MAX_PHONE_LENGTH
    ) {
        errors.push(
            "Phone number is too long."
        );
    }

    if (
        cleanEmail &&
        !isValidEmail(cleanEmail)
    ) {
        errors.push(
            "Please enter a valid email address."
        );
    }

    const experience =
        normalizeNumber(
            experience_years,
            0
        );

    if (
        experience === null ||
        experience < 0 ||
        !Number.isInteger(experience)
    ) {
        errors.push(
            "Experience years must be a valid non-negative number."
        );
    }

    const fee =
        normalizeNumber(
            consultation_fee,
            0
        );

    if (
        fee === null ||
        fee < 0
    ) {
        errors.push(
            "Consultation fee must be a valid non-negative number."
        );
    }

    if (
        status !== undefined &&
        status !== null &&
        normalizeText(status) !== ""
    ) {
        const cleanStatus =
            normalizeText(status).toLowerCase();

        if (
            !VALID_STATUSES.includes(
                cleanStatus
            )
        ) {
            errors.push(
                "Invalid doctor status."
            );
        }
    }

    return {
        errors,
        data: {
            name: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
            experience_years:
                experience,
            consultation_fee:
                fee,
            status:
                status === undefined ||
                status === null ||
                normalizeText(status) === ""
                    ? "available"
                    : normalizeText(
                          status
                      ).toLowerCase(),
        },
    };
};


/*
=========================================================
HOSPITAL SCOPE
=========================================================

Super Admin:
    null = global scope

Hospital users:
    their JWT hospital_id
=========================================================
*/

const getHospitalScope = (req) => {
    const role = normalizeText(
        req.user?.role
    ).toLowerCase();

    if (
        role === SUPER_ADMIN
    ) {
        return null;
    }

    return normalizeId(
        req.user?.hospital_id
    );
};


const requireHospitalScope = (
    req,
    res
) => {
    const role = normalizeText(
        req.user?.role
    ).toLowerCase();

    if (
        role === SUPER_ADMIN
    ) {
        return null;
    }

    const hospitalId =
        getHospitalScope(req);

    if (!hospitalId) {
        res.status(403).json({
            success: false,
            message:
                "Hospital access is not assigned to this user.",
        });

        return undefined;
    }

    return hospitalId;
};


/*
=========================================================
ACTIVE HOSPITAL VALIDATION
=========================================================
*/

const ensureActiveHospital = async (
    hospitalId
) => {
    const id =
        normalizeId(hospitalId);

    if (!id) {
        return {
            valid: false,
            message:
                "Valid hospital_id is required.",
        };
    }

    const hospital =
        await findHospitalById(id);

    if (!hospital) {
        return {
            valid: false,
            message:
                "Hospital not found.",
        };
    }

    if (
        normalizeText(
            hospital.status
        ).toLowerCase() !== "active"
    ) {
        return {
            valid: false,
            message:
                "Selected hospital is inactive.",
        };
    }

    return {
        valid: true,
        hospital,
    };
};


/*
=========================================================
DOCTOR PHOTO UPLOAD
=========================================================

Priority:
1. Cloudinary
2. Local filesystem
=========================================================
*/

const uploadDoctorPhoto = async (file) => {
    if (!file) {
        return null;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new Error("INVALID_DOCTOR_IMAGE_TYPE");
    }

    // Photo TiDB (images table) me save hoti hai
    return saveImageFile(file, { entityType: "doctor" });
};


/*
=========================================================
GET ALL DOCTORS
=========================================================
*/

const getDoctors = async (
    req,
    res
) => {
    try {
        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (
            hospitalId === undefined
        ) {
            return;
        }

        const search =
            normalizeText(
                req.query.search
            );

        let doctors;

        if (search) {
            doctors =
                await searchDoctors(
                    search,
                    hospitalId
                );
        } else {
            doctors =
                await getAllDoctors(
                    hospitalId
                );
        }

        return res.status(200).json({
            success: true,
            count:
                doctors.length,
            doctors,
        });
    } catch (error) {
        console.error(
            "GET DOCTORS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch doctors.",
        });
    }
};


/*
=========================================================
GET SINGLE DOCTOR
=========================================================
*/

const getDoctor = async (
    req,
    res
) => {
    try {
        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (
            hospitalId === undefined
        ) {
            return;
        }

        const id =
            normalizeId(
                req.params.id
            );

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid doctor ID.",
            });
        }

        const doctor =
            await getDoctorById(
                id,
                hospitalId
            );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message:
                    "Doctor not found.",
            });
        }

        return res.status(200).json({
            success: true,
            doctor,
        });
    } catch (error) {
        console.error(
            "GET DOCTOR ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch doctor.",
        });
    }
};


/*
=========================================================
GET NEXT DOCTOR CODE
=========================================================
*/

const getNextDoctorCode = async (
    req,
    res
) => {
    try {
        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (
            hospitalId === undefined
        ) {
            return;
        }

        /*
        Super Admin needs a selected hospital
        for generating a hospital-specific code.
        */

        if (
            hospitalId === null
        ) {
            const requestedHospitalId =
                normalizeId(
                    req.query.hospital_id
                );

            if (
                !requestedHospitalId
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "hospital_id is required for Super Admin.",
                });
            }

            const hospitalResult =
                await ensureActiveHospital(
                    requestedHospitalId
                );

            if (
                !hospitalResult.valid
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        hospitalResult.message,
                });
            }

            const doctorCode =
                await generateDoctorCode(
                    requestedHospitalId
                );

            return res.status(200).json({
                success: true,
                doctor_code:
                    doctorCode,
                doctorCode:
                    doctorCode,
            });
        }

        const doctorCode =
            await generateDoctorCode(
                hospitalId
            );

        return res.status(200).json({
            success: true,
            doctor_code:
                doctorCode,
            doctorCode:
                doctorCode,
        });
    } catch (error) {
        console.error(
            "GET NEXT DOCTOR CODE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate doctor code.",
        });
    }
};


/*
=========================================================
ADD DOCTOR
=========================================================
*/

const addDoctor = async (
    req,
    res
) => {
    let uploadedPhotoUrl = null;

    try {
        const isSuperAdmin =
            normalizeText(
                req.user?.role
            ).toLowerCase() ===
            SUPER_ADMIN;

        let hospitalId;

        /*
        -------------------------------------------------
        SUPER ADMIN
        -------------------------------------------------
        */

        if (isSuperAdmin) {
            hospitalId =
                normalizeId(
                    req.body.hospital_id
                );

            if (!hospitalId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Valid hospital_id is required.",
                });
            }
        } else {
            hospitalId =
                requireHospitalScope(
                    req,
                    res
                );

            if (
                hospitalId === undefined
            ) {
                return;
            }
        }

        const hospitalResult =
            await ensureActiveHospital(
                hospitalId
            );

        if (
            !hospitalResult.valid
        ) {
            return res.status(400).json({
                success: false,
                message:
                    hospitalResult.message,
            });
        }

        const {
            doctor_code,
            name,
            specialization,
            qualification,
            phone,
            email,
            experience_years,
            consultation_fee,
            department_id,
            status,
        } = req.body;

        const validation =
            validateDoctorInput({
                name,
                phone,
                email,
                experience_years,
                consultation_fee,
                status,
            });

        if (
            validation.errors.length
        ) {
            return res.status(400).json({
                success: false,
                message:
                    validation.errors[0],
                errors:
                    validation.errors,
            });
        }

        /*
        Login credentials email par bheje jate hain,
        isliye new doctor ke liye email zaroori hai.
        */
        if (!validation.data.email) {
            return res.status(400).json({
                success: false,
                message:
                    "Email is required to send login credentials.",
            });
        }

        const existingUser =
            await findUserByEmail(
                validation.data.email
            );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "A user with this email already exists.",
            });
        }

        const finalDoctorCode =
            normalizeText(
                doctor_code
            ) ||
            await generateDoctorCode(
                hospitalId
            );

        if (
            finalDoctorCode.length >
            20
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor code cannot exceed 20 characters.",
            });
        }

        /*
        -------------------------------------------------
        PHOTO
        -------------------------------------------------
        */

        if (req.file) {
            try {
                uploadedPhotoUrl =
                    await uploadDoctorPhoto(
                        req.file
                    );
            } catch (uploadError) {
                console.error(
                    "DOCTOR PHOTO UPLOAD ERROR:",
                    uploadError
                );

                if (
                    uploadError.message ===
                    "INVALID_DOCTOR_IMAGE_TYPE"
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Only JPG, JPEG, PNG and WEBP images are allowed.",
                    });
                }

                return res.status(500).json({
                    success: false,
                    message:
                        "Doctor photo upload failed.",
                });
            }
        }

        const doctorData = {
            doctor_code:
                finalDoctorCode,

            name:
                validation.data.name,

            photo:
                uploadedPhotoUrl,

            specialization:
                normalizeOptionalText(
                    specialization
                ),

            qualification:
                normalizeOptionalText(
                    qualification
                ),

            phone:
                validation.data.phone,

            email:
                validation.data.email,

            experience_years:
                validation.data
                    .experience_years,

            consultation_fee:
                validation.data
                    .consultation_fee,

            department_id:
                normalizeId(
                    department_id
                ),

            status:
                validation.data.status,
        };

        const result =
            await createDoctor(
                doctorData,
                hospitalId
            );

        /*
        -------------------------------------------------
        LOGIN ACCOUNT + CREDENTIALS EMAIL (PDF)
        -------------------------------------------------
        Doctor save ho chuka hai. Login ya mail me dikkat
        aaye to registration fail nahi hoti, sirf flags
        false aate hain.
        */

        let loginCreated = false;
        let mailSent = false;

        try {
            const tempPassword =
                generatePassword();

            const hashedPassword =
                await bcrypt.hash(
                    tempPassword,
                    10
                );

            const userResult =
                await createUser(
                    doctorData.name,
                    doctorData.email,
                    hashedPassword,
                    doctorData.phone,
                    "doctor",
                    null,
                    hospitalId
                );

            loginCreated = true;

            mailSent =
                await issueCredentials({
                    userId:
                        userResult.insertId,
                    name:
                        doctorData.name,
                    email:
                        doctorData.email,
                    role: "doctor",
                    password:
                        tempPassword,
                    hospitalId,
                    hospitalName:
                        hospitalResult
                            .hospital?.name,
                });
        } catch (loginError) {
            console.error(
                "DOCTOR LOGIN CREATE ERROR:",
                loginError
            );
        }

        return res.status(201).json({
            success: true,
            message:
                "Doctor added successfully.",
            loginCreated,
            mailSent,
            doctor: {
                id:
                    result.id,
                doctor_code:
                    result.doctor_code,
                hospital_id:
                    hospitalId,
                photo:
                    uploadedPhotoUrl,
            },
        });
    } catch (error) {
        console.error(
            "ADD DOCTOR ERROR:",
            error
        );

        if (
            error.code ===
                "ER_DUP_ENTRY" ||
            error.code === "1062"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Doctor code already exists.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to add doctor.",
        });
    }
};


/*
=========================================================
EDIT DOCTOR
=========================================================
*/

const editDoctor = async (
    req,
    res
) => {
    try {
        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (
            hospitalId === undefined
        ) {
            return;
        }

        const id =
            normalizeId(
                req.params.id
            );

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid doctor ID.",
            });
        }

        const existingDoctor =
            await getDoctorById(
                id,
                hospitalId
            );

        if (!existingDoctor) {
            return res.status(404).json({
                success: false,
                message:
                    "Doctor not found.",
            });
        }

        const {
            doctor_code,
            name,
            specialization,
            qualification,
            phone,
            email,
            experience_years,
            consultation_fee,
            department_id,
            status,
        } = req.body;

        const validation =
            validateDoctorInput({
                name,
                phone,
                email,
                experience_years,
                consultation_fee,
                status,
            });

        if (
            validation.errors.length
        ) {
            return res.status(400).json({
                success: false,
                message:
                    validation.errors[0],
                errors:
                    validation.errors,
            });
        }

        /*
        -------------------------------------------------
        PHOTO
        -------------------------------------------------

        No new photo:
            keep existing photo

        New photo:
            upload new photo
        -------------------------------------------------
        */

        let photoUrl =
            existingDoctor.photo ||
            null;

        if (req.file) {
            try {
                const uploadedPhoto =
                    await uploadDoctorPhoto(
                        req.file
                    );

                if (uploadedPhoto) {
                    photoUrl =
                        uploadedPhoto;
                }
            } catch (uploadError) {
                console.error(
                    "DOCTOR PHOTO UPLOAD ERROR:",
                    uploadError
                );

                if (
                    uploadError.message ===
                    "INVALID_DOCTOR_IMAGE_TYPE"
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Only JPG, JPEG, PNG and WEBP images are allowed.",
                    });
                }

                return res.status(500).json({
                    success: false,
                    message:
                        "Doctor photo upload failed.",
                });
            }
        }

        const finalDoctorCode =
            normalizeText(
                doctor_code
            ) ||
            existingDoctor.doctor_code;

        if (
            finalDoctorCode &&
            finalDoctorCode.length >
                20
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor code cannot exceed 20 characters.",
            });
        }

        const doctorData = {
            doctor_code:
                finalDoctorCode,

            name:
                validation.data.name,

            photo:
                photoUrl,

            specialization:
                normalizeOptionalText(
                    specialization
                ),

            qualification:
                normalizeOptionalText(
                    qualification
                ),

            phone:
                validation.data.phone,

            email:
                validation.data.email,

            experience_years:
                validation.data
                    .experience_years,

            consultation_fee:
                validation.data
                    .consultation_fee,

            department_id:
                normalizeId(
                    department_id
                ),

            status:
                validation.data.status,
        };

        const result =
            await updateDoctor(
                id,
                doctorData,
                hospitalId
            );

        if (
            !result ||
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Doctor not found or access denied.",
            });
        }

        const updatedDoctor =
            await getDoctorById(
                id,
                hospitalId
            );

        return res.status(200).json({
            success: true,
            message:
                "Doctor updated successfully.",
            doctor:
                updatedDoctor,
        });
    } catch (error) {
        console.error(
            "EDIT DOCTOR ERROR:",
            error
        );

        if (
            error.code ===
                "ER_DUP_ENTRY" ||
            error.code === "1062"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Doctor code already exists.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to update doctor.",
        });
    }
};


/*
=========================================================
DELETE DOCTOR
=========================================================
*/

const removeDoctor = async (
    req,
    res
) => {
    try {
        const hospitalId =
            requireHospitalScope(
                req,
                res
            );

        if (
            hospitalId === undefined
        ) {
            return;
        }

        const id =
            normalizeId(
                req.params.id
            );

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid doctor ID.",
            });
        }

        const existingDoctor =
            await getDoctorById(
                id,
                hospitalId
            );

        if (!existingDoctor) {
            return res.status(404).json({
                success: false,
                message:
                    "Doctor not found.",
            });
        }

        const result =
            await deleteDoctorById(
                id,
                hospitalId
            );

        if (
            !result ||
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Doctor not found or access denied.",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Doctor deleted successfully.",
        });
    } catch (error) {
        console.error(
            "REMOVE DOCTOR ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete doctor.",
        });
    }
};


/*
=========================================================
EXPORTS
=========================================================
*/

module.exports = {
    getDoctors,
    getDoctor,
    getNextDoctorCode,
    addDoctor,
    editDoctor,
    removeDoctor,
};