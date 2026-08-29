import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaArrowLeft,
    FaHospital,
    FaUser,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaLock,
    FaBell,
    FaPalette,
    FaGlobe,
    FaSave,
    FaCheckCircle,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaEye,
    FaEyeSlash,
    FaTimes,
    FaSpinner,
} from "react-icons/fa";

import "./Settings.css";

const API_BASE = "http://localhost:5000/api";

const DEFAULT_SETTINGS = {
    hospitalName: "HMS Hospital Narayanpur",
    hospitalEmail: "admin@hmshospital.com",
    phone: "+91 98765 43210",
    address: "Narayanpur, Uttar Pradesh, India",

    tagline: "Hospital System",

    adminName: "HMS Admin",
    adminEmail: "admin@hmshospital.com",

    appointmentNotifications: true,
    billingNotifications: true,
    systemNotifications: true,

    timezone: "Asia/Kolkata",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",

    logo: "/hms-logo.png",
};

const Settings = () => {
    const navigate = useNavigate();

    const [settings, setSettings] = useState(DEFAULT_SETTINGS);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    const [passwordModal, setPasswordModal] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    /* =========================================================
       LOAD SETTINGS FROM BACKEND
       ========================================================= */

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_BASE}/settings`
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to load hospital settings."
                );
            }

            const backendSettings =
                result.data || {};

            const loadedSettings = {
                ...DEFAULT_SETTINGS,
                ...backendSettings,
            };

            setSettings(loadedSettings);

            // Keep localStorage synchronized
            localStorage.setItem(
                "hmsSettings",
                JSON.stringify(loadedSettings)
            );

            // Notify Header / Sidebar
            window.dispatchEvent(
                new Event("hmsSettingsUpdated")
            );

        } catch (err) {
            console.error(
                "Unable to fetch hospital settings:",
                err
            );

            setError(
                err.message ||
                "Unable to load hospital settings."
            );

            /*
             * Fallback:
             * If backend is temporarily unavailable,
             * try localStorage.
             */
            try {
                const storedSettings =
                    localStorage.getItem(
                        "hmsSettings"
                    );

                if (storedSettings) {
                    const parsed =
                        JSON.parse(storedSettings);

                    setSettings({
                        ...DEFAULT_SETTINGS,
                        ...parsed,
                    });
                }
            } catch (localError) {
                console.error(
                    "Unable to load local settings:",
                    localError
                );
            }

        } finally {
            setLoading(false);
        }
    };

    /* =========================================================
       HANDLE INPUT
       ========================================================= */

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setSettings((previous) => ({
            ...previous,
            [name]: value,
        }));

        setSaved(false);
        setError("");
    };

    /* =========================================================
       HANDLE TOGGLE
       ========================================================= */

    const handleToggle = (name) => {
        setSettings((previous) => ({
            ...previous,
            [name]: !previous[name],
        }));

        setSaved(false);
        setError("");
    };

    /* =========================================================
       SAVE SETTINGS TO BACKEND
       ========================================================= */

    const handleSave = async () => {
        try {
            setSaving(true);
            setSaved(false);
            setError("");

            const payload = {
                hospitalName:
                    settings.hospitalName,

                hospitalEmail:
                    settings.hospitalEmail,

                phone:
                    settings.phone,

                address:
                    settings.address,

                tagline:
                    settings.tagline,

                adminName:
                    settings.adminName,

                adminEmail:
                    settings.adminEmail,

                appointmentNotifications:
                    Boolean(
                        settings.appointmentNotifications
                    ),

                billingNotifications:
                    Boolean(
                        settings.billingNotifications
                    ),

                systemNotifications:
                    Boolean(
                        settings.systemNotifications
                    ),

                timezone:
                    settings.timezone,

                currency:
                    settings.currency,

                dateFormat:
                    settings.dateFormat,

                logo:
                    settings.logo ||
                    "/hms-logo.png",
            };

            const response = await fetch(
                `${API_BASE}/settings`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(payload),
                }
            );

            const result =
                await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to update hospital settings."
                );
            }

            const updatedSettings = {
                ...settings,
                ...(result.data || {}),
            };

            setSettings(updatedSettings);

            // Local cache
            localStorage.setItem(
                "hmsSettings",
                JSON.stringify(
                    updatedSettings
                )
            );

            // Notify other components
            window.dispatchEvent(
                new Event("hmsSettingsUpdated")
            );

            setSaved(true);

            setTimeout(() => {
                setSaved(false);
            }, 3500);

        } catch (err) {
            console.error(
                "Unable to save hospital settings:",
                err
            );

            setError(
                err.message ||
                "Unable to save hospital settings."
            );

        } finally {
            setSaving(false);
        }
    };

    /* =========================================================
       PASSWORD INPUT
       ========================================================= */

    const handlePasswordChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setPasswords((previous) => ({
            ...previous,
            [name]: value,
        }));

        setPasswordError("");
        setPasswordSuccess("");
    };

    /* =========================================================
       CHANGE PASSWORD
       ========================================================= */

    const handlePasswordSubmit = (event) => {
        event.preventDefault();

        setPasswordError("");
        setPasswordSuccess("");

        if (
            !passwords.currentPassword ||
            !passwords.newPassword ||
            !passwords.confirmPassword
        ) {
            setPasswordError(
                "Please fill in all password fields."
            );

            return;
        }

        if (
            passwords.newPassword.length < 6
        ) {
            setPasswordError(
                "New password must contain at least 6 characters."
            );

            return;
        }

        if (
            passwords.newPassword !==
            passwords.confirmPassword
        ) {
            setPasswordError(
                "New passwords do not match."
            );

            return;
        }

        /*
         * Current backend does not yet expose
         * a change-password endpoint.
         *
         * Therefore we do not pretend that the
         * password was actually changed.
         */
        setPasswordError(
            "Password API is not connected yet. Please add the change-password backend endpoint before using this feature."
        );
    };

    /* =========================================================
       CLOSE PASSWORD MODAL
       ========================================================= */

    const closePasswordModal = () => {
        setPasswordModal(false);

        setPasswords({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });

        setPasswordError("");
        setPasswordSuccess("");

        setShowPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    /* =========================================================
       LOADING
       ========================================================= */

    if (loading) {
        return (
            <div className="settings-page">

                <div className="settings-loading">

                    <FaSpinner className="settings-spinner" />

                    <span>
                        Loading hospital settings...
                    </span>

                </div>

            </div>
        );
    }

    return (
        <div className="settings-page">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="settings-header">

                <div className="settings-header-left">

                    <button
                        type="button"
                        className="settings-back-btn"
                        onClick={() => navigate(-1)}
                        title="Go Back"
                    >
                        <FaArrowLeft />
                    </button>

                    <div className="settings-title-area">

                        <h1>
                            Settings
                        </h1>

                        <p>
                            Manage your HMS system preferences
                        </p>

                    </div>

                </div>

                <button
                    type="button"
                    className="settings-save-btn"
                    onClick={handleSave}
                    disabled={saving}
                >

                    {saving ? (
                        <FaSpinner className="button-spinner" />
                    ) : (
                        <FaSave />
                    )}

                    <span>
                        {saving
                            ? "Saving..."
                            : "Save Changes"}
                    </span>

                </button>

            </div>


            {/* =====================================================
                ERROR MESSAGE
            ===================================================== */}

            {error && (
                <div className="settings-error">

                    <FaTimes />

                    <span>
                        {error}
                    </span>

                </div>
            )}


            {/* =====================================================
                SUCCESS MESSAGE
            ===================================================== */}

            {saved && (
                <div className="settings-success">

                    <FaCheckCircle />

                    <span>
                        Settings saved successfully
                    </span>

                </div>
            )}


            {/* =====================================================
                SETTINGS CONTENT
            ===================================================== */}

            <div className="settings-content">


                {/* =================================================
                    GENERAL SETTINGS
                ================================================= */}

                <section className="settings-card">

                    <div className="settings-card-header">

                        <div className="settings-icon">
                            <FaHospital />
                        </div>

                        <div>

                            <h2>
                                General Settings
                            </h2>

                            <p>
                                Basic hospital information
                            </p>

                        </div>

                    </div>


                    <div className="settings-grid">


                        {/* Hospital Name */}

                        <div className="settings-field">

                            <label htmlFor="hospitalName">
                                Hospital Name
                            </label>

                            <div className="input-wrapper">

                                <FaHospital />

                                <input
                                    id="hospitalName"
                                    type="text"
                                    name="hospitalName"
                                    value={
                                        settings.hospitalName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter hospital name"
                                />

                            </div>

                        </div>


                        {/* Hospital Email */}

                        <div className="settings-field">

                            <label htmlFor="hospitalEmail">
                                Hospital Email
                            </label>

                            <div className="input-wrapper">

                                <FaEnvelope />

                                <input
                                    id="hospitalEmail"
                                    type="email"
                                    name="hospitalEmail"
                                    value={
                                        settings.hospitalEmail
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter hospital email"
                                />

                            </div>

                        </div>


                        {/* Phone */}

                        <div className="settings-field">

                            <label htmlFor="phone">
                                Phone Number
                            </label>

                            <div className="input-wrapper">

                                <FaPhone />

                                <input
                                    id="phone"
                                    type="text"
                                    name="phone"
                                    value={
                                        settings.phone
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter phone number"
                                />

                            </div>

                        </div>


                        {/* Address */}

                        <div className="settings-field">

                            <label htmlFor="address">
                                Hospital Address
                            </label>

                            <div className="input-wrapper">

                                <FaMapMarkerAlt />

                                <input
                                    id="address"
                                    type="text"
                                    name="address"
                                    value={
                                        settings.address
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter hospital address"
                                />

                            </div>

                        </div>


                        {/* Tagline */}

                        <div className="settings-field">

                            <label htmlFor="tagline">
                                Hospital Tagline
                            </label>

                            <div className="input-wrapper">

                                <FaHospital />

                                <input
                                    id="tagline"
                                    type="text"
                                    name="tagline"
                                    value={
                                        settings.tagline
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter hospital tagline"
                                />

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    ADMINISTRATOR PROFILE
                ================================================= */}

                <section className="settings-card">

                    <div className="settings-card-header">

                        <div className="settings-icon">
                            <FaUser />
                        </div>

                        <div>

                            <h2>
                                Administrator Profile
                            </h2>

                            <p>
                                Manage administrator information
                            </p>

                        </div>

                    </div>


                    <div className="settings-grid">


                        {/* Admin Name */}

                        <div className="settings-field">

                            <label htmlFor="adminName">
                                Administrator Name
                            </label>

                            <div className="input-wrapper">

                                <FaUser />

                                <input
                                    id="adminName"
                                    type="text"
                                    name="adminName"
                                    value={
                                        settings.adminName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter administrator name"
                                />

                            </div>

                        </div>


                        {/* Admin Email */}

                        <div className="settings-field">

                            <label htmlFor="adminEmail">
                                Administrator Email
                            </label>

                            <div className="input-wrapper">

                                <FaEnvelope />

                                <input
                                    id="adminEmail"
                                    type="email"
                                    name="adminEmail"
                                    value={
                                        settings.adminEmail
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter administrator email"
                                />

                            </div>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="security-btn"
                        onClick={() =>
                            setPasswordModal(true)
                        }
                    >

                        <FaLock />

                        <span>
                            Change Password
                        </span>

                    </button>

                </section>


                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}

                <section className="settings-card">

                    <div className="settings-card-header">

                        <div className="settings-icon">
                            <FaBell />
                        </div>

                        <div>

                            <h2>
                                Notifications
                            </h2>

                            <p>
                                Control system notifications
                            </p>

                        </div>

                    </div>


                    <div className="notification-list">


                        {/* Appointment */}

                        <div className="notification-item">

                            <div className="notification-info">

                                <h3>
                                    Appointment Notifications
                                </h3>

                                <p>
                                    Receive notifications about appointments
                                </p>

                            </div>

                            <button
                                type="button"
                                aria-label="Toggle appointment notifications"
                                className={`toggle ${settings.appointmentNotifications
                                        ? "active"
                                        : ""
                                    }`}
                                onClick={() =>
                                    handleToggle(
                                        "appointmentNotifications"
                                    )
                                }
                            >
                                <span />
                            </button>

                        </div>


                        {/* Billing */}

                        <div className="notification-item">

                            <div className="notification-info">

                                <h3>
                                    Billing Notifications
                                </h3>

                                <p>
                                    Receive billing and payment notifications
                                </p>

                            </div>

                            <button
                                type="button"
                                aria-label="Toggle billing notifications"
                                className={`toggle ${settings.billingNotifications
                                        ? "active"
                                        : ""
                                    }`}
                                onClick={() =>
                                    handleToggle(
                                        "billingNotifications"
                                    )
                                }
                            >
                                <span />
                            </button>

                        </div>


                        {/* System */}

                        <div className="notification-item">

                            <div className="notification-info">

                                <h3>
                                    System Notifications
                                </h3>

                                <p>
                                    Receive important system notifications
                                </p>

                            </div>

                            <button
                                type="button"
                                aria-label="Toggle system notifications"
                                className={`toggle ${settings.systemNotifications
                                        ? "active"
                                        : ""
                                    }`}
                                onClick={() =>
                                    handleToggle(
                                        "systemNotifications"
                                    )
                                }
                            >
                                <span />
                            </button>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    SYSTEM PREFERENCES
                ================================================= */}

                <section className="settings-card">

                    <div className="settings-card-header">

                        <div className="settings-icon">
                            <FaPalette />
                        </div>

                        <div>

                            <h2>
                                System Preferences
                            </h2>

                            <p>
                                Configure regional and display preferences
                            </p>

                        </div>

                    </div>


                    <div className="settings-grid">


                        {/* Timezone */}

                        <div className="settings-field">

                            <label htmlFor="timezone">
                                Timezone
                            </label>

                            <div className="input-wrapper">

                                <FaGlobe />

                                <select
                                    id="timezone"
                                    name="timezone"
                                    value={
                                        settings.timezone
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="Asia/Kolkata">
                                        Asia/Kolkata (IST)
                                    </option>

                                    <option value="Asia/Dubai">
                                        Asia/Dubai
                                    </option>

                                    <option value="Europe/London">
                                        Europe/London
                                    </option>

                                    <option value="America/New_York">
                                        America/New_York
                                    </option>

                                </select>

                            </div>

                        </div>


                        {/* Currency */}

                        <div className="settings-field">

                            <label htmlFor="currency">
                                Currency
                            </label>

                            <div className="input-wrapper">

                                <FaMoneyBillWave />

                                <select
                                    id="currency"
                                    name="currency"
                                    value={
                                        settings.currency
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="INR">
                                        INR - Indian Rupee
                                    </option>

                                    <option value="USD">
                                        USD - US Dollar
                                    </option>

                                    <option value="EUR">
                                        EUR - Euro
                                    </option>

                                </select>

                            </div>

                        </div>


                        {/* Date Format */}

                        <div className="settings-field">

                            <label htmlFor="dateFormat">
                                Date Format
                            </label>

                            <div className="input-wrapper">

                                <FaCalendarAlt />

                                <select
                                    id="dateFormat"
                                    name="dateFormat"
                                    value={
                                        settings.dateFormat
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="DD/MM/YYYY">
                                        DD/MM/YYYY
                                    </option>

                                    <option value="MM/DD/YYYY">
                                        MM/DD/YYYY
                                    </option>

                                    <option value="YYYY-MM-DD">
                                        YYYY-MM-DD
                                    </option>

                                </select>

                            </div>

                        </div>

                    </div>

                </section>

            </div>


            {/* =====================================================
                CHANGE PASSWORD MODAL
            ===================================================== */}

            {passwordModal && (

                <div
                    className="settings-modal-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closePasswordModal();
                        }

                    }}
                >

                    <div className="password-modal">


                        {/* Modal Header */}

                        <div className="password-modal-header">

                            <div>

                                <h2>
                                    Change Password
                                </h2>

                                <p>
                                    Update your administrator password
                                </p>

                            </div>

                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={
                                    closePasswordModal
                                }
                                title="Close"
                            >
                                <FaTimes />
                            </button>

                        </div>


                        {/* Password Form */}

                        <form
                            className="password-form"
                            onSubmit={
                                handlePasswordSubmit
                            }
                        >


                            {/* Current Password */}

                            <div className="settings-field">

                                <label htmlFor="currentPassword">
                                    Current Password
                                </label>

                                <div className="input-wrapper">

                                    <FaLock />

                                    <input
                                        id="currentPassword"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="currentPassword"
                                        value={
                                            passwords.currentPassword
                                        }
                                        onChange={
                                            handlePasswordChange
                                        }
                                        placeholder="Enter current password"
                                    />

                                    <button
                                        type="button"
                                        className="password-eye-btn"
                                        onClick={() =>
                                            setShowPassword(
                                                (previous) =>
                                                    !previous
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

                            </div>


                            {/* New Password */}

                            <div className="settings-field">

                                <label htmlFor="newPassword">
                                    New Password
                                </label>

                                <div className="input-wrapper">

                                    <FaLock />

                                    <input
                                        id="newPassword"
                                        type={
                                            showNewPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="newPassword"
                                        value={
                                            passwords.newPassword
                                        }
                                        onChange={
                                            handlePasswordChange
                                        }
                                        placeholder="Enter new password"
                                    />

                                    <button
                                        type="button"
                                        className="password-eye-btn"
                                        onClick={() =>
                                            setShowNewPassword(
                                                (previous) =>
                                                    !previous
                                            )
                                        }
                                    >

                                        {showNewPassword ? (
                                            <FaEyeSlash />
                                        ) : (
                                            <FaEye />
                                        )}

                                    </button>

                                </div>

                            </div>


                            {/* Confirm Password */}

                            <div className="settings-field">

                                <label htmlFor="confirmPassword">
                                    Confirm New Password
                                </label>

                                <div className="input-wrapper">

                                    <FaLock />

                                    <input
                                        id="confirmPassword"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="confirmPassword"
                                        value={
                                            passwords.confirmPassword
                                        }
                                        onChange={
                                            handlePasswordChange
                                        }
                                        placeholder="Confirm new password"
                                    />

                                    <button
                                        type="button"
                                        className="password-eye-btn"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                (previous) =>
                                                    !previous
                                            )
                                        }
                                    >

                                        {showConfirmPassword ? (
                                            <FaEyeSlash />
                                        ) : (
                                            <FaEye />
                                        )}

                                    </button>

                                </div>

                            </div>


                            {/* Error */}

                            {passwordError && (
                                <div className="password-error">
                                    {passwordError}
                                </div>
                            )}


                            {/* Success */}

                            {passwordSuccess && (
                                <div className="password-success">

                                    <FaCheckCircle />

                                    {passwordSuccess}

                                </div>
                            )}


                            {/* Actions */}

                            <div className="password-modal-actions">

                                <button
                                    type="button"
                                    className="cancel-password-btn"
                                    onClick={
                                        closePasswordModal
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="update-password-btn"
                                >

                                    <FaLock />

                                    Update Password

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
};

export default Settings;