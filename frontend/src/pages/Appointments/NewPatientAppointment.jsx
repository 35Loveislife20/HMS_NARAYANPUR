import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SuccessPopup from "../../components/common/SuccessPopup";
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaCheckCircle,
    FaClock,
    FaHospital,
    FaPhone,
    FaRedo,
    FaStethoscope,
    FaUser,
    FaUserMd,
    FaVenusMars,
} from "react-icons/fa";

import "./NewPatientAppointment.css";
import { PaymentSection, PrintableReceipt, getDoctorFee } from "./Appointmentpayment";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const TIME_SLOTS = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
];

const getToday = () => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatTime = (value) => {
    if (!value) return "—";

    const parts = String(value).split(":");

    if (parts.length < 2) {
        return value;
    }

    const hour = Number(parts[0]);
    const minute = parts[1];

    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute} ${suffix}`;
};

const extractArray = (data, keys = []) => {
    if (Array.isArray(data)) {
        return data;
    }

    for (const key of keys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }
    }

    return [];
};

const normalizePatient = (patient) => {
    if (!patient) {
        return null;
    }

    const patientId =
        patient.id ??
        patient.patient_id ??
        patient.patientId ??
        "";

    return {
        ...patient,
        id: patientId,
        patient_id: patientId,
        patient_code:
            patient.patient_code ??
            patient.patientCode ??
            "",
        name: patient.name ?? "",
        phone:
            patient.phone ??
            patient.mobile ??
            "",
        gender: patient.gender ?? "",
    };
};

const normalizeDoctor = (doctor) => {
    if (!doctor) {
        return null;
    }

    const doctorId =
        doctor.id ??
        doctor.doctor_id ??
        doctor.doctorId ??
        "";

    return {
        ...doctor,
        id: doctorId,
        doctor_id: doctorId,
        name: doctor.name ?? "",
        doctor_code:
            doctor.doctor_code ??
            doctor.doctorCode ??
            "",
        specialization:
            doctor.specialization ??
            doctor.speciality ??
            doctor.specialty ??
            "General Medicine",
    };
};

const getAppointmentTime = (appointment) => {
    if (!appointment) {
        return "";
    }

    return String(
        appointment.appointment_time ??
            appointment.time ??
            ""
    ).slice(0, 5);
};

const getAppointmentStatus = (appointment) => {
    return String(
        appointment?.status ?? "pending"
    )
        .trim()
        .toLowerCase();
};

const NewPatientAppointment = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Hospital context comes from the Patient Portal selection.
    const routeHospital = location.state?.hospital || null;

    const getHospitalId = (hospital) =>
        hospital?.id ??
        hospital?.hospital_id ??
        hospital?.hospitalId ??
        null;

    const patientHospitalId =
        location.state?.hospital_id ??
        getHospitalId(routeHospital) ??
        localStorage.getItem("hms_patient_hospital_id") ??
        null;

    const patientHospitalName =
        routeHospital?.name ||
        routeHospital?.hospital_name ||
        localStorage.getItem("hms_patient_hospital_name") ||
        "Selected Hospital";

    const validHospitalId =
        Number.isInteger(Number(patientHospitalId)) &&
        Number(patientHospitalId) > 0
            ? Number(patientHospitalId)
            : null;

    const knownHospitalName =
        routeHospital?.name ||
        routeHospital?.hospital_name ||
        localStorage.getItem("hms_patient_hospital_name") ||
        "";

    const [hospitalName, setHospitalName] =
        useState(knownHospitalName || "HMS Hospital");

    const [hospitalSubtitle, setHospitalSubtitle] =
        useState("Hospital Management System");

    const [patient, setPatient] = useState(null);

    const [doctors, setDoctors] = useState([]);

    const [appointments, setAppointments] = useState([]);

    const [locallyBookedSlots, setLocallyBookedSlots] =
        useState([]);

    const [form, setForm] = useState({
        patient_id: "",
        doctor_id: "",
        appointment_date: getToday(),
        appointment_time: "",
        reason: "",
    });

    const [loading, setLoading] = useState(false);
    const [patientLoading, setPatientLoading] = useState(true);
    const [doctorsLoading, setDoctorsLoading] = useState(true);
    const [availabilityLoading, setAvailabilityLoading] =
        useState(false);
    const [availabilityLoaded, setAvailabilityLoaded] =
        useState(false);
    const [settingsLoading, setSettingsLoading] =
        useState(false);

    const [error, setError] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [success, setSuccess] = useState(null);
    const [successPopupOpen, setSuccessPopupOpen] = useState(false);

    useEffect(() => {
        setSuccessPopupOpen(Boolean(success));
    }, [success]);

    const [refreshing, setRefreshing] = useState(false);

    /* =====================================================
       HOSPITAL SETTINGS
    ===================================================== */

    useEffect(() => {
        let cancelled = false;

        const loadSettings = async () => {
            setSettingsLoading(true);

            try {
                const response = await fetch(
                    `${API_URL}/settings/public`
                );

                let data = {};

                try {
                    data = await response.json();
                } catch {
                    data = {};
                }

                if (!response.ok) {
                    return;
                }

                const settings =
                    data?.settings ||
                    data?.data ||
                    data ||
                    {};

                if (cancelled) return;

                setHospitalName(
                    knownHospitalName ||
                        settings.hospitalName ||
                        settings.hospital_name ||
                        "HMS Hospital"
                );

                setHospitalSubtitle(
                    settings.hospitalSubtitle ||
                        settings.hospital_subtitle ||
                        settings.hospitalTagline ||
                        settings.hospital_tagline ||
                        "Hospital Management System"
                );
            } catch (settingsError) {
                console.warn(
                    "Settings loading error:",
                    settingsError
                );
            } finally {
                if (!cancelled) {
                    setSettingsLoading(false);
                }
            }
        };

        loadSettings();

        return () => {
            cancelled = true;
        };
    }, []);

    /* =====================================================
       LOAD DOCTORS
    ===================================================== */

    useEffect(() => {
        let cancelled = false;

        const loadDoctors = async () => {
            if (!validHospitalId) {
                setDoctors([]);
                setDoctorsLoading(false);
                setError("Hospital selection is missing. Please return to Patient Portal and select a hospital first.");
                return;
            }

            setDoctorsLoading(true);

            try {
                const query = `hospital_id=${encodeURIComponent(
                    validHospitalId
                )}`;

                // Patient page par login nahi hota, isliye public endpoint pehle
                const endpoints = [
                    `/public/doctors?${query}`,
                    `/doctors?${query}`,
                ];

                let doctorList = [];
                const failures = [];

                for (const endpoint of endpoints) {
                    const name = endpoint.split("?")[0];

                    try {
                        const response = await fetch(
                            `${API_URL}${endpoint}`
                        );

                        let data = {};

                        try {
                            data = await response.json();
                        } catch {
                            data = {};
                        }

                        if (!response.ok) {
                            failures.push(
                                `${name}: ${response.status} ${
                                    data?.message || ""
                                }`.trim()
                            );
                            continue;
                        }

                        const list = extractArray(data, [
                            "doctors",
                            "data",
                            "results",
                        ])
                            .filter(
                                (raw) =>
                                    raw?.hospital_id ==
                                        null ||
                                    Number(
                                        raw.hospital_id
                                    ) === validHospitalId
                            )
                            .map(normalizeDoctor)
                            .filter(
                                (doctor) =>
                                    doctor?.id !== "" &&
                                    doctor?.id != null
                            );

                        if (list.length > 0) {
                            doctorList = list;
                            break;
                        }

                        failures.push(`${name}: 0 doctors`);
                    } catch {
                        failures.push(
                            `${name}: server not reachable`
                        );
                    }
                }

                if (doctorList.length === 0) {
                    throw new Error(
                        `Doctors could not be loaded for this hospital (${failures.join(
                            " | "
                        )})`
                    );
                }

                if (cancelled) return;

                setDoctors(doctorList);

                setForm((previous) => {
                    if (
                        previous.doctor_id ||
                        doctorList.length === 0
                    ) {
                        return previous;
                    }

                    return {
                        ...previous,
                        doctor_id: doctorList[0].id,
                    };
                });
            } catch (doctorError) {
                console.error(
                    "Doctor loading error:",
                    doctorError
                );

                if (!cancelled) {
                    setDoctors([]);
                    setError(
                        doctorError?.message ||
                            "Unable to load doctors."
                    );
                }
            } finally {
                if (!cancelled) {
                    setDoctorsLoading(false);
                }
            }
        };

        loadDoctors();

        return () => {
            cancelled = true;
        };
    }, [validHospitalId]);

    /* =====================================================
       LOAD PATIENT
    ===================================================== */

    useEffect(() => {
        let cancelled = false;

        const loadPatient = async () => {
            setPatientLoading(true);
            setError("");

            try {
                const statePatient =
                    location.state?.patient;

                const statePatientId =
                    location.state?.patient_id ||
                    statePatient?.id ||
                    statePatient?.patient_id ||
                    "";

                /* -----------------------------------------
                   1. ROUTER STATE
                ----------------------------------------- */

                if (statePatient) {
                    const normalizedPatient =
                        normalizePatient(
                            statePatient
                        );

                    if (cancelled) return;

                    setPatient(normalizedPatient);

                    setForm((previous) => ({
                        ...previous,
                        patient_id:
                            normalizedPatient.id,
                    }));

                    try {
                        sessionStorage.setItem(
                            "newlyRegisteredPatient",
                            JSON.stringify(
                                normalizedPatient
                            )
                        );

                        sessionStorage.setItem(
                            "newlyRegisteredPatientId",
                            String(
                                normalizedPatient.id
                            )
                        );
                    } catch (storageError) {
                        console.warn(
                            "Session storage error:",
                            storageError
                        );
                    }

                    return;
                }

                /* -----------------------------------------
                   2. SESSION STORAGE
                ----------------------------------------- */

                let storedPatient = null;
                let storedPatientId = "";

                try {
                    const stored =
                        sessionStorage.getItem(
                            "newlyRegisteredPatient"
                        );

                    storedPatientId =
                        sessionStorage.getItem(
                            "newlyRegisteredPatientId"
                        ) || "";

                    if (stored) {
                        storedPatient =
                            JSON.parse(stored);
                    }
                } catch (storageError) {
                    console.warn(
                        "Unable to read session storage:",
                        storageError
                    );
                }

                if (storedPatient) {
                    const normalizedPatient =
                        normalizePatient(
                            storedPatient
                        );

                    if (
                        !normalizedPatient.id &&
                        storedPatientId
                    ) {
                        normalizedPatient.id =
                            storedPatientId;

                        normalizedPatient.patient_id =
                            storedPatientId;
                    }

                    if (cancelled) return;

                    setPatient(normalizedPatient);

                    setForm((previous) => ({
                        ...previous,
                        patient_id:
                            normalizedPatient.id,
                    }));

                    return;
                }

                /* -----------------------------------------
                   3. URL PATIENT ID
                ----------------------------------------- */

                const params =
                    new URLSearchParams(
                        location.search
                    );

                const queryPatientId =
                    params.get("patient_id") ||
                    params.get("patientId") ||
                    params.get("id") ||
                    "";

                const patientId =
                    statePatientId ||
                    storedPatientId ||
                    queryPatientId;

                if (!patientId) {
                    if (cancelled) return;

                    setPatient(null);

                    setForm((previous) => ({
                        ...previous,
                        patient_id: "",
                    }));

                    return;
                }

                /* -----------------------------------------
                   4. PUBLIC PATIENT SEARCH
                ----------------------------------------- */

                if (!validHospitalId) {
                    throw new Error(
                        "Hospital selection is missing. Please return to Patient Portal and select a hospital first."
                    );
                }

                const searchUrl =
                    `${API_URL}/patients/public/search` +
                    `?query=${encodeURIComponent(
                        patientId
                    )}` +
                    `&type=id` +
                    `&hospital_id=${encodeURIComponent(
                        validHospitalId
                    )}`;

                const response =
                    await fetch(searchUrl);

                let data = {};

                try {
                    data = await response.json();
                } catch {
                    data = {};
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            "Unable to load registered patient."
                    );
                }

                const patients = extractArray(data, [
                    "patients",
                    "data",
                    "results",
                ]);

                const foundPatient =
                    patients.find(
                        (item) =>
                            String(
                                item?.id ??
                                    item?.patient_id ??
                                    ""
                            ) ===
                            String(patientId)
                    ) ||
                    patients.find(
                        (item) =>
                            String(
                                item?.patient_code ??
                                    ""
                            ) ===
                            String(patientId)
                    );

                if (!foundPatient) {
                    throw new Error(
                        "Registered patient was not found. Please register the patient again."
                    );
                }

                const normalizedPatient =
                    normalizePatient(
                        foundPatient
                    );

                if (cancelled) return;

                setPatient(normalizedPatient);

                setForm((previous) => ({
                    ...previous,
                    patient_id:
                        normalizedPatient.id,
                }));

                try {
                    sessionStorage.setItem(
                        "newlyRegisteredPatient",
                        JSON.stringify(
                            normalizedPatient
                        )
                    );

                    sessionStorage.setItem(
                        "newlyRegisteredPatientId",
                        String(
                            normalizedPatient.id
                        )
                    );
                } catch (storageError) {
                    console.warn(
                        "Unable to save patient session:",
                        storageError
                    );
                }
            } catch (patientError) {
                console.error(
                    "Patient loading error:",
                    patientError
                );

                if (!cancelled) {
                    setPatient(null);

                    setForm((previous) => ({
                        ...previous,
                        patient_id: "",
                    }));

                    setError(
                        patientError?.message ||
                            "Unable to load patient details."
                    );
                }
            } finally {
                if (!cancelled) {
                    setPatientLoading(false);
                }
            }
        };

        loadPatient();

        return () => {
            cancelled = true;
        };
    }, [
        location.search,
        location.state,
        validHospitalId,
    ]);

    /* =====================================================
       CHECK SLOT AVAILABILITY
    ===================================================== */

    useEffect(() => {
        let cancelled = false;

        const loadAvailability = async () => {
            setAppointments([]);
            setLocallyBookedSlots([]);
            setAvailabilityLoaded(false);

            if (
                !validHospitalId ||
                !form.doctor_id ||
                !form.appointment_date
            ) {
                return;
            }

            setAvailabilityLoading(true);

            try {
                const url =
                    `${API_URL}/appointments/public` +
                    `?doctor_id=${encodeURIComponent(
                        form.doctor_id
                    )}` +
                    `&appointment_date=${encodeURIComponent(
                        form.appointment_date
                    )}` +
                    `&hospital_id=${encodeURIComponent(
                        validHospitalId
                    )}`;

                const response = await fetch(url);

                let data = {};

                try {
                    data = await response.json();
                } catch {
                    data = {};
                }

                if (!response.ok) {
                    console.warn(
                        "Availability API error:",
                        data?.message
                    );

                    if (!cancelled) {
                        setAppointments([]);
                        setAvailabilityLoaded(false);
                    }

                    return;
                }

                const appointmentList =
                    extractArray(data, [
                        "appointments",
                        "data",
                        "results",
                    ]);

                if (cancelled) return;

                setAppointments(appointmentList);
                setAvailabilityLoaded(true);
            } catch (availabilityError) {
                console.error(
                    "Availability loading error:",
                    availabilityError
                );

                if (!cancelled) {
                    setAppointments([]);
                    setAvailabilityLoaded(false);
                }
            } finally {
                if (!cancelled) {
                    setAvailabilityLoading(false);
                }
            }
        };

        loadAvailability();

        return () => {
            cancelled = true;
        };
    }, [
        form.doctor_id,
        form.appointment_date,
        validHospitalId,
    ]);

    /* =====================================================
       BOOKED SLOTS
    ===================================================== */

    const bookedSlots = useMemo(() => {
        const slots = new Set();

        appointments.forEach((appointment) => {
            const status =
                getAppointmentStatus(
                    appointment
                );

            if (
                status === "cancelled" ||
                status === "canceled"
            ) {
                return;
            }

            const time =
                getAppointmentTime(
                    appointment
                );

            if (time) {
                slots.add(time);
            }
        });

        locallyBookedSlots.forEach((time) => {
            if (time) {
                slots.add(
                    String(time).slice(0, 5)
                );
            }
        });

        return slots;
    }, [
        appointments,
        locallyBookedSlots,
    ]);

    /* =====================================================
       FORM CHANGE
    ===================================================== */

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setError("");

        setForm((previous) => {
            const updated = {
                ...previous,
                [name]: value,
            };

            if (
                name === "doctor_id" ||
                name === "appointment_date"
            ) {
                updated.appointment_time = "";
            }

            return updated;
        });
    };

    /* =====================================================
       TIME SLOT SELECT
    ===================================================== */

    const handleTimeSelect = (time) => {
        if (bookedSlots.has(time)) {
            return;
        }

        setError("");

        setForm((previous) => ({
            ...previous,
            appointment_time: time,
        }));
    };

    /* =====================================================
       REFRESH AVAILABILITY
    ===================================================== */

    const handleRefresh = async () => {
        if (
            !form.doctor_id ||
            !form.appointment_date
        ) {
            return;
        }

        setRefreshing(true);
        setError("");

        try {
            const url =
                `${API_URL}/appointments/public` +
                `?doctor_id=${encodeURIComponent(
                    form.doctor_id
                )}` +
                `&appointment_date=${encodeURIComponent(
                    form.appointment_date
                )}` +
                `&hospital_id=${encodeURIComponent(
                    validHospitalId
                )}`;

            const response = await fetch(url);

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Unable to refresh availability."
                );
            }

            const appointmentList =
                extractArray(data, [
                    "appointments",
                    "data",
                    "results",
                ]);

            setAppointments(appointmentList);
            setAvailabilityLoaded(true);

            if (
                form.appointment_time &&
                appointmentList.some(
                    (appointment) =>
                        getAppointmentStatus(
                            appointment
                        ) !== "cancelled" &&
                        getAppointmentStatus(
                            appointment
                        ) !== "canceled" &&
                        getAppointmentTime(
                            appointment
                        ) ===
                            form.appointment_time
                )
            ) {
                setForm((previous) => ({
                    ...previous,
                    appointment_time: "",
                }));
            }
        } catch (refreshError) {
            console.error(
                "Refresh availability error:",
                refreshError
            );

            setAvailabilityLoaded(false);

            setError(
                refreshError?.message ||
                    "Unable to refresh availability."
            );
        } finally {
            setRefreshing(false);
        }
    };

    /* =====================================================
       VALIDATE
    ===================================================== */

    const validateForm = () => {
        if (!validHospitalId) {
            return "Hospital selection is missing. Please return to Patient Portal and select a hospital first.";
        }

        if (!patient?.id) {
            return "Patient information is missing. Please register the patient first.";
        }

        if (!form.doctor_id) {
            return "Please select a doctor.";
        }

        if (!form.appointment_date) {
            return "Please select appointment date.";
        }

        if (!form.appointment_time) {
            return "Please select a time slot.";
        }

        if (
            bookedSlots.has(
                form.appointment_time
            )
        ) {
            return "This time slot is already booked. Please select another slot.";
        }

        return "";
    };

    /* =====================================================
       BOOK APPOINTMENT
    ===================================================== */

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess(null);

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        const selectedTime =
            form.appointment_time;

        try {
            const feeDoctor = doctors.find(
                (doctor) => String(doctor.id) === String(form.doctor_id)
            );
            const appointmentFee = getDoctorFee(feeDoctor);

            const payload = {
                fee: appointmentFee,
                payment_mode: paymentMode,
                patient_id: Number(
                    patient.id
                ),
                doctor_id: Number(
                    form.doctor_id
                ),
                appointment_date:
                    form.appointment_date,
                appointment_time:
                    selectedTime,
                reason:
                    form.reason.trim() ||
                    null,

                patient_type: "new",

                hospital_id: validHospitalId,
            };

            const response = await fetch(
                `${API_URL}/appointments/public`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(
                        payload
                    ),
                }
            );

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                if (response.status === 409) {
                    setLocallyBookedSlots(
                        (previous) =>
                            Array.from(
                                new Set([
                                    ...previous,
                                    selectedTime,
                                ])
                            )
                    );

                    setForm((previous) => ({
                        ...previous,
                        appointment_time: "",
                    }));

                    throw new Error(
                        data?.message ||
                            "This appointment slot is already booked. Please select another slot."
                    );
                }

                throw new Error(
                    data?.message ||
                        "Unable to book appointment."
                );
            }

            const createdAppointment =
                data?.appointment ||
                data?.data ||
                {};

            const selectedDoctor =
                doctors.find(
                    (doctor) =>
                        String(
                            doctor.id
                        ) ===
                        String(
                            form.doctor_id
                        )
                );

            const appointmentId =
                createdAppointment?.id ??
                data?.appointmentId ??
                data?.id ??
                "";

            setSuccess({
                id: appointmentId,
                appointment_id:
                    appointmentId,
                patient_id: patient.id,
                patient_code:
                    patient.patient_code ||
                    "",
                patient_name:
                    patient.name || "",
                doctor_id:
                    form.doctor_id,
                doctor_name:
                    createdAppointment?.doctor_name ||
                    selectedDoctor?.name ||
                    "",
                specialization:
                    createdAppointment?.specialization ||
                    selectedDoctor?.specialization ||
                    "",
                appointment_date:
                    form.appointment_date,
                appointment_time:
                    selectedTime,
                status:
                    createdAppointment?.status ||
                    "pending",
                fee: appointmentFee,
                payment_mode: paymentMode,
                receipt_no:
                    createdAppointment?.receipt_no ||
                    createdAppointment?.receiptNo ||
                    appointmentId,
                reason:
                    form.reason.trim() ||
                    "",
                patient_type: "new",
            });

            setLocallyBookedSlots(
                (previous) =>
                    Array.from(
                        new Set([
                            ...previous,
                            selectedTime,
                        ])
                    )
            );

            setForm((previous) => ({
                ...previous,
                appointment_time: "",
                reason: "",
            }));
        } catch (submitError) {
            console.error(
                "Appointment booking error:",
                submitError
            );

            setError(
                submitError?.message ||
                    "Unable to book appointment. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       NAVIGATION
    ===================================================== */

    const handleBackHome = () => {
        navigate("/");
    };

    const handleRegisterPatient = () => {
        navigate("/patient-registration");
    };

    const handleBookAnother = () => {
        setSuccess(null);
        setError("");

        setForm((previous) => ({
            ...previous,
            doctor_id:
                doctors.length > 0
                    ? doctors[0].id
                    : "",
            appointment_date: getToday(),
            appointment_time: "",
            reason: "",
        }));

        setAppointments([]);
        setLocallyBookedSlots([]);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    /* =====================================================
       SELECTED DOCTOR
    ===================================================== */

    const selectedDoctor = useMemo(() => {
        return (
            doctors.find(
                (doctor) =>
                    String(
                        doctor.id
                    ) ===
                    String(
                        form.doctor_id
                    )
            ) || null
        );
    }, [
        doctors,
        form.doctor_id,
    ]);

    /* =====================================================
       SUCCESS SCREEN
    ===================================================== */

    if (success) {
        return (
            <div className="new-appointment-page">
                <SuccessPopup
                    open={successPopupOpen}
                    title="Appointment Booked"
                    message="Your appointment has been booked successfully."
                    buttonLabel="View Receipt"
                    onClose={() => setSuccessPopupOpen(false)}
                />

                <header className="new-appointment-header">
                    <button
                        type="button"
                        className="new-back-btn"
                        onClick={handleBackHome}
                    >
                        <FaArrowLeft />
                        <span>
                            Back to Home
                        </span>
                    </button>

                    <div className="new-header-brand">
                        <div className="new-brand-icon">
                            <FaHospital />
                        </div>

                        <div>
                            <h1>
                                {hospitalName}
                            </h1>

                            <p>
                                {hospitalSubtitle}
                            </p>
                        </div>
                    </div>
                </header>

                <main className="new-appointment-main">
                    <section className="new-success-card">
                        <div className="new-success-icon">
                            <FaCheckCircle />
                        </div>

                        <h2>
                            Appointment Booked
                            Successfully
                        </h2>

                        <p className="new-success-message">
                            Your appointment has
                            been successfully
                            submitted to{" "}
                            <strong>
                                {hospitalName}
                            </strong>
                            .
                        </p>

                        <div className="new-success-details">
                            <div className="new-success-row">
                                <span>
                                    Patient Name
                                </span>

                                <strong>
                                    {success.patient_name}
                                </strong>
                            </div>

                            <div className="new-success-row">
                                <span>
                                    Patient ID
                                </span>

                                <strong>
                                    {success.patient_id}
                                </strong>
                            </div>

                            {success.patient_code && (
                                <div className="new-success-row">
                                    <span>
                                        Patient Code
                                    </span>

                                    <strong>
                                        {success.patient_code}
                                    </strong>
                                </div>
                            )}

                            <div className="new-success-row">
                                <span>
                                    Doctor
                                </span>

                                <strong>
                                    Dr.{" "}
                                    {success.doctor_name}
                                </strong>
                            </div>

                            {success.specialization && (
                                <div className="new-success-row">
                                    <span>
                                        Specialization
                                    </span>

                                    <strong>
                                        {success.specialization}
                                    </strong>
                                </div>
                            )}

                            <div className="new-success-row">
                                <span>
                                    Appointment Date
                                </span>

                                <strong>
                                    {formatDate(
                                        success.appointment_date
                                    )}
                                </strong>
                            </div>

                            <div className="new-success-row">
                                <span>
                                    Appointment Time
                                </span>

                                <strong>
                                    {formatTime(
                                        success.appointment_time
                                    )}
                                </strong>
                            </div>

                            <div className="new-success-row">
                                <span>
                                    Status
                                </span>

                                <strong className="new-status-pending">
                                    Pending
                                </strong>
                            </div>
                        </div>

                        <PrintableReceipt
                            variant="new"
                            badge="New Patient"
                            title="New Patient Appointment Receipt"
                            data={{
                                hospital: hospitalName || patientHospitalName,
                                receiptNo: success.receipt_no,
                                registrationNo: success.patient_code,
                                patient: success.patient_name,
                                doctor: success.doctor_name,
                                doctorId: success.doctor_id,
                                date: success.appointment_date,
                                time: success.appointment_time,
                                fee: success.fee,
                                paymentMode: success.payment_mode,
                            }}
                        />

                        <div className="new-success-actions">
                            <button
                                type="button"
                                className="new-primary-btn"
                                onClick={handleBookAnother}
                            >
                                <FaCalendarAlt />
                                Book Another
                                Appointment
                            </button>

                            <button
                                type="button"
                                className="new-secondary-btn"
                                onClick={handleBackHome}
                            >
                                <FaArrowLeft />
                                Back to Home
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    /* =====================================================
       MAIN PAGE
    ===================================================== */

    return (
        <div className="new-appointment-page">
            <header className="new-appointment-header">
                <button
                    type="button"
                    className="new-back-btn"
                    onClick={handleBackHome}
                >
                    <FaArrowLeft />
                    <span>
                        Back to Home
                    </span>
                </button>

                <div className="new-header-brand">
                    <div className="new-brand-icon">
                        <FaHospital />
                    </div>

                    <div>
                        <h1>
                            {settingsLoading
                                ? "HMS Hospital"
                                : hospitalName}
                        </h1>

                        <p>
                            {hospitalSubtitle}
                        </p>
                    </div>
                </div>
            </header>

            <main className="new-appointment-main">
                <section className="new-page-heading">
                    <span className="new-page-kicker">
                        PATIENT SERVICES
                    </span>

                    <h2>
                        New Patient
                        Appointment
                    </h2>

                    <p>
                        Book an appointment
                        with a doctor at{" "}
                        <strong>
                            {hospitalName}
                        </strong>
                    </p>
                </section>

                {error && (
                    <div className="new-error-box">
                        <div className="new-error-icon">
                            !
                        </div>

                        <div>
                            <strong>
                                Booking Error
                            </strong>

                            <p>
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {patientLoading ? (
                    <section className="new-loading-card">
                        <div className="new-loader" />

                        <h3>
                            Loading Patient
                            Information...
                        </h3>

                        <p>
                            Please wait while we
                            load your registered
                            patient details.
                        </p>
                    </section>
                ) : !patient ? (
                    <section className="new-missing-patient-card">
                        <div className="new-missing-icon">
                            <FaUser />
                        </div>

                        <span className="new-page-kicker">
                            PATIENT SERVICES
                        </span>

                        <h2>
                            Patient Information
                            Required
                        </h2>

                        <p>
                            Please complete New
                            Patient Registration
                            before booking an
                            appointment.
                        </p>

                        <button
                            type="button"
                            className="new-primary-btn"
                            onClick={handleRegisterPatient}
                        >
                            <FaUser />
                            Register Patient
                        </button>
                    </section>
                ) : (
                    <form
                        className="new-appointment-layout"
                        onSubmit={handleSubmit}
                    >
                        {/* PATIENT */}

                        <section className="new-card new-patient-card">
                            <div className="new-card-header">
                                <div className="new-card-icon">
                                    <FaUser />
                                </div>

                                <div>
                                    <h3>
                                        Patient
                                        Information
                                    </h3>

                                    <p>
                                        Registered
                                        patient
                                        details
                                    </p>
                                </div>
                            </div>

                            <div className="new-patient-grid">
                                <div className="new-info-item">
                                    <span>
                                        Patient Name
                                    </span>

                                    <strong>
                                        {patient.name}
                                    </strong>
                                </div>

                                <div className="new-info-item">
                                    <span>
                                        Patient ID
                                    </span>

                                    <strong>
                                        {patient.id}
                                    </strong>
                                </div>

                                {patient.patient_code && (
                                    <div className="new-info-item">
                                        <span>
                                            Patient
                                            Code
                                        </span>

                                        <strong>
                                            {patient.patient_code}
                                        </strong>
                                    </div>
                                )}

                                <div className="new-info-item">
                                    <span>
                                        <FaPhone />
                                        Mobile
                                    </span>

                                    <strong>
                                        {patient.phone ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="new-info-item">
                                    <span>
                                        <FaVenusMars />
                                        Gender
                                    </span>

                                    <strong>
                                        {patient.gender ||
                                            "—"}
                                    </strong>
                                </div>
                            </div>
                        </section>

                        {/* DOCTOR */}

                        <section className="new-card">
                            <div className="new-card-header">
                                <div className="new-card-icon">
                                    <FaUserMd />
                                </div>

                                <div>
                                    <h3>
                                        Select Doctor
                                    </h3>

                                    <p>
                                        Choose your
                                        preferred
                                        doctor
                                    </p>
                                </div>
                            </div>

                            <div className="new-form-group">
                                <label htmlFor="doctor_id">
                                    <FaUserMd />
                                    Doctor
                                    <span>
                                        *
                                    </span>
                                </label>

                                <select
                                    id="doctor_id"
                                    name="doctor_id"
                                    value={form.doctor_id}
                                    onChange={handleChange}
                                    disabled={
                                        doctorsLoading ||
                                        doctors.length === 0
                                    }
                                    required
                                >
                                    <option value="">
                                        {doctorsLoading
                                            ? "Loading doctors..."
                                            : doctors.length === 0
                                            ? "No doctors available"
                                            : "Select Doctor"}
                                    </option>

                                    {doctors.map(
                                        (doctor) => (
                                            <option
                                                key={doctor.id}
                                                value={doctor.id}
                                            >
                                                {doctor.name}
                                                {doctor.specialization
                                                    ? ` — ${doctor.specialization}`
                                                    : ""}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {selectedDoctor && (
                                <div className="new-selected-doctor">
                                    <div className="new-selected-doctor-icon">
                                        <FaStethoscope />
                                    </div>

                                    <div>
                                        <strong>
                                            {selectedDoctor.name}
                                        </strong>

                                        <span>
                                            {selectedDoctor.specialization}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* DATE */}

                        <section className="new-card">
                            <div className="new-card-header">
                                <div className="new-card-icon">
                                    <FaCalendarAlt />
                                </div>

                                <div>
                                    <h3>
                                        Appointment
                                        Date
                                    </h3>

                                    <p>
                                        Select your
                                        preferred
                                        date
                                    </p>
                                </div>
                            </div>

                            <div className="new-form-group">
                                <label htmlFor="appointment_date">
                                    <FaCalendarAlt />
                                    Date
                                    <span>
                                        *
                                    </span>
                                </label>

                                <input
                                    id="appointment_date"
                                    type="date"
                                    name="appointment_date"
                                    value={form.appointment_date}
                                    min={getToday()}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </section>

                        {/* TIME */}

                        <section className="new-card new-time-card">
                            <div className="new-card-header">
                                <div className="new-card-icon">
                                    <FaClock />
                                </div>

                                <div className="new-time-heading">
                                    <div>
                                        <h3>
                                            Select
                                            Time Slot
                                        </h3>

                                        <p>
                                            Choose an
                                            available
                                            appointment
                                            time
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="new-refresh-btn"
                                        onClick={handleRefresh}
                                        disabled={
                                            availabilityLoading ||
                                            refreshing ||
                                            !form.doctor_id ||
                                            !form.appointment_date
                                        }
                                        title="Refresh availability"
                                    >
                                        <FaRedo
                                            className={
                                                availabilityLoading ||
                                                refreshing
                                                    ? "new-spin"
                                                    : ""
                                            }
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="new-slot-status">
                                <span className="new-slot-available-dot" />
                                <span>
                                    Green slots are
                                    available
                                </span>

                                <span className="new-slot-booked-dot" />
                                <span>
                                    Red slots are
                                    booked
                                </span>

                                {availabilityLoading && (
                                    <span className="new-slot-loading">
                                        Checking
                                        availability...
                                    </span>
                                )}

                                {!availabilityLoading &&
                                    !availabilityLoaded && (
                                        <span className="new-slot-loading">
                                            Availability
                                            refresh
                                            pending
                                        </span>
                                    )}
                            </div>

                            <div className="new-time-slots">
                                {TIME_SLOTS.map((time) => {
                                    const isBooked =
                                        bookedSlots.has(time);

                                    const isSelected =
                                        form.appointment_time ===
                                        time;

                                    return (
                                        <button
                                            key={time}
                                            type="button"
                                            className={`new-time-slot ${
                                                isSelected
                                                    ? "selected"
                                                    : isBooked
                                                    ? "booked"
                                                    : "available"
                                            }`}
                                            disabled={isBooked}
                                            aria-pressed={isSelected}
                                            onClick={() =>
                                                handleTimeSelect(time)
                                            }
                                        >
                                            <span>
                                                {formatTime(time)}
                                            </span>

                                            <small>
                                                {isBooked
                                                    ? "Booked"
                                                    : isSelected
                                                    ? "Selected"
                                                    : "Available"}
                                            </small>
                                        </button>
                                    );
                                })}
                            </div>

                            {form.appointment_time && (
                                <div className="new-selected-slot">
                                    <FaCheckCircle />

                                    <span>
                                        Selected
                                        Time:
                                    </span>

                                    <strong>
                                        {formatTime(
                                            form.appointment_time
                                        )}
                                    </strong>
                                </div>
                            )}
                        </section>

                        {/* REASON */}

                        <section className="new-card">
                            <div className="new-card-header">
                                <div className="new-card-icon">
                                    <FaStethoscope />
                                </div>

                                <div>
                                    <h3>
                                        Reason for
                                        Visit
                                    </h3>

                                    <p>
                                        Tell us briefly
                                        about your
                                        concern
                                    </p>
                                </div>
                            </div>

                            <div className="new-form-group">
                                <label htmlFor="reason">
                                    Reason
                                </label>

                                <textarea
                                    id="reason"
                                    name="reason"
                                    value={form.reason}
                                    onChange={handleChange}
                                    placeholder="Enter reason for appointment..."
                                    rows="4"
                                    maxLength="500"
                                />

                                <div className="new-character-count">
                                    {form.reason.length}{" "}
                                    / 500
                                </div>
                            </div>
                        </section>

                        {/* SUMMARY */}

                        <section className="new-card new-summary-card">
                            <div className="new-card-header">
                                <div className="new-card-icon">
                                    <FaCheckCircle />
                                </div>

                                <div>
                                    <h3>
                                        Appointment
                                        Summary
                                    </h3>

                                    <p>
                                        Please review
                                        before
                                        booking
                                    </p>
                                </div>
                            </div>

                            <div className="new-summary-grid">
                                <div>
                                    <span>
                                        Patient
                                    </span>

                                    <strong>
                                        {patient.name}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Doctor
                                    </span>

                                    <strong>
                                        {selectedDoctor?.name ||
                                            "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Date
                                    </span>

                                    <strong>
                                        {formatDate(
                                            form.appointment_date
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Time
                                    </span>

                                    <strong>
                                        {form.appointment_time
                                            ? formatTime(
                                                  form.appointment_time
                                              )
                                            : "Not selected"}
                                    </strong>
                                </div>
                            </div>

                            <PaymentSection
                                variant="new"
                                doctor={selectedDoctor}
                                mode={paymentMode}
                                onMode={setPaymentMode}
                            />

                            <button
                                type="submit"
                                className="new-book-btn"
                                disabled={
                                    loading ||
                                    !patient?.id ||
                                    !form.doctor_id ||
                                    !form.appointment_date ||
                                    !form.appointment_time
                                }
                            >
                                {loading ? (
                                    <>
                                        <span className="new-button-loader" />
                                        Booking
                                        Appointment...
                                    </>
                                ) : (
                                    <>
                                        <FaCalendarAlt />
                                        Book
                                        Appointment
                                    </>
                                )}
                            </button>
                        </section>
                    </form>
                )}
            </main>

            <footer className="new-appointment-footer">
                <p>
                    © {new Date().getFullYear()}{" "}
                    {hospitalName}. All rights
                    reserved.
                </p>

                <span>
                    Patient Services
                </span>
            </footer>
        </div>
    );
};

export default NewPatientAppointment;