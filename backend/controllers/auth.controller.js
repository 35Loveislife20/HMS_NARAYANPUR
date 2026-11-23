const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { pool } = require("../config/db");

const {
    createUser,
    findUserByEmail,
    findUserById,
    findUserByResetToken,
    saveResetToken,
    clearResetToken,
    updateUserPassword,
} = require("../models/user.model");

const generateToken = require("../utils/jwt");

const { issueCredentials } = require("../utils/credentialMailer");

const {
    otpRequiredFor,
    LOGIN_WINDOW_MS,
    OTP_TTL_MS,
    maskEmail,
    maskPhone,
} = require("../services/otp.service");

const { startChallenge } = require("../models/otp.model");

const {
    sendPasswordResetEmail,
} = require("../services/email.service");

// =====================================================
// CONSTANTS
// =====================================================

const VALID_ROLES = [
    "patient",
    "super_admin",
    "hospital_admin",
    "receptionist",
    "doctor",
    "lab_technician",
    "pharmacist",
    "accountant",
    "nurse",
];

// Roles a hospital_admin may create inside their OWN hospital
const HOSPITAL_ADMIN_CREATABLE_ROLES = [
    "patient",
    "receptionist",
    "doctor",
    "lab_technician",
    "pharmacist",
    "accountant",
    "nurse",
];

const isProduction = process.env.NODE_ENV === "production";

// Do not leak internal error details in production
const errorPayload = (error) =>
    isProduction
        ? {}
        : { error: error.message, code: error.code || null };

// =====================================================
// HELPERS
// =====================================================

const parseHospitalId = (value) => {
    if (value === undefined || value === null || value === "") {
        return { value: null, invalid: false };
    }

    const n = Number(value);

    if (!Number.isInteger(n) || n <= 0) {
        return { value: null, invalid: true };
    }

    return { value: n, invalid: false };
};

const isActiveStatus = (status) =>
    String(status ?? "active").trim().toLowerCase() === "active";

// users.must_change_password (TINYINT) -> boolean. Missing column => false.
const mustChangePassword = (user) =>
    Number(user?.must_change_password) === 1 ||
    user?.must_change_password === true;

const findHospitalById = async (hospitalId) => {
    const [rows] = await pool.query(
        `
        SELECT id, name, status
        FROM hospitals
        WHERE id = ?
        LIMIT 1
        `,
        [hospitalId]
    );

    return rows[0] || null;
};

// Register is a public route. If a valid Bearer token is sent,
// we learn WHO is creating the user. Invalid/missing token => null.
const getOptionalCaller = (req) => {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            return null;
        }

        const decoded = jwt.verify(
            header.split(" ")[1],
            process.env.JWT_SECRET
        );

        return {
            id: decoded.id,
            role: decoded.role,
            hospital_id:
                decoded.hospital_id !== undefined &&
                decoded.hospital_id !== null
                    ? Number(decoded.hospital_id)
                    : null,
        };
    } catch (error) {
        return null;
    }
};

// =====================================================
// REGISTER
//
// Public (no token)      -> only role "patient"
// hospital_admin token   -> staff roles, own hospital only
// super_admin token      -> any role, any hospital
// =====================================================

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            role,
            hospital_id,
            hospitalId,
        } = req.body || {};

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password and role are required",
            });
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role",
                allowed_roles: VALID_ROLES,
            });
        }

        // -------------------------------------------------
        // WHO IS ALLOWED TO CREATE THIS ROLE?
        // -------------------------------------------------

        const caller = getOptionalCaller(req);
        const callerRole = caller ? caller.role : null;

        let hospitalIdValue = null;

        if (callerRole === "super_admin") {
            const parsed = parseHospitalId(
                hospital_id !== undefined ? hospital_id : hospitalId
            );

            if (parsed.invalid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid hospital_id",
                });
            }

            hospitalIdValue = parsed.value;
        } else if (callerRole === "hospital_admin") {
            if (!HOSPITAL_ADMIN_CREATABLE_ROLES.includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: "You cannot create a user with this role",
                });
            }

            // Always own hospital, whatever the client sent
            hospitalIdValue = caller.hospital_id;
        } else {
            // Public / any other role: patient self-registration only
            if (role !== "patient") {
                return res.status(403).json({
                    success: false,
                    message:
                        "Only patient accounts can be self-registered",
                });
            }

            const parsed = parseHospitalId(
                hospital_id !== undefined ? hospital_id : hospitalId
            );

            if (parsed.invalid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid hospital_id",
                });
            }

            hospitalIdValue = parsed.value;
        }

        // Super admin is global
        if (role === "super_admin") {
            hospitalIdValue = null;
        }

        // Everyone else needs a real, active hospital
        if (role !== "super_admin") {
            if (!hospitalIdValue) {
                return res.status(400).json({
                    success: false,
                    message: "hospital_id is required for hospital users",
                });
            }

            const hospital = await findHospitalById(hospitalIdValue);

            if (!hospital) {
                return res.status(400).json({
                    success: false,
                    message: "Hospital not found",
                });
            }

            if (!isActiveStatus(hospital.status)) {
                return res.status(403).json({
                    success: false,
                    message: "This hospital is not active",
                });
            }
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const existingUser = await findUserByEmail(normalizedEmail);

        if (existingUser) {
            // Do not expose another account's details
            return res.status(409).json({
                success: false,
                message: "Email already registered",
            });
        }

        const hashedPassword = await bcrypt.hash(String(password), 10);

        const result = await createUser(
            String(name).trim(),
            normalizedEmail,
            hashedPassword,
            phone || null,
            role,
            null,
            hospitalIdValue
        );

        const userId = result.insertId;

        const userPayload = {
            id: userId,
            name: String(name).trim(),
            email: normalizedEmail,
            phone: phone || null,
            role,
            hospital_id: hospitalIdValue,
            profile_image: null,
        };

        // Admin ne staff/doctor banaya hai -> login credentials mail + PDF.
        // (Patient self-registration me mail nahi jati.)
        let mailSent = false;

        if (caller && role !== "patient") {
            mailSent = await issueCredentials({
                userId,
                name: String(name).trim(),
                email: normalizedEmail,
                role,
                password: String(password),
                hospitalId: hospitalIdValue,
            });
        }

        // Token is returned only for self-registration (patient).
        // When an admin creates a user, the new user logs in themselves.
        if (!caller) {
            const token = generateToken({
                id: userId,
                email: normalizedEmail,
                role,
                hospital_id: hospitalIdValue,
            });

            return res.status(201).json({
                success: true,
                message: "User registered successfully",
                token,
                user: userPayload,
            });
        }

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            mailSent,
            user: userPayload,
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
            ...errorPayload(error),
        });
    }
};

// =====================================================
// LOGIN
// =====================================================

const login = async (req, res) => {
    try {
        const {
            email,
            password,
            role,
            hospitalId,
            hospital_id,
        } = req.body || {};

        console.log("========================================");
        console.log("🔐 HMS LOGIN REQUEST");
        console.log("Email:", email);
        console.log("Role:", role || "Not provided");
        console.log("Hospital ID:", hospitalId ?? hospital_id ?? null);
        console.log("========================================");

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        // -------------------------------------------------
        // FIND USER
        // -------------------------------------------------

        const user = await findUserByEmail(normalizedEmail);

        if (!user) {
            console.log("❌ USER NOT FOUND:", normalizedEmail);

            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // -------------------------------------------------
        // PASSWORD CHECK
        // -------------------------------------------------

        if (!user.password) {
            return res.status(500).json({
                success: false,
                message: "User password is not configured",
            });
        }

        const passwordMatch = await bcrypt.compare(
            String(password),
            user.password
        );

        if (!passwordMatch) {
            console.log("❌ INVALID PASSWORD:", normalizedEmail);

            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // -------------------------------------------------
        // ACCOUNT STATUS (inactive / blocked users)
        // -------------------------------------------------

        if (!isActiveStatus(user.status)) {
            console.log("❌ ACCOUNT NOT ACTIVE:", normalizedEmail);

            return res.status(403).json({
                success: false,
                message: "This account is not active. Contact your administrator.",
            });
        }

        // -------------------------------------------------
        // ROLE CHECK
        // -------------------------------------------------

        if (
            role &&
            String(role).trim() !== String(user.role).trim()
        ) {
            console.log("❌ ROLE MISMATCH:", {
                selectedRole: role,
                accountRole: user.role,
            });

            return res.status(403).json({
                success: false,
                message: "Selected role does not match this account",
                account_role: user.role,
            });
        }

        // -------------------------------------------------
        // USER HOSPITAL ID
        // -------------------------------------------------

        const userHospitalId =
            user.hospital_id !== null &&
            user.hospital_id !== undefined &&
            user.hospital_id !== ""
                ? Number(user.hospital_id)
                : null;

        // -------------------------------------------------
        // REQUESTED HOSPITAL ID
        // -------------------------------------------------

        const parsedRequested = parseHospitalId(
            hospitalId !== undefined ? hospitalId : hospital_id
        );

        if (parsedRequested.invalid) {
            return res.status(400).json({
                success: false,
                message: "Invalid hospitalId",
            });
        }

        const requestedHospitalId = parsedRequested.value;

        // -------------------------------------------------
        // HOSPITAL CHECKS (everyone except super admin)
        // -------------------------------------------------

        if (user.role !== "super_admin") {
            if (!userHospitalId) {
                return res.status(403).json({
                    success: false,
                    message: "No hospital is assigned to this account",
                });
            }

            if (
                requestedHospitalId !== null &&
                userHospitalId !== requestedHospitalId
            ) {
                console.log("❌ HOSPITAL MISMATCH:", {
                    userHospitalId,
                    requestedHospitalId,
                });

                return res.status(403).json({
                    success: false,
                    message:
                        "This account does not belong to the selected hospital",
                });
            }

            const hospital = await findHospitalById(userHospitalId);

            if (!hospital) {
                console.log("❌ HOSPITAL NOT FOUND:", userHospitalId);

                return res.status(403).json({
                    success: false,
                    message: "The hospital for this account was not found",
                });
            }

            if (!isActiveStatus(hospital.status)) {
                console.log("❌ HOSPITAL NOT ACTIVE:", userHospitalId);

                return res.status(403).json({
                    success: false,
                    message: "This hospital is currently deactivated",
                });
            }
        }

        // -------------------------------------------------
        // OTP STEP (hospital admin): password is correct,
        // but NO token yet. Token is given only by /verify-otp.
        // -------------------------------------------------

        if (otpRequiredFor(user)) {
            await startChallenge(user.id, Date.now() + LOGIN_WINDOW_MS);

            console.log("🔑 OTP REQUIRED:", normalizedEmail);

            return res.status(200).json({
                success: true,
                requires_otp: true,
                message:
                    "Credentials verified. Please choose where to receive the OTP.",
                expires_in: OTP_TTL_MS / 1000,
                user: {
                    id: user.id,
                    name: user.name,
                    // masked: only used to show "OTP sent to ..."
                    email: maskEmail(user.email),
                    phone: maskPhone(user.phone),
                    role: user.role,
                    hospital_id: userHospitalId,
                },
            });
        }

        // -------------------------------------------------
        // GENERATE JWT
        // -------------------------------------------------

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            hospital_id: userHospitalId,
        });

        console.log("✅ LOGIN SUCCESS:", normalizedEmail);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                hospital_id: userHospitalId,
                profile_image: user.profile_image || null,
                must_change_password: mustChangePassword(user),
            },
        });
    } catch (error) {
        console.error("========================================");
        console.error("❌ LOGIN ERROR");
        console.error("Message:", error.message);
        console.error("Code:", error.code || "N/A");
        console.error("Stack:", error.stack);
        console.error("========================================");

        return res.status(500).json({
            success: false,
            message: "Unable to process login",
            ...errorPayload(error),
        });
    }
};

// =====================================================
// FORGOT PASSWORD
// =====================================================

const forgotPassword = async (req, res) => {
    console.log("");
    console.log("========================================");
    console.log("🔐 HMS FORGOT PASSWORD API CALLED");
    console.log("========================================");

    try {
        const { email } = req.body || {};

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email address is required",
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const user = await findUserByEmail(normalizedEmail);

        // Do not reveal whether email exists
        if (!user) {
            return res.status(200).json({
                success: true,
                message:
                    "If this email is registered, password reset instructions have been sent.",
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hospital name + address are shown in the email header.
        // If this lookup fails, the email is still sent (generic header).
        let hospitalInfo = null;

        if (user.hospital_id) {
            try {
                const [hospitalRows] = await pool.query(
                    `
                    SELECT name, address, city, state, pincode
                    FROM hospitals
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [Number(user.hospital_id)]
                );

                hospitalInfo = hospitalRows[0] || null;
            } catch (hospitalError) {
                console.error(
                    "FORGOT PASSWORD hospital lookup error:",
                    hospitalError.code || hospitalError.message
                );
            }
        }

        const resetTokenExpiresAt = new Date(
            Date.now() + 15 * 60 * 1000
        );

        await saveResetToken(user.id, resetToken, resetTokenExpiresAt);

        const emailResult = await sendPasswordResetEmail(
            normalizedEmail,
            resetToken,
            user.name,
            hospitalInfo
        );

        console.log("✅ PASSWORD RESET EMAIL SENT");
        console.log("Message ID:", emailResult?.messageId || "N/A");

        return res.status(200).json({
            success: true,
            message:
                "Password reset instructions have been sent to your email.",
        });
    } catch (error) {
        console.error("❌ HMS FORGOT PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to send password reset email.",
            ...errorPayload(error),
        });
    }
};

// =====================================================
// RESET PASSWORD
// =====================================================

const resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body || {};

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Reset token, password and confirm password are required",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        const user = await findUserByResetToken(token);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await updateUserPassword(user.id, hashedPassword);

        await clearResetToken(user.id);

        // User chose this password themselves, so no forced change needed
        try {
            await pool.query(
                "UPDATE users SET must_change_password = 0 WHERE id = ?",
                [user.id]
            );
        } catch (flagError) {
            if (flagError.code !== "ER_BAD_FIELD_ERROR") {
                throw flagError;
            }
        }

        return res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
            ...errorPayload(error),
        });
    }
};

// =====================================================
// CHANGE PASSWORD (logged-in user)
// PUT /api/auth/change-password   (auth middleware required)
// body: { currentPassword, newPassword, confirmPassword }
// =====================================================

const changePassword = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const { currentPassword, newPassword, confirmPassword } =
            req.body || {};

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password, new password and confirm password are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        if (String(newPassword).length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be different from the current password",
            });
        }

        let user = await findUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // findUserById may not return the hash; findUserByEmail does (login uses it)
        if (!user.password) {
            user = await findUserByEmail(user.email);
        }

        if (!user || !user.password) {
            return res.status(500).json({
                success: false,
                message: "User password is not configured",
            });
        }

        const passwordMatch = await bcrypt.compare(
            String(currentPassword),
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        const hashedPassword = await bcrypt.hash(String(newPassword), 10);

        await updateUserPassword(user.id, hashedPassword);

        // First-login rule is satisfied now. If the column is not
        // migrated yet, do not fail the password change because of it.
        try {
            await pool.query(
                "UPDATE users SET must_change_password = 0 WHERE id = ?",
                [user.id]
            );
        } catch (flagError) {
            if (flagError.code !== "ER_BAD_FIELD_ERROR") {
                throw flagError;
            }

            console.warn(
                "users.must_change_password column missing - run the SQL migration"
            );
        }

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("CHANGE PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
            ...errorPayload(error),
        });
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    changePassword,
};