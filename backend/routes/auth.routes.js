const express = require("express");

const {
    register,
    login,
    forgotPassword,
    resetPassword,
} = require("../controllers/auth.controller");

const router = express.Router();


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
// EXPORT
// =====================================================

module.exports = router;