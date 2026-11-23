const generateToken = require("../utils/jwt");

const { findUserById } = require("../models/user.model");

const {
    getChallenge,
    saveCode,
    addAttempt,
    deleteChallenge,
} = require("../models/otp.model");

const {
    OTP_TTL_MS,
    RESEND_COOLDOWN_MS,
    MAX_ATTEMPTS,
    hashOtp,
    generateOtp,
    safeEqual,
    maskEmail,
    maskPhone,
    sendOtpEmail,
    sendOtpSms,
} = require("../services/otp.service");

// =====================================================
// SEND OTP
// POST /api/auth/send-otp
// body: { user_id, method: "email" | "mobile" }
// =====================================================

const sendOtp = async (req, res) => {
    try {
        const userId = Number(req.body?.user_id);
        const method =
            req.body?.method === "mobile" ? "mobile" : "email";

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "User information is missing.",
            });
        }

        const now = Date.now();
        const challenge = await getChallenge(userId);

        // OTP can be requested only right after a correct password
        if (
            !challenge ||
            Number(challenge.verified_until) < now
        ) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please login again.",
            });
        }

        if (
            challenge.last_sent_at &&
            now - Number(challenge.last_sent_at) < RESEND_COOLDOWN_MS
        ) {
            const wait = Math.ceil(
                (RESEND_COOLDOWN_MS -
                    (now - Number(challenge.last_sent_at))) /
                    1000
            );

            return res.status(429).json({
                success: false,
                message: `Please wait ${wait} seconds before requesting another OTP.`,
            });
        }

        // email / phone ALWAYS come from the database, never from the request
        const user = await findUserById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const target =
            method === "mobile" ? user.phone : user.email;

        if (!target) {
            return res.status(400).json({
                success: false,
                message:
                    method === "mobile"
                        ? "No mobile number is registered for this account."
                        : "No email is registered for this account.",
            });
        }

        const otp = generateOtp();

        // send first; save only if sending worked
        if (method === "mobile") {
            await sendOtpSms(target, otp);
        } else {
            await sendOtpEmail(target, user.name, otp);
        }

        await saveCode(
            userId,
            hashOtp(userId, otp),
            method,
            now + OTP_TTL_MS,
            now
        );

        if (process.env.OTP_DEBUG === "true") {
            console.log(`[OTP_DEBUG] user ${userId} (${method}): ${otp}`);
        }

        return res.status(200).json({
            success: true,
            message: `OTP sent to ${
                method === "mobile"
                    ? maskPhone(target)
                    : maskEmail(target)
            }.`,
            expires_in: OTP_TTL_MS / 1000,
        });
    } catch (error) {
        console.error("SEND OTP ERROR:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message || "Unable to send OTP.",
        });
    }
};

// =====================================================
// VERIFY OTP
// POST /api/auth/verify-otp
// body: { user_id, otp, method }
// =====================================================

const verifyOtp = async (req, res) => {
    try {
        const userId = Number(req.body?.user_id);
        const otp = String(req.body?.otp || "").trim();

        if (!Number.isInteger(userId) || userId <= 0 || !otp) {
            return res.status(400).json({
                success: false,
                message: "User and OTP are required.",
            });
        }

        const now = Date.now();
        const challenge = await getChallenge(userId);

        if (
            !challenge ||
            Number(challenge.verified_until) < now
        ) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please login again.",
            });
        }

        if (!challenge.code_hash) {
            return res.status(400).json({
                success: false,
                message: "Please request an OTP first.",
            });
        }

        if (Number(challenge.expires_at) < now) {
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please send a new OTP.",
            });
        }

        if (Number(challenge.attempts) >= MAX_ATTEMPTS) {
            return res.status(429).json({
                success: false,
                message:
                    "Too many wrong attempts. Please send a new OTP.",
            });
        }

        if (!safeEqual(hashOtp(userId, otp), challenge.code_hash)) {
            await addAttempt(userId);

            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }

        // OTP can be used only once
        await deleteChallenge(userId);

        const user = await findUserById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const hospitalId =
            user.hospital_id !== null &&
            user.hospital_id !== undefined &&
            user.hospital_id !== ""
                ? Number(user.hospital_id)
                : null;

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            hospital_id: hospitalId,
        });

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                hospital_id: hospitalId,
                profile_image: user.profile_image || null,
                // true => frontend must open the "set new password" screen
                must_change_password:
                    Number(user.must_change_password) === 1 ||
                    user.must_change_password === true,
            },
        });
    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "OTP verification failed.",
        });
    }
};

module.exports = { sendOtp, verifyOtp };