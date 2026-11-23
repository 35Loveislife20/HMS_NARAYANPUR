const express = require("express");
const jwt = require("jsonwebtoken");

const {
    register,
    login,
    forgotPassword,
    resetPassword,
    changePassword,
} = require("../controllers/auth.controller");

const {
    sendOtp,
    verifyOtp,
} = require("../controllers/otp.controller");

const router = express.Router();


// =====================================================
// REQUIRE AUTH (JWT)
// Sets req.user = { id, email, role, hospital_id }
// Same token format that login / verify-otp issue.
// If your project already has an auth middleware, you can
// import it instead and delete this function.
// =====================================================

const requireAuth = (req, res, next) => {
    try {
        const header = req.headers.authorization || "";

        if (!header.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const decoded = jwt.verify(
            header.split(" ")[1],
            process.env.JWT_SECRET
        );

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            hospital_id:
                decoded.hospital_id !== undefined &&
                decoded.hospital_id !== null
                    ? Number(decoded.hospital_id)
                    : null,
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};


// =====================================================
// REGISTER
// POST /api/auth/register
// =====================================================

router.post(
    "/register",
    register
);


// =====================================================
// LOGIN
// POST /api/auth/login
// =====================================================

router.post(
    "/login",
    login
);


// =====================================================
// SEND OTP (email or mobile)
// POST /api/auth/send-otp
// =====================================================

router.post(
    "/send-otp",
    sendOtp
);


// =====================================================
// VERIFY OTP
// POST /api/auth/verify-otp
// =====================================================

router.post(
    "/verify-otp",
    verifyOtp
);


// =====================================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// =====================================================

router.post(
    "/forgot-password",
    forgotPassword
);


// =====================================================
// RESET PASSWORD
// POST /api/auth/reset-password
// =====================================================

router.post(
    "/reset-password",
    resetPassword
);


// =====================================================
// CHANGE PASSWORD (logged-in user)
// PUT /api/auth/change-password
// body: { currentPassword, newPassword, confirmPassword }
// =====================================================

router.put(
    "/change-password",
    requireAuth,
    changePassword
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;