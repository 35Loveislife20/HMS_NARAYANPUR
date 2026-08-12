import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
    FaUser,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaShieldAlt,
    FaHeartbeat,
    FaTimes,
} from "react-icons/fa";

import "./LoginModal.css";


function LoginModal({ onClose }) {

    const navigate = useNavigate();

    const [showPassword, setShowPassword] =
        useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");


    /* =========================
       ESC KEY CLOSE
    ========================= */

    useEffect(() => {

        const handleEscape = (e) => {

            if (e.key === "Escape") {
                onClose();
            }

        };

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {

            document.removeEventListener(
                "keydown",
                handleEscape
            );

        };

    }, [onClose]);


    /* =========================
       INPUT CHANGE
    ========================= */

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

        setError("");
    };


    /* =========================
       LOGIN
    ========================= */

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);

        setError("");


        try {

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                    }),
                }
            );


            const data = await response.json();


            if (!response.ok) {

                setError(
                    data.message ||
                    "Invalid email or password"
                );

                return;
            }


            /* SAVE TOKEN */

            if (data.token) {

                localStorage.setItem(
                    "hms_token",
                    data.token
                );

            }


            /* SAVE USER */

            if (data.user) {

                localStorage.setItem(
                    "hms_user",
                    JSON.stringify(data.user)
                );

            }


            /* CLOSE MODAL */

            onClose();


            /* DASHBOARD */

            navigate("/dashboard");


        } catch (err) {

            console.error(
                "LOGIN ERROR:",
                err
            );

            setError(
                "Unable to connect to HMS server."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div
            className="login-modal-overlay"
            onClick={onClose}
        >

            <div
                className="login-modal"
                onClick={(e) =>
                    e.stopPropagation()
                }
            >


                {/* CLOSE */}

                <button
                    type="button"
                    className="login-modal-close"
                    onClick={onClose}
                    aria-label="Close login"
                >

                    <FaTimes />

                </button>


                {/* LOGO */}

                <div className="modal-logo">

                    <FaHeartbeat />

                </div>


                <h2>
                    HMS
                </h2>


                <p className="modal-subtitle">

                    Hospital Management System

                </p>


                {/* SIGN IN */}

                <div className="modal-heading">

                    <span>
                        SIGN IN
                    </span>

                </div>


                {/* FORM */}

                <form
                    className="modal-form"
                    onSubmit={handleSubmit}
                >


                    {/* EMAIL */}

                    <div className="modal-input">

                        <FaUser />

                        <input
                            type="email"
                            name="email"
                            placeholder="Username / Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                        />

                    </div>


                    {/* PASSWORD */}

                    <div className="modal-input">

                        <FaLock />

                        <input
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                        />


                        <button
                            type="button"
                            className="modal-eye"
                            onClick={() =>
                                setShowPassword(
                                    !showPassword
                                )
                            }
                        >

                            {showPassword ? (
                                <FaEyeSlash />
                            ) : (
                                <FaEye />
                            )}

                        </button>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="modal-error">

                            ⚠ {error}

                        </div>

                    )}


                    {/* OPTIONS */}

                    <div className="modal-options">

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/forgot-password"
                                )
                            }
                        >
                            Forgot Password?
                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/register"
                                )
                            }
                        >
                            Signup
                        </button>

                    </div>


                    {/* LOGIN */}

                    <button
                        type="submit"
                        className="modal-login-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Signing in..."
                            : "Login"
                        }

                    </button>


                    {/* OR */}

                    <div className="modal-or">

                        <span>
                            OR
                        </span>

                    </div>


                    {/* SECURITY */}

                    <div className="modal-security">

                        <FaShieldAlt />

                        <span>
                            Secure Login
                        </span>

                        <span>
                            • Your data is protected
                        </span>

                    </div>


                </form>

            </div>

        </div>

    );
}


export default LoginModal;