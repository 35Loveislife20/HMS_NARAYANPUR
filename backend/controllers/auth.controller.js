const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const {
    createUser,
    findUserByEmail,
    findUserByResetToken,
    saveResetToken,
    clearResetToken,
    updateUserPassword,
} = require("../models/user.model");

const generateToken = require("../utils/jwt");

const {
    sendPasswordResetEmail,
} = require("../services/email.service");


// =====================================================
// VALID ROLES
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


// =====================================================
// REGISTER
// =====================================================

const register = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            phone,
            role,
        } = req.body;

        if (
            !name ||
            !email ||
            !password ||
            !role
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, password and role are required",
            });
        }

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role",
                allowed_roles: VALID_ROLES,
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const existingUser =
            await findUserByEmail(
                normalizedEmail
            );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "Email already registered",
                existing_user: {
                    id: existingUser.id,
                    name: existingUser.name,
                    email: existingUser.email,
                    role: existingUser.role,
                },
            });
        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        const result =
            await createUser(
                name.trim(),
                normalizedEmail,
                hashedPassword,
                phone,
                role
            );

        const userId =
            result.insertId;

        const token =
            generateToken({
                id: userId,
                email: normalizedEmail,
                role,
            });

        return res.status(201).json({
            success: true,
            message:
                "User registered successfully",
            token,
            user: {
                id: userId,
                name: name.trim(),
                email: normalizedEmail,
                phone: phone || null,
                role,
                profile_image: null,
            },
        });

    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
            code: error.code || null,
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
        } = req.body;

        if (
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required",
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await findUserByEmail(
                normalizedEmail
            );

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }

        const token =
            generateToken({
                id: user.id,
                email: user.email,
                role: user.role,
            });

        return res.status(200).json({
            success: true,
            message:
                "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profile_image:
                    user.profile_image || null,
            },
        });

    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
            code: error.code || null,
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

        // -------------------------------------------------
        // REQUEST BODY
        // -------------------------------------------------

        console.log(
            "📦 Request Body:",
            req.body
        );

        const {
            email,
        } = req.body || {};


        // -------------------------------------------------
        // VALIDATE EMAIL
        // -------------------------------------------------

        if (!email) {

            console.log(
                "❌ Email was not provided"
            );

            return res.status(400).json({
                success: false,
                message:
                    "Email address is required",
            });
        }


        // -------------------------------------------------
        // NORMALIZE EMAIL
        // -------------------------------------------------

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        console.log(
            "📧 Requested Email:",
            normalizedEmail
        );


        // -------------------------------------------------
        // FIND USER
        // -------------------------------------------------

        console.log(
            "🔎 Searching user in database..."
        );

        const user =
            await findUserByEmail(
                normalizedEmail
            );


        // -------------------------------------------------
        // USER NOT FOUND
        // -------------------------------------------------

        if (!user) {

            console.log(
                "⚠️ User not found:",
                normalizedEmail
            );

            console.log(
                "========================================"
            );

            /*
             * Security response
             */
            return res.status(200).json({

                success: true,

                message:
                    "If this email is registered, password reset instructions have been sent.",

            });
        }


        // -------------------------------------------------
        // USER FOUND
        // -------------------------------------------------

        console.log(
            "✅ User found"
        );

        console.log(
            "👤 User ID:",
            user.id
        );

        console.log(
            "👤 User Name:",
            user.name
        );

        console.log(
            "📧 User Email:",
            user.email
        );


        // -------------------------------------------------
        // GENERATE RESET TOKEN
        // -------------------------------------------------

        console.log(
            "🔐 Generating reset token..."
        );

        const resetToken =
            crypto
                .randomBytes(32)
                .toString("hex");


        console.log(
            "✅ Reset token generated"
        );


        // -------------------------------------------------
        // TOKEN EXPIRATION
        // -------------------------------------------------

        const resetTokenExpiresAt =
            new Date(
                Date.now() +
                15 * 60 * 1000
            );

        console.log(
            "⏰ Token expires:",
            resetTokenExpiresAt
        );


        // -------------------------------------------------
        // SAVE TOKEN
        // -------------------------------------------------

        console.log(
            "💾 Saving reset token to database..."
        );

        await saveResetToken(
            user.id,
            resetToken,
            resetTokenExpiresAt
        );

        console.log(
            "✅ Reset token saved to database"
        );


        // -------------------------------------------------
        // SEND EMAIL
        // -------------------------------------------------

        console.log(
            "📨 Sending password reset email..."
        );

        console.log(
            "📧 To:",
            normalizedEmail
        );

        const emailResult =
            await sendPasswordResetEmail(
                normalizedEmail,
                resetToken,
                user.name
            );


        // -------------------------------------------------
        // EMAIL SUCCESS
        // -------------------------------------------------

        console.log(
            "========================================"
        );

        console.log(
            "✅ PASSWORD RESET EMAIL SENT"
        );

        console.log(
            "📧 To:",
            normalizedEmail
        );

        console.log(
            "📨 Message ID:",
            emailResult?.messageId || "N/A"
        );

        console.log(
            "========================================"
        );


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Password reset instructions have been sent to your email.",

        });

    } catch (error) {

        console.error("");
        console.error(
            "========================================"
        );

        console.error(
            "❌ HMS FORGOT PASSWORD ERROR"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Code:",
            error.code || "N/A"
        );

        console.error(
            "Stack:",
            error.stack
        );

        console.error(
            "========================================"
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to send password reset email.",

            error:
                error.message,

            code:
                error.code || null,

        });
    }
};


// =====================================================
// RESET PASSWORD
// =====================================================

const resetPassword = async (req, res) => {

    try {

        const {
            token,
            password,
            confirmPassword,
        } = req.body;

        if (
            !token ||
            !password ||
            !confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Reset token, password and confirm password are required",
            });
        }

        if (
            password !==
            confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Passwords do not match",
            });
        }

        if (
            password.length < 6
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters long",
            });
        }

        const user =
            await findUserByResetToken(
                token
            );

        if (!user) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid or expired reset token",
            });
        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        await updateUserPassword(
            user.id,
            hashedPassword
        );

        await clearResetToken(
            user.id
        );

        return res.status(200).json({
            success: true,
            message:
                "Password reset successfully",
        });

    } catch (error) {

        console.error(
            "RESET PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error",
            error:
                error.message,
            code:
                error.code || null,
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

};