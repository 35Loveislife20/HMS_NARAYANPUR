const {
    getAllDoctors,
    getDoctorById,
    searchDoctors,
    generateDoctorCode,
    createDoctor,
    updateDoctor,
    deleteDoctor,
} = require("../models/doctor.model");

// =====================================================
// GET DOCTORS
// GET /api/doctors
// =====================================================

const getDoctors = async (req, res) => {
    try {
        const { search } = req.query;

        const doctors = search
            ? await searchDoctors(search)
            : await getAllDoctors();

        return res.status(200).json({
            success: true,
            count: doctors.length,
            doctors,
        });

    } catch (error) {
        console.error("GET DOCTORS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load doctors",
            error: error.message,
        });
    }
};

// =====================================================
// GET SINGLE DOCTOR
// GET /api/doctors/:id
// =====================================================

const getDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await getDoctorById(id);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        return res.status(200).json({
            success: true,
            doctor,
        });

    } catch (error) {
        console.error("GET DOCTOR ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load doctor",
            error: error.message,
        });
    }
};

// =====================================================
// GET NEXT DOCTOR CODE
// GET /api/doctors/next-code
// =====================================================

const getNextDoctorCode = async (req, res) => {
    try {
        const doctorCode = await generateDoctorCode();

        return res.status(200).json({
            success: true,
            doctor_code: doctorCode,
        });

    } catch (error) {
        console.error(
            "GENERATE DOCTOR CODE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to generate doctor code",
            error: error.message,
        });
    }
};

// =====================================================
// CREATE DOCTOR
// POST /api/doctors
// =====================================================

const addDoctor = async (req, res) => {
    try {
        const {
            name,
            specialization,
            qualification,
            phone,
            email,
            experience_years,
            consultation_fee,
            department_id,
            hospital_id,
            status,
        } = req.body;

        // Required
        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Doctor name is required",
            });
        }

        // Status validation
        const validStatuses = [
            "available",
            "busy",
            "offline",
        ];

        if (
            status &&
            !validStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be available, busy or offline",
            });
        }

        const doctor = await createDoctor({
            name: String(name).trim(),
            specialization,
            qualification,
            phone,
            email,
            experience_years,
            consultation_fee,
            department_id,
            hospital_id,
            status,
        });

        const createdDoctor =
            await getDoctorById(doctor.id);

        return res.status(201).json({
            success: true,
            message: "Doctor added successfully",
            doctor: createdDoctor,
        });

    } catch (error) {
        console.error("ADD DOCTOR ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add doctor",
            error: error.message,
        });
    }
};

// =====================================================
// UPDATE DOCTOR
// PUT /api/doctors/:id
// =====================================================

const editDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        const existingDoctor =
            await getDoctorById(id);

        if (!existingDoctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        const {
            name,
            specialization,
            qualification,
            phone,
            email,
            experience_years,
            consultation_fee,
            department_id,
            hospital_id,
            status,
        } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Doctor name is required",
            });
        }

        const validStatuses = [
            "available",
            "busy",
            "offline",
        ];

        if (
            status &&
            !validStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be available, busy or offline",
            });
        }

        await updateDoctor(id, {
            name: String(name).trim(),
            specialization,
            qualification,
            phone,
            email,
            experience_years,
            consultation_fee,
            department_id,
            hospital_id,
            status,
        });

        const updatedDoctor =
            await getDoctorById(id);

        return res.status(200).json({
            success: true,
            message: "Doctor updated successfully",
            doctor: updatedDoctor,
        });

    } catch (error) {
        console.error("UPDATE DOCTOR ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update doctor",
            error: error.message,
        });
    }
};

// =====================================================
// DELETE DOCTOR
// DELETE /api/doctors/:id
// =====================================================

const removeDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor =
            await getDoctorById(id);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        await deleteDoctor(id);

        return res.status(200).json({
            success: true,
            message: "Doctor deleted successfully",
        });

    } catch (error) {
        console.error("DELETE DOCTOR ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete doctor",
            error: error.message,
        });
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getDoctors,
    getDoctor,
    getNextDoctorCode,
    addDoctor,
    editDoctor,
    removeDoctor,
};