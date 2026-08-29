import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaHeartbeat,
    FaArrowLeft,
    FaShieldAlt,
    FaCheckCircle,
    FaExclamationTriangle,
} from "react-icons/fa";

import "./Register.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

// =====================================================
// EXACT 9 ROLES
// =====================================================

const ROLES = [
    {
        value: "super_admin",
        label: "Super Admin",
    },
    {
        value: "hospital_admin",
        label: "Hospital Admin",
    },
    {
        value: "receptionist",
        label: "Receptionist",
    },
    {
        value: "doctor",
        label: "Doctor",
    },
    {
        value: "lab_technician",
        label: "Lab Technician",
    },
    {
        value: "pharmacist",
        label: "Pharmacist",
    },
    {
        value: "accountant",
        label: "Accountant",
    },
    {
        value: "nurse",
        label: "Nurse",
    },
    {
        value: "patient",
        label: "Patient",
    },
];

function Register() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "patient",
    });

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


    // =====================================================
    // INPUT CHANGE
    // =====================================================

    const handleChange = (e) => {

        const {
            name,
            value,
        } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError("");
    };


    // =====================================================
    // VALIDATE
    // =====================================================

    const validateForm = () => {

        const name =
            formData.name.trim();

        const email =
            formData.email.trim().toLowerCase();

        const phone =
            formData.phone.trim();

        const password =
            formData.password;

        const confirmPassword =
            formData.confirmPassword;

        const role =
            formData.role;


        if (!name) {
            return "Full name is required.";
        }

        if (name.length < 2) {
            return "Name must contain at least 2 characters.";
        }

        if (!email) {
            return "Email address is required.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return "Please enter a valid email address.";
        }

        if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
            return "Please enter a valid phone number.";
        }

        if (!password) {
            return "Password is required.";
        }

        if (password.length < 6) {
            return "Password must contain at least 6 characters.";
        }

        if (password !== confirmPassword) {
            return "Passwords do not match.";
        }

        if (
            !ROLES.some(
                (item) => item.value === role
            )
        ) {
            return "Please select a valid role.";
        }

        return null;
    };


    // =====================================================
    // REGISTER
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        setSuccess(false);


        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }


        setLoading(true);


        try {

            const response =
                await fetch(
                    `${API_URL}/auth/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            name:
                                formData.name.trim(),

                            email:
                                formData.email
                                    .trim()
                                    .toLowerCase(),

                            phone:
                                formData.phone.trim() ||
                                null,

                            password:
                                formData.password,

                            role:
                                formData.role,
                        }),
                    }
                );


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


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    `Registration failed with status ${response.status}`
                );
            }


            setSuccess(true);

        } catch (err) {

            console.error(
                "REGISTER ERROR:",
                err
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
    // LOGIN
    // =====================================================

    const handleLogin = () => {

        navigate("/");

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="register-page">

            {/* BACKGROUND */}

            <div className="register-background-grid" />


            {/* REGISTER CARD */}

            <div className="register-card">

                {/* BACK */}

                <button
                    type="button"
                    className="register-back-button"
                    onClick={() => navigate("/")}
                >

                    <FaArrowLeft />

                    <span>
                        Back to HMS
                    </span>

                </button>


                {/* LOGO */}

                <div className="register-logo">

                    <FaHeartbeat />

                </div>


                {/* HEADER */}

                <div className="register-header">

                    <h1>
                        Create HMS Account
                    </h1>

                    <p>
                        Register a new account for
                        Hospital Management System
                    </p>

                </div>


                {/* SUCCESS */}

                {success ? (

                    <div className="register-success">

                        <FaCheckCircle />

                        <h3>
                            Registration Successful
                        </h3>

                        <p>
                            Your HMS account has been
                            created successfully.
                        </p>

                        <button
                            type="button"
                            className="register-login-button"
                            onClick={handleLogin}
                        >
                            Go to Login
                        </button>

                    </div>

                ) : (

                    <form
                        className="register-form"
                        onSubmit={handleSubmit}
                    >

                        {/* NAME */}

                        <label htmlFor="register-name">
                            Full Name
                        </label>

                        <div className="register-input">

                            <FaUser />

                            <input
                                id="register-name"
                                type="text"
                                name="name"
                                placeholder="Enter full name"
                                value={formData.name}
                                onChange={handleChange}
                                autoComplete="name"
                                required
                            />

                        </div>


                        {/* EMAIL */}

                        <label htmlFor="register-email">
                            Email Address
                        </label>

                        <div className="register-input">

                            <FaEnvelope />

                            <input
                                id="register-email"
                                type="email"
                                name="email"
                                placeholder="Enter email address"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                required
                            />

                        </div>


                        {/* PHONE */}

                        <label htmlFor="register-phone">
                            Phone Number
                            <span>
                                {" "}(Optional)
                            </span>
                        </label>

                        <div className="register-input">

                            <FaPhone />

                            <input
                                id="register-phone"
                                type="tel"
                                name="phone"
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={handleChange}
                                autoComplete="tel"
                            />

                        </div>


                        {/* ROLE */}

                        <label htmlFor="register-role">
                            Account Role
                        </label>

                        <div className="register-select">

                            <FaShieldAlt />

                            <select
                                id="register-role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >

                                {ROLES.map((role) => (

                                    <option
                                        key={role.value}
                                        value={role.value}
                                    >
                                        {role.label}
                                    </option>

                                ))}

                            </select>

                        </div>


                        {/* PASSWORD */}

                        <label htmlFor="register-password">
                            Password
                        </label>

                        <div className="register-input">

                            <FaLock />

                            <input
                                id="register-password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                name="password"
                                placeholder="Create password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />

                            <button
                                type="button"
                                className="register-eye"
                                onClick={() =>
                                    setShowPassword(
                                        (previous) =>
                                            !previous
                                    )
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >

                                {showPassword
                                    ? <FaEyeSlash />
                                    : <FaEye />
                                }

                            </button>

                        </div>


                        {/* CONFIRM PASSWORD */}

                        <label htmlFor="register-confirm-password">
                            Confirm Password
                        </label>

                        <div className="register-input">

                            <FaLock />

                            <input
                                id="register-confirm-password"
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                name="confirmPassword"
                                placeholder="Confirm password"
                                value={
                                    formData.confirmPassword
                                }
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />

                            <button
                                type="button"
                                className="register-eye"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        (previous) =>
                                            !previous
                                    )
                                }
                                aria-label={
                                    showConfirmPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >

                                {showConfirmPassword
                                    ? <FaEyeSlash />
                                    : <FaEye />
                                }

                            </button>

                        </div>


                        {/* ERROR */}

                        {error && (

                            <div className="register-error">

                                <FaExclamationTriangle />

                                <span>
                                    {error}
                                </span>

                            </div>

                        )}


                        {/* REGISTER BUTTON */}

                        <button
                            type="submit"
                            className="register-submit"
                            disabled={loading}
                        >

                            {loading
                                ? "Creating Account..."
                                : "Create Account"
                            }

                        </button>


                        {/* LOGIN */}

                        <div className="register-login-link">

                            <span>
                                Already have an account?
                            </span>

                            <button
                                type="button"
                                onClick={handleLogin}
                            >
                                Login
                            </button>

                        </div>

                    </form>

                )}


                {/* SECURITY */}

                <div className="register-security">

                    <FaShieldAlt />

                    <span>
                        Secure HMS Account Registration
                    </span>

                </div>

            </div>

        </div>
    );
}

export default Register;