const {
    getAllAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointment,
    deleteAppointment,
} = require("../models/appointment.model");

// =====================================================
// GET ALL APPOINTMENTS
// =====================================================

const getAppointments = async (req, res) => {
    try {
        const appointments = await getAllAppointments();

        return res.status(200).json({
            success: true,
            count: appointments.length,
            appointments,
        });
    } catch (error) {
        console.error("Get Appointments Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load appointments",
        });
    }
};

// =====================================================
// GET APPOINTMENT BY ID
// =====================================================

const getAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Valid appointment ID is required",
            });
        }

        const appointment =
            await getAppointmentById(Number(id));

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        return res.status(200).json({
            success: true,
            appointment,
        });
    } catch (error) {
        console.error("Get Appointment Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load appointment",
        });
    }
};

// =====================================================
// CREATE APPOINTMENT
// =====================================================

const addAppointment = async (req, res) => {
    try {
        const {
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            reason,
        } = req.body;

        // =============================================
        // VALIDATION
        // =============================================

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

        if (
            !Number.isInteger(Number(patient_id)) ||
            !Number.isInteger(Number(doctor_id))
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient ID and Doctor ID must be valid numbers",
            });
        }

        // =============================================
        // CREATE
        // =============================================

        const appointmentId =
            await createAppointment({
                patient_id: Number(patient_id),
                doctor_id: Number(doctor_id),
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

// =====================================================
// UPDATE APPOINTMENT
// =====================================================

const editAppointment = async (req, res) => {
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

        // =============================================
        // ID VALIDATION
        // =============================================

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

        // =============================================
        // FIELD VALIDATION
        // =============================================

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

        if (
            !Number.isInteger(Number(patient_id)) ||
            !Number.isInteger(Number(doctor_id))
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient ID and Doctor ID must be valid numbers",
            });
        }

        // =============================================
        // UPDATE
        // =============================================

        const affectedRows =
            await updateAppointment(
                Number(id),
                {
                    patient_id: Number(patient_id),
                    doctor_id: Number(doctor_id),
                    appointment_date,
                    appointment_time,
                    status,
                    reason,
                }
            );

        if (affectedRows === 0) {
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

// =====================================================
// DELETE APPOINTMENT
// =====================================================

const removeAppointment = async (req, res) => {
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

        const affectedRows =
            await deleteAppointment(Number(id));

        if (affectedRows === 0) {
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

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getAppointments,
    getAppointment,
    addAppointment,
    editAppointment,
    removeAppointment,
};