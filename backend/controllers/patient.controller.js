const {
    createPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    getPatientStats,
} = require("../models/patient.model");

const { sendPatientRegistrationSMS } = require("../services/sms.service");

// =====================================================
// ADD PATIENT
// =====================================================

const addPatient = async (req, res) => {
    try {
        const {
            name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            blood_group,
        } = req.body;

        if (!name || !gender) {
            return res.status(400).json({
                success: false,
                message: "Name and gender are required",
            });
        }

        const patientId = await createPatient({
            name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            blood_group,
        });

        const patient = await getPatientById(patientId);

        // SMS bhejo agar phone number hai
        if (patient && patient.phone) {
            sendPatientRegistrationSMS(patient).catch((err) =>
                console.error("SMS failed:", err)
            );
        }

        return res.status(201).json({
            success: true,
            message: "Patient created successfully",
            patient,
        });

    } catch (error) {
        console.error("Add Patient Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =====================================================
// GET PATIENTS
// =====================================================

const getPatients = async (req, res) => {
    try {
        const patients = await getAllPatients();
        const stats = await getPatientStats();

        return res.status(200).json({
            success: true,
            count: patients.length,
            stats: {
                totalPatients: stats.totalPatients,
                todayPatients: stats.todayPatients,
                newPatients: stats.newPatients,
            },
            patients,
        });
    } catch (error) {
        console.error("Get Patients Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =====================================================
// GET SINGLE PATIENT
// =====================================================

const getPatient = async (req, res) => {
    try {
        const patient = await getPatientById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        return res.status(200).json({
            success: true,
            patient,
        });
    } catch (error) {
        console.error("Get Patient Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =====================================================
// UPDATE PATIENT
// =====================================================

const editPatient = async (req, res) => {
    try {
        const patient = await getPatientById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        await updatePatient(req.params.id, req.body);

        const updatedPatient = await getPatientById(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Patient updated successfully",
            patient: updatedPatient,
        });
    } catch (error) {
        console.error("Update Patient Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =====================================================
// DELETE PATIENT
// =====================================================

const removePatient = async (req, res) => {
    try {
        const patient = await getPatientById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        await deletePatient(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Patient deleted successfully",
        });
    } catch (error) {
        console.error("Delete Patient Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

module.exports = {
    addPatient,
    getPatients,
    getPatient,
    editPatient,
    removePatient,
};