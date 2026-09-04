const fs = require("fs");
const path = require("path");

const {
    getAllDoctors,
    getDoctorById,
    searchDoctors,
    generateDoctorCode,
    createDoctor,
    updateDoctor,
    deleteDoctorById,
} = require("../models/doctor.model");


/* =========================================================
   HELPER — DELETE OLD PHOTO
========================================================= */
const deleteDoctorPhoto = (photo) => {
    if (!photo) return;

    try {
        // Only delete files stored in /uploads/doctors/
        if (!photo.includes("/uploads/doctors/")) {
            return;
        }

        const fileName = path.basename(photo);
        const filePath = path.join(
            __dirname,
            "..",
            "uploads",
            "doctors",
            fileName
        );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error("Doctor photo delete error:", error.message);
    }
};


/* =========================================================
   GET ALL DOCTORS
   GET /api/doctors
   PUBLIC — Home page needs this
========================================================= */
const getDoctors = async (req, res) => {
    try {
        const { search } = req.query;

        let doctors;

        if (search && search.trim()) {
            doctors = await searchDoctors(search.trim());
        } else {
            doctors = await getAllDoctors();
        }

        return res.status(200).json({
            success: true,
            count: doctors.length,
            doctors,
        });
    } catch (error) {
        console.error("Get doctors error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch doctors",
            error: error.message,
        });
    }
};


/* =========================================================
   GET SINGLE DOCTOR
   GET /api/doctors/:id
========================================================= */
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
        console.error("Get doctor error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch doctor",
            error: error.message,
        });
    }
};


/* =========================================================
   GET NEXT DOCTOR CODE
   GET /api/doctors/next-code
========================================================= */
const getNextDoctorCode = async (req, res) => {
    try {
        const doctorCode = await generateDoctorCode();

        return res.status(200).json({
            success: true,
            doctor_code: doctorCode,
        });
    } catch (error) {
        console.error("Generate doctor code error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate doctor code",
            error: error.message,
        });
    }
};


/* =========================================================
   ADD DOCTOR
   POST /api/doctors
========================================================= */
const addDoctor = async (req, res) => {
    try {
        const {
            doctor_code,
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

        /* ---------------------------------------------
           VALIDATION
        --------------------------------------------- */
        if (!name || !name.trim()) {
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

        const doctorStatus = validStatuses.includes(status)
            ? status
            : "available";


        /* ---------------------------------------------
           PHOTO
        --------------------------------------------- */
        let photo = null;

        if (req.file) {
            photo = `/uploads/doctors/${req.file.filename}`;
        }


        /* ---------------------------------------------
           DOCTOR CODE
        --------------------------------------------- */
        const finalDoctorCode =
            doctor_code && doctor_code.trim()
                ? doctor_code.trim()
                : await generateDoctorCode();


        /* ---------------------------------------------
           CREATE DOCTOR
        --------------------------------------------- */
        const result = await createDoctor({
            doctor_code: finalDoctorCode,
            name: name.trim(),
            photo,
            specialization: specialization?.trim() || null,
            qualification: qualification?.trim() || null,
            phone: phone?.trim() || null,
            email: email?.trim() || null,
            experience_years: experience_years || 0,
            consultation_fee: consultation_fee || 0,
            department_id: department_id || null,
            hospital_id: hospital_id || null,
            status: doctorStatus,
        });


        /* ---------------------------------------------
           RETURN CREATED DOCTOR
        --------------------------------------------- */
        const doctor = await getDoctorById(result.id);

        return res.status(201).json({
            success: true,
            message: "Doctor added successfully",
            doctor,
        });

    } catch (error) {
        console.error("Add doctor error:", error);

        // If DB insertion fails, remove uploaded photo
        if (req.file) {
            try {
                const filePath = path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "doctors",
                    req.file.filename
                );

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileError) {
                console.error(
                    "Uploaded photo cleanup error:",
                    fileError.message
                );
            }
        }

        return res.status(500).json({
            success: false,
            message: "Failed to add doctor",
            error: error.message,
        });
    }
};


/* =========================================================
   EDIT DOCTOR
   PUT /api/doctors/:id
========================================================= */
const editDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        /* ---------------------------------------------
           FIND EXISTING DOCTOR
        --------------------------------------------- */
        const existingDoctor = await getDoctorById(id);

        if (!existingDoctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }


        const {
            doctor_code,
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


        /* ---------------------------------------------
           VALIDATION
        --------------------------------------------- */
        if (!name || !name.trim()) {
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

        const doctorStatus = validStatuses.includes(status)
            ? status
            : existingDoctor.status || "available";


        /* ---------------------------------------------
           PHOTO HANDLING
        --------------------------------------------- */

        let photo = existingDoctor.photo || null;

        // New photo uploaded
        if (req.file) {
            photo = `/uploads/doctors/${req.file.filename}`;

            // Delete old photo
            if (existingDoctor.photo) {
                deleteDoctorPhoto(existingDoctor.photo);
            }
        }


        /* ---------------------------------------------
           UPDATE DOCTOR
        --------------------------------------------- */
        await updateDoctor(id, {
            doctor_code:
                doctor_code?.trim() ||
                existingDoctor.doctor_code,

            name: name.trim(),

            photo,

            specialization:
                specialization?.trim() || null,

            qualification:
                qualification?.trim() || null,

            phone:
                phone?.trim() || null,

            email:
                email?.trim() || null,

            experience_years:
                experience_years || 0,

            consultation_fee:
                consultation_fee || 0,

            department_id:
                department_id || null,

            hospital_id:
                hospital_id || null,

            status: doctorStatus,
        });


        /* ---------------------------------------------
           RETURN UPDATED DOCTOR
        --------------------------------------------- */
        const updatedDoctor = await getDoctorById(id);

        return res.status(200).json({
            success: true,
            message: "Doctor updated successfully",
            doctor: updatedDoctor,
        });

    } catch (error) {
        console.error("Edit doctor error:", error);

        // Cleanup newly uploaded photo if update fails
        if (req.file) {
            try {
                const filePath = path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "doctors",
                    req.file.filename
                );

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileError) {
                console.error(
                    "Uploaded photo cleanup error:",
                    fileError.message
                );
            }
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update doctor",
            error: error.message,
        });
    }
};


/* =========================================================
   DELETE DOCTOR
   DELETE /api/doctors/:id
========================================================= */
const removeDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await getDoctorById(id);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }


        /* ---------------------------------------------
           DELETE DATABASE RECORD
        --------------------------------------------- */
        await deleteDoctorById(id);


        /* ---------------------------------------------
           DELETE PHOTO FILE
        --------------------------------------------- */
        if (doctor.photo) {
            deleteDoctorPhoto(doctor.photo);
        }


        return res.status(200).json({
            success: true,
            message: "Doctor deleted successfully",
        });

    } catch (error) {
        console.error("Delete doctor error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete doctor",
            error: error.message,
        });
    }
};


/* =========================================================
   EXPORTS
========================================================= */
module.exports = {
    getDoctors,
    getDoctor,
    getNextDoctorCode,
    addDoctor,
    editDoctor,
    removeDoctor,
};