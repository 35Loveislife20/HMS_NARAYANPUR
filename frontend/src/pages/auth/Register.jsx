import { useEffect, useState } from "react";
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
    FaHospital,
    FaCalendarAlt,
    FaVenusMars,
    FaMapMarkerAlt,
    FaTint,
    FaPhoneAlt,
} from "react-icons/fa";

import "./Register.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

function Register() {
    const navigate = useNavigate();

    // =====================================================
    // FORM
    // =====================================================

    const [formData, setFormData] = useState({
        hospital_id: "",
        name: "",
        date_of_birth: "",
        gender: "",
        phone: "",
        email: "",
        address: "",
        blood_group: "",
        emergency_contact: "",
        password: "",
        confirmPassword: "",
    });

    // =====================================================
    // HOSPITALS
    // =====================================================

    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(true);

    // =====================================================
    // UI STATES
    // =====================================================

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // =====================================================
    // LOAD ACTIVE HOSPITALS
    // =====================================================

    useEffect(() => {
        const controller = new AbortController();

        const loadHospitals = async () => {
            try {
                setLoadingHospitals(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/hospitals`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        signal: controller.signal,
                    }
                );

                const contentType =
                    response.headers.get("content-type") || "";

                let data;

                if (
                    contentType.includes(
                        "application/json"
                    )
                ) {
                    data = await response.json();
                } else {
                    const text = await response.text();

                    throw new Error(
                        text ||
                            `Server returned HTTP ${response.status}`
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            "Unable to load hospitals."
                    );
                }

                const hospitalList =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(data?.hospitals)
                        ? data.hospitals
                        : Array.isArray(data?.data)
                        ? data.data
                        : [];

                const activeHospitals =
                    hospitalList.filter(
                        (hospital) =>
                            hospital?.status !==
                                "inactive" &&
                            hospital?.status !== false
                    );

                setHospitals(activeHospitals);
            } catch (err) {
                if (
                    err?.name ===
                    "AbortError"
                ) {
                    return;
                }

                console.error(
                    "HOSPITAL LOAD ERROR:",
                    err
                );

                setError(
                    err?.message ||
                        "Unable to load hospitals."
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingHospitals(false);
                }
            }
        };

        loadHospitals();

        return () => {
            controller.abort();
        };
    }, []);

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
    // VALIDATE FORM
    // =====================================================

    const validateForm = () => {
        const name =
            formData.name.trim();

        const email =
            formData.email
                .trim()
                .toLowerCase();

        const phone =
            formData.phone.trim();

        const address =
            formData.address.trim();

        const emergencyContact =
            formData.emergency_contact.trim();

        const password =
            formData.password;

        const confirmPassword =
            formData.confirmPassword;

        // -------------------------------------------------
        // HOSPITAL
        // -------------------------------------------------

        if (!formData.hospital_id) {
            return "Please select a hospital.";
        }

        // -------------------------------------------------
        // NAME
        // -------------------------------------------------

        if (!name) {
            return "Full name is required.";
        }

        if (name.length < 2) {
            return "Name must contain at least 2 characters.";
        }

        // -------------------------------------------------
        // DATE OF BIRTH
        // -------------------------------------------------

        if (!formData.date_of_birth) {
            return "Date of birth is required.";
        }

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(
                formData.date_of_birth
            )
        ) {
            return "Please enter a valid date of birth.";
        }

        const selectedDate =
            new Date(
                `${formData.date_of_birth}T00:00:00`
            );

        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        if (
            Number.isNaN(
                selectedDate.getTime()
            )
        ) {
            return "Please enter a valid date of birth.";
        }

        if (selectedDate > today) {
            return "Date of birth cannot be in the future.";
        }

        // -------------------------------------------------
        // GENDER
        // -------------------------------------------------

        if (!formData.gender) {
            return "Please select your gender.";
        }

        if (
            ![
                "male",
                "female",
                "other",
            ].includes(formData.gender)
        ) {
            return "Please select a valid gender.";
        }

        // -------------------------------------------------
        // PHONE
        // -------------------------------------------------

        if (!phone) {
            return "Mobile number is required.";
        }

        if (!/^\d{10}$/.test(phone)) {
            return "Mobile number must contain exactly 10 digits.";
        }

        // -------------------------------------------------
        // EMAIL
        // -------------------------------------------------

        if (!email) {
            return "Email address is required.";
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email
            )
        ) {
            return "Please enter a valid email address.";
        }

        // -------------------------------------------------
        // ADDRESS
        // -------------------------------------------------

        if (!address) {
            return "Address is required.";
        }

        if (address.length < 5) {
            return "Please enter a complete address.";
        }

        // -------------------------------------------------
        // EMERGENCY CONTACT
        // -------------------------------------------------

        if (emergencyContact) {
            if (
                !/^\d{10}$/.test(
                    emergencyContact
                )
            ) {
                return "Emergency contact must contain exactly 10 digits.";
            }
        }

        // -------------------------------------------------
        // PASSWORD
        // -------------------------------------------------

        if (!password) {
            return "Password is required.";
        }

        if (password.length < 6) {
            return "Password must contain at least 6 characters.";
        }

        if (
            password !==
            confirmPassword
        ) {
            return "Passwords do not match.";
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
                            hospital_id:
                                Number(
                                    formData.hospital_id
                                ),

                            name:
                                formData.name.trim(),

                            date_of_birth:
                                formData.date_of_birth,

                            gender:
                                formData.gender,

                            phone:
                                formData.phone.trim(),

                            email:
                                formData.email
                                    .trim()
                                    .toLowerCase(),

                            address:
                                formData.address.trim(),

                            blood_group:
                                formData.blood_group ||
                                null,

                            emergency_contact:
                                formData.emergency_contact.trim() ||
                                null,

                            password:
                                formData.password,

                            confirmPassword:
                                formData.confirmPassword,
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
                        "Registration failed."
                );
            }

            // =================================================
            // SAVE AUTH DATA
            // =================================================

            if (data?.token) {
                localStorage.setItem(
                    "hms_token",
                    data.token
                );

                localStorage.setItem(
                    "token",
                    data.token
                );

                localStorage.setItem(
                    "authToken",
                    data.token
                );
            }

            if (data?.user) {
                localStorage.setItem(
                    "hms_user",
                    JSON.stringify(
                        data.user
                    )
                );

                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        data.user
                    )
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
    // PATIENT PORTAL
    // =====================================================

    const handlePatientPortal = () => {
        navigate("/patient-portal");
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="register-page">

            {/* =========================================
                BACKGROUND
            ========================================== */}

            <div className="register-background-grid" />

            {/* =========================================
                REGISTER CARD
            ========================================== */}

            <div className="register-card">

                {/* BACK */}

                <button
                    type="button"
                    className="register-back-button"
                    onClick={() =>
                        navigate("/")
                    }
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
                        Patient Registration
                    </h1>

                    <p>
                        Create your secure HMS
                        patient account
                    </p>

                </div>

                {/* =====================================
                    SUCCESS
                ====================================== */}

                {success ? (

                    <div className="register-success">

                        <FaCheckCircle />

                        <h3>
                            Registration Successful
                        </h3>

                        <p>
                            Your patient account has
                            been created successfully.
                        </p>

                        <p>
                            You can now access your
                            Patient Portal and book
                            appointments.
                        </p>

                        <button
                            type="button"
                            className="register-login-button"
                            onClick={
                                handlePatientPortal
                            }
                        >
                            Open Patient Portal
                        </button>

                        <button
                            type="button"
                            className="register-login-button"
                            onClick={
                                handleLogin
                            }
                            style={{
                                marginTop:
                                    "10px",
                            }}
                        >
                            Go to Login
                        </button>

                    </div>

                ) : (

                    <form
                        className="register-form"
                        onSubmit={
                            handleSubmit
                        }
                    >

                        {/* =================================
                            HOSPITAL
                        ================================== */}

                        <label htmlFor="register-hospital">
                            Select Hospital
                        </label>

                        <div className="register-select">

                            <FaHospital />

                            <select
                                id="register-hospital"
                                name="hospital_id"
                                value={
                                    formData.hospital_id
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                disabled={
                                    loadingHospitals
                                }
                            >

                                <option value="">
                                    {loadingHospitals
                                        ? "Loading hospitals..."
                                        : "Select your hospital"}
                                </option>

                                {hospitals.map(
                                    (hospital) => (
                                        <option
                                            key={
                                                hospital.id
                                            }
                                            value={
                                                hospital.id
                                            }
                                        >
                                            {hospital.name}
                                            {hospital.city
                                                ? ` - ${hospital.city}`
                                                : ""}
                                        </option>
                                    )
                                )}

                            </select>

                        </div>

                        {/* =================================
                            FULL NAME
                        ================================== */}

                        <label htmlFor="register-name">
                            Full Name
                        </label>

                        <div className="register-input">

                            <FaUser />

                            <input
                                id="register-name"
                                type="text"
                                name="name"
                                placeholder="Enter your full name"
                                value={
                                    formData.name
                                }
                                onChange={
                                    handleChange
                                }
                                autoComplete="name"
                                required
                            />

                        </div>

                        {/* =================================
                            DATE OF BIRTH
                        ================================== */}

                        <label htmlFor="register-dob">
                            Date of Birth
                        </label>

                        <div className="register-input">

                            <FaCalendarAlt />

                            <input
                                id="register-dob"
                                type="date"
                                name="date_of_birth"
                                value={
                                    formData.date_of_birth
                                }
                                onChange={
                                    handleChange
                                }
                                max={
                                    new Date()
                                        .toISOString()
                                        .split("T")[0]
                                }
                                required
                            />

                        </div>

                        {/* =================================
                            GENDER
                        ================================== */}

                        <label htmlFor="register-gender">
                            Gender
                        </label>

                        <div className="register-select">

                            <FaVenusMars />

                            <select
                                id="register-gender"
                                name="gender"
                                value={
                                    formData.gender
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            >

                                <option value="">
                                    Select gender
                                </option>

                                <option value="male">
                                    Male
                                </option>

                                <option value="female">
                                    Female
                                </option>

                                <option value="other">
                                    Other
                                </option>

                            </select>

                        </div>

                        {/* =================================
                            PHONE
                        ================================== */}

                        <label htmlFor="register-phone">
                            Mobile Number
                        </label>

                        <div className="register-input">

                            <FaPhone />

                            <input
                                id="register-phone"
                                type="tel"
                                name="phone"
                                placeholder="10-digit mobile number"
                                value={
                                    formData.phone
                                }
                                onChange={(e) => {
                                    const value =
                                        e.target.value.replace(
                                            /\D/g,
                                            ""
                                        );

                                    setFormData(
                                        (
                                            previous
                                        ) => ({
                                            ...previous,
                                            phone:
                                                value.slice(
                                                    0,
                                                    10
                                                ),
                                        })
                                    );

                                    setError("");
                                }}
                                autoComplete="tel"
                                inputMode="numeric"
                                maxLength={10}
                                required
                            />

                        </div>

                        {/* =================================
                            EMAIL
                        ================================== */}

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
                                value={
                                    formData.email
                                }
                                onChange={
                                    handleChange
                                }
                                autoComplete="email"
                                required
                            />

                        </div>

                        {/* =================================
                            ADDRESS
                        ================================== */}

                        <label htmlFor="register-address">
                            Address
                        </label>

                        <div className="register-input">

                            <FaMapMarkerAlt />

                            <input
                                id="register-address"
                                type="text"
                                name="address"
                                placeholder="Enter your complete address"
                                value={
                                    formData.address
                                }
                                onChange={
                                    handleChange
                                }
                                autoComplete="street-address"
                                required
                            />

                        </div>

                        {/* =================================
                            BLOOD GROUP
                        ================================== */}

                        <label htmlFor="register-blood-group">
                            Blood Group
                            <span>
                                {" "}
                                (Optional)
                            </span>
                        </label>

                        <div className="register-select">

                            <FaTint />

                            <select
                                id="register-blood-group"
                                name="blood_group"
                                value={
                                    formData.blood_group
                                }
                                onChange={
                                    handleChange
                                }
                            >

                                <option value="">
                                    Select blood group
                                </option>

                                <option value="A+">
                                    A+
                                </option>

                                <option value="A-">
                                    A-
                                </option>

                                <option value="B+">
                                    B+
                                </option>

                                <option value="B-">
                                    B-
                                </option>

                                <option value="AB+">
                                    AB+
                                </option>

                                <option value="AB-">
                                    AB-
                                </option>

                                <option value="O+">
                                    O+
                                </option>

                                <option value="O-">
                                    O-
                                </option>

                            </select>

                        </div>

                        {/* =================================
                            EMERGENCY CONTACT
                        ================================== */}

                        <label htmlFor="register-emergency-contact">
                            Emergency Contact
                            <span>
                                {" "}
                                (Optional)
                            </span>
                        </label>

                        <div className="register-input">

                            <FaPhoneAlt />

                            <input
                                id="register-emergency-contact"
                                type="tel"
                                name="emergency_contact"
                                placeholder="10-digit emergency contact"
                                value={
                                    formData.emergency_contact
                                }
                                onChange={(e) => {
                                    const value =
                                        e.target.value.replace(
                                            /\D/g,
                                            ""
                                        );

                                    setFormData(
                                        (
                                            previous
                                        ) => ({
                                            ...previous,
                                            emergency_contact:
                                                value.slice(
                                                    0,
                                                    10
                                                ),
                                        })
                                    );

                                    setError("");
                                }}
                                inputMode="numeric"
                                maxLength={10}
                            />

                        </div>

                        {/* =================================
                            PASSWORD
                        ================================== */}

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
                                value={
                                    formData.password
                                }
                                onChange={
                                    handleChange
                                }
                                autoComplete="new-password"
                                required
                            />

                            <button
                                type="button"
                                className="register-eye"
                                onClick={() =>
                                    setShowPassword(
                                        (
                                            previous
                                        ) =>
                                            !previous
                                    )
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

                        {/* =================================
                            CONFIRM PASSWORD
                        ================================== */}

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
                                onChange={
                                    handleChange
                                }
                                autoComplete="new-password"
                                required
                            />

                            <button
                                type="button"
                                className="register-eye"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        (
                                            previous
                                        ) =>
                                            !previous
                                    )
                                }
                                aria-label={
                                    showConfirmPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showConfirmPassword ? (
                                    <FaEyeSlash />
                                ) : (
                                    <FaEye />
                                )}
                            </button>

                        </div>

                        {/* =================================
                            PATIENT ROLE NOTICE
                        ================================== */}

                        <div
                            className="register-security"
                            style={{
                                marginTop:
                                    "4px",
                                marginBottom:
                                    "8px",
                            }}
                        >

                            <FaShieldAlt />

                            <span>
                                Patient account will be
                                securely linked to the
                                selected hospital.
                            </span>

                        </div>

                        {/* =================================
                            ERROR
                        ================================== */}

                        {error && (

                            <div className="register-error">

                                <FaExclamationTriangle />

                                <span>
                                    {error}
                                </span>

                            </div>

                        )}

                        {/* =================================
                            SUBMIT
                        ================================== */}

                        <button
                            type="submit"
                            className="register-submit"
                            disabled={
                                loading ||
                                loadingHospitals
                            }
                        >
                            {loading
                                ? "Creating Patient Account..."
                                : "Create Patient Account"}
                        </button>

                        {/* =================================
                            LOGIN
                        ================================== */}

                        <div className="register-login-link">

                            <span>
                                Already have an account?
                            </span>

                            <button
                                type="button"
                                onClick={
                                    handleLogin
                                }
                            >
                                Login
                            </button>

                        </div>

                    </form>
                )}

                {/* =========================================
                    SECURITY
                ========================================== */}

                <div className="register-security">

                    <FaShieldAlt />

                    <span>
                        Secure HMS Patient Registration
                    </span>

                </div>

            </div>
        </div>
    );
}

export default Register;