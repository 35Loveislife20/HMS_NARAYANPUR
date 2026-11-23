const { sendPatientRegistrationSMS } = require("../services/sms.service");
const { transporter } = require("../services/email.service");
const BOOKABLE_STATUSES = ["active", "available"];
const appointmentModel = require("../models/appointment.model");

/*
=========================================================
HELPERS
=========================================================
*/

const isSuperAdmin = (req) => {
    return (
        String(req.user?.role || "")
            .trim()
            .toLowerCase() === "super_admin"
    );
};

const getHospitalScope = (req) => {
    if (isSuperAdmin(req)) {
        return null;
    }

    const hospitalId = Number(req.user?.hospital_id);

    if (!Number.isInteger(hospitalId) || hospitalId <= 0) {
        return undefined;
    }

    return hospitalId;
};

const requireHospitalScope = (req, res) => {
    const hospitalId = getHospitalScope(req);

    if (hospitalId === undefined) {
        res.status(403).json({
            success: false,
            message: "User is not assigned to a hospital.",
        });

        return undefined;
    }

    return hospitalId;
};

const normalizePositiveInteger = (value, fieldName) => {
    const number = Number(value);

    if (!Number.isInteger(number) || number <= 0) {
        throw new Error(
            `${fieldName} must be a valid positive integer.`
        );
    }

    return number;
};

const isValidDate = (value) => {
    if (!value) {
        return false;
    }

    const date = String(value).trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const [year, month, day] = date
        .split("-")
        .map(Number);

    const parsed = new Date(
        Date.UTC(year, month - 1, day)
    );

    return (
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() + 1 === month &&
        parsed.getUTCDate() === day
    );
};

const isValidTime = (value) => {
    if (!value) {
        return false;
    }

    return /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(
        String(value).trim()
    );
};

const normalizeOptionalText = (
    value,
    maxLength = 1000
) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const text = String(value).trim();

    if (!text) {
        return null;
    }

    if (text.length > maxLength) {
        throw new Error(
            `Text must not exceed ${maxLength} characters.`
        );
    }

    return text;
};

const isDuplicateError = (error) => {
    return (
        error?.code === "ER_DUP_ENTRY" ||
        error?.code === "ER_DUPLICATE_KEY"
    );
};

const isValidationError = (error) => {
    const message = String(error?.message || "");

    return (
        message.includes("required") ||
        message.includes("must be") ||
        message.includes("Invalid") ||
        message.includes("invalid") ||
        message.includes("format")
    );
};

const validateAppointmentInput = (body = {}) => {
    const {
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
    } = body;

    if (
        patient_id === undefined ||
        patient_id === null ||
        patient_id === ""
    ) {
        return "Patient ID is required.";
    }

    if (
        doctor_id === undefined ||
        doctor_id === null ||
        doctor_id === ""
    ) {
        return "Doctor ID is required.";
    }

    if (!isValidDate(appointment_date)) {
        return "Appointment date must be a valid YYYY-MM-DD date.";
    }

    if (!isValidTime(appointment_time)) {
        return "Appointment time must be in HH:mm or HH:mm:ss format.";
    }

    return null;
};

const normalizeAppointmentPayload = (body = {}) => {
    return {
        patient_id: body.patient_id,
        doctor_id: body.doctor_id,
        appointment_date: body.appointment_date,
        appointment_time: body.appointment_time,
        status: body.status,
        reason: normalizeOptionalText(body.reason),
    };
};

/*
=========================================================
GET ALL APPOINTMENTS
=========================================================
*/

const getAppointments = async (req, res) => {
    try {
        const hospitalId = requireHospitalScope(
            req,
            res
        );

        if (hospitalId === undefined) {
            return;
        }

        const appointments =
            await appointmentModel.getAllAppointments(
                hospitalId
            );

        return res.status(200).json({
            success: true,
            count: appointments.length,
            appointments,
        });
    } catch (error) {
        console.error(
            "Get appointments error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load appointments.",
        });
    }
};

/*
=========================================================
GET APPOINTMENT BY ID
=========================================================
*/

const getAppointment = async (req, res) => {
    try {
        const appointmentId =
            normalizePositiveInteger(
                req.params.id,
                "Appointment ID"
            );

        const hospitalId = requireHospitalScope(
            req,
            res
        );

        if (hospitalId === undefined) {
            return;
        }

        const appointment =
            await appointmentModel.getAppointmentById(
                appointmentId,
                hospitalId
            );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found.",
            });
        }

        return res.status(200).json({
            success: true,
            appointment,
        });
    } catch (error) {
        console.error(
            "Get appointment error:",
            error
        );

        if (isValidationError(error)) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to load appointment.",
        });
    }
};

/*
=========================================================
PUBLIC APPOINTMENT AVAILABILITY
GET /api/appointments/public
=========================================================
*/

const getPublicAppointments = async (req, res) => {
    try {
        const {
            doctor_id,
            appointment_date,
        } = req.query;

        let doctorId;

        try {
            doctorId =
                normalizePositiveInteger(
                    doctor_id,
                    "Doctor ID"
                );
        } catch {
            return res.status(400).json({
                success: false,
                message: "Valid doctor ID is required.",
            });
        }

        if (!isValidDate(appointment_date)) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid appointment date is required.",
            });
        }

        const doctor =
            await appointmentModel.findDoctorById(
                doctorId
            );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        if (
            doctor.status &&
            !BOOKABLE_STATUSES.includes(String(doctor.status).trim().toLowerCase())
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Selected doctor is currently inactive.",
            });
        }

        const appointments =
            await appointmentModel.getPublicAppointmentsByDoctorAndDate(
                doctorId,
                appointment_date
            );

        return res.status(200).json({
            success: true,
            doctor: {
                id: doctor.id,
                name: doctor.name,
                doctor_code: doctor.doctor_code,
                specialization: doctor.specialization,
            },
            appointment_date,
            count: appointments.length,
            appointments,
        });
    } catch (error) {
        console.error(
            "Public appointment availability error:",
            error
        );

        if (isValidationError(error)) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to check appointment availability.",
        });
    }
};

/*
=========================================================
PUBLIC CREATE APPOINTMENT
=========================================================
*/

const addPublicAppointment = async (req, res) => {
    try {
        const validationError =
            validateAppointmentInput(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        const payload =
            normalizeAppointmentPayload(req.body);

        const patientType =
            String(req.body.patient_type || "new")
                .trim()
                .toLowerCase() === "old"
                ? "old"
                : "new";

        let patientId;
        let doctorId;

        try {
            patientId =
                normalizePositiveInteger(
                    payload.patient_id,
                    "Patient ID"
                );

            doctorId =
                normalizePositiveInteger(
                    payload.doctor_id,
                    "Doctor ID"
                );
        } catch {
            return res.status(400).json({
                success: false,
                message:
                    "Patient ID and Doctor ID must be valid positive numbers.",
            });
        }

        const [patient, doctor] =
            await Promise.all([
                appointmentModel.findPatientById(
                    patientId
                ),
                appointmentModel.findDoctorById(
                    doctorId
                ),
            ]);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message:
                    "Patient not found. Please register the patient first.",
            });
        }

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        if (
            doctor.status &&
            !BOOKABLE_STATUSES.includes(String(doctor.status).trim().toLowerCase())
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Selected doctor is currently inactive.",
            });
        }

        if (
            patient.hospital_id === null ||
            patient.hospital_id === undefined ||
            doctor.hospital_id === null ||
            doctor.hospital_id === undefined ||
            Number(patient.hospital_id) !==
                Number(doctor.hospital_id)
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Patient and doctor must belong to the same hospital.",
            });
        }

        const existing =
            await appointmentModel.findAppointmentBySlot(
                doctorId,
                payload.appointment_date,
                payload.appointment_time
            );

        if (existing) {
            return res.status(409).json({
                success: false,
                message:
                    "This appointment slot is already booked. Please select another slot.",
            });
        }

        const appointmentId =
            await appointmentModel.createAppointment({
                patient_id: patientId,
                doctor_id: doctorId,
                appointment_date:
                    payload.appointment_date,
                appointment_time:
                    payload.appointment_time,
                status: "pending",
                reason: payload.reason,
                patient_type: patientType,
            });

        const appointment =
            await appointmentModel.getAppointmentById(
                appointmentId,
                null
            );

        // Notification background mein — booking response ko block nahi karega
        (async () => {
            try {
                if (patient.phone) {
                    const smsResult =
                        await sendPatientRegistrationSMS(
                            patient
                        );

                    console.log(
                        "APPOINTMENT SMS RESULT:",
                        smsResult
                    );
                }
            } catch (error) {
                console.error(
                    "APPOINTMENT SMS ERROR:",
                    error.message
                );
            }

            try {
                if (patient.email) {
                    await transporter.sendMail({
                        from:
                            process.env.EMAIL_FROM ||
                            process.env.GMAIL_USER,
                        to: patient.email,
                        subject: `Appointment Confirmed - ${
                            appointment?.doctor_name ||
                            "Doctor"
                        }`,
                        html: `
                            <div style="font-family: Arial, sans-serif; color: #111;">
                                <p>Namaste <b>${patient.name}</b>,</p>
                                <p>Aapka appointment book ho gaya hai.</p>
                                <p>
                                    Doctor: <b>${appointment?.doctor_name || "-"}</b><br/>
                                    Date: <b>${payload.appointment_date}</b><br/>
                                    Time: <b>${payload.appointment_time}</b><br/>
                                    Receipt No: <b>${appointmentId}</b><br/>
                                    Registration No: <b>${patient.patient_code || patient.id}</b>
                                </p>
                                <p>Appointment ke din yeh Registration Number aur receipt zaroor laayein.</p>
                            </div>
                        `,
                    });

                    console.log(
                        "APPOINTMENT EMAIL SENT:",
                        patient.email
                    );
                }
            } catch (error) {
                console.error(
                    "APPOINTMENT EMAIL ERROR:",
                    error.message
                );
            }
        })();

        return res.status(201).json({
            success: true,
            message: "Appointment booked successfully.",
            appointmentId,
            appointment,
            patient_type: patientType,
        });
    } catch (error) {
        console.error(
            "Public create appointment error:",
            error
        );

        if (isDuplicateError(error)) {
            return res.status(409).json({
                success: false,
                message:
                    "This appointment slot is already booked. Please select another slot.",
            });
        }

        if (isValidationError(error)) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create appointment.",
        });
    }
};

/*
=========================================================
STAFF CREATE APPOINTMENT
=========================================================
*/

const addAppointment = async (req, res) => {
    try {
        const validationError =
            validateAppointmentInput(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        const hospitalId = requireHospitalScope(
            req,
            res
        );

        if (hospitalId === undefined) {
            return;
        }

        const payload =
            normalizeAppointmentPayload(req.body);

        let patientId;
        let doctorId;

        try {
            patientId =
                normalizePositiveInteger(
                    payload.patient_id,
                    "Patient ID"
                );

            doctorId =
                normalizePositiveInteger(
                    payload.doctor_id,
                    "Doctor ID"
                );
        } catch {
            return res.status(400).json({
                success: false,
                message:
                    "Patient ID and Doctor ID must be valid positive numbers.",
            });
        }

        const [patient, doctor] =
            await Promise.all([
                appointmentModel.findPatientById(
                    patientId
                ),
                appointmentModel.findDoctorById(
                    doctorId
                ),
            ]);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found.",
            });
        }

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        if (
            doctor.status &&
            !BOOKABLE_STATUSES.includes(String(doctor.status).trim().toLowerCase())
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Selected doctor is currently inactive.",
            });
        }

        if (
            hospitalId !== null &&
            (
                Number(patient.hospital_id) !==
                    hospitalId ||
                Number(doctor.hospital_id) !==
                    hospitalId
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Patient and doctor must belong to your hospital.",
            });
        }

        if (
            patient.hospital_id === null ||
            patient.hospital_id === undefined ||
            doctor.hospital_id === null ||
            doctor.hospital_id === undefined ||
            Number(patient.hospital_id) !==
                Number(doctor.hospital_id)
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Patient and doctor must belong to the same hospital.",
            });
        }

        const existing =
            await appointmentModel.findAppointmentBySlot(
                doctorId,
                payload.appointment_date,
                payload.appointment_time
            );

        if (existing) {
            return res.status(409).json({
                success: false,
                message:
                    "This appointment slot is already booked.",
            });
        }

        const appointmentId =
            await appointmentModel.createAppointment({
                patient_id: patientId,
                doctor_id: doctorId,
                appointment_date:
                    payload.appointment_date,
                appointment_time:
                    payload.appointment_time,
                status:
                    payload.status || "pending",
                reason: payload.reason,
            });

        const appointment =
            await appointmentModel.getAppointmentById(
                appointmentId,
                hospitalId
            );

        return res.status(201).json({
            success: true,
            message:
                "Appointment created successfully.",
            appointmentId,
            appointment,
        });
    } catch (error) {
        console.error(
            "Create appointment error:",
            error
        );

        if (isDuplicateError(error)) {
            return res.status(409).json({
                success: false,
                message:
                    "This appointment slot is already booked.",
            });
        }

        if (isValidationError(error)) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to create appointment.",
        });
    }
};

/*
=========================================================
UPDATE APPOINTMENT
=========================================================
*/

const editAppointment = async (req, res) => {
    try {
        const appointmentId =
            normalizePositiveInteger(
                req.params.id,
                "Appointment ID"
            );

        const validationError =
            validateAppointmentInput(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        const hospitalId = requireHospitalScope(
            req,
            res
        );

        if (hospitalId === undefined) {
            return;
        }

        const existingAppointment =
            await appointmentModel.getAppointmentById(
                appointmentId,
                hospitalId
            );

        if (!existingAppointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found.",
            });
        }

        const payload =
            normalizeAppointmentPayload(req.body);

        let patientId;
        let doctorId;

        try {
            patientId =
                normalizePositiveInteger(
                    payload.patient_id,
                    "Patient ID"
                );

            doctorId =
                normalizePositiveInteger(
                    payload.doctor_id,
                    "Doctor ID"
                );
        } catch {
            return res.status(400).json({
                success: false,
                message:
                    "Patient ID and Doctor ID must be valid positive numbers.",
            });
        }

        const [patient, doctor] =
            await Promise.all([
                appointmentModel.findPatientById(
                    patientId
                ),
                appointmentModel.findDoctorById(
                    doctorId
                ),
            ]);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found.",
            });
        }

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        if (
            doctor.status &&
            !BOOKABLE_STATUSES.includes(String(doctor.status).trim().toLowerCase())
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Selected doctor is currently inactive.",
            });
        }

        if (
            hospitalId !== null &&
            (
                Number(patient.hospital_id) !==
                    hospitalId ||
                Number(doctor.hospital_id) !==
                    hospitalId
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Patient and doctor must belong to your hospital.",
            });
        }

        if (
            patient.hospital_id === null ||
            patient.hospital_id === undefined ||
            doctor.hospital_id === null ||
            doctor.hospital_id === undefined ||
            Number(patient.hospital_id) !==
                Number(doctor.hospital_id)
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Patient and doctor must belong to the same hospital.",
            });
        }

        const existingSlot =
            await appointmentModel.findAppointmentBySlot(
                doctorId,
                payload.appointment_date,
                payload.appointment_time
            );

        if (
            existingSlot &&
            Number(existingSlot.id) !== appointmentId
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "This appointment slot is already booked.",
            });
        }

        const affectedRows =
            await appointmentModel.updateAppointment(
                appointmentId,
                {
                    patient_id: patientId,
                    doctor_id: doctorId,
                    appointment_date:
                        payload.appointment_date,
                    appointment_time:
                        payload.appointment_time,
                    status:
                        payload.status || "pending",
                    reason: payload.reason,
                },
                hospitalId
            );

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message:
                    "Appointment not found or no changes were made.",
            });
        }

        const appointment =
            await appointmentModel.getAppointmentById(
                appointmentId,
                hospitalId
            );

        return res.status(200).json({
            success: true,
            message:
                "Appointment updated successfully.",
            appointment,
        });
    } catch (error) {
        console.error(
            "Update appointment error:",
            error
        );

        if (isDuplicateError(error)) {
            return res.status(409).json({
                success: false,
                message:
                    "This appointment slot is already booked.",
            });
        }

        if (isValidationError(error)) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to update appointment.",
        });
    }
};

/*
=========================================================
DELETE APPOINTMENT
=========================================================
*/

const removeAppointment = async (req, res) => {
    try {
        const appointmentId =
            normalizePositiveInteger(
                req.params.id,
                "Appointment ID"
            );

        const hospitalId = requireHospitalScope(
            req,
            res
        );

        if (hospitalId === undefined) {
            return;
        }

        const appointment =
            await appointmentModel.getAppointmentById(
                appointmentId,
                hospitalId
            );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found.",
            });
        }

        const affectedRows =
            await appointmentModel.deleteAppointment(
                appointmentId,
                hospitalId
            );

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Appointment deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Delete appointment error:",
            error
        );

        if (isValidationError(error)) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete appointment.",
        });
    }
};

/*
=========================================================
EXPORTS
=========================================================
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