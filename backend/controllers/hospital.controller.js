const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const { pool } = require("../config/db");

/* =========================================================
   HOSPITAL MODEL
========================================================= */

const {
    createHospital: createHospitalModel,
    findHospitalById,
    findHospitalByName,
    findHospitalByNameExceptId,
    findAllHospitals,
    findActiveHospitals,
    searchHospitals: searchHospitalsModel,
    updateHospital: updateHospitalModel,
    updateHospitalStatus,
    updateHospitalBeds,
    deleteHospital: deleteHospitalModel,
    getHospitalStats,
} = require("../models/hospital.model");

/* =========================================================
   USER MODEL
========================================================= */

const {
    findUserByEmail,
    findAllUsers,
    updateUserPassword,
    deleteUserById,
} = require("../models/user.model");

/* =========================================================
   HOSPITAL CREDENTIAL SERVICE
========================================================= */

const {
    provisionHospitalAdmin,
    sendHospitalCredentialsEmail,
    createRegistrationCertificatePdf,
    formatHospitalCode,
    getHospitalLicenseNumber,
    getHospitalLicenseExpiry,
    toDateOnly,
} = require("../services/hospitalCredentials.service");

/* =========================================================
   WELCOME EMAIL (login details + certificate PDF from frontend)
========================================================= */

const {
    sendHospitalWelcomeEmail,
} = require("../services/hospitalWelcome.service");

/* =========================================================
   SMS SERVICE
========================================================= */

const {
    sendSMS,
} = require("../services/sms.service");

/* =========================================================
   HELPERS
========================================================= */

const normalizeEmail = (email) => {
    if (!email) {
        return "";
    }

    return String(email)
        .trim()
        .toLowerCase();
};

const cleanString = (value) => {
    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    const cleaned = String(value).trim();

    return cleaned || null;
};

/* =========================================================
   NORMALIZE HOSPITAL RESPONSE
========================================================= */

const normalizeHospitalResponse = (hospital) => {
    if (!hospital) {
        return hospital;
    }

    /*
     * License number is auto-generated (HMS-LIC-YYYY-NNNNNN) when it
     * was not entered manually. "Valid until" = registration date
     * + LICENSE_VALIDITY_YEARS (see hospitalCredentials.service.js).
     */
    const licenseNumber =
        getHospitalLicenseNumber(hospital) || null;

    const licenseExpiry =
        hospital.id !== undefined &&
            hospital.id !== null
            ? toDateOnly(
                getHospitalLicenseExpiry(hospital)
            ) || null
            : null;

    return {
        ...hospital,

        registrationNumber:
            hospital.registration_number ?? null,

        licenseNumber,

        licenceNumber:
            licenseNumber,

        license_number:
            licenseNumber,

        licenseExpiry,

        license_expiry:
            licenseExpiry,

        licenseValidUntil:
            licenseExpiry,
    };
};

const normalizeHospitalsResponse = (hospitals) => {
    if (!Array.isArray(hospitals)) {
        return [];
    }

    return hospitals.map(
        normalizeHospitalResponse
    );
};

/* =========================================================
   ENSURE LICENSE NUMBER IS SAVED IN DATABASE
   (auto-generated when missing, e.g. old hospitals)
========================================================= */

const ensureHospitalLicenseNumber = async (
    hospital
) => {
    if (
        !hospital ||
        cleanString(hospital.license_number)
    ) {
        return hospital;
    }

    const license_number =
        getHospitalLicenseNumber(hospital);

    if (!license_number) {
        return hospital;
    }

    try {
        await updateHospitalModel(
            hospital.id,
            {
                name: hospital.name,
                address: hospital.address,
                city: hospital.city,
                state: hospital.state,
                district: hospital.district,
                country: hospital.country,
                pincode: hospital.pincode,
                registration_number:
                    hospital.registration_number,
                license_number,
                tagline: hospital.tagline,
                location: hospital.location,
                phone: hospital.phone,
                email: hospital.email,
                image_url: hospital.image_url,
                logo_url: hospital.logo_url,
                total_beds: Number(
                    hospital.total_beds || 0
                ),
                available_beds: Number(
                    hospital.available_beds || 0
                ),
                status:
                    hospital.status || "active",
                latitude: hospital.latitude,
                longitude: hospital.longitude,
            }
        );
    } catch (licenseSaveError) {
        console.error(
            "License number save error:",
            licenseSaveError
        );
    }

    hospital.license_number = license_number;

    return hospital;
};

/* =========================================================
   VALIDATE EMAIL
========================================================= */

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
};

/* =========================================================
   VALIDATE ID
========================================================= */

const isValidId = (id) => {
    return (
        id !== undefined &&
        id !== null &&
        String(id).trim() !== "" &&
        !Number.isNaN(Number(id))
    );
};

/* =========================================================
   GENERATE TEMPORARY PASSWORD
========================================================= */

const generateTemporaryPassword = (
    length = 12
) => {
    const upper =
        "ABCDEFGHJKLMNPQRSTUVWXYZ";

    const lower =
        "abcdefghijkmnopqrstuvwxyz";

    const numbers =
        "23456789";

    const special =
        "@#$%";

    const all =
        upper +
        lower +
        numbers +
        special;

    const chars = [
        upper[
        crypto.randomInt(
            0,
            upper.length
        )
        ],
        lower[
        crypto.randomInt(
            0,
            lower.length
        )
        ],
        numbers[
        crypto.randomInt(
            0,
            numbers.length
        )
        ],
        special[
        crypto.randomInt(
            0,
            special.length
        )
        ],
    ];

    while (chars.length < length) {
        chars.push(
            all[
            crypto.randomInt(
                0,
                all.length
            )
            ]
        );
    }

    for (
        let i = chars.length - 1;
        i > 0;
        i -= 1
    ) {
        const j = crypto.randomInt(
            i + 1
        );

        [
            chars[i],
            chars[j],
        ] = [
                chars[j],
                chars[i],
            ];
    }

    return chars.join("");
};

/* =========================================================
   GENERATE HMS REGISTRATION NUMBER
========================================================= */

const generateHospitalRegistrationNumber = (
    hospitalId
) => {
    const year =
        new Date().getFullYear();

    const numericId =
        Number(hospitalId);

    if (
        !Number.isFinite(
            numericId
        )
    ) {
        throw new Error(
            "Valid hospital ID is required to generate registration number"
        );
    }

    return `HMS-REG-${year}-${String(
        numericId
    ).padStart(6, "0")}`;
};

/* =========================================================
   GET HOSPITAL ADMIN
========================================================= */

const getHospitalAdmin = async (
    hospitalId
) => {
    const users =
        await findAllUsers(
            hospitalId
        );

    if (!Array.isArray(users)) {
        return null;
    }

    return (
        users.find(
            (user) =>
                String(
                    user.role || ""
                )
                    .trim()
                    .toLowerCase() ===
                "hospital_admin" &&
                Number(
                    user.hospital_id ??
                    user.hospitalId
                ) ===
                Number(hospitalId)
        ) || null
    );
};

/* =========================================================
   FORCE PASSWORD CHANGE ON NEXT LOGIN
   (temporary passwords are sent by Email/SMS, so the admin
   must replace them at first login)
========================================================= */

const flagMustChangePassword = async (userId) => {
    if (!userId) {
        return;
    }

    try {
        await pool.query(
            "UPDATE users SET must_change_password = 1 WHERE id = ?",
            [Number(userId)]
        );
    } catch (error) {
        // Column not migrated yet: do not break registration / reset
        console.error(
            "flagMustChangePassword error:",
            error?.code || error?.message
        );
    }
};

/* =========================================================
   CLEANUP OLD HOSPITAL ADMIN
========================================================= */

const cleanupExistingHospitalAdmin =
    async (existingUser) => {
        if (!existingUser) {
            return {
                cleaned: false,
                reason: "not_found",
            };
        }

        const existingRole =
            String(
                existingUser.role || ""
            )
                .trim()
                .toLowerCase();

        if (
            existingRole !==
            "hospital_admin"
        ) {
            return {
                cleaned: false,
                reason: "protected_user",
            };
        }

        const existingHospitalId =
            existingUser.hospital_id ??
            existingUser.hospitalId ??
            null;

        if (!existingHospitalId) {
            await deleteUserById(
                existingUser.id
            );

            return {
                cleaned: true,
                reason: "orphan_admin",
            };
        }

        const existingHospital =
            await findHospitalById(
                existingHospitalId
            );

        if (!existingHospital) {
            await deleteUserById(
                existingUser.id
            );

            return {
                cleaned: true,
                reason: "missing_hospital",
            };
        }

        const existingStatus =
            String(
                existingHospital.status ||
                "active"
            )
                .trim()
                .toLowerCase();

        const inactiveStatuses = [
            "inactive",
            "disabled",
            "deleted",
            "deactivated",
        ];

        if (
            inactiveStatuses.includes(
                existingStatus
            )
        ) {
            await deleteUserById(
                existingUser.id
            );

            return {
                cleaned: true,
                reason: "inactive_hospital",
            };
        }

        return {
            cleaned: false,
            reason: "active_hospital",
            hospital: existingHospital,
        };
    };

/* =========================================================
   GET REGISTRATION NUMBER FROM REQUEST
========================================================= */

const getRegistrationNumber = (
    body
) => {
    return cleanString(
        body?.registrationNumber ??
        body?.registration_number ??
        body?.registrationNo ??
        body?.registration_no ??
        body?.hospitalRegistrationNumber ??
        body?.hospital_registration_number ??
        body?.hospitalRegistrationNo ??
        body?.hospital_registration_no ??
        body?.hospitalRegNo ??
        body?.hospital_reg_no ??
        body?.regNumber ??
        body?.reg_number ??
        body?.regNo ??
        body?.reg_no ??
        body?.registrationId ??
        body?.registration_id ??
        body?.registrationCode ??
        body?.registration_code
    );
};

/* =========================================================
   GET LICENSE NUMBER FROM REQUEST
========================================================= */

const getLicenseNumber = (
    body
) => {
    return cleanString(
        body?.licenseNumber ??
        body?.license_number ??
        body?.licenseNo ??
        body?.license_no ??
        body?.licenceNumber ??
        body?.licence_number ??
        body?.licenceNo ??
        body?.licence_no ??
        body?.license ??
        body?.licence
    );
};

/* =========================================================
   GET ALL HOSPITALS
========================================================= */

/* Image columns model ke SELECT me nahi aate, isliye list me alag se merge karte hain */
const attachHospitalImages = async (list) => {
    if (!Array.isArray(list) || list.length === 0) return list;

    const [rows] = await pool.query(
        `SELECT id, login_background_image, logo_url, signature,
                stamp, seal, verified_sticker
         FROM hospitals`
    );

    const byId = new Map(rows.map((r) => [String(r.id), r]));

    return list.map((h) => ({
        ...h,
        ...(byId.get(String(h.id)) || {}),
    }));
};

const getAllHospitals = async (
    req,
    res
) => {
    try {
        const hospitals =
            await attachHospitalImages(
                await findAllHospitals()
            );

        const normalizedHospitals =
            normalizeHospitalsResponse(
                hospitals
            );

        return res.status(200).json({
            success: true,
            message:
                "Hospitals fetched successfully",
            hospitals:
                normalizedHospitals,
            data:
                normalizedHospitals,
        });
    } catch (error) {
        console.error(
            "Get all hospitals error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch hospitals",
            error:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined,
        });
    }
};

/* =========================================================
   GET ACTIVE HOSPITALS
========================================================= */

const getActiveHospitals = async (
    req,
    res
) => {
    try {
        const hospitals =
            await attachHospitalImages(
                await findActiveHospitals()
            );

        const normalizedHospitals =
            normalizeHospitalsResponse(
                hospitals
            );

        return res.status(200).json({
            success: true,
            message:
                "Active hospitals fetched successfully",
            hospitals:
                normalizedHospitals,
            data:
                normalizedHospitals,
        });
    } catch (error) {
        console.error(
            "Get active hospitals error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch active hospitals",
            error:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined,
        });
    }
};

/* =========================================================
   SEARCH HOSPITALS
========================================================= */

const searchHospitals = async (
    req,
    res
) => {
    try {
        const search =
            req.query.q ??
            req.query.search ??
            req.query.keyword ??
            "";

        const keyword =
            String(search).trim();

        if (!keyword) {
            const hospitals =
                await findAllHospitals();

            const normalizedHospitals =
                normalizeHospitalsResponse(
                    hospitals
                );

            return res.status(200).json({
                success: true,
                message:
                    "Hospitals fetched successfully",
                hospitals:
                    normalizedHospitals,
                data:
                    normalizedHospitals,
            });
        }

        const hospitals =
            await searchHospitalsModel(
                keyword
            );

        const normalizedHospitals =
            normalizeHospitalsResponse(
                hospitals
            );

        return res.status(200).json({
            success: true,
            message:
                "Hospital search completed",
            hospitals:
                normalizedHospitals,
            data:
                normalizedHospitals,
        });
    } catch (error) {
        console.error(
            "Search hospitals error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to search hospitals",
            error:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined,
        });
    }
};

/* =========================================================
   GET HOSPITAL BY ID
========================================================= */

const getHospitalById = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid hospital ID is required",
            });
        }

        const hospital =
            await findHospitalById(id);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message:
                    "Hospital not found",
            });
        }

        const normalizedHospital =
            normalizeHospitalResponse(
                hospital
            );

        return res.status(200).json({
            success: true,
            message:
                "Hospital fetched successfully",
            hospital:
                normalizedHospital,
            data:
                normalizedHospital,
        });
    } catch (error) {
        console.error(
            "Get hospital by ID error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch hospital",
            error:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined,
        });
    }
};

/* =========================================================
   CREATE HOSPITAL
   Email is NOT sent here. Frontend generates the certificate
   and calls POST /hospitals/:id/send-welcome.
========================================================= */

const createHospital = async (
    req,
    res
) => {
    let createdHospitalId = null;

    try {
        if (
            !req.user ||
            req.user.role !==
            "super_admin"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only Super Admin can create a hospital",
            });
        }

        const body =
            req.body || {};

        const name =
            cleanString(
                body.name ??
                body.hospitalName ??
                body.hospital_name
            );

        const address =
            cleanString(body.address);

        const city =
            cleanString(body.city);

        const state =
            cleanString(body.state);

        const district =
            cleanString(body.district);

        const country =
            cleanString(body.country);

        const pincode =
            cleanString(
                body.pincode ??
                body.pinCode ??
                body.postal_code
            );

        const requestedRegistrationNumber =
            getRegistrationNumber(body);

        const license_number =
            getLicenseNumber(body);

        const tagline = null;

        const location =
            cleanString(
                body.location
            ) ||
            [
                address,
                city,
                district,
                state,
                country,
                pincode,
            ]
                .filter(Boolean)
                .join(", ") ||
            null;

        const phone =
            cleanString(
                body.phone ??
                body.phoneNumber ??
                body.mobile
            );

        const email =
            normalizeEmail(
                body.email ??
                body.hospitalEmail ??
                body.hospital_email
            );

        const image_url =
            cleanString(
                body.image_url ??
                body.imageUrl ??
                body.image
            );

        const logo_url =
            cleanString(
                body.logo_url ??
                body.logoUrl ??
                body.logo
            );

        const total_beds =
            Number.isFinite(
                Number(
                    body.total_beds ??
                    body.totalBeds ??
                    0
                )
            )
                ? Number(
                    body.total_beds ??
                    body.totalBeds ??
                    0
                )
                : 0;

        const available_beds =
            Number.isFinite(
                Number(
                    body.available_beds ??
                    body.availableBeds ??
                    0
                )
            )
                ? Number(
                    body.available_beds ??
                    body.availableBeds ??
                    0
                )
                : 0;

        const status =
            cleanString(
                body.status
            ) || "active";

        const latitude =
            body.latitude !==
                undefined &&
                body.latitude !== null &&
                body.latitude !== ""
                ? Number(
                    body.latitude
                )
                : null;

        const longitude =
            body.longitude !==
                undefined &&
                body.longitude !== null &&
                body.longitude !== ""
                ? Number(
                    body.longitude
                )
                : null;

        if (!name) {
            return res.status(400).json({
                success: false,
                message:
                    "Hospital name is required",
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message:
                    "Hospital email is required",
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid hospital email",
            });
        }

        if (
            total_beds < 0 ||
            available_beds < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Bed values cannot be negative",
            });
        }

        if (
            available_beds >
            total_beds
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Available beds cannot be greater than total beds",
            });
        }

        const existingHospital =
            await findHospitalByName(name);

        if (existingHospital) {
            return res.status(409).json({
                success: false,
                message:
                    "A hospital with this name already exists",
                hospital:
                    normalizeHospitalResponse(
                        existingHospital
                    ),
            });
        }

        const existingUser =
            await findUserByEmail(email);

        if (existingUser) {
            const cleanupResult =
                await cleanupExistingHospitalAdmin(
                    existingUser
                );

            if (
                !cleanupResult.cleaned &&
                cleanupResult.reason ===
                "protected_user"
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This email is already registered with another user account.",
                });
            }

            if (
                !cleanupResult.cleaned &&
                cleanupResult.reason ===
                "active_hospital"
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This email is already registered as a Hospital Admin for another active hospital.",
                    hospital:
                        cleanupResult.hospital
                            ? normalizeHospitalResponse(
                                cleanupResult.hospital
                            )
                            : null,
                });
            }
        }

        const result =
            await createHospitalModel({
                name,
                address,
                city,
                location,
                phone,
                email,
                image_url,
                logo_url,
                total_beds,
                available_beds,
                status,
                latitude,
                longitude,
                state,
                district,
                country,
                pincode,
                registration_number:
                    requestedRegistrationNumber,
                license_number,
                tagline,
            });

        createdHospitalId =
            result.insertId;

        if (!createdHospitalId) {
            throw new Error(
                "Hospital was not created because database did not return insertId"
            );
        }

        let registration_number =
            requestedRegistrationNumber;

        if (!registration_number) {
            registration_number =
                generateHospitalRegistrationNumber(
                    createdHospitalId
                );
        }

        let hospital =
            await findHospitalById(
                createdHospitalId
            );

        if (!hospital) {
            throw new Error(
                "Hospital was created but could not be fetched"
            );
        }

        if (
            hospital.registration_number !==
            registration_number ||
            !cleanString(
                hospital.license_number
            )
        ) {
            await updateHospitalModel(
                createdHospitalId,
                {
                    name:
                        hospital.name,
                    address:
                        hospital.address,
                    city:
                        hospital.city,
                    state:
                        hospital.state,
                    district:
                        hospital.district,
                    country:
                        hospital.country,
                    pincode:
                        hospital.pincode,
                    registration_number,
                    license_number:
                        getHospitalLicenseNumber(
                            hospital
                        ),
                    tagline:
                        hospital.tagline ??
                        tagline,
                    location:
                        hospital.location,
                    phone:
                        hospital.phone,
                    email:
                        hospital.email,
                    image_url:
                        hospital.image_url,
                    logo_url:
                        hospital.logo_url,
                    total_beds:
                        Number(
                            hospital.total_beds ||
                            0
                        ),
                    available_beds:
                        Number(
                            hospital.available_beds ||
                            0
                        ),
                    status:
                        hospital.status ||
                        status,
                    latitude:
                        hospital.latitude,
                    longitude:
                        hospital.longitude,
                }
            );

            hospital =
                await findHospitalById(
                    createdHospitalId
                );
        }

        let credentials;

        try {
            credentials =
                await provisionHospitalAdmin({
                    hospitalId:
                        createdHospitalId,
                    hospitalName:
                        hospital.name,
                    email:
                        hospital.email,
                    phone:
                        hospital.phone,
                });

            const provisionedAdmin =
                await getHospitalAdmin(
                    createdHospitalId
                );

            if (provisionedAdmin) {
                await flagMustChangePassword(
                    provisionedAdmin.id
                );
            }
        } catch (provisionError) {
            console.error(
                "Hospital Admin provisioning error:",
                provisionError
            );

            try {
                await deleteHospitalModel(
                    createdHospitalId
                );
            } catch (
            rollbackError
            ) {
                console.error(
                    "Hospital rollback error:",
                    rollbackError
                );
            }

            createdHospitalId = null;

            return res.status(500).json({
                success: false,
                message:
                    "Hospital could not be created because Hospital Admin account creation failed",
                error:
                    process.env.NODE_ENV ===
                        "development"
                        ? provisionError.message
                        : undefined,
            });
        }

        const hospitalCode =
            formatHospitalCode(
                createdHospitalId
            );

        const normalizedHospital =
            normalizeHospitalResponse(
                hospital
            );

        const loginUrl =
            credentials.loginUrl ||
            `${process.env.FRONTEND_URL ||
            "http://localhost:5173"
            }/login`;

        return res.status(201).json({
            success: true,
            message:
                "Hospital created successfully. Send the login details and certificate from the dashboard.",
            hospital:
                normalizedHospital,
            registrationNumber:
                normalizedHospital.registrationNumber,
            licenseNumber:
                normalizedHospital.licenseNumber,
            credentials: {
                hospitalId:
                    credentials.hospitalCode ||
                    hospitalCode,
                loginEmail:
                    credentials.loginEmail ||
                    email,
                password:
                    credentials.password,
                loginUrl,
            },
            emailSent: false,
        });
    } catch (error) {
        console.error(
            "===================================="
        );

        console.error(
            "CREATE HOSPITAL ERROR"
        );

        console.error(
            "Message:",
            error?.message
        );

        console.error(
            "Code:",
            error?.code
        );

        console.error(
            "SQL State:",
            error?.sqlState
        );

        console.error(
            "SQL Message:",
            error?.sqlMessage
        );

        console.error(
            "Stack:",
            error?.stack
        );

        console.error(
            "===================================="
        );

        if (createdHospitalId) {
            try {
                await deleteHospitalModel(
                    createdHospitalId
                );
            } catch (
            rollbackError
            ) {
                console.error(
                    "Create hospital rollback error:",
                    rollbackError
                );
            }
        }

        return res.status(500).json({
            success: false,
            message:
                error?.sqlMessage ||
                error?.message ||
                "Failed to create hospital",
            error:
                process.env.NODE_ENV ===
                    "development"
                    ? {
                        message:
                            error?.message,
                        code:
                            error?.code,
                        sqlState:
                            error?.sqlState,
                        sqlMessage:
                            error?.sqlMessage,
                    }
                    : undefined,
        });
    }
};

/* =========================================================
   SEND WELCOME EMAIL
   Login details + certificate PDF (generated by frontend,
   same design as Super Admin screen).
   POST /api/hospitals/:id/send-welcome
========================================================= */

const sendHospitalWelcome = async (
    req,
    res
) => {
    try {
        if (
            !req.user ||
            req.user.role !==
            "super_admin"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only Super Admin can send hospital welcome email",
            });
        }

        const { id } =
            req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid hospital ID is required",
            });
        }

        const {
            certificatePdfBase64,
            password,
        } = req.body || {};

        if (
            !certificatePdfBase64 ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "certificatePdfBase64 and password are required",
            });
        }

        const hospital =
            await findHospitalById(id);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message:
                    "Hospital not found",
            });
        }

        const hospitalAdmin =
            await getHospitalAdmin(id);

        const normalized =
            normalizeHospitalResponse(
                hospital
            );

        const emailSent =
            await sendHospitalWelcomeEmail({
                to: hospital.email,
                hospitalName:
                    hospital.name,
                hospitalCode:
                    formatHospitalCode(
                        hospital.id
                    ),
                regNo:
                    hospital.registration_number,
                licenseNo:
                    normalized.licenseNumber,
                loginEmail:
                    hospitalAdmin?.email ||
                    hospital.email,
                password,
                loginUrl: `${process.env
                    .FRONTEND_URL ||
                    "http://localhost:5173"
                    }/login`,
                certificatePdf:
                    Buffer.from(
                        certificatePdfBase64,
                        "base64"
                    ),
            });

        return res.status(200).json({
            success: emailSent,
            emailSent,
            message: emailSent
                ? "Login details and certificate sent by email"
                : "Email could not be sent",
        });
    } catch (error) {
        console.error(
            "Send hospital welcome error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to send welcome email",
        });
    }
};

/* =========================================================
   UPDATE HOSPITAL
========================================================= */

const updateHospital = async (
    req,
    res
) => {
    try {
        if (
            !req.user ||
            req.user.role !==
            "super_admin"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only Super Admin can update a hospital",
            });
        }

        const { id } =
            req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid hospital ID is required",
            });
        }

        const existingHospital =
            await findHospitalById(id);

        if (!existingHospital) {
            return res.status(404).json({
                success: false,
                message:
                    "Hospital not found",
            });
        }

        const body =
            req.body || {};

        const name =
            cleanString(
                body.name ??
                body.hospitalName ??
                body.hospital_name ??
                existingHospital.name
            );

        if (!name) {
            return res.status(400).json({
                success: false,
                message:
                    "Hospital name is required",
            });
        }

        const duplicate =
            await findHospitalByNameExceptId(
                name,
                id
            );

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message:
                    "Another hospital with this name already exists",
            });
        }

        const address =
            cleanString(
                body.address ??
                existingHospital.address
            );

        const city =
            cleanString(
                body.city ??
                existingHospital.city
            );

        const state =
            cleanString(
                body.state ??
                existingHospital.state
            );

        const district =
            cleanString(
                body.district ??
                existingHospital.district
            );

        const country =
            cleanString(
                body.country ??
                existingHospital.country
            );

        const pincode =
            cleanString(
                body.pincode ??
                body.pinCode ??
                body.postal_code ??
                existingHospital.pincode
            );

        let registration_number;

        const registrationWasProvided =
            body.registrationNumber !==
            undefined ||
            body.registration_number !==
            undefined ||
            body.registrationNo !==
            undefined ||
            body.registration_no !==
            undefined ||
            body.hospitalRegistrationNumber !==
            undefined ||
            body.hospital_registration_number !==
            undefined ||
            body.hospitalRegistrationNo !==
            undefined ||
            body.hospital_registration_no !==
            undefined ||
            body.hospitalRegNo !==
            undefined ||
            body.hospital_reg_no !==
            undefined ||
            body.regNumber !==
            undefined ||
            body.reg_number !==
            undefined ||
            body.regNo !==
            undefined ||
            body.reg_no !==
            undefined ||
            body.registrationId !==
            undefined ||
            body.registration_id !==
            undefined ||
            body.registrationCode !==
            undefined ||
            body.registration_code !==
            undefined;

        if (registrationWasProvided) {
            registration_number =
                getRegistrationNumber(
                    body
                );
        } else {
            registration_number =
                cleanString(
                    existingHospital.registration_number
                );
        }

        if (!registration_number) {
            registration_number =
                generateHospitalRegistrationNumber(
                    id
                );
        }

        const licenseWasProvided =
            body.licenseNumber !==
            undefined ||
            body.license_number !==
            undefined ||
            body.licenseNo !==
            undefined ||
            body.license_no !==
            undefined ||
            body.licenceNumber !==
            undefined ||
            body.licence_number !==
            undefined ||
            body.licenceNo !==
            undefined ||
            body.licence_no !==
            undefined ||
            body.license !==
            undefined ||
            body.licence !==
            undefined;

        const license_number =
            licenseWasProvided
                ? getLicenseNumber(
                    body
                )
                : cleanString(
                    existingHospital.license_number
                );

        const tagline =
            cleanString(
                existingHospital.tagline
            );

        const location =
            cleanString(
                body.location ??
                existingHospital.location
            ) ||
            [
                address,
                city,
                district,
                state,
                country,
                pincode,
            ]
                .filter(Boolean)
                .join(", ") ||
            null;

        const phone =
            cleanString(
                body.phone ??
                body.phoneNumber ??
                body.mobile ??
                existingHospital.phone
            );

        const email =
            normalizeEmail(
                body.email ??
                body.hospitalEmail ??
                body.hospital_email ??
                existingHospital.email
            );

        if (!email) {
            return res.status(400).json({
                success: false,
                message:
                    "Hospital email is required",
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid hospital email",
            });
        }

        const existingUser =
            await findUserByEmail(email);

        if (existingUser) {
            const existingUserHospitalId =
                existingUser.hospital_id ??
                existingUser.hospitalId ??
                null;

            if (
                String(
                    existingUserHospitalId
                ) !== String(id)
            ) {
                const cleanupResult =
                    await cleanupExistingHospitalAdmin(
                        existingUser
                    );

                if (
                    !cleanupResult.cleaned
                ) {
                    return res.status(409).json({
                        success: false,
                        message:
                            cleanupResult.reason ===
                                "active_hospital"
                                ? "This email is already registered to another active hospital"
                                : "This email is already registered to another user",
                    });
                }
            }
        }

        const image_url =
            cleanString(
                body.image_url ??
                body.imageUrl ??
                body.image ??
                existingHospital.image_url
            );

        const logo_url =
            cleanString(
                body.logo_url ??
                body.logoUrl ??
                body.logo ??
                existingHospital.logo_url
            );

        const total_beds =
            Number.isFinite(
                Number(
                    body.total_beds ??
                    body.totalBeds ??
                    existingHospital.total_beds ??
                    0
                )
            )
                ? Number(
                    body.total_beds ??
                    body.totalBeds ??
                    existingHospital.total_beds ??
                    0
                )
                : 0;

        const available_beds =
            Number.isFinite(
                Number(
                    body.available_beds ??
                    body.availableBeds ??
                    existingHospital.available_beds ??
                    0
                )
            )
                ? Number(
                    body.available_beds ??
                    body.availableBeds ??
                    existingHospital.available_beds ??
                    0
                )
                : 0;

        const status =
            cleanString(
                body.status
            ) ||
            cleanString(
                existingHospital.status
            ) ||
            "active";

        const latitude =
            body.latitude !==
                undefined &&
                body.latitude !== null &&
                body.latitude !== ""
                ? Number(
                    body.latitude
                )
                : existingHospital.latitude ??
                null;

        const longitude =
            body.longitude !==
                undefined &&
                body.longitude !== null &&
                body.longitude !== ""
                ? Number(
                    body.longitude
                )
                : existingHospital.longitude ??
                null;

        if (
            total_beds < 0 ||
            available_beds < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Bed values cannot be negative",
            });
        }

        if (
            available_beds >
            total_beds
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Available beds cannot be greater than total beds",
            });
        }

        const result =
            await updateHospitalModel(
                id,
                {
                    name,
                    address,
                    city,
                    location,
                    phone,
                    email,
                    image_url,
                    logo_url,
                    total_beds,
                    available_beds,
                    status,
                    latitude,
                    longitude,
                    state,
                    district,
                    country,
                    pincode,
                    registration_number,
                    license_number,
                    tagline,
                }
            );

        const hospital =
            await findHospitalById(id);

        const normalizedHospital =
            normalizeHospitalResponse(
                hospital
            );

        return res.status(200).json({
            success: true,
            message:
                "Hospital updated successfully",
            hospital:
                normalizedHospital,
            data:
                normalizedHospital,
            registrationNumber:
                normalizedHospital?.registrationNumber ??
                registration_number,
            licenseNumber:
                normalizedHospital?.licenseNumber ??
                license_number,
            affectedRows:
                result?.affectedRows ?? 0,
        });
    } catch (error) {
        console.error(
            "Update hospital error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.sqlMessage ||
                error?.message ||
                "Failed to update hospital",
        });
    }
};

/* =========================================================
   UPDATE HOSPITAL STATUS
========================================================= */

const changeHospitalStatus = async (
    req,
    res
) => {
    try {
        if (
            !req.user ||
            req.user.role !==
            "super_admin"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only Super Admin can change hospital status",
            });
        }

        const { id } =
            req.params;

        const status =
            cleanString(
                req.body?.status
            );

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid hospital ID is required",
            });
        }

        if (
            !status ||
            ![
                "active",
                "inactive",
            ].includes(
                status.toLowerCase()
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be active or inactive",
            });
        }

        const hospital =
            await findHospitalById(id);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message:
                    "Hospital not found",
            });
        }

        await updateHospitalStatus(
            id,
            status.toLowerCase()
        );

        const updatedHospital =
            await findHospitalById(id);

        const normalizedHospital =
            normalizeHospitalResponse(
                updatedHospital
            );

        return res.status(200).json({
            success: true,
            message:
                "Hospital status updated successfully",
            hospital:
                normalizedHospital,
            data:
                normalizedHospital,
        });
    } catch (error) {
        console.error(
            "Change hospital status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.sqlMessage ||
                error?.message ||
                "Failed to update hospital status",
        });
    }
};

/* =========================================================
   UPDATE HOSPITAL BEDS
========================================================= */

const changeHospitalBeds = async (
    req,
    res
) => {
    try {
        if (
            !req.user ||
            req.user.role !==
            "super_admin"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only Super Admin can update hospital beds",
            });
        }

        const { id } =
            req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid hospital ID is required",
            });
        }

        const totalBeds =
            Number(
                req.body?.totalBeds ??
                req.body?.total_beds
            );

        const availableBeds =
            Number(
                req.body?.availableBeds ??
                req.body?.available_beds
            );

        if (
            !Number.isFinite(
                totalBeds
            ) ||
            !Number.isFinite(
                availableBeds
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid totalBeds and availableBeds are required",
            });
        }

        if (
            totalBeds < 0 ||
            availableBeds < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Bed values cannot be negative",
            });
        }

        if (
            availableBeds >
            totalBeds
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Available beds cannot be greater than total beds",
            });
        }

        const hospital =
            await findHospitalById(id);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message:
                    "Hospital not found",
            });
        }

        await updateHospitalBeds(
            id,
            totalBeds,
            availableBeds
        );

        const updatedHospital =
            await findHospitalById(id);

        const normalizedHospital =
            normalizeHospitalResponse(
                updatedHospital
            );

        return res.status(200).json({
            success: true,
            message:
                "Hospital beds updated successfully",
            hospital:
                normalizedHospital,
            data:
                normalizedHospital,
        });
    } catch (error) {
        console.error(
            "Change hospital beds error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.sqlMessage ||
                error?.message ||
                "Failed to update hospital beds",
        });
    }
};

/* =========================================================
   GET HOSPITAL STATS
========================================================= */

const getStats = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid hospital ID is required",
            });
        }

        const hospital =
            await findHospitalById(id);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message:
                    "Hospital not found",
            });
        }

        const stats =
            await getHospitalStats(id);

        return res.status(200).json({
            success: true,
            message:
                "Hospital statistics fetched successfully",
            hospital:
                normalizeHospitalResponse(
                    hospital
                ),
            stats,
            data:
                stats,
        });
    } catch (error) {
        console.error(
            "Get hospital stats error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.sqlMessage ||
                error?.message ||
                "Failed to fetch hospital statistics",
        });
    }
};

/* =========================================================
   REGISTRATION CERTIFICATE (print page)
========================================================= */

const printHospitalCertificate =
    async (
        req,
        res
    ) => {
        try {
            if (
                !req.user ||
                req.user.role !==
                "super_admin"
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Only Super Admin can print hospital certificates",
                });
            }

            const { id } =
                req.params;

            if (!isValidId(id)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Valid hospital ID is required",
                });
            }

            const hospital =
                await findHospitalById(id);

            if (!hospital) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hospital not found",
                });
            }

            if (
                !cleanString(
                    hospital.registration_number
                )
            ) {
                const generatedRegistrationNumber =
                    generateHospitalRegistrationNumber(
                        hospital.id
                    );

                await updateHospitalModel(
                    hospital.id,
                    {
                        name:
                            hospital.name,
                        address:
                            hospital.address,
                        city:
                            hospital.city,
                        state:
                            hospital.state,
                        district:
                            hospital.district,
                        country:
                            hospital.country,
                        pincode:
                            hospital.pincode,
                        registration_number:
                            generatedRegistrationNumber,
                        license_number:
                            hospital.license_number,
                        tagline:
                            hospital.tagline,
                        location:
                            hospital.location,
                        phone:
                            hospital.phone,
                        email:
                            hospital.email,
                        image_url:
                            hospital.image_url,
                        logo_url:
                            hospital.logo_url,
                        total_beds:
                            Number(
                                hospital.total_beds ||
                                0
                            ),
                        available_beds:
                            Number(
                                hospital.available_beds ||
                                0
                            ),
                        status:
                            hospital.status ||
                            "active",
                        latitude:
                            hospital.latitude,
                        longitude:
                            hospital.longitude,
                    }
                );

                const refreshedHospital =
                    await findHospitalById(
                        hospital.id
                    );

                if (refreshedHospital) {
                    Object.assign(
                        hospital,
                        refreshedHospital
                    );
                }
            }

            await ensureHospitalLicenseNumber(
                hospital
            );

            const hospitalCode =
                formatHospitalCode(
                    hospital.id
                );

            const pdfBuffer =
                await createRegistrationCertificatePdf(
                    {
                        hospital,
                        hospitalCode,
                    }
                );

            res.setHeader(
                "Content-Type",
                "application/pdf"
            );

            res.setHeader(
                "Content-Disposition",
                `inline; filename="Hospital_Registration_Certificate_${hospital.id}.pdf"`
            );

            res.setHeader(
                "Content-Length",
                pdfBuffer.length
            );

            return res.send(
                pdfBuffer
            );
        } catch (error) {
            console.error(
                "Print hospital certificate error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error?.message ||
                    "Failed to generate hospital registration certificate",
            });
        }
    };

/* =========================================================
   RESET HOSPITAL ADMIN PASSWORD
========================================================= */

const resetHospitalAdminPassword =
    async (
        req,
        res
    ) => {
        try {
            if (
                !req.user ||
                req.user.role !==
                "super_admin"
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Only Super Admin can reset Hospital Admin password",
                });
            }

            const { id } =
                req.params;

            if (!isValidId(id)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Valid hospital ID is required",
                });
            }

            const hospital =
                await findHospitalById(id);

            if (!hospital) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hospital not found",
                });
            }

            await ensureHospitalLicenseNumber(
                hospital
            );

            const hospitalAdmin =
                await getHospitalAdmin(id);

            if (!hospitalAdmin) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hospital Admin account not found for this hospital",
                });
            }

            const temporaryPassword =
                generateTemporaryPassword(
                    12
                );

            const hashedPassword =
                await bcrypt.hash(
                    temporaryPassword,
                    12
                );

            await updateUserPassword(
                hospitalAdmin.id,
                hashedPassword
            );

            await flagMustChangePassword(
                hospitalAdmin.id
            );

            let emailSent = false;

            try {
                emailSent =
                    await sendHospitalCredentialsEmail(
                        {
                            hospitalId:
                                hospital.id,
                            hospitalName:
                                hospital.name,
                            hospitalCode:
                                formatHospitalCode(
                                    hospital.id
                                ),
                            loginEmail:
                                hospitalAdmin.email,
                            password:
                                temporaryPassword,
                            loginUrl:
                                `${process.env
                                    .FRONTEND_URL ||
                                "http://localhost:5173"
                                }/login`,
                            hospital,
                            isPasswordReset:
                                true,
                        }
                    );
            } catch (
            emailError
            ) {
                console.error(
                    "Reset password email error:",
                    emailError
                );

                emailSent = false;
            }

            const normalizedHospital =
                normalizeHospitalResponse(
                    hospital
                );

            return res.status(200).json({
                success: true,
                message: emailSent
                    ? "Hospital Admin password reset successfully and new credentials were emailed"
                    : "Hospital Admin password reset successfully, but email could not be sent",
                hospital: {
                    id:
                        normalizedHospital.id,
                    name:
                        normalizedHospital.name,
                    registrationNumber:
                        normalizedHospital.registrationNumber,
                    licenseNumber:
                        normalizedHospital.licenseNumber,
                },
                credentials: {
                    hospitalId:
                        formatHospitalCode(
                            hospital.id
                        ),
                    loginEmail:
                        hospitalAdmin.email,
                    password:
                        temporaryPassword,
                    loginUrl:
                        `${process.env
                            .FRONTEND_URL ||
                        "http://localhost:5173"
                        }/login`,
                },
                emailSent,
            });
        } catch (error) {
            console.error(
                "Reset Hospital Admin password error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error?.sqlMessage ||
                    error?.message ||
                    "Failed to reset Hospital Admin password",
            });
        }
    };

/* =========================================================
   SEND HOSPITAL CREDENTIALS
   EMAIL + SMS
   POST /api/hospitals/:id/send-credentials
========================================================= */

const sendHospitalCredentials =
    async (
        req,
        res
    ) => {
        try {
            if (
                !req.user ||
                req.user.role !==
                "super_admin"
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Only Super Admin can send hospital credentials",
                });
            }

            const { id } =
                req.params;

            if (!isValidId(id)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Valid hospital ID is required",
                });
            }

            const hospital =
                await findHospitalById(id);

            if (!hospital) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hospital not found",
                });
            }

            await ensureHospitalLicenseNumber(
                hospital
            );

            const hospitalAdmin =
                await getHospitalAdmin(id);

            if (!hospitalAdmin) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Hospital Admin account not found for this hospital",
                });
            }

            /*
             * Generate a fresh temporary password.
             */

            const temporaryPassword =
                generateTemporaryPassword(
                    12
                );

            const hashedPassword =
                await bcrypt.hash(
                    temporaryPassword,
                    12
                );

            await updateUserPassword(
                hospitalAdmin.id,
                hashedPassword
            );

            await flagMustChangePassword(
                hospitalAdmin.id
            );

            /*
             * Ensure HMS registration number exists.
             */

            let registrationNumber =
                cleanString(
                    hospital.registration_number
                );

            if (!registrationNumber) {
                registrationNumber =
                    generateHospitalRegistrationNumber(
                        hospital.id
                    );

                await updateHospitalModel(
                    hospital.id,
                    {
                        name:
                            hospital.name,
                        address:
                            hospital.address,
                        city:
                            hospital.city,
                        state:
                            hospital.state,
                        district:
                            hospital.district,
                        country:
                            hospital.country,
                        pincode:
                            hospital.pincode,
                        registration_number:
                            registrationNumber,
                        license_number:
                            hospital.license_number,
                        tagline:
                            hospital.tagline,
                        location:
                            hospital.location,
                        phone:
                            hospital.phone,
                        email:
                            hospital.email,
                        image_url:
                            hospital.image_url,
                        logo_url:
                            hospital.logo_url,
                        total_beds:
                            Number(
                                hospital.total_beds ||
                                0
                            ),
                        available_beds:
                            Number(
                                hospital.available_beds ||
                                0
                            ),
                        status:
                            hospital.status ||
                            "active",
                        latitude:
                            hospital.latitude,
                        longitude:
                            hospital.longitude,
                    }
                );

                const refreshedHospital =
                    await findHospitalById(
                        hospital.id
                    );

                if (refreshedHospital) {
                    Object.assign(
                        hospital,
                        refreshedHospital
                    );
                }
            }

            const licenseNumber =
                cleanString(
                    hospital.license_number
                );

            const hospitalCode =
                formatHospitalCode(
                    hospital.id
                );

            const loginEmail =
                hospitalAdmin.email ||
                hospital.email;

            const loginUrl =
                `${process.env
                    .FRONTEND_URL ||
                "http://localhost:5173"
                }/login`;

            /*
             * =========================
             * SEND EMAIL
             * =========================
             */

            /*
             * The dashboard sends ONE combined email (login details +
             * certificate PDF) through POST /:id/send-welcome. It calls
             * this route with skipEmail:true so only the password is
             * reset and the SMS is sent - no second, separate email.
             */
            const skipEmail =
                req.body?.skipEmail === true ||
                req.body?.sendEmail === false;

            let emailSent = false;

            if (!skipEmail) try {
                emailSent =
                    await sendHospitalCredentialsEmail(
                        {
                            hospitalId:
                                hospital.id,

                            hospitalName:
                                hospital.name,

                            hospitalCode,

                            loginEmail,

                            password:
                                temporaryPassword,

                            loginUrl,

                            hospital: {
                                ...hospital,
                                registration_number:
                                    registrationNumber,
                                license_number:
                                    licenseNumber,
                            },

                            isPasswordReset:
                                true,
                        }
                    );
            } catch (
            emailError
            ) {
                console.error(
                    "Hospital credentials email error:",
                    emailError
                );

                emailSent = false;
            }

            /*
             * =========================
             * SEND SMS
             * =========================
             */

            let smsSent = false;
            let smsError = null;

            const phone =
                cleanString(
                    hospital.phone
                ) ||
                cleanString(
                    hospitalAdmin.phone
                );

            if (!phone) {
                smsError =
                    "Hospital mobile number is not available";
            } else {
                /*
                 * SMS = login credentials only.
                 * Certificate / registration / license details
                 * are sent by email (PDF) only.
                 */
                const smsMessage =
                    `HMS Login Credentials. ` +
                    `Hospital ID: ${hospitalCode}. ` +
                    `Username: ${loginEmail}. ` +
                    `Password: ${temporaryPassword}. ` +
                    `Login: ${loginUrl}`;

                try {
                    const smsResult =
                        await sendSMS(
                            phone,
                            smsMessage
                        );

                    smsSent =
                        smsResult?.success === true;

                    if (!smsSent) {
                        smsError =
                            smsResult?.error ||
                            "SMS could not be sent";
                    }
                } catch (error) {
                    console.error(
                        "Hospital credentials SMS error:",
                        error
                    );

                    smsError =
                        error?.message ||
                        "SMS could not be sent";
                }
            }

            const normalizedHospital =
                normalizeHospitalResponse(
                    hospital
                );

            let message =
                "Credentials could not be sent by Email or SMS";

            if (skipEmail) {
                message = smsSent
                    ? "Password reset and credentials sent by SMS"
                    : "Password reset, but SMS could not be sent";
            } else if (
                emailSent &&
                smsSent
            ) {
                message =
                    "Credentials sent successfully by Email and SMS";
            } else if (emailSent) {
                message =
                    "Credentials sent by Email, but SMS could not be sent";
            } else if (smsSent) {
                message =
                    "Credentials sent by SMS, but Email could not be sent";
            }

            return res.status(200).json({
                success: true,

                message,

                hospital:
                    normalizedHospital,

                registrationNumber,

                licenseNumber,

                credentials: {
                    hospitalId:
                        hospitalCode,

                    loginEmail,

                    password:
                        temporaryPassword,

                    loginUrl,
                },

                emailSent,

                emailSkipped: skipEmail,

                smsSent,

                smsError,
            });
        } catch (error) {
            console.error(
                "Send hospital credentials error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error?.sqlMessage ||
                    error?.message ||
                    "Failed to send hospital credentials",
            });
        }
    };

/* =========================================================
   DELETE HOSPITAL
========================================================= */

const deleteHospital = async (
    req,
    res
) => {
    try {
        if (
            !req.user ||
            req.user.role !==
            "super_admin"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only Super Admin can delete a hospital",
            });
        }

        const { id } =
            req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid hospital ID is required",
            });
        }

        const hospital =
            await findHospitalById(id);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message:
                    "Hospital not found",
            });
        }

        // -------------------------------------------------
        // SAFETY: refuse to delete a hospital that still has
        // data. Checked BEFORE the admin user is removed, so a
        // blocked delete never leaves a hospital without an admin.
        // -------------------------------------------------
        const hospitalAdminForCheck =
            await getHospitalAdmin(id);

        const dataTables = [
            "patients",
            "doctors",
            "appointments",
            "departments",
            "medicines",
            "laboratory_tests",
            "billing",
            "complaints",
            "emergency_assignments",
        ];

        const blockers = [];

        for (const tableName of dataTables) {
            const [countRows] = await pool.query(
                `SELECT COUNT(*) AS total FROM ${tableName} WHERE hospital_id = ?`,
                [Number(id)]
            );

            const total = Number(countRows?.[0]?.total) || 0;

            if (total > 0) {
                blockers.push(`${tableName}: ${total}`);
            }
        }

        const [userRows] = await pool.query(
            `SELECT COUNT(*) AS total FROM users WHERE hospital_id = ? AND id <> ?`,
            [Number(id), Number(hospitalAdminForCheck?.id) || 0]
        );

        const otherUsers = Number(userRows?.[0]?.total) || 0;

        if (otherUsers > 0) {
            blockers.push(`users: ${otherUsers}`);
        }

        if (blockers.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Hospital cannot be deleted because it still has data. Remove or deactivate it instead.",
                related_records: blockers,
            });
        }

        const hospitalAdmin =
            await getHospitalAdmin(id);

        let deletedAdmin = null;

        if (hospitalAdmin) {
            try {
                await deleteUserById(
                    hospitalAdmin.id
                );

                deletedAdmin = {
                    id:
                        hospitalAdmin.id,
                    email:
                        hospitalAdmin.email,
                    role:
                        hospitalAdmin.role,
                    hospital_id:
                        hospitalAdmin.hospital_id,
                    deleted:
                        true,
                };
            } catch (
            adminDeleteError
            ) {
                console.error(
                    "Hospital Admin delete error:",
                    adminDeleteError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Hospital Admin could not be deleted, so hospital deletion was stopped",
                });
            }
        }

        const result =
            await deleteHospitalModel(
                id
            );

        return res.status(200).json({
            success: true,

            message:
                "Hospital and its Hospital Admin deleted successfully",

            hospital:
                normalizeHospitalResponse(
                    hospital
                ),

            affectedRows:
                result?.affectedRows ?? 0,

            deletedAdmin,
        });
    } catch (error) {
        console.error(
            "Delete hospital error:",
            error
        );

        if (
            error.code ===
            "ER_ROW_IS_REFERENCED_2" ||
            error.code ===
            "ER_ROW_IS_REFERENCED"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Hospital cannot be deleted because related records exist",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error?.sqlMessage ||
                error?.message ||
                "Failed to delete hospital",
        });
    }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    getAllHospitals,
    getActiveHospitals,
    searchHospitals,
    getHospitalById,
    createHospital,
    sendHospitalWelcome,
    updateHospital,
    changeHospitalStatus,
    changeHospitalBeds,
    getStats,
    printHospitalCertificate,
    resetHospitalAdminPassword,
    sendHospitalCredentials,
    deleteHospital,
};