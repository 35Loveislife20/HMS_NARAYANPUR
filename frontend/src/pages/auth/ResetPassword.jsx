import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
    FaArrowLeft,
    FaLock,
    FaHeartbeat,
    FaEye,
    FaEyeSlash,
    FaShieldAlt,
    FaCheckCircle,
    FaExclamationTriangle,
} from "react-icons/fa";

import "./ResetPassword.css";

// =====================================================
// API URL
// =====================================================

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

// =====================================================
// COMPONENT
// =====================================================

function ResetPassword() {

    const navigate = useNavigate();

    // =================================================
    // READ TOKEN FROM:
    // /reset-password?token=XXXXXXXX
    // =================================================

    const [searchParams] = useSearchParams();

    const token =
        searchParams.get("token") || "";

    // =================================================
    // STATE
    // =================================================

    const [password, setPassword] = useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState(false);

    // =================================================
    // RESET PASSWORD
    // =================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        // ------------------------------------------------
        // TOKEN CHECK
        // ------------------------------------------------

        if (!token) {

            setError(
                "Invalid or missing password reset token."
            );

            return;
        }

        // ------------------------------------------------
        // PASSWORD CHECK
        // ------------------------------------------------

        if (!password) {

            setError(
                "Please enter your new password."
            );

            return;
        }

        if (password.length < 6) {

            setError(
                "Password must be at least 6 characters long."
            );

            return;
        }

        // ------------------------------------------------
        // CONFIRM PASSWORD
        // ------------------------------------------------

        if (!confirmPassword) {

            setError(
                "Please confirm your new password."
            );

            return;
        }

        if (password !== confirmPassword) {

            setError(
                "Passwords do not match."
            );

            return;
        }

        setLoading(true);

        try {

            console.log(
                "========================================"
            );

            console.log(
                "🔐 HMS RESET PASSWORD"
            );

            console.log(
                "🌐 API BASE:",
                API_URL
            );

            console.log(
                "📡 API URL:",
                `${API_URL}/auth/reset-password`
            );

            console.log(
                "🔑 Reset Token:",
                token
                    ? `${token.substring(0, 12)}...`
                    : "MISSING"
            );

            console.log(
                "🚀 Sending reset password request..."
            );

            console.log(
                "========================================"
            );

            // ------------------------------------------------
            // API REQUEST
            // ------------------------------------------------

            const response = await fetch(
                `${API_URL}/auth/reset-password`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({

                        token: token,

                        password: password,

                        confirmPassword: confirmPassword,

                    }),
                }
            );

            // ------------------------------------------------
            // CONTENT TYPE
            // ------------------------------------------------

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            let data;

            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            } else {

                const text =
                    await response.text();

                throw new Error(
                    text ||
                    `Server returned HTTP ${response.status}`
                );
            }

            // ------------------------------------------------
            // DEBUG RESPONSE
            // ------------------------------------------------

            console.log(
                "📥 Backend Status:",
                response.status
            );

            console.log(
                "📥 Backend OK:",
                response.ok
            );

            console.log(
                "📦 Backend Response:",
                data
            );

            // ------------------------------------------------
            // API ERROR
            // ------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    "Unable to reset password."
                );
            }

            // ------------------------------------------------
            // SUCCESS
            // ------------------------------------------------

            console.log(
                "========================================"
            );

            console.log(
                "✅ PASSWORD RESET SUCCESSFUL"
            );

            console.log(
                "========================================"
            );

            setSuccess(true);

            // Clear password fields
            setPassword("");
            setConfirmPassword("");

        } catch (err) {

            console.error(
                "========================================"
            );

            console.error(
                "❌ RESET PASSWORD ERROR"
            );

            console.error(
                err
            );

            console.error(
                "========================================"
            );

            setError(
                err?.message ||
                "Unable to connect to HMS server."
            );

        } finally {

            setLoading(false);

        }
    };

    // =================================================
    // RENDER
    // =================================================

    return (

        <div className="reset-page">

            {/* =========================================
                BACKGROUND
            ========================================= */}

            <div className="reset-background-grid" />


            {/* =========================================
                BACK BUTTON
            ========================================= */}

            <button
                type="button"
                className="reset-back-button"
                onClick={() => navigate("/")}
            >

                <FaArrowLeft />

                <span>
                    Back to HMS
                </span>

            </button>


            {/* =========================================
                CARD
            ========================================= */}

            <div className="reset-card">

                {/* =====================================
                    LOGO
                ===================================== */}

                <div className="reset-logo">

                    <FaHeartbeat />

                </div>


                {/* =====================================
                    HEADER
                ===================================== */}

                <div className="reset-header">

                    <h1>
                        Reset Password
                    </h1>

                    <p>
                        Create a new secure password
                        for your HMS account.
                    </p>

                </div>


                {/* =====================================
                    SUCCESS
                ===================================== */}

                {success ? (

                    <div className="reset-success">

                        <div className="reset-success-icon">

                            <FaCheckCircle />

                        </div>

                        <h3>
                            Password Reset Successful
                        </h3>

                        <p>
                            Your password has been
                            updated successfully.
                        </p>

                        <button
                            type="button"
                            className="reset-login-button"
                            onClick={() => navigate("/")}
                        >
                            Return to Login
                        </button>

                    </div>

                ) : (

                    <form
                        className="reset-form"
                        onSubmit={handleSubmit}
                    >

                        {/* =================================
                            ERROR
                        ================================= */}

                        {error && (

                            <div className="reset-error">

                                <FaExclamationTriangle />

                                <span>
                                    {error}
                                </span>

                            </div>

                        )}


                        {/* =================================
                            NEW PASSWORD
                        ================================= */}

                        <label htmlFor="reset-password">
                            New Password
                        </label>

                        <div className="reset-input">

                            <FaLock />

                            <input
                                id="reset-password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(e) => {

                                    setPassword(
                                        e.target.value
                                    );

                                    setError("");

                                }}
                                placeholder="Enter new password"
                                autoComplete="new-password"
                                disabled={loading}
                                minLength={6}
                            />

                            <button
                                type="button"
                                className="reset-eye"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                                tabIndex={-1}
                            >

                                {showPassword ? (
                                    <FaEyeSlash />
                                ) : (
                                    <FaEye />
                                )}

                            </button>

                        </div>


                        {/* =================================
                            CONFIRM PASSWORD
                        ================================= */}

                        <label htmlFor="reset-confirm-password">
                            Confirm Password
                        </label>

                        <div className="reset-input">

                            <FaLock />

                            <input
                                id="reset-confirm-password"
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                value={confirmPassword}
                                onChange={(e) => {

                                    setConfirmPassword(
                                        e.target.value
                                    );

                                    setError("");

                                }}
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                                disabled={loading}
                                minLength={6}
                            />

                            <button
                                type="button"
                                className="reset-eye"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        !showConfirmPassword
                                    )
                                }
                                tabIndex={-1}
                            >

                                {showConfirmPassword ? (
                                    <FaEyeSlash />
                                ) : (
                                    <FaEye />
                                )}

                            </button>

                        </div>


                        {/* =================================
                            PASSWORD INFO
                        ================================= */}

                        <div className="reset-password-info">

                            <FaShieldAlt />

                            <span>
                                Password must contain at least
                                6 characters.
                            </span>

                        </div>


                        {/* =================================
                            SUBMIT
                        ================================= */}

                        <button
                            type="submit"
                            className="reset-submit"
                            disabled={loading}
                        >

                            {loading
                                ? "Updating Password..."
                                : "Reset Password"
                            }

                        </button>


                        {/* =================================
                            LOGIN
                        ================================= */}

                        <button
                            type="button"
                            className="reset-login-link"
                            onClick={() => navigate("/")}
                        >

                            Remember your password?

                            <strong>
                                {" "}Login
                            </strong>

                        </button>

                    </form>

                )}


                {/* =====================================
                    SECURITY
                ===================================== */}

                <div className="reset-security">

                    <FaShieldAlt />

                    <span>
                        Secure HMS Password Recovery
                    </span>

                </div>

            </div>

        </div>

    );
}

export default ResetPassword;