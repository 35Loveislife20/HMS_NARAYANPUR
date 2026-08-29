import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaUser,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaShieldAlt,
    FaHeartbeat,
    FaTimes,
    FaUserMd,
    FaUserInjured,
    FaFlask,
    FaPills,
    FaCalculator,
    FaUserNurse,
    FaUserTie,
    FaHospitalUser,
    FaChevronDown,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";

import "./LoginModal.css";


// =====================================================
// EXACT 9 HMS ROLES
// =====================================================

const ROLE_CONFIG = {
    super_admin: {
        label: "Super Admin",
        icon: FaUserTie,
    },

    hospital_admin: {
        label: "Hospital Admin",
        icon: FaHospitalUser,
    },

    receptionist: {
        label: "Receptionist",
        icon: FaUser,
    },

    doctor: {
        label: "Doctor",
        icon: FaUserMd,
    },

    lab_technician: {
        label: "Lab Technician",
        icon: FaFlask,
    },

    pharmacist: {
        label: "Pharmacist",
        icon: FaPills,
    },

    accountant: {
        label: "Accountant",
        icon: FaCalculator,
    },

    nurse: {
        label: "Nurse",
        icon: FaUserNurse,
    },

    patient: {
        label: "Patient",
        icon: FaUserInjured,
    },
};


// =====================================================
// ROLE ORDER
// =====================================================

const ROLE_OPTIONS = [
    "super_admin",
    "hospital_admin",
    "receptionist",
    "doctor",
    "lab_technician",
    "pharmacist",
    "accountant",
    "nurse",
    "patient",
];


// =====================================================
// ROLE NORMALIZER
// =====================================================

const normalizeRole = (role) => {
    if (typeof role !== "string") {
        return "";
    }

    return role
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
};


// =====================================================
// LOGIN MODAL
// =====================================================

function LoginModal({ onClose }) {

    const navigate = useNavigate();

    const { login } = useAuth();


    // =================================================
    // STATE
    // =================================================

    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        role: "super_admin",
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");


    // =================================================
    // SELECTED ROLE
    // =================================================

    const selectedRole = useMemo(() => {
        return (
            ROLE_CONFIG[formData.role] ||
            ROLE_CONFIG.super_admin
        );
    }, [formData.role]);


    // =================================================
    // SUPER ADMIN CHECK
    // =================================================

    const isSuperAdmin =
        formData.role === "super_admin";


    // =================================================
    // ESC KEY
    // =================================================

    useEffect(() => {

        const handleEscape = (event) => {

            if (
                event.key === "Escape" &&
                !loading
            ) {
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

    }, [onClose, loading]);


    // =================================================
    // HANDLE INPUT
    // =================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError("");
    };


    // =================================================
    // HANDLE ROLE
    // =================================================

    const handleRoleChange = (event) => {

        const role = normalizeRole(
            event.target.value
        );

        if (!ROLE_CONFIG[role]) {
            return;
        }

        setFormData((previous) => ({
            ...previous,
            role,
        }));

        setError("");
    };


    // =================================================
    // FORGOT PASSWORD
    // =================================================

    const handleForgotPassword = () => {

        if (loading) {
            return;
        }

        onClose();

        navigate(
            "/forgot-password"
        );
    };


    // =================================================
    // REGISTER
    // ONLY SUPER ADMIN
    // =================================================

    const handleRegister = () => {

        if (
            loading ||
            !isSuperAdmin
        ) {
            return;
        }

        onClose();

        navigate("/register");
    };


    // =================================================
    // LOGIN SUBMIT
    // =================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");


        // -------------------------------------------------
        // ROLE
        // -------------------------------------------------

        const selectedRoleName =
            normalizeRole(formData.role);

        if (
            !ROLE_CONFIG[selectedRoleName]
        ) {
            setError(
                "Please select a valid HMS role."
            );

            return;
        }


        // -------------------------------------------------
        // EMAIL
        // -------------------------------------------------

        const email =
            formData.email.trim();

        if (!email) {
            setError(
                "Please enter your email address."
            );

            return;
        }


        // -------------------------------------------------
        // PASSWORD
        // -------------------------------------------------

        if (!formData.password) {
            setError(
                "Please enter your password."
            );

            return;
        }


        setLoading(true);


        try {

            // =================================================
            // AUTH CONTEXT
            // =================================================

            const response = await login(
                email,
                formData.password
            );


            // =================================================
            // RESPONSE VALIDATION
            // =================================================

            if (
                !response ||
                !response.success ||
                !response.token ||
                !response.user
            ) {
                throw new Error(
                    response?.message ||
                    "Login failed. Please check your credentials."
                );
            }


            // =================================================
            // BACKEND ROLE
            // =================================================

            const actualRole =
                normalizeRole(
                    response.user.role
                );


            if (
                !ROLE_CONFIG[actualRole]
            ) {
                throw new Error(
                    "Your account has an invalid HMS role."
                );
            }


            // =================================================
            // ROLE SECURITY CHECK
            // =================================================

            if (
                actualRole !==
                selectedRoleName
            ) {

                throw new Error(
                    `Selected role is "${ROLE_CONFIG[selectedRoleName].label}", but this account is registered as "${ROLE_CONFIG[actualRole].label}". Please select the correct role.`
                );
            }


            // =================================================
            // SUCCESS
            // =================================================

            console.log(
                "HMS Login Successful:",
                {
                    user: response.user,
                    role: actualRole,
                }
            );


            // Close modal

            onClose();


            // All roles -> dashboard

            navigate(
                "/dashboard",
                {
                    replace: true,
                }
            );

        } catch (loginError) {

            console.error(
                "HMS LOGIN ERROR:",
                loginError
            );

            setError(
                loginError?.message ||
                "Unable to connect to HMS server."
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // UI
    // =====================================================

    return (
        <div
            className="login-modal-overlay"
            onClick={() => {

                if (!loading) {
                    onClose();
                }

            }}
        >

            <div
                className="login-modal"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >

                {/* =================================================
                    CLOSE
                ================================================= */}

                <button
                    type="button"
                    className="login-modal-close"
                    onClick={onClose}
                    disabled={loading}
                    aria-label="Close login modal"
                >
                    <FaTimes />
                </button>


                {/* =================================================
                    LOGO
                ================================================= */}

                <div className="modal-logo">
                    <FaHeartbeat />
                </div>


                <h2>
                    HMS
                </h2>


                <p className="modal-subtitle">
                    Hospital Management System
                </p>


                {/* =================================================
                    SIGN IN
                ================================================= */}

                <div className="modal-heading">
                    <span>
                        SIGN IN
                    </span>
                </div>


                {/* =================================================
                    FORM
                ================================================= */}

                <form
                    className="modal-form"
                    onSubmit={handleSubmit}
                >

                    {/* =================================================
                        ROLE - FIRST
                    ================================================= */}

                    <div className="modal-field">

                        <label>
                            Select Role
                        </label>

                        <div className="modal-input modal-role-input">

                            <selectedRole.icon />

                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleRoleChange}
                                disabled={loading}
                                aria-label="Select HMS role"
                                required
                            >

                                {ROLE_OPTIONS.map(
                                    (role) => {

                                        const config =
                                            ROLE_CONFIG[role];

                                        return (
                                            <option
                                                key={role}
                                                value={role}
                                            >
                                                {config.label}
                                            </option>
                                        );
                                    }
                                )}

                            </select>

                            <FaChevronDown
                                className="modal-role-arrow"
                            />

                        </div>

                    </div>


                    {/* =================================================
                        SELECTED ROLE
                    ================================================= */}

                    <div className="modal-selected-role">

                        <span>
                            Signing in as
                        </span>

                        <strong>
                            {selectedRole.label}
                        </strong>

                    </div>


                    {/* =================================================
                        EMAIL
                    ================================================= */}

                    <div className="modal-field">

                        <label>
                            Email Address
                        </label>

                        <div className="modal-input">

                            <FaUser />

                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                disabled={loading}
                                required
                            />

                        </div>

                    </div>


                    {/* =================================================
                        PASSWORD
                    ================================================= */}

                    <div className="modal-field">

                        <label>
                            Password
                        </label>

                        <div className="modal-input">

                            <FaLock />

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                disabled={loading}
                                required
                            />

                            <button
                                type="button"
                                className="modal-eye"
                                onClick={() =>
                                    setShowPassword(
                                        (previous) =>
                                            !previous
                                    )
                                }
                                disabled={loading}
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

                    </div>


                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (

                        <div
                            className="modal-error"
                            role="alert"
                        >
                            <span>⚠</span>

                            <span>
                                {error}
                            </span>
                        </div>

                    )}


                    {/* =================================================
                        OPTIONS
                    ================================================= */}

                    <div
                        className={
                            isSuperAdmin
                                ? "modal-options"
                                : "modal-options modal-options-single"
                        }
                    >

                        {/* FORGOT - EVERY ROLE */}

                        <button
                            type="button"
                            onClick={
                                handleForgotPassword
                            }
                            disabled={loading}
                        >
                            Forgot Password?
                        </button>


                        {/* REGISTER - SUPER ADMIN ONLY */}

                        {isSuperAdmin && (

                            <button
                                type="button"
                                onClick={
                                    handleRegister
                                }
                                disabled={loading}
                            >
                                Register
                            </button>

                        )}

                    </div>


                    {/* =================================================
                        LOGIN
                    ================================================= */}

                    <button
                        type="submit"
                        className="modal-login-button"
                        disabled={loading}
                    >

                        {loading ? (
                            <>
                                <span className="login-spinner" />
                                Signing in...
                            </>
                        ) : (
                            "Login"
                        )}

                    </button>


                    {/* =================================================
                        OR
                    ================================================= */}

                    <div className="modal-or">
                        <span>
                            OR
                        </span>
                    </div>


                    {/* =================================================
                        SECURITY
                    ================================================= */}

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