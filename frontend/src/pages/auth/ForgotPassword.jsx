import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaArrowLeft,
    FaEnvelope,
    FaHeartbeat,
    FaShieldAlt,
    FaCheckCircle,
    FaExclamationTriangle,
} from "react-icons/fa";

import "./ForgotPassword.css";

// =====================================================
// API CONFIGURATION
// =====================================================

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

// =====================================================
// FORGOT PASSWORD
// =====================================================

function ForgotPassword() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // =====================================================
    // INPUT CHANGE
    // =====================================================

    const handleEmailChange = (e) => {

        setEmail(e.target.value);

        setError("");
        setMessage("");
        setSuccess(false);

    };

    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setMessage("");
        setSuccess(false);

        const normalizedEmail =
            email.trim().toLowerCase();

        // -------------------------------------------------
        // VALIDATE EMAIL
        // -------------------------------------------------

        if (!normalizedEmail) {

            setError(
                "Please enter your email address."
            );

            return;
        }

        // -------------------------------------------------
        // FINAL API URL
        // -------------------------------------------------

        const forgotPasswordUrl =
            `${API_URL}/auth/forgot-password`;

        // -------------------------------------------------
        // DEBUG LOGS
        // -------------------------------------------------

        console.log(
            "========================================"
        );

        console.log(
            "🔐 HMS FORGOT PASSWORD"
        );

        console.log(
            "🌐 API BASE:",
            API_URL
        );

        console.log(
            "📡 API URL:",
            forgotPasswordUrl
        );

        console.log(
            "📧 Email:",
            normalizedEmail
        );

        console.log(
            "🚀 Sending request..."
        );

        console.log(
            "========================================"
        );

        setLoading(true);

        try {

            // -------------------------------------------------
            // SEND REQUEST
            // -------------------------------------------------

            const response =
                await fetch(
                    forgotPasswordUrl,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                email:
                                    normalizedEmail,
                            }),
                    }
                );

            // -------------------------------------------------
            // RESPONSE LOG
            // -------------------------------------------------

            console.log(
                "📥 Backend Response Status:",
                response.status
            );

            console.log(
                "📥 Backend Response OK:",
                response.ok
            );

            console.log(
                "📥 Backend Response URL:",
                response.url
            );

            // -------------------------------------------------
            // CONTENT TYPE
            // -------------------------------------------------

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            console.log(
                "📦 Response Content-Type:",
                contentType
            );

            let data;

            // -------------------------------------------------
            // JSON RESPONSE
            // -------------------------------------------------

            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            }

            // -------------------------------------------------
            // NON JSON RESPONSE
            // -------------------------------------------------

            else {

                const text =
                    await response.text();

                console.error(
                    "❌ Non-JSON Backend Response:",
                    text
                );

                throw new Error(
                    text ||
                    `Server returned HTTP ${response.status}`
                );
            }

            // -------------------------------------------------
            // RESPONSE DATA
            // -------------------------------------------------

            console.log(
                "📨 Backend Response Data:",
                data
            );

            // -------------------------------------------------
            // ERROR RESPONSE
            // -------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    `Request failed with status ${response.status}`
                );
            }

            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            console.log(
                "========================================"
            );

            console.log(
                "✅ FORGOT PASSWORD REQUEST SUCCESS"
            );

            console.log(
                "📧 Reset email request accepted"
            );

            console.log(
                "========================================"
            );

            setSuccess(true);

            setMessage(
                data?.message ||
                "Password reset instructions have been sent to your email."
            );

        } catch (err) {

            // -------------------------------------------------
            // ERROR LOG
            // -------------------------------------------------

            console.error(
                "========================================"
            );

            console.error(
                "❌ FORGOT PASSWORD REQUEST FAILED"
            );

            console.error(
                "Error:",
                err
            );

            console.error(
                "Error Message:",
                err?.message
            );

            console.error(
                "API URL:",
                forgotPasswordUrl
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

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="forgot-page">

            {/* =================================================
                BACKGROUND
            ================================================= */}

            <div className="forgot-background-grid" />

            {/* =================================================
                CARD
            ================================================= */}

            <div className="forgot-card">

                {/* =================================================
                    BACK BUTTON
                ================================================= */}

                <button
                    type="button"
                    className="forgot-back-button"
                    onClick={() => navigate("/")}
                >

                    <FaArrowLeft />

                    <span>
                        Back to HMS
                    </span>

                </button>


                {/* =================================================
                    LOGO
                ================================================= */}

                <div className="forgot-logo">

                    <FaHeartbeat />

                </div>


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="forgot-header">

                    <h1>
                        Forgot Password?
                    </h1>

                    <p>
                        Enter your registered email address
                        and we'll help you reset your password.
                    </p>

                </div>


                {/* =================================================
                    SUCCESS
                ================================================= */}

                {success ? (

                    <div className="forgot-success">

                        <FaCheckCircle />

                        <h3>
                            Request Submitted
                        </h3>

                        <p>
                            {message}
                        </p>

                        <button
                            type="button"
                            className="forgot-login-button"
                            onClick={() => navigate("/")}
                        >
                            Return to Login
                        </button>

                    </div>

                ) : (

                    <form
                        className="forgot-form"
                        onSubmit={handleSubmit}
                    >

                        {/* =================================================
                            EMAIL LABEL
                        ================================================= */}

                        <label
                            htmlFor="forgot-email"
                        >
                            Email Address
                        </label>


                        {/* =================================================
                            EMAIL INPUT
                        ================================================= */}

                        <div className="forgot-input">

                            <FaEnvelope />

                            <input
                                id="forgot-email"
                                type="email"
                                name="email"
                                value={email}
                                onChange={
                                    handleEmailChange
                                }
                                placeholder="Enter your email"
                                autoComplete="email"
                                required
                                disabled={loading}
                            />

                        </div>


                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {error && (

                            <div className="forgot-error">

                                <FaExclamationTriangle />

                                <span>
                                    {error}
                                </span>

                            </div>

                        )}


                        {/* =================================================
                            SUBMIT BUTTON
                        ================================================= */}

                        <button
                            type="submit"
                            className="forgot-submit"
                            disabled={loading}
                        >

                            {loading
                                ? "Sending..."
                                : "Send Reset Instructions"
                            }

                        </button>


                        {/* =================================================
                            LOGIN LINK
                        ================================================= */}

                        <button
                            type="button"
                            className="forgot-login-link"
                            onClick={() => navigate("/")}
                            disabled={loading}
                        >

                            Remember your password?

                            <strong>
                                {" "}Login
                            </strong>

                        </button>

                    </form>

                )}


                {/* =================================================
                    SECURITY
                ================================================= */}

                <div className="forgot-security">

                    <FaShieldAlt />

                    <span>
                        Secure HMS Password Recovery
                    </span>

                </div>

            </div>

        </div>
    );
}


// =====================================================
// EXPORT
// =====================================================

export default ForgotPassword;