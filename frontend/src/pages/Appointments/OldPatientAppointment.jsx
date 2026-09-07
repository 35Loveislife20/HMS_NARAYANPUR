import React, { useEffect, useMemo, useState } from "react";

import {
    FaArrowLeft,
    FaArrowRight,
    FaCalendarAlt,
    FaCheck,
    FaCheckCircle,
    FaClock,
    FaHospital,
    FaIdCard,
    FaPhone,
    FaSearch,
    FaStethoscope,
    FaUser,
    FaUserMd,
    FaTimes,
    FaRedo,
    FaLock,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import "./OldPatientAppointment.css";

// =====================================================
// API
// =====================================================

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

// =====================================================
// SLOT CONFIG
// =====================================================

const SLOT_START_HOUR = 9;
const SLOT_END_HOUR = 18;
const SLOT_INTERVAL = 30;

// =====================================================
// EMPTY FORM
// =====================================================

const EMPTY_FORM = {
    patient_id: "",
    doctor_id: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
};

// =====================================================
// GENERATE TIME SLOTS DYNAMICALLY
// =====================================================

const generateTimeSlots = (
    startHour = SLOT_START_HOUR,
    endHour = SLOT_END_HOUR,
    interval = SLOT_INTERVAL
) => {
    const slots = [];

    const startMinutes =
        startHour * 60;

    const endMinutes =
        endHour * 60 + 30;

    for (
        let minutes = startMinutes;
        minutes <= endMinutes;
        minutes += interval
    ) {
        const hours = Math.floor(
            minutes / 60
        );

        const mins =
            minutes % 60;

        slots.push(
            `${String(hours).padStart(
                2,
                "0"
            )}:${String(mins).padStart(
                2,
                "0"
            )}`
        );
    }

    return slots;
};

const TIME_SLOTS =
    generateTimeSlots();

// =====================================================
// HELPERS
// =====================================================

const normalizeArray = (data) => {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.patients)) {
        return data.patients;
    }

    if (Array.isArray(data?.doctors)) {
        return data.doctors;
    }

    if (Array.isArray(data?.appointments)) {
        return data.appointments;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (Array.isArray(data?.rows)) {
        return data.rows;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    return [];
};

// =====================================================
// PATIENT HELPERS
// =====================================================

const getPatientId = (patient) => {
    if (!patient) return "";

    return (
        patient.id ??
        patient.patient_id ??
        patient.patientId ??
        patient.ID ??
        ""
    );
};

const getPatientCode = (patient) => {
    if (!patient) return "";

    return (
        patient.patient_code ??
        patient.patientCode ??
        patient.patient_number ??
        patient.patientNumber ??
        patient.registration_number ??
        patient.registrationNumber ??
        patient.code ??
        ""
    );
};

const getPatientName = (patient) => {
    if (!patient) {
        return "Unknown Patient";
    }

    const name =
        patient.name ??
        patient.full_name ??
        patient.fullName ??
        patient.patient_name ??
        patient.patientName;

    if (name) {
        return String(name);
    }

    const firstName =
        patient.first_name ??
        patient.firstName ??
        "";

    const lastName =
        patient.last_name ??
        patient.lastName ??
        "";

    return (
        `${firstName} ${lastName}`.trim() ||
        "Unknown Patient"
    );
};

const getPatientPhone = (patient) => {
    if (!patient) return "";

    return (
        patient.phone ??
        patient.mobile ??
        patient.mobile_number ??
        patient.mobileNumber ??
        patient.contact ??
        ""
    );
};

const getPatientGender = (patient) => {
    if (!patient) return "";

    return (
        patient.gender ??
        patient.sex ??
        ""
    );
};

// =====================================================
// DOCTOR HELPERS
// =====================================================

const getDoctorId = (doctor) => {
    if (!doctor) return "";

    return (
        doctor.id ??
        doctor.doctor_id ??
        doctor.doctorId ??
        doctor.ID ??
        ""
    );
};

const getDoctorName = (doctor) => {
    if (!doctor) {
        return "Unknown Doctor";
    }

    const name =
        doctor.name ??
        doctor.full_name ??
        doctor.fullName ??
        doctor.doctor_name ??
        doctor.doctorName;

    if (name) {
        return String(name);
    }

    const firstName =
        doctor.first_name ??
        doctor.firstName ??
        "";

    const lastName =
        doctor.last_name ??
        doctor.lastName ??
        "";

    return (
        `${firstName} ${lastName}`.trim() ||
        "Unknown Doctor"
    );
};

const getDoctorSpecialization = (
    doctor
) => {
    if (!doctor) return "";

    return (
        doctor.specialization ??
        doctor.speciality ??
        doctor.specialty ??
        doctor.department ??
        doctor.designation ??
        ""
    );
};

// =====================================================
// DATE / TIME
// =====================================================

const normalizeDate = (value) => {
    if (!value) return "";

    const stringValue =
        String(value);

    if (
        stringValue.includes("T")
    ) {
        return stringValue.split(
            "T"
        )[0];
    }

    if (
        stringValue.includes(" ")
    ) {
        return stringValue.split(
            " "
        )[0];
    }

    return stringValue.substring(
        0,
        10
    );
};

const normalizeTime = (value) => {
    if (!value) return "";

    const stringValue =
        String(value);

    if (
        stringValue.includes("T")
    ) {
        return stringValue.substring(
            11,
            16
        );
    }

    if (
        stringValue.includes(" ")
    ) {
        const parts =
            stringValue.split(" ");

        if (parts[1]) {
            return parts[1].substring(
                0,
                5
            );
        }
    }

    return stringValue.substring(
        0,
        5
    );
};

const formatTime = (time) => {
    if (!time) return "";

    const [
        hoursString,
        minutes,
    ] = String(time)
        .substring(0, 5)
        .split(":");

    let hours =
        Number(hoursString);

    if (Number.isNaN(hours)) {
        return time;
    }

    const suffix =
        hours >= 12
            ? "PM"
            : "AM";

    hours =
        hours % 12;

    if (hours === 0) {
        hours = 12;
    }

    return `${hours}:${minutes} ${suffix}`;
};

const formatDate = (date) => {
    if (!date) return "";

    const normalized =
        normalizeDate(date);

    const [
        year,
        month,
        day,
    ] = normalized
        .split("-")
        .map(Number);

    if (
        !year ||
        !month ||
        !day
    ) {
        return date;
    }

    const parsed =
        new Date(
            year,
            month - 1,
            day
        );

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return date;
    }

    return parsed.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
};

const getTodayLocal = () => {
    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

// =====================================================
// APPOINTMENT HELPERS
// =====================================================

const isCancelledAppointment = (
    appointment
) => {
    const status =
        String(
            appointment?.status ??
                appointment?.appointment_status ??
                appointment?.appointmentStatus ??
                ""
        )
            .trim()
            .toLowerCase();

    return (
        status === "cancelled" ||
        status === "canceled"
    );
};

const getAppointmentDoctorId = (
    appointment
) => {
    if (!appointment) return "";

    return String(
        appointment.doctor_id ??
            appointment.doctorId ??
            appointment.doctor?.id ??
            ""
    );
};

const getAppointmentDate = (
    appointment
) => {
    if (!appointment) return "";

    return normalizeDate(
        appointment.appointment_date ??
            appointment.appointmentDate ??
            appointment.date ??
            ""
    );
};

const getAppointmentTime = (
    appointment
) => {
    if (!appointment) return "";

    return normalizeTime(
        appointment.appointment_time ??
            appointment.appointmentTime ??
            appointment.time ??
            ""
    );
};

const createSlotKey = (
    doctorId,
    date,
    time
) => {
    return `${String(
        doctorId
    )}_${normalizeDate(
        date
    )}_${normalizeTime(
        time
    )}`;
};

// =====================================================
// SLOT PERIOD
// =====================================================

const getSlotPeriod = (
    time
) => {
    const hour = Number(
        String(time).split(":")[0]
    );

    if (hour < 12) {
        return "Morning";
    }

    if (hour < 17) {
        return "Afternoon";
    }

    return "Evening";
};

// =====================================================
// COMPONENT
// =====================================================

function OldPatientAppointment() {
    const navigate =
        useNavigate();

    // ===================================================
    // STATE
    // ===================================================

    const [
        hospitalName,
        setHospitalName,
    ] = useState(
        "HMS Hospital"
    );

    const [
        patients,
        setPatients,
    ] = useState([]);

    const [
        doctors,
        setDoctors,
    ] = useState([]);

    const [
        appointments,
        setAppointments,
    ] = useState([]);

    const [
        selectedPatient,
        setSelectedPatient,
    ] = useState(null);

    const [
        searchValue,
        setSearchValue,
    ] = useState("");

    const [
        searchType,
        setSearchType,
    ] = useState("all");

    const [
        showPatientResults,
        setShowPatientResults,
    ] = useState(false);

    const [
        loadingPatients,
        setLoadingPatients,
    ] = useState(false);

    const [
        loadingDoctors,
        setLoadingDoctors,
    ] = useState(false);

    const [
        loadingAvailability,
        setLoadingAvailability,
    ] = useState(false);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        loadingSettings,
        setLoadingSettings,
    ] = useState(true);

    const [
        availabilityLoaded,
        setAvailabilityLoaded,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        success,
        setSuccess,
    ] = useState(null);

    const [
        locallyBookedSlots,
        setLocallyBookedSlots,
    ] = useState([]);

    const [
        form,
        setForm,
    ] = useState(
        EMPTY_FORM
    );

    const [
        selectedTimeSlot,
        setSelectedTimeSlot,
    ] = useState("");

    // ===================================================
    // FETCH JSON
    // ===================================================

    const fetchJSON = async (
        url,
        options = {}
    ) => {
        const response =
            await fetch(url, {
                ...options,
                headers: {
                    Accept:
                        "application/json",
                    "Content-Type":
                        "application/json",
                    ...(options.headers ||
                        {}),
                },
            });

        let data = {};

        try {
            data =
                await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            const message =
                data?.message ||
                data?.error ||
                `Request failed with status ${response.status}`;

            const requestError =
                new Error(
                    message
                );

            requestError.status =
                response.status;

            requestError.data =
                data;

            throw requestError;
        }

        return data;
    };

    // ===================================================
    // SETTINGS
    // ===================================================

    useEffect(() => {
        let mounted = true;

        const loadSettings =
            async () => {
                try {
                    setLoadingSettings(
                        true
                    );

                    const data =
                        await fetchJSON(
                            `${API_URL}/settings`
                        );

                    const settings =
                        data?.data ||
                        data?.settings ||
                        data ||
                        {};

                    if (!mounted) {
                        return;
                    }

                    setHospitalName(
                        settings.hospitalName ||
                            settings.hospital_name ||
                            settings.name ||
                            "HMS Hospital"
                    );
                } catch {
                    if (mounted) {
                        setHospitalName(
                            "HMS Hospital"
                        );
                    }
                } finally {
                    if (mounted) {
                        setLoadingSettings(
                            false
                        );
                    }
                }
            };

        loadSettings();

        return () => {
            mounted = false;
        };
    }, []);

    // ===================================================
    // DOCTORS
    // ===================================================

    const fetchDoctors =
        async () => {
            try {
                setLoadingDoctors(
                    true
                );

                const data =
                    await fetchJSON(
                        `${API_URL}/doctors`
                    );

                const doctorList =
                    normalizeArray(
                        data
                    );

                setDoctors(
                    doctorList
                );

                return doctorList;
            } catch (
                requestError
            ) {
                setError(
                    requestError?.message ||
                        "Unable to load doctors."
                );

                return [];
            } finally {
                setLoadingDoctors(
                    false
                );
            }
        };

    useEffect(() => {
        fetchDoctors();
    }, []);

    // ===================================================
    // PATIENT SEARCH
    // ===================================================

    const searchPatients =
        async (
            value = searchValue
        ) => {
            const search =
                String(
                    value || ""
                ).trim();

            if (!search) {
                setPatients([]);
                setShowPatientResults(
                    false
                );
                return [];
            }

            if (search.length < 2) {
                setPatients([]);
                setShowPatientResults(
                    true
                );
                return [];
            }

            try {
                setLoadingPatients(
                    true
                );

                setError("");

                const query =
                    new URLSearchParams({
                        query: search,
                        type: searchType,
                    });

                const data =
                    await fetchJSON(
                        `${API_URL}/patients/public/search?${query.toString()}`
                    );

                let patientList =
                    normalizeArray(
                        data
                    );

                const normalizedSearch =
                    search.toLowerCase();

                patientList =
                    patientList
                        .filter(
                            (
                                patient
                            ) => {
                                const id =
                                    String(
                                        getPatientId(
                                            patient
                                        )
                                    ).toLowerCase();

                                const code =
                                    String(
                                        getPatientCode(
                                            patient
                                        )
                                    ).toLowerCase();

                                const name =
                                    String(
                                        getPatientName(
                                            patient
                                        )
                                    ).toLowerCase();

                                const phone =
                                    String(
                                        getPatientPhone(
                                            patient
                                        )
                                    ).toLowerCase();

                                if (
                                    searchType ===
                                    "id"
                                ) {
                                    return (
                                        id.includes(
                                            normalizedSearch
                                        ) ||
                                        code.includes(
                                            normalizedSearch
                                        )
                                    );
                                }

                                if (
                                    searchType ===
                                    "name"
                                ) {
                                    return name.includes(
                                        normalizedSearch
                                    );
                                }

                                if (
                                    searchType ===
                                    "phone"
                                ) {
                                    return phone.includes(
                                        normalizedSearch
                                    );
                                }

                                return (
                                    id.includes(
                                        normalizedSearch
                                    ) ||
                                    code.includes(
                                        normalizedSearch
                                    ) ||
                                    name.includes(
                                        normalizedSearch
                                    ) ||
                                    phone.includes(
                                        normalizedSearch
                                    )
                                );
                            }
                        )
                        .slice(
                            0,
                            10
                        );

                setPatients(
                    patientList
                );

                setShowPatientResults(
                    true
                );

                return patientList;
            } catch (
                requestError
            ) {
                setPatients([]);

                setShowPatientResults(
                    true
                );

                setError(
                    requestError?.message ||
                        "Unable to search patients."
                );

                return [];
            } finally {
                setLoadingPatients(
                    false
                );
            }
        };

    // ===================================================
    // SEARCH TYPE
    // ===================================================

    useEffect(() => {
        if (
            searchValue.trim()
                .length >= 2
        ) {
            searchPatients(
                searchValue
            );
        }
    }, [searchType]);

    // ===================================================
    // SEARCH DEBOUNCE
    // ===================================================

    useEffect(() => {
        const value =
            searchValue.trim();

        if (!value) {
            setPatients([]);

            setShowPatientResults(
                false
            );

            return undefined;
        }

        if (value.length < 2) {
            setPatients([]);

            setShowPatientResults(
                true
            );

            return undefined;
        }

        const timer =
            setTimeout(() => {
                searchPatients(
                    value
                );
            }, 350);

        return () => {
            clearTimeout(
                timer
            );
        };
    }, [searchValue]);

    // ===================================================
    // SELECT PATIENT
    // ===================================================

    const handleSelectPatient = (
        patient
    ) => {
        const patientId =
            getPatientId(
                patient
            );

        if (!patientId) {
            setError(
                "Selected patient does not have a valid patient ID."
            );

            return;
        }

        setSelectedPatient(
            patient
        );

        setForm(
            (previous) => ({
                ...previous,
                patient_id:
                    String(
                        patientId
                    ),
            })
        );

        setSelectedTimeSlot(
            ""
        );

        setSearchValue(
            getPatientName(
                patient
            )
        );

        setShowPatientResults(
            false
        );

        setError("");

        setSuccess(null);
    };

    // ===================================================
    // CLEAR PATIENT
    // ===================================================

    const handleClearPatient =
        () => {
            setSelectedPatient(
                null
            );

            setSearchValue("");

            setPatients([]);

            setForm({
                ...EMPTY_FORM,
            });

            setSelectedTimeSlot(
                ""
            );

            setAppointments([]);

            setLocallyBookedSlots(
                []
            );

            setAvailabilityLoaded(
                false
            );

            setError("");

            setSuccess(null);
        };

    // ===================================================
    // FORM CHANGE
    // ===================================================

    const handleChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setError("");

        setSuccess(null);

        if (
            name ===
            "doctor_id"
        ) {
            setForm(
                (previous) => ({
                    ...previous,
                    doctor_id:
                        value,
                    appointment_time:
                        "",
                })
            );

            setSelectedTimeSlot(
                ""
            );

            setAppointments([]);

            setLocallyBookedSlots(
                []
            );

            setAvailabilityLoaded(
                false
            );

            return;
        }

        if (
            name ===
            "appointment_date"
        ) {
            setForm(
                (previous) => ({
                    ...previous,
                    appointment_date:
                        value,
                    appointment_time:
                        "",
                })
            );

            setSelectedTimeSlot(
                ""
            );

            setAppointments([]);

            setLocallyBookedSlots(
                []
            );

            setAvailabilityLoaded(
                false
            );

            return;
        }

        setForm(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );
    };

    // ===================================================
    // FETCH AVAILABILITY
    // ===================================================

    const fetchAvailability =
        async (
            doctorId = form.doctor_id,
            appointmentDate =
                form.appointment_date
        ) => {
            if (
                !doctorId ||
                !appointmentDate
            ) {
                setAppointments([]);

                setAvailabilityLoaded(
                    false
                );

                return [];
            }

            try {
                setLoadingAvailability(
                    true
                );

                setAvailabilityLoaded(
                    false
                );

                const query =
                    new URLSearchParams({
                        doctor_id:
                            String(
                                doctorId
                            ),

                        appointment_date:
                            appointmentDate,
                    });

                const data =
                    await fetchJSON(
                        `${API_URL}/appointments/public?${query.toString()}`
                    );

                const list =
                    normalizeArray(
                        data
                    );

                const selectedDoctorId =
                    String(
                        doctorId
                    );

                const selectedDate =
                    normalizeDate(
                        appointmentDate
                    );

                const filtered =
                    list.filter(
                        (
                            appointment
                        ) => {
                            if (
                                isCancelledAppointment(
                                    appointment
                                )
                            ) {
                                return false;
                            }

                            return (
                                getAppointmentDoctorId(
                                    appointment
                                ) ===
                                    selectedDoctorId &&
                                getAppointmentDate(
                                    appointment
                                ) ===
                                    selectedDate
                            );
                        }
                    );

                setAppointments(
                    filtered
                );

                setAvailabilityLoaded(
                    true
                );

                return filtered;
            } catch (
                requestError
            ) {
                setAppointments([]);

                setAvailabilityLoaded(
                    false
                );

                setError(
                    requestError?.message ||
                        "Unable to load appointment availability."
                );

                return [];
            } finally {
                setLoadingAvailability(
                    false
                );
            }
        };

    // ===================================================
    // AUTO AVAILABILITY
    // ===================================================

    useEffect(() => {
        if (
            form.doctor_id &&
            form.appointment_date
        ) {
            fetchAvailability(
                form.doctor_id,
                form.appointment_date
            );
        } else {
            setAppointments([]);

            setAvailabilityLoaded(
                false
            );
        }
    }, [
        form.doctor_id,
        form.appointment_date,
    ]);

    // ===================================================
    // BOOKED SLOTS
    // ===================================================

    const bookedSlots =
        useMemo(() => {
            const slots =
                new Set();

            appointments.forEach(
                (appointment) => {
                    const doctorId =
                        getAppointmentDoctorId(
                            appointment
                        );

                    const date =
                        getAppointmentDate(
                            appointment
                        );

                    const time =
                        getAppointmentTime(
                            appointment
                        );

                    if (
                        doctorId &&
                        date &&
                        time
                    ) {
                        slots.add(
                            createSlotKey(
                                doctorId,
                                date,
                                time
                            )
                        );
                    }
                }
            );

            locallyBookedSlots.forEach(
                (slot) => {
                    slots.add(slot);
                }
            );

            return slots;
        }, [
            appointments,
            locallyBookedSlots,
        ]);

    // ===================================================
    // SLOT COUNTS
    // ===================================================

    const slotStats =
        useMemo(() => {
            let available = 0;
            let booked = 0;
            let selected = 0;

            TIME_SLOTS.forEach(
                (time) => {
                    const key =
                        createSlotKey(
                            form.doctor_id,
                            form.appointment_date,
                            time
                        );

                    if (
                        bookedSlots.has(
                            key
                        )
                    ) {
                        booked += 1;
                    } else if (
                        selectedTimeSlot ===
                        time
                    ) {
                        selected += 1;
                    } else {
                        available += 1;
                    }
                }
            );

            return {
                total:
                    TIME_SLOTS.length,
                available,
                booked,
                selected,
            };
        }, [
            form.doctor_id,
            form.appointment_date,
            bookedSlots,
            selectedTimeSlot,
        ]);

    // ===================================================
    // GROUP SLOTS
    // ===================================================

    const groupedSlots =
        useMemo(() => {
            return {
                Morning:
                    TIME_SLOTS.filter(
                        (time) =>
                            getSlotPeriod(
                                time
                            ) ===
                            "Morning"
                    ),

                Afternoon:
                    TIME_SLOTS.filter(
                        (time) =>
                            getSlotPeriod(
                                time
                            ) ===
                            "Afternoon"
                    ),

                Evening:
                    TIME_SLOTS.filter(
                        (time) =>
                            getSlotPeriod(
                                time
                            ) ===
                            "Evening"
                    ),
            };
        }, []);

    // ===================================================
    // SLOT STATUS
    // ===================================================

    const getSlotStatus = (
        time
    ) => {
        if (
            !form.doctor_id ||
            !form.appointment_date
        ) {
            return "disabled";
        }

        if (
            !availabilityLoaded
        ) {
            return "disabled";
        }

        const slotKey =
            createSlotKey(
                form.doctor_id,
                form.appointment_date,
                time
            );

        if (
            bookedSlots.has(
                slotKey
            )
        ) {
            return "booked";
        }

        if (
            selectedTimeSlot ===
            time
        ) {
            return "selected";
        }

        return "available";
    };

    // ===================================================
    // SELECT SLOT
    // ===================================================

    const handleSelectTime = (
        time
    ) => {
        if (
            !form.doctor_id ||
            !form.appointment_date
        ) {
            return;
        }

        if (
            !availabilityLoaded
        ) {
            return;
        }

        const slotKey =
            createSlotKey(
                form.doctor_id,
                form.appointment_date,
                time
            );

        if (
            bookedSlots.has(
                slotKey
            )
        ) {
            return;
        }

        setSelectedTimeSlot(
            time
        );

        setForm(
            (previous) => ({
                ...previous,
                appointment_time:
                    time,
            })
        );

        setError("");

        setSuccess(null);
    };

    // ===================================================
    // VALIDATION
    // ===================================================

    const validateForm =
        () => {
            if (
                !selectedPatient
            ) {
                return "Please search and select an old patient first.";
            }

            if (!form.patient_id) {
                return "Patient ID is required.";
            }

            if (!form.doctor_id) {
                return "Please select a doctor.";
            }

            if (
                !form.appointment_date
            ) {
                return "Please select an appointment date.";
            }

            if (
                !form.appointment_time
            ) {
                return "Please select an available time slot.";
            }

            if (
                !form.reason.trim()
            ) {
                return "Please enter the reason for appointment.";
            }

            return "";
        };

    // ===================================================
    // SUBMIT
    // ===================================================

    const handleSubmit =
        async (event) => {
            event.preventDefault();

            setError("");

            setSuccess(null);

            const validationError =
                validateForm();

            if (
                validationError
            ) {
                setError(
                    validationError
                );

                return;
            }

            try {
                setSubmitting(
                    true
                );

                const latestAppointments =
                    await fetchAvailability(
                        form.doctor_id,
                        form.appointment_date
                    );

                const selectedSlotKey =
                    createSlotKey(
                        form.doctor_id,
                        form.appointment_date,
                        form.appointment_time
                    );

                const alreadyBooked =
                    latestAppointments.some(
                        (
                            appointment
                        ) => {
                            if (
                                isCancelledAppointment(
                                    appointment
                                )
                            ) {
                                return false;
                            }

                            return (
                                createSlotKey(
                                    getAppointmentDoctorId(
                                        appointment
                                    ),
                                    getAppointmentDate(
                                        appointment
                                    ),
                                    getAppointmentTime(
                                        appointment
                                    )
                                ) ===
                                selectedSlotKey
                            );
                        }
                    );

                if (
                    alreadyBooked
                ) {
                    setError(
                        "This time slot was just booked by someone else. Please select another slot."
                    );

                    setSelectedTimeSlot(
                        ""
                    );

                    setForm(
                        (previous) => ({
                            ...previous,
                            appointment_time:
                                "",
                        })
                    );

                    await fetchAvailability();

                    return;
                }

                const response =
                    await fetchJSON(
                        `${API_URL}/appointments/public`,
                        {
                            method: "POST",

                            body: JSON.stringify(
                                {
                                    patient_id:
                                        Number(
                                            form.patient_id
                                        ),

                                    doctor_id:
                                        Number(
                                            form.doctor_id
                                        ),

                                    appointment_date:
                                        form.appointment_date,

                                    appointment_time:
                                        form.appointment_time,

                                    reason:
                                        form.reason.trim(),

                                    status:
                                        "pending",
                                }
                            ),
                        }
                    );

                const appointment =
                    response?.appointment ||
                    response?.data ||
                    response?.result ||
                    response;

                setLocallyBookedSlots(
                    (
                        previous
                    ) => {
                        if (
                            previous.includes(
                                selectedSlotKey
                            )
                        ) {
                            return previous;
                        }

                        return [
                            ...previous,
                            selectedSlotKey,
                        ];
                    }
                );

                const selectedDoctor =
                    doctors.find(
                        (
                            doctor
                        ) =>
                            String(
                                getDoctorId(
                                    doctor
                                )
                            ) ===
                            String(
                                form.doctor_id
                            )
                    );

                const appointmentId =
                    appointment?.id ??
                    appointment?.appointment_id ??
                    appointment?.appointmentId ??
                    response?.appointment_id ??
                    response?.appointmentId ??
                    "Generated";

                setSuccess({
                    appointmentId,

                    patient:
                        selectedPatient,

                    doctor:
                        selectedDoctor,

                    doctorName:
                        selectedDoctor
                            ? getDoctorName(
                                  selectedDoctor
                              )
                            : "Doctor",

                    specialization:
                        selectedDoctor
                            ? getDoctorSpecialization(
                                  selectedDoctor
                              )
                            : "",

                    date:
                        form.appointment_date,

                    time:
                        form.appointment_time,

                    reason:
                        form.reason.trim(),
                });

                setSelectedTimeSlot(
                    ""
                );

                setForm(
                    (previous) => ({
                        ...previous,
                        doctor_id: "",
                        appointment_time:
                            "",
                        reason: "",
                    })
                );

                setAppointments([]);

                setAvailabilityLoaded(
                    false
                );
            } catch (
                requestError
            ) {
                if (
                    requestError?.status ===
                    409
                ) {
                    setError(
                        "This appointment slot is already booked. Please select another time."
                    );

                    setSelectedTimeSlot(
                        ""
                    );

                    setForm(
                        (previous) => ({
                            ...previous,
                            appointment_time:
                                "",
                        })
                    );

                    await fetchAvailability();

                    return;
                }

                setError(
                    requestError?.message ||
                        "Unable to book appointment. Please try again."
                );
            } finally {
                setSubmitting(
                    false
                );
            }
        };

    // ===================================================
    // BOOK ANOTHER
    // ===================================================

    const handleBookAnother =
        () => {
            setSuccess(null);

            setError("");

            const patientId =
                getPatientId(
                    selectedPatient
                );

            setForm({
                patient_id:
                    String(
                        patientId
                    ),

                doctor_id: "",

                appointment_date:
                    getTodayLocal(),

                appointment_time:
                    "",

                reason: "",
            });

            setSelectedTimeSlot(
                ""
            );

            setAppointments([]);

            setLocallyBookedSlots(
                []
            );

            setAvailabilityLoaded(
                false
            );
        };

    // ===================================================
    // BACK HOME
    // ===================================================

    const handleBackHome =
        () => {
            navigate("/");
        };

    // ===================================================
    // REFRESH
    // ===================================================

    const handleRefresh =
        async () => {
            setError("");

            await fetchDoctors();

            if (
                searchValue.trim()
                    .length >= 2
            ) {
                await searchPatients(
                    searchValue
                );
            }

            if (
                form.doctor_id &&
                form.appointment_date
            ) {
                await fetchAvailability(
                    form.doctor_id,
                    form.appointment_date
                );
            }
        };

    // ===================================================
    // SELECTED DOCTOR
    // ===================================================

    const selectedDoctor =
        useMemo(() => {
            return doctors.find(
                (doctor) =>
                    String(
                        getDoctorId(
                            doctor
                        )
                    ) ===
                    String(
                        form.doctor_id
                    )
            );
        }, [
            doctors,
            form.doctor_id,
        ]);

    // ===================================================
    // SUCCESS
    // ===================================================

    if (success) {
        return (
            <div className="old-appointment-page">

                <div className="old-appointment-bg-glow glow-one" />

                <div className="old-appointment-bg-glow glow-two" />

                <div className="old-success-wrapper">

                    <div className="old-success-card">

                        <div className="old-success-icon">
                            <FaCheckCircle />
                        </div>

                        <div className="old-success-label">
                            APPOINTMENT BOOKED
                        </div>

                        <h1>
                            Appointment Confirmed
                        </h1>

                        <p className="old-success-message">
                            Your appointment has been successfully booked.
                        </p>

                        <div className="old-success-hospital">
                            <FaHospital />

                            <span>
                                {hospitalName}
                            </span>
                        </div>

                        <div className="old-appointment-number">
                            <span>
                                Appointment ID
                            </span>

                            <strong>
                                #{success.appointmentId}
                            </strong>
                        </div>

                        <div className="old-success-details">

                            <div className="old-detail-item">
                                <div className="old-detail-icon">
                                    <FaUser />
                                </div>

                                <div>
                                    <span>
                                        Patient
                                    </span>

                                    <strong>
                                        {getPatientName(
                                            success.patient
                                        )}
                                    </strong>

                                    {getPatientCode(
                                        success.patient
                                    ) && (
                                        <small>
                                            Patient Code:{" "}
                                            {getPatientCode(
                                                success.patient
                                            )}
                                        </small>
                                    )}
                                </div>
                            </div>

                            <div className="old-detail-item">
                                <div className="old-detail-icon">
                                    <FaUserMd />
                                </div>

                                <div>
                                    <span>
                                        Doctor
                                    </span>

                                    <strong>
                                        {success.doctorName}
                                    </strong>

                                    {success.specialization && (
                                        <small>
                                            {
                                                success.specialization
                                            }
                                        </small>
                                    )}
                                </div>
                            </div>

                            <div className="old-detail-item">
                                <div className="old-detail-icon">
                                    <FaCalendarAlt />
                                </div>

                                <div>
                                    <span>
                                        Appointment Date
                                    </span>

                                    <strong>
                                        {formatDate(
                                            success.date
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <div className="old-detail-item">
                                <div className="old-detail-icon">
                                    <FaClock />
                                </div>

                                <div>
                                    <span>
                                        Appointment Time
                                    </span>

                                    <strong>
                                        {formatTime(
                                            success.time
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <div className="old-detail-item old-detail-full">
                                <div className="old-detail-icon">
                                    <FaStethoscope />
                                </div>

                                <div>
                                    <span>
                                        Reason
                                    </span>

                                    <strong>
                                        {success.reason}
                                    </strong>
                                </div>
                            </div>

                        </div>

                        <div className="old-success-actions">

                            <button
                                type="button"
                                className="old-btn old-btn-secondary"
                                onClick={
                                    handleBackHome
                                }
                            >
                                <FaArrowLeft />
                                Back to Home
                            </button>

                            <button
                                type="button"
                                className="old-btn old-btn-primary"
                                onClick={
                                    handleBookAnother
                                }
                            >
                                Book Another Appointment
                                <FaArrowRight />
                            </button>

                        </div>

                    </div>

                </div>

            </div>
        );
    }

    // ===================================================
    // MAIN
    // ===================================================

    return (
        <div className="old-appointment-page">

            <div className="old-appointment-bg-glow glow-one" />

            <div className="old-appointment-bg-glow glow-two" />

            {/* HEADER */}

            <header className="old-public-header">

                <div className="old-header-inner">

                    <button
                        type="button"
                        className="old-home-button"
                        onClick={
                            handleBackHome
                        }
                    >
                        <FaArrowLeft />

                        <span>
                            Back to Home
                        </span>
                    </button>

                    <div className="old-header-right">

                        <button
                            type="button"
                            className="old-refresh-button"
                            onClick={
                                handleRefresh
                            }
                            title="Refresh"
                            aria-label="Refresh"
                        >
                            <FaRedo />
                        </button>

                        <div className="old-header-brand">

                            <div className="old-brand-icon">
                                <FaHospital />
                            </div>

                            <div>
                                <strong>
                                    {loadingSettings
                                        ? "HMS Hospital"
                                        : hospitalName}
                                </strong>

                                <span>
                                    Hospital Management System
                                </span>
                            </div>

                        </div>

                    </div>

                </div>

            </header>

            {/* CONTENT */}

            <main className="old-appointment-container">

                <div className="old-page-heading">

                    <div className="old-heading-icon">
                        <FaCalendarAlt />
                    </div>

                    <div>
                        <span className="old-heading-eyebrow">
                            PATIENT SERVICES
                        </span>

                        <h1>
                            Old Patient Appointment
                        </h1>

                        <p>
                            Search your existing patient record and book a new appointment without logging in.
                        </p>
                    </div>

                </div>

                {/* ERROR */}

                {error && (
                    <div className="old-alert old-alert-error">

                        <div className="old-alert-symbol">
                            !
                        </div>

                        <div>
                            <strong>
                                Unable to continue
                            </strong>

                            <span>
                                {error}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setError("")
                            }
                        >
                            <FaTimes />
                        </button>

                    </div>
                )}

                <div className="old-main-grid">

                    {/* LEFT */}

                    <section className="old-form-card">

                        <div className="old-card-header">

                            <div className="old-card-title">

                                <div className="old-card-icon">
                                    <FaSearch />
                                </div>

                                <div>
                                    <h2>
                                        Find Patient
                                    </h2>

                                    <p>
                                        Search your existing patient record
                                    </p>
                                </div>

                            </div>

                        </div>

                        {/* SEARCH */}

                        <div className="old-search-area">

                            <label>
                                Search Patient
                                <span>*</span>
                            </label>

                            <div className="old-search-row">

                                <div className="old-search-input-wrapper">

                                    <FaSearch />

                                    <input
                                        type="text"
                                        value={
                                            searchValue
                                        }
                                        onChange={(
                                            event
                                        ) => {
                                            const value =
                                                event.target.value;

                                            setSearchValue(
                                                value
                                            );

                                            setShowPatientResults(
                                                true
                                            );

                                            if (
                                                selectedPatient &&
                                                value !==
                                                    getPatientName(
                                                        selectedPatient
                                                    )
                                            ) {
                                                setSelectedPatient(
                                                    null
                                                );

                                                setForm(
                                                    (
                                                        previous
                                                    ) => ({
                                                        ...previous,
                                                        patient_id:
                                                            "",
                                                        doctor_id:
                                                            "",
                                                        appointment_time:
                                                            "",
                                                    })
                                                );

                                                setSelectedTimeSlot(
                                                    ""
                                                );

                                                setAppointments(
                                                    []
                                                );

                                                setLocallyBookedSlots(
                                                    []
                                                );

                                                setAvailabilityLoaded(
                                                    false
                                                );
                                            }
                                        }}
                                        onFocus={() => {
                                            if (
                                                searchValue.trim()
                                            ) {
                                                setShowPatientResults(
                                                    true
                                                );
                                            }
                                        }}
                                        placeholder="Enter Patient ID, Patient Code, Name or Phone"
                                        autoComplete="off"
                                    />

                                    {searchValue && (
                                        <button
                                            type="button"
                                            className="old-clear-search"
                                            onClick={
                                                handleClearPatient
                                            }
                                        >
                                            <FaTimes />
                                        </button>
                                    )}

                                </div>

                                <select
                                    value={
                                        searchType
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearchType(
                                            event.target.value
                                        )
                                    }
                                    className="old-search-type"
                                >
                                    <option value="all">
                                        All
                                    </option>

                                    <option value="id">
                                        Patient ID
                                    </option>

                                    <option value="name">
                                        Name
                                    </option>

                                    <option value="phone">
                                        Phone
                                    </option>
                                </select>

                            </div>

                            {showPatientResults &&
                                searchValue.trim() && (
                                    <div className="old-patient-results">

                                        {loadingPatients ? (
                                            <div className="old-result-empty">
                                                <div className="old-small-loader" />

                                                <span>
                                                    Searching patients...
                                                </span>
                                            </div>
                                        ) : searchValue.trim().length < 2 ? (
                                            <div className="old-result-empty">
                                                <FaSearch />

                                                <strong>
                                                    Keep typing
                                                </strong>

                                                <span>
                                                    Enter at least 2 characters to search.
                                                </span>
                                            </div>
                                        ) : patients.length > 0 ? (
                                            patients.map(
                                                (
                                                    patient,
                                                    index
                                                ) => {
                                                    const patientId =
                                                        getPatientId(
                                                            patient
                                                        );

                                                    return (
                                                        <button
                                                            type="button"
                                                            className="old-patient-result"
                                                            key={
                                                                patientId ||
                                                                `patient-${index}`
                                                            }
                                                            onClick={() =>
                                                                handleSelectPatient(
                                                                    patient
                                                                )
                                                            }
                                                        >
                                                            <div className="old-result-avatar">
                                                                <FaUser />
                                                            </div>

                                                            <div className="old-result-info">

                                                                <strong>
                                                                    {getPatientName(
                                                                        patient
                                                                    )}
                                                                </strong>

                                                                <div className="old-result-meta">

                                                                    <span>
                                                                        <FaIdCard />

                                                                        {getPatientCode(
                                                                            patient
                                                                        ) ||
                                                                            patientId ||
                                                                            "N/A"}
                                                                    </span>

                                                                    {getPatientPhone(
                                                                        patient
                                                                    ) && (
                                                                        <span>
                                                                            <FaPhone />

                                                                            {getPatientPhone(
                                                                                patient
                                                                            )}
                                                                        </span>
                                                                    )}

                                                                </div>

                                                            </div>

                                                            <FaArrowRight className="old-result-arrow" />
                                                        </button>
                                                    );
                                                }
                                            )
                                        ) : (
                                            <div className="old-result-empty">
                                                <FaSearch />

                                                <strong>
                                                    No patient found
                                                </strong>

                                                <span>
                                                    Check the Patient ID, code, name or phone number.
                                                </span>
                                            </div>
                                        )}

                                    </div>
                                )}

                        </div>

                        {/* SELECTED PATIENT */}

                        {selectedPatient && (
                            <div className="old-selected-patient">

                                <div className="old-selected-header">

                                    <div className="old-selected-title">
                                        <FaCheckCircle />

                                        <span>
                                            Patient Selected
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            handleClearPatient
                                        }
                                    >
                                        Change
                                    </button>

                                </div>

                                <div className="old-selected-body">

                                    <div className="old-selected-avatar">
                                        <FaUser />
                                    </div>

                                    <div className="old-selected-info">

                                        <h3>
                                            {getPatientName(
                                                selectedPatient
                                            )}
                                        </h3>

                                        <div className="old-selected-grid">

                                            <div>
                                                <span>
                                                    Patient ID
                                                </span>

                                                <strong>
                                                    {getPatientId(
                                                        selectedPatient
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Patient Code
                                                </span>

                                                <strong>
                                                    {getPatientCode(
                                                        selectedPatient
                                                    ) ||
                                                        "N/A"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Phone
                                                </span>

                                                <strong>
                                                    {getPatientPhone(
                                                        selectedPatient
                                                    ) ||
                                                        "N/A"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Gender
                                                </span>

                                                <strong>
                                                    {getPatientGender(
                                                        selectedPatient
                                                    ) ||
                                                        "N/A"}
                                                </strong>
                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>
                        )}

                        {/* BOOKING FORM */}

                        <form
                            className="old-booking-form"
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="old-section-heading">

                                <div>
                                    <span>
                                        STEP 2
                                    </span>

                                    <h2>
                                        Appointment Details
                                    </h2>
                                </div>

                            </div>

                            {/* DOCTOR */}

                            <div className="old-form-group">

                                <label htmlFor="doctor_id">
                                    Select Doctor
                                    <span>*</span>
                                </label>

                                <div className="old-select-wrapper">

                                    <FaUserMd />

                                    <select
                                        id="doctor_id"
                                        name="doctor_id"
                                        value={
                                            form.doctor_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            !selectedPatient ||
                                            loadingDoctors
                                        }
                                    >

                                        <option value="">
                                            {loadingDoctors
                                                ? "Loading doctors..."
                                                : "Select a doctor"}
                                        </option>

                                        {doctors.map(
                                            (
                                                doctor,
                                                index
                                            ) => {
                                                const doctorId =
                                                    getDoctorId(
                                                        doctor
                                                    );

                                                return (
                                                    <option
                                                        key={
                                                            doctorId ||
                                                            `doctor-${index}`
                                                        }
                                                        value={
                                                            doctorId
                                                        }
                                                    >
                                                        {getDoctorName(
                                                            doctor
                                                        )}

                                                        {getDoctorSpecialization(
                                                            doctor
                                                        )
                                                            ? ` — ${getDoctorSpecialization(
                                                                  doctor
                                                              )}`
                                                            : ""}
                                                    </option>
                                                );
                                            }
                                        )}

                                    </select>

                                </div>

                                {selectedDoctor &&
                                    getDoctorSpecialization(
                                        selectedDoctor
                                    ) && (
                                        <div className="old-doctor-hint">
                                            <FaStethoscope />

                                            <span>
                                                {getDoctorSpecialization(
                                                    selectedDoctor
                                                )}
                                            </span>
                                        </div>
                                    )}

                            </div>

                            {/* DATE */}

                            <div className="old-form-group">

                                <label htmlFor="appointment_date">
                                    Appointment Date
                                    <span>*</span>
                                </label>

                                <div className="old-input-icon-wrapper">

                                    <FaCalendarAlt />

                                    <input
                                        id="appointment_date"
                                        type="date"
                                        name="appointment_date"
                                        value={
                                            form.appointment_date
                                        }
                                        min={
                                            getTodayLocal()
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            !selectedPatient
                                        }
                                    />

                                </div>

                            </div>

                            {/* DYNAMIC SLOTS */}

                            <div className="old-form-group old-dynamic-slot-section">

                                <div className="old-time-heading">

                                    <div>
                                        <label>
                                            Select Time Slot
                                            <span>*</span>
                                        </label>

                                        {form.doctor_id &&
                                            form.appointment_date &&
                                            availabilityLoaded && (
                                                <small className="old-slot-date-info">
                                                    {formatDate(
                                                        form.appointment_date
                                                    )}
                                                </small>
                                            )}
                                    </div>

                                    {loadingAvailability && (
                                        <span className="old-availability-loading">
                                            <span className="old-dot-loader" />
                                            Checking availability...
                                        </span>
                                    )}

                                </div>

                                {!selectedPatient ? (
                                    <div className="old-slot-message">
                                        <FaUser />

                                        <span>
                                            Please select a patient first.
                                        </span>
                                    </div>
                                ) : !form.doctor_id ||
                                  !form.appointment_date ? (
                                    <div className="old-slot-message">
                                        <FaCalendarAlt />

                                        <span>
                                            Select a doctor and appointment date to see available slots.
                                        </span>
                                    </div>
                                ) : !availabilityLoaded &&
                                  loadingAvailability ? (
                                    <div className="old-slot-loading">

                                        <div className="old-loader" />

                                        <span>
                                            Loading available time slots...
                                        </span>

                                    </div>
                                ) : (
                                    <div className="old-dynamic-slots-wrapper">

                                        {/* SLOT SUMMARY */}

                                        <div className="old-slot-summary">

                                            <div className="old-slot-summary-title">
                                                <div>
                                                    <FaClock />

                                                    <span>
                                                        Available Time Slots
                                                    </span>
                                                </div>

                                                <strong>
                                                    {slotStats.available} Available
                                                </strong>
                                            </div>

                                            <div className="old-slot-summary-stats">

                                                <div className="slot-stat total">
                                                    <span>
                                                        Total
                                                    </span>

                                                    <strong>
                                                        {slotStats.total}
                                                    </strong>
                                                </div>

                                                <div className="slot-stat available">
                                                    <span>
                                                        Available
                                                    </span>

                                                    <strong>
                                                        {slotStats.available}
                                                    </strong>
                                                </div>

                                                <div className="slot-stat booked">
                                                    <span>
                                                        Booked
                                                    </span>

                                                    <strong>
                                                        {slotStats.booked}
                                                    </strong>
                                                </div>

                                            </div>

                                        </div>

                                        {/* SELECTED SLOT */}

                                        {selectedTimeSlot && (
                                            <div className="old-selected-slot-banner">

                                                <div className="selected-slot-icon">
                                                    <FaCheck />
                                                </div>

                                                <div>
                                                    <span>
                                                        Selected Time
                                                    </span>

                                                    <strong>
                                                        {formatTime(
                                                            selectedTimeSlot
                                                        )}
                                                    </strong>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTimeSlot(
                                                            ""
                                                        );

                                                        setForm(
                                                            (
                                                                previous
                                                            ) => ({
                                                                ...previous,
                                                                appointment_time:
                                                                    "",
                                                            })
                                                        );
                                                    }}
                                                >
                                                    Change
                                                </button>

                                            </div>
                                        )}

                                        {/* PERIOD GROUPS */}

                                        {Object.entries(
                                            groupedSlots
                                        ).map(
                                            ([
                                                period,
                                                slots,
                                            ]) => (
                                                <div
                                                    className="old-slot-period"
                                                    key={
                                                        period
                                                    }
                                                >

                                                    <div className="old-slot-period-header">

                                                        <div>
                                                            <span className="old-period-dot" />

                                                            <h3>
                                                                {period}
                                                            </h3>
                                                        </div>

                                                        <span>
                                                            {slots.length} slots
                                                        </span>

                                                    </div>

                                                    <div className="old-time-slots">

                                                        {slots.map(
                                                            (
                                                                time
                                                            ) => {
                                                                const status =
                                                                    getSlotStatus(
                                                                        time
                                                                    );

                                                                const isBooked =
                                                                    status ===
                                                                    "booked";

                                                                const isSelected =
                                                                    status ===
                                                                    "selected";

                                                                const isDisabled =
                                                                    status ===
                                                                        "booked" ||
                                                                    status ===
                                                                        "disabled";

                                                                return (
                                                                    <button
                                                                        key={
                                                                            time
                                                                        }
                                                                        type="button"
                                                                        className={[
                                                                            "old-time-slot",
                                                                            `slot-${status}`,
                                                                            isSelected
                                                                                ? "is-selected"
                                                                                : "",
                                                                        ]
                                                                            .filter(
                                                                                Boolean
                                                                            )
                                                                            .join(
                                                                                " "
                                                                            )}
                                                                        disabled={
                                                                            isDisabled
                                                                        }
                                                                        aria-pressed={
                                                                            isSelected
                                                                        }
                                                                        onClick={() =>
                                                                            handleSelectTime(
                                                                                time
                                                                            )
                                                                        }
                                                                    >

                                                                        <div className="old-slot-time-icon">
                                                                            {isBooked ? (
                                                                                <FaLock />
                                                                            ) : isSelected ? (
                                                                                <FaCheck />
                                                                            ) : (
                                                                                <FaClock />
                                                                            )}
                                                                        </div>

                                                                        <div className="old-slot-content">

                                                                            <strong>
                                                                                {formatTime(
                                                                                    time
                                                                                )}
                                                                            </strong>

                                                                            <span>
                                                                                {isBooked
                                                                                    ? "Booked"
                                                                                    : isSelected
                                                                                    ? "Selected"
                                                                                    : "Available"}
                                                                            </span>

                                                                        </div>

                                                                        <div className="old-slot-status-indicator">
                                                                            {isBooked ? (
                                                                                <FaLock />
                                                                            ) : isSelected ? (
                                                                                <FaCheck />
                                                                            ) : (
                                                                                <span />
                                                                            )}
                                                                        </div>

                                                                    </button>
                                                                );
                                                            }
                                                        )}

                                                    </div>

                                                </div>
                                            )
                                        )}

                                        {/* LEGEND */}

                                        <div className="old-slot-legend">

                                            <div>
                                                <span className="legend-box available" />
                                                Available
                                            </div>

                                            <div>
                                                <span className="legend-box selected" />
                                                Selected
                                            </div>

                                            <div>
                                                <span className="legend-box booked" />
                                                Booked
                                            </div>

                                        </div>

                                    </div>
                                )}

                            </div>

                            {/* REASON */}

                            <div className="old-form-group">

                                <label htmlFor="reason">
                                    Reason for Appointment
                                    <span>*</span>
                                </label>

                                <textarea
                                    id="reason"
                                    name="reason"
                                    value={
                                        form.reason
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        !selectedPatient
                                    }
                                    placeholder="Enter reason for your appointment..."
                                    rows={4}
                                    maxLength={500}
                                />

                                <div className="old-textarea-footer">

                                    <span>
                                        Please provide a brief description.
                                    </span>

                                    <span>
                                        {form.reason.length}/500
                                    </span>

                                </div>

                            </div>

                            {/* SUBMIT */}

                            <button
                                type="submit"
                                className="old-submit-button"
                                disabled={
                                    submitting ||
                                    !selectedPatient ||
                                    !form.doctor_id ||
                                    !form.appointment_date ||
                                    !form.appointment_time ||
                                    !form.reason.trim()
                                }
                            >

                                {submitting ? (
                                    <>
                                        <span className="old-button-loader" />

                                        Booking Appointment...
                                    </>
                                ) : (
                                    <>
                                        <FaCalendarAlt />

                                        Book Appointment

                                        <FaArrowRight />
                                    </>
                                )}

                            </button>

                        </form>

                    </section>

                    {/* RIGHT */}

                    <aside className="old-info-column">

                        <div className="old-info-card">

                            <div className="old-info-card-icon">
                                <FaHospital />
                            </div>

                            <h2>
                                Existing Patient?
                            </h2>

                            <p>
                                Use your existing patient information to quickly book your next hospital appointment.
                            </p>

                            <div className="old-info-list">

                                <div>
                                    <FaCheckCircle />
                                    <span>
                                        No login required
                                    </span>
                                </div>

                                <div>
                                    <FaCheckCircle />
                                    <span>
                                        Search by Patient ID
                                    </span>
                                </div>

                                <div>
                                    <FaCheckCircle />
                                    <span>
                                        Search by phone number
                                    </span>
                                </div>

                                <div>
                                    <FaCheckCircle />
                                    <span>
                                        Real-time slot availability
                                    </span>
                                </div>

                            </div>

                        </div>

                        <div className="old-help-card">

                            <div className="old-help-icon">
                                ?
                            </div>

                            <div>

                                <h3>
                                    Can't find your record?
                                </h3>

                                <p>
                                    If you are a new patient, please register first.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/patient-registration"
                                        )
                                    }
                                >
                                    New Patient Registration

                                    <FaArrowRight />
                                </button>

                            </div>

                        </div>

                        <div className="old-hospital-card">

                            <div className="old-hospital-card-icon">
                                <FaHospital />
                            </div>

                            <div>

                                <span>
                                    Hospital
                                </span>

                                <strong>
                                    {hospitalName}
                                </strong>

                                <small>
                                    Hospital Management System
                                </small>

                            </div>

                        </div>

                    </aside>

                </div>

            </main>

            <footer className="old-public-footer">

                <span>
                    © {new Date().getFullYear()}{" "}
                    {hospitalName}
                </span>

                <span>
                    Secure Patient Services
                </span>

            </footer>

        </div>
    );
}

export default OldPatientAppointment;