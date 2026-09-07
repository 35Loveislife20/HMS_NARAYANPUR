import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaArrowLeft,
    FaCheckCircle,
    FaHeartbeat,
    FaHospital,
    FaUserPlus,
} from "react-icons/fa";

import "./PatientRegistration.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const EMPTY_FORM = {
    name: "",
    phone: "",
    email: "",
    gender: "",
    date_of_birth: "",
    address: "",
    blood_group: "",
};

const PatientRegistration = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState(EMPTY_FORM);

    const [hospitalName, setHospitalName] =
        useState("HMS Hospital");

    const [loading, setLoading] =
        useState(false);

    const [settingsLoading, setSettingsLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState(false);

    const [registeredPatient, setRegisteredPatient] =
        useState(null);

    const [registeredPatientId, setRegisteredPatientId] =
        useState("");

    /*
    =====================================================
    LOAD HOSPITAL SETTINGS
    =====================================================
    */

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setSettingsLoading(true);

                const response = await fetch(
                    `${API_URL}/settings`
                );

                if (!response.ok) {
                    throw new Error(
                        "Settings request failed"
                    );
                }

                const data =
                    await response.json();

                const settings =
                    data?.settings ||
                    data?.data ||
                    data;

                if (
                    settings &&
                    typeof settings === "object"
                ) {
                    setHospitalName(
                        settings.hospitalName ||
                        settings.hospital_name ||
                        settings.name ||
                        "HMS Hospital"
                    );
                }
            } catch (err) {
                console.error(
                    "SETTINGS ERROR:",
                    err
                );

                setHospitalName(
                    "HMS Hospital"
                );
            } finally {
                setSettingsLoading(false);
            }
        };

        loadSettings();
    }, []);

    /*
    =====================================================
    HANDLE INPUT
    =====================================================
    */

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (error) {
            setError("");
        }
    };

    /*
    =====================================================
    VALIDATION
    =====================================================
    */

    const validateForm = () => {
        const name =
            form.name.trim();

        const phone =
            form.phone.trim();

        const email =
            form.email.trim();

        const address =
            form.address.trim();

        if (!name) {
            return "Please enter patient name.";
        }

        if (!phone) {
            return "Please enter mobile number.";
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            return "Mobile number must contain exactly 10 digits.";
        }

        if (email) {
            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                return "Please enter a valid email address.";
            }
        }

        if (!form.gender) {
            return "Please select gender.";
        }

        if (!form.date_of_birth) {
            return "Please select date of birth.";
        }

        if (!address) {
            return "Please enter address.";
        }

        return "";
    };

    /*
    =====================================================
    SUBMIT REGISTRATION
    =====================================================
    */

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);

            const payload = {
                name:
                    form.name.trim(),

                phone:
                    form.phone.trim(),

                email:
                    form.email.trim() ||
                    null,

                gender:
                    form.gender,

                date_of_birth:
                    form.date_of_birth ||
                    null,

                address:
                    form.address.trim(),

                blood_group:
                    form.blood_group ||
                    null,
            };

            const response =
                await fetch(
                    `${API_URL}/patients/register`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );

            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }

            if (
                !response.ok ||
                data?.success === false
            ) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    "Patient registration failed."
                );
            }

            /*
            =================================================
            EXTRACT PATIENT
            =================================================
            */

            const patient =
                data?.patient ||
                data?.data?.patient ||
                data?.data ||
                data;

            /*
            =================================================
            EXTRACT PATIENT ID
            =================================================
            */

            const patientId =
                patient?.id ||
                patient?.patient_id ||
                patient?.patientId ||
                data?.patient_id ||
                data?.patientId ||
                data?.id ||
                "";

            if (!patientId) {
                throw new Error(
                    "Patient registered but patient ID was not returned by the server."
                );
            }

            /*
            =================================================
            EXTRACT PATIENT CODE
            =================================================
            */

            const patientCode =
                patient?.patient_code ||
                patient?.patientCode ||
                patient?.code ||
                "";

            /*
            =================================================
            NORMALIZED PATIENT
            =================================================
            */

            const finalPatient = {
                ...patient,

                id:
                    patientId,

                patient_id:
                    patientId,

                patient_code:
                    patientCode,

                name:
                    patient?.name ||
                    form.name.trim(),

                phone:
                    patient?.phone ||
                    form.phone.trim(),

                gender:
                    patient?.gender ||
                    form.gender,

                email:
                    patient?.email ??
                    form.email.trim(),

                date_of_birth:
                    patient?.date_of_birth ||
                    form.date_of_birth,

                address:
                    patient?.address ||
                    form.address.trim(),

                blood_group:
                    patient?.blood_group ||
                    form.blood_group,
            };

            /*
            =================================================
            SAVE REACT STATE
            =================================================
            */

            setRegisteredPatient(
                finalPatient
            );

            setRegisteredPatientId(
                String(patientId)
            );

            /*
            =================================================
            SAVE SESSION STORAGE
            =================================================
            */

            try {
                sessionStorage.setItem(
                    "newlyRegisteredPatient",
                    JSON.stringify(
                        finalPatient
                    )
                );

                sessionStorage.setItem(
                    "newlyRegisteredPatientId",
                    String(patientId)
                );
            } catch (storageError) {
                console.warn(
                    "SESSION STORAGE ERROR:",
                    storageError
                );
            }

            setSuccess(true);
        } catch (err) {
            console.error(
                "PATIENT REGISTRATION ERROR:",
                err
            );

            setError(
                err?.message ||
                "Unable to register patient. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    /*
    =====================================================
    CONTINUE TO APPOINTMENT
    =====================================================
    */

    const handleContinue = () => {
        if (!registeredPatientId) {
            setError(
                "Patient ID is missing. Please register the patient again."
            );

            return;
        }

        /*
        IMPORTANT:
        Patient object + patient ID
        dono Appointment page ko bhej rahe hain.
        */

        navigate(
            `/new-patient-appointment?patient_id=${encodeURIComponent(
                registeredPatientId
            )}`,
            {
                state: {
                    patient:
                        registeredPatient,

                    patient_id:
                        registeredPatientId,
                },
            }
        );
    };

    /*
    =====================================================
    REGISTER ANOTHER
    =====================================================
    */

    const handleRegisterAnother = () => {
        setForm(EMPTY_FORM);

        setError("");

        setSuccess(false);

        setRegisteredPatient(null);

        setRegisteredPatientId("");

        try {
            sessionStorage.removeItem(
                "newlyRegisteredPatient"
            );

            sessionStorage.removeItem(
                "newlyRegisteredPatientId"
            );
        } catch (storageError) {
            console.warn(
                storageError
            );
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    /*
    =====================================================
    SUCCESS SCREEN
    =====================================================
    */

    if (success) {
        return (
            <div className="patient-registration-page">

                <div className="registration-topbar">

                    <div className="registration-brand">

                        <div className="brand-icon">
                            <FaHeartbeat />
                        </div>

                        <div>

                            <div className="brand-name">
                                {settingsLoading
                                    ? "HMS Hospital"
                                    : hospitalName}
                            </div>

                            <div className="brand-subtitle">
                                Patient Registration
                            </div>

                        </div>

                    </div>

                    <button
                        type="button"
                        className="top-back-button"
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        <FaArrowLeft />

                        <span>
                            Back to Home
                        </span>
                    </button>

                </div>

                <main className="registration-main">

                    <div className="registration-success-card">

                        <div className="success-icon">
                            <FaCheckCircle />
                        </div>

                        <h1>
                            Registration Successful
                        </h1>

                        <p className="success-message">
                            Patient has been successfully
                            registered with{" "}
                            <strong>
                                {hospitalName}
                            </strong>
                            .
                        </p>

                        {registeredPatient && (
                            <div className="registered-patient-info">

                                <div className="patient-info-row">
                                    <span>
                                        Patient ID
                                    </span>

                                    <strong>
                                        {registeredPatientId}
                                    </strong>
                                </div>

                                {registeredPatient.patient_code && (
                                    <div className="patient-info-row">
                                        <span>
                                            Patient Code
                                        </span>

                                        <strong>
                                            {
                                                registeredPatient.patient_code
                                            }
                                        </strong>
                                    </div>
                                )}

                                <div className="patient-info-row">
                                    <span>
                                        Patient Name
                                    </span>

                                    <strong>
                                        {
                                            registeredPatient.name
                                        }
                                    </strong>
                                </div>

                                <div className="patient-info-row">
                                    <span>
                                        Mobile
                                    </span>

                                    <strong>
                                        {
                                            registeredPatient.phone
                                        }
                                    </strong>
                                </div>

                            </div>
                        )}

                        <div className="success-actions">

                            <button
                                type="button"
                                className="primary-button"
                                onClick={
                                    handleContinue
                                }
                            >
                                <FaCheckCircle />

                                Continue to Appointment
                            </button>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={
                                    handleRegisterAnother
                                }
                            >
                                <FaUserPlus />

                                Register Another Patient
                            </button>

                            <button
                                type="button"
                                className="back-home-button"
                                onClick={() =>
                                    navigate("/")
                                }
                            >
                                <FaArrowLeft />

                                Back to Home
                            </button>

                        </div>

                    </div>

                </main>

                <footer className="registration-footer">
                    ©{" "}
                    {new Date().getFullYear()}{" "}
                    {hospitalName}. All rights reserved.
                </footer>

            </div>
        );
    }

    /*
    =====================================================
    FORM SCREEN
    =====================================================
    */

    return (
        <div className="patient-registration-page">

            <header className="registration-topbar">

                <div className="registration-brand">

                    <div className="brand-icon">
                        <FaHospital />
                    </div>

                    <div>

                        <div className="brand-name">
                            {settingsLoading
                                ? "HMS Hospital"
                                : hospitalName}
                        </div>

                        <div className="brand-subtitle">
                            Hospital Management System
                        </div>

                    </div>

                </div>

                <button
                    type="button"
                    className="top-back-button"
                    onClick={() =>
                        navigate("/")
                    }
                >
                    <FaArrowLeft />

                    <span>
                        Back to Home
                    </span>
                </button>

            </header>

            <main className="registration-main">

                <div className="registration-header">

                    <div className="header-icon">
                        <FaUserPlus />
                    </div>

                    <div>

                        <h1>
                            Patient Registration
                        </h1>

                        <p>
                            Register as a new patient
                            to access hospital services
                            and appointments.
                        </p>

                    </div>

                </div>

                {error && (
                    <div className="registration-error">

                        <span>!</span>

                        <p>
                            {error}
                        </p>

                    </div>
                )}

                <form
                    className="patient-registration-form"
                    onSubmit={handleSubmit}
                    noValidate
                >

                    <section className="form-section">

                        <div className="section-heading">

                            <div className="section-number">
                                01
                            </div>

                            <div>

                                <h2>
                                    Personal Information
                                </h2>

                                <p>
                                    Enter patient's basic
                                    information.
                                </p>

                            </div>

                        </div>

                        <div className="form-grid">

                            <div className="form-group full-width">

                                <label htmlFor="name">
                                    Full Name
                                    <span>*</span>
                                </label>

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={
                                        form.name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter patient's full name"
                                    autoComplete="name"
                                    disabled={loading}
                                />

                            </div>

                            <div className="form-group">

                                <label htmlFor="phone">
                                    Mobile Number
                                    <span>*</span>
                                </label>

                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={
                                        form.phone
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="10-digit mobile number"
                                    maxLength={10}
                                    inputMode="numeric"
                                    autoComplete="tel"
                                    disabled={loading}
                                />

                            </div>

                            <div className="form-group">

                                <label htmlFor="email">
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={
                                        form.email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter email address"
                                    autoComplete="email"
                                    disabled={loading}
                                />

                            </div>

                            <div className="form-group">

                                <label htmlFor="gender">
                                    Gender
                                    <span>*</span>
                                </label>

                                <select
                                    id="gender"
                                    name="gender"
                                    value={
                                        form.gender
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={loading}
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

                            <div className="form-group">

                                <label htmlFor="date_of_birth">
                                    Date of Birth
                                    <span>*</span>
                                </label>

                                <input
                                    id="date_of_birth"
                                    name="date_of_birth"
                                    type="date"
                                    value={
                                        form.date_of_birth
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={loading}
                                />

                            </div>

                            <div className="form-group">

                                <label htmlFor="blood_group">
                                    Blood Group
                                </label>

                                <select
                                    id="blood_group"
                                    name="blood_group"
                                    value={
                                        form.blood_group
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={loading}
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

                        </div>

                    </section>

                    <section className="form-section">

                        <div className="section-heading">

                            <div className="section-number">
                                02
                            </div>

                            <div>

                                <h2>
                                    Address Information
                                </h2>

                                <p>
                                    Provide patient's
                                    current address.
                                </p>

                            </div>

                        </div>

                        <div className="form-grid">

                            <div className="form-group full-width">

                                <label htmlFor="address">
                                    Address
                                    <span>*</span>
                                </label>

                                <textarea
                                    id="address"
                                    name="address"
                                    value={
                                        form.address
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter complete address"
                                    rows={4}
                                    disabled={loading}
                                />

                            </div>

                        </div>

                    </section>

                    <div className="action-information">

                        <div className="information-icon">
                            i
                        </div>

                        <div>

                            <strong>
                                Important Information
                            </strong>

                            <p>
                                Please make sure all
                                information is correct
                                before registering the
                                patient.
                            </p>

                        </div>

                    </div>

                    <div className="registration-actions">

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() =>
                                navigate("/")
                            }
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="register-button patient-register-submit-btn"
                            disabled={loading}
                            style={{
                                minWidth:
                                    "158px",
                                width:
                                    "auto",
                                height:
                                    "42px",
                                minHeight:
                                    "42px",
                                display:
                                    "inline-flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                                gap:
                                    "8px",
                                margin:
                                    "0",
                                padding:
                                    "0 18px",
                                border:
                                    "1px solid rgba(74, 222, 128, 0.45)",
                                borderRadius:
                                    "8px",
                                outline:
                                    "none",
                                background:
                                    loading
                                        ? "#15803d"
                                        : "#22c55e",
                                color:
                                    "#04120a",
                                fontFamily:
                                    "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
                                fontSize:
                                    "12px",
                                fontWeight:
                                    "700",
                                lineHeight:
                                    "1",
                                textAlign:
                                    "center",
                                cursor:
                                    loading
                                        ? "not-allowed"
                                        : "pointer",
                                appearance:
                                    "none",
                                WebkitAppearance:
                                    "none",
                                boxShadow:
                                    "0 7px 22px rgba(34, 197, 94, 0.20)",
                                opacity:
                                    loading
                                        ? 0.75
                                        : 1,
                                transition:
                                    "all 0.2s ease",
                            }}
                        >

                            {loading ? (
                                <>
                                    <span
                                        className="loading-spinner"
                                        style={{
                                            width:
                                                "14px",
                                            height:
                                                "14px",
                                            border:
                                                "2px solid rgba(4, 18, 10, 0.30)",
                                            borderTopColor:
                                                "#04120a",
                                            borderRadius:
                                                "50%",
                                            display:
                                                "inline-block",
                                            animation:
                                                "patientRegisterSpin 0.7s linear infinite",
                                        }}
                                    />

                                    <span>
                                        Registering...
                                    </span>
                                </>
                            ) : (
                                <>
                                    <FaCheckCircle />

                                    <span>
                                        Register Patient
                                    </span>
                                </>
                            )}

                        </button>

                    </div>

                </form>

            </main>

            <footer className="registration-footer">

                ©{" "}
                {new Date().getFullYear()}{" "}
                {hospitalName}. All rights reserved.

            </footer>

            <style>
                {`
                    @keyframes patientRegisterSpin {
                        from {
                            transform: rotate(0deg);
                        }

                        to {
                            transform: rotate(360deg);
                        }
                    }

                    .patient-register-submit-btn:hover:not(:disabled) {
                        background: #16a34a !important;
                        border-color: rgba(74, 222, 128, 0.75) !important;
                        color: #ffffff !important;
                        transform: translateY(-1px);
                        box-shadow: 0 10px 28px rgba(34, 197, 94, 0.28) !important;
                    }

                    .patient-register-submit-btn:active:not(:disabled) {
                        transform: translateY(0);
                    }

                    .patient-register-submit-btn:disabled {
                        cursor: not-allowed !important;
                    }
                `}
            </style>

        </div>
    );
};

export default PatientRegistration;