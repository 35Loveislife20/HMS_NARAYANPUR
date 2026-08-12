import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    FaUser,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaShieldAlt,
} from "react-icons/fa";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

        setError("");
    };

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
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                    }),
                }
            );

            const data = await response.json();

            console.log("LOGIN RESPONSE:", data);

            if (!response.ok) {
                setError(
                    data.message || "Invalid email or password"
                );
                return;
            }

            if (data.token) {
                localStorage.setItem(
                    "hms_token",
                    data.token
                );
            }

            if (data.user) {
                localStorage.setItem(
                    "hms_user",
                    JSON.stringify(data.user)
                );
            }

            navigate("/dashboard");

        } catch (err) {
            console.error("LOGIN ERROR:", err);

            setError(
                "Unable to connect to HMS server. Please check backend."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">

            <section className="login-card">

                <div className="login-logo">
                    <div className="login-logo-icon">
                        +
                    </div>
                </div>

                <h1 className="login-title">
                    HMS
                </h1>

                <p className="login-subtitle">
                    Hospital Management System
                </p>

                <div className="login-heading">
                    <span>SIGN IN</span>
                </div>

                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >

                    {/* EMAIL */}

                    <div className="input-group">

                        <FaUser className="input-icon" />

                        <input
                            type="email"
                            name="email"
                            placeholder="Username / Email"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                        />

                    </div>

                    {/* PASSWORD */}

                    <div className="input-group">

                        <FaLock className="input-icon" />

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
                            autoComplete="current-password"
                            required
                        />

                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() =>
                                setShowPassword(!showPassword)
                            }
                            aria-label={
                                showPassword
                                    ? "Hide password"
                                    : "Show password"
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
                        <div className="login-error">
                            ⚠ {error}
                        </div>
                    )}

                    {/* OPTIONS */}

                    <div className="login-options">

                        <Link to="/forgot-password">
                            Forgot Password?
                        </Link>

                        <Link to="/register">
                            Signup
                        </Link>

                    </div>

                    {/* LOGIN */}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Login"}
                    </button>

                    {/* OR */}

                    <div className="login-or">
                        <span>OR</span>
                    </div>

                    {/* SECURITY */}

                    <div className="login-security">

                        <FaShieldAlt />

                        <span>
                            Secure Login
                        </span>

                        <span>
                            • Your data is protected
                        </span>

                    </div>

                </form>

            </section>

        </main>
    );
}

export default Login;