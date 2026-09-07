const {
    getAllAppointments,
    getAppointmentById,

    getPublicAppointmentsByDoctorAndDate,
    findAppointmentBySlot,
    findPatientById,
    findDoctorById,

    createAppointment,
    updateAppointment,
    deleteAppointment,
} = require("../models/appointment.model");

/*
=====================================================
VALID DATE
=====================================================

IMPORTANT:
Do NOT use toISOString() here.

The appointment date is a calendar date, not
a UTC timestamp.

Example:
2026-09-07 must remain 2026-09-07 in IST.
=====================================================
*/

const isValidDate = (value) => {
    if (!value) {
        return false;
    }

    const text = String(value).trim();

    /*
    Must be exactly YYYY-MM-DD
    */

    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return false;
    }

    const [year, month, day] = text
        .split("-")
        .map(Number);

    /*
    Basic range validation
    */

    if (
        year < 1900 ||
        year > 2100 ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        return false;
    }

    /*
    Calendar validation without timezone conversion.

    Example:
    2026-02-31 -> false
    2026-09-07 -> true
    */

    const daysInMonth = new Date(
        year,
        month,
        0
    ).getDate();

    return day <= daysInMonth;
};

/*
=====================================================
VALID TIME
=====================================================
*/

const isValidTime = (value) => {
    if (!value) {
        return false;
    }

    const text = String(value).trim();

    return /^\d{2}:\d{2}(:\d{2})?$/.test(text);
};

/*
=====================================================
GET ALL APPOINTMENTS
=====================================================
*/

const getAppointments = async (req, res) => {
    try {
        const appointments =
            await getAllAppointments();

        return res.status(200).json({
            success: true,
            count: appointments.length,
            appointments,
        });
    } catch (error) {
        console.error(
            "Get Appointments Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load appointments",
        });
    }
};

/*
=====================================================
GET APPOINTMENT BY ID
=====================================================
*/

const getAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        if (
            !id ||
            !Number.isInteger(Number(id))
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid appointment ID is required",
            });
        }

        const appointment =
            await getAppointmentById(
                Number(id)
            );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message:
                    "Appointment not found",
            });
        }

        return res.status(200).json({
            success: true,
            appointment,
        });
    } catch (error) {
        console.error(
            "Get Appointment Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load appointment",
        });
    }
};

/*
=====================================================
PUBLIC GET APPOINTMENT AVAILABILITY
=====================================================

GET

/api/appointments/public
    ?doctor_id=30003
    &appointment_date=2026-09-07

NO LOGIN REQUIRED.
=====================================================
*/

const getPublicAppointments = async (
    req,
    res
) => {
    try {
        const {
            doctor_id,
            appointment_date,
        } = req.query;

        /*
        ---------------------------------------------
        VALIDATE DOCTOR
        ---------------------------------------------
        */

        if (
            !doctor_id ||
            !Number.isInteger(
                Number(doctor_id)
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid doctor ID is required",
            });
        }

        /*
        ---------------------------------------------
        VALIDATE DATE
        ---------------------------------------------
        */

        if (
            !isValidDate(
                appointment_date
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid appointment date is required",
            });
        }

        /*
        ---------------------------------------------
        FIND DOCTOR
        ---------------------------------------------
        */

        const doctor =
            await findDoctorById(
                Number(doctor_id)
            );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message:
                    "Doctor not found",
            });
        }

        /*
        ---------------------------------------------
        GET APPOINTMENTS FOR DATE
        ---------------------------------------------
        */

        const appointments =
            await getPublicAppointmentsByDoctorAndDate(
                Number(doctor_id),
                appointment_date
            );

        /*
        ---------------------------------------------
        RESPONSE
        ---------------------------------------------
        */

        return res.status(200).json({
            success: true,

            doctor: {
                id: doctor.id,
                name: doctor.name,
                doctor_code:
                    doctor.doctor_code,
                specialization:
                    doctor.specialization,
            },

            appointment_date,

            count: appointments.length,

            appointments,
        });
    } catch (error) {
        console.error(
            "Public Appointment Availability Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to check appointment availability",
        });
    }
};

/*
=====================================================
PUBLIC CREATE APPOINTMENT
=====================================================

POST

/api/appointments/public

NO LOGIN REQUIRED.
=====================================================
*/

const addPublicAppointment = async (
    req,
    res
) => {
    try {
        const {
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            reason,
        } = req.body;

        /*
        ---------------------------------------------
        REQUIRED FIELDS
        ---------------------------------------------
        */

        if (
            !patient_id ||
            !doctor_id ||
            !appointment_date ||
            !appointment_time
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient, doctor, date and time are required",
            });
        }

        /*
        ---------------------------------------------
        NUMERIC IDS
        ---------------------------------------------
        */

        const patientId =
            Number(patient_id);

        const doctorId =
            Number(doctor_id);

        if (
            !Number.isInteger(
                patientId
            ) ||
            !Number.isInteger(
                doctorId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient ID and Doctor ID must be valid numbers",
            });
        }

        /*
        ---------------------------------------------
        DATE VALIDATION
        ---------------------------------------------
        */

        if (
            !isValidDate(
                appointment_date
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid appointment date",
            });
        }

        /*
        ---------------------------------------------
        TIME VALIDATION
        ---------------------------------------------
        */

        if (
            !isValidTime(
                appointment_time
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid appointment time",
            });
        }

        /*
        ---------------------------------------------
        FIND PATIENT
        ---------------------------------------------
        */

        const patient =
            await findPatientById(
                patientId
            );

        if (!patient) {
            return res.status(404).json({
                success: false,
                message:
                    "Patient not found. Please register the patient first.",
            });
        }

        /*
        ---------------------------------------------
        FIND DOCTOR
        ---------------------------------------------
        */

        const doctor =
            await findDoctorById(
                doctorId
            );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message:
                    "Doctor not found.",
            });
        }

        /*
        ---------------------------------------------
        CHECK SLOT
        ---------------------------------------------
        */

        const existing =
            await findAppointmentBySlot(
                doctorId,
                appointment_date,
                appointment_time
            );

        if (existing) {
            return res.status(409).json({
                success: false,
                message:
                    "This appointment slot is already booked. Please select another slot.",
            });
        }

        /*
        ---------------------------------------------
        CREATE APPOINTMENT
        ---------------------------------------------
        */

        let appointmentId;

        try {
            appointmentId =
                await createAppointment({
                    patient_id:
                        patientId,

                    doctor_id:
                        doctorId,

                    appointment_date,

                    appointment_time,

                    status: "pending",

                    reason:
                        String(
                            reason || ""
                        ).trim() || null,
                });
        } catch (insertError) {
            /*
            -----------------------------------------
            DATABASE DUPLICATE
            -----------------------------------------
            */

            if (
                insertError?.code ===
                "ER_DUP_ENTRY"
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This appointment slot is already booked. Please select another slot.",
                });
            }

            throw insertError;
        }

        /*
        ---------------------------------------------
        GET CREATED APPOINTMENT
        ---------------------------------------------
        */

        const appointment =
            await getAppointmentById(
                appointmentId
            );

        /*
        ---------------------------------------------
        SUCCESS
        ---------------------------------------------
        */

        return res.status(201).json({
            success: true,

            message:
                "Appointment booked successfully.",

            appointmentId,

            appointment,
        });
    } catch (error) {
        console.error(
            "Public Create Appointment Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create appointment",
        });
    }
};

/*
=====================================================
STAFF CREATE APPOINTMENT
=====================================================
*/

const addAppointment = async (
    req,
    res
) => {
    try {
        const {
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            reason,
        } = req.body;

        /*
        ---------------------------------------------
        REQUIRED
        ---------------------------------------------
        */

        if (
            !patient_id ||
            !doctor_id ||
            !appointment_date ||
            !appointment_time
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient, doctor, date and time are required",
            });
        }

        /*
        ---------------------------------------------
        IDS
        ---------------------------------------------
        */

        if (
            !Number.isInteger(
                Number(patient_id)
            ) ||
            !Number.isInteger(
                Number(doctor_id)
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient ID and Doctor ID must be valid numbers",
            });
        }

        /*
        ---------------------------------------------
        CREATE
        ---------------------------------------------
        */

        const appointmentId =
            await createAppointment({
                patient_id:
                    Number(patient_id),

                doctor_id:
                    Number(doctor_id),

                appointment_date,

                appointment_time,

                status,

                reason,
            });

        return res.status(201).json({
            success: true,
            message:
                "Appointment created successfully",
            appointmentId,
        });
    } catch (error) {
        console.error(
            "Create Appointment Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create appointment",
        });
    }
};

/*
=====================================================
UPDATE APPOINTMENT
=====================================================
*/

const editAppointment = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const {
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            reason,
        } = req.body;

        /*
        ---------------------------------------------
        APPOINTMENT ID
        ---------------------------------------------
        */

        if (
            !id ||
            !Number.isInteger(Number(id))
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid appointment ID is required",
            });
        }

        /*
        ---------------------------------------------
        REQUIRED
        ---------------------------------------------
        */

        if (
            !patient_id ||
            !doctor_id ||
            !appointment_date ||
            !appointment_time
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient, doctor, date and time are required",
            });
        }

        /*
        ---------------------------------------------
        IDS
        ---------------------------------------------
        */

        if (
            !Number.isInteger(
                Number(patient_id)
            ) ||
            !Number.isInteger(
                Number(doctor_id)
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient ID and Doctor ID must be valid numbers",
            });
        }

        /*
        ---------------------------------------------
        UPDATE
        ---------------------------------------------
        */

        const affectedRows =
            await updateAppointment(
                Number(id),
                {
                    patient_id:
                        Number(
                            patient_id
                        ),

                    doctor_id:
                        Number(
                            doctor_id
                        ),

                    appointment_date,

                    appointment_time,

                    status,

                    reason,
                }
            );

        if (
            affectedRows === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Appointment not found",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Appointment updated successfully",
        });
    } catch (error) {
        console.error(
            "Update Appointment Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update appointment",
        });
    }
};

/*
=====================================================
DELETE APPOINTMENT
=====================================================
*/

const removeAppointment = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        /*
        ---------------------------------------------
        VALID ID
        ---------------------------------------------
        */

        if (
            !id ||
            !Number.isInteger(Number(id))
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid appointment ID is required",
            });
        }

        /*
        ---------------------------------------------
        DELETE
        ---------------------------------------------
        */

        const affectedRows =
            await deleteAppointment(
                Number(id)
            );

        if (
            affectedRows === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Appointment not found",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Appointment deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Appointment Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete appointment",
        });
    }
};

/*
=====================================================
EXPORTS
=====================================================
*/

module.exports = {
    getAppointments,
    getAppointment,

    getPublicAppointments,
    addPublicAppointment,

    addAppointment,
    editAppointment,
    removeAppointment,
};