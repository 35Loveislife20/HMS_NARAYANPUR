const {
    getAllDoctors,
    getDoctorById,
    searchDoctors,
    generateDoctorCode,
    createDoctor,
    updateDoctor,
    deleteDoctorById,
} = require("../models/doctor.model");

const cloudinary = require("../config/cloudinary");


/* =========================================================
   UPLOAD DOCTOR PHOTO TO CLOUDINARY
========================================================= */

const uploadDoctorPhotoToCloudinary = async (file) => {

    if (!file || !file.buffer) {
        return null;
    }

    return new Promise((resolve, reject) => {

        const uploadStream =
            cloudinary.uploader.upload_stream(
                {
                    folder:
                        "hms-hospital-narayanpur/doctors",

                    resource_type: "image",

                    transformation: [
                        {
                            width: 600,
                            height: 600,
                            crop: "fill",
                            gravity: "face",
                        },
                    ],
                },

                (error, result) => {

                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(result);
                }
            );

        uploadStream.end(file.buffer);
    });
};


/* =========================================================
   DELETE DOCTOR PHOTO FROM CLOUDINARY
========================================================= */

const deleteDoctorPhoto = async (photo) => {

    if (!photo) {
        return;
    }

    try {

        /*
         * Only process Cloudinary URLs.
         */

        if (
            !photo.includes(
                "res.cloudinary.com"
            )
        ) {
            return;
        }


        /*
         * Find /upload/ part.
         */

        const uploadIndex =
            photo.indexOf("/upload/");

        if (uploadIndex === -1) {
            return;
        }


        /*
         * Example:

         * https://res.cloudinary.com/demo/image/upload/
         * v123456/hms-hospital-narayanpur/doctors/photo.jpg
         */

        let publicId =
            photo.substring(
                uploadIndex + "/upload/".length
            );


        /*
         * Remove transformation segments if present.
         */

        const parts =
            publicId.split("/");


        /*
         * Remove version:
         * v123456
         */

        if (
            parts[0] &&
            /^v\d+$/.test(parts[0])
        ) {
            parts.shift();
        }


        publicId = parts.join("/");


        /*
         * Remove extension.
         */

        publicId =
            publicId.replace(
                /\.(jpg|jpeg|png|webp|gif|avif)$/i,
                ""
            );


        if (!publicId) {
            return;
        }


        await cloudinary.uploader.destroy(
            publicId,
            {
                resource_type: "image",
            }
        );

        console.log(
            "Cloudinary doctor photo deleted:",
            publicId
        );

    } catch (error) {

        /*
         * Photo deletion failure should not
         * break doctor operations.
         */

        console.error(
            "Cloudinary doctor photo delete error:",
            error.message
        );
    }
};


/* =========================================================
   GET ALL DOCTORS
   GET /api/doctors
   PUBLIC
========================================================= */

const getDoctors = async (req, res) => {

    try {

        const { search } = req.query;

        let doctors;


        if (
            search &&
            search.trim()
        ) {

            doctors =
                await searchDoctors(
                    search.trim()
                );

        } else {

            doctors =
                await getAllDoctors();
        }


        return res.status(200).json({

            success: true,

            count: doctors.length,

            doctors,

        });

    } catch (error) {

        console.error(
            "Get doctors error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch doctors",

            error:
                error.message,

        });
    }
};


/* =========================================================
   GET SINGLE DOCTOR
   GET /api/doctors/:id
========================================================= */

const getDoctor = async (req, res) => {

    try {

        const { id } =
            req.params;


        const doctor =
            await getDoctorById(id);


        if (!doctor) {

            return res.status(404).json({

                success: false,

                message:
                    "Doctor not found",

            });
        }


        return res.status(200).json({

            success: true,

            doctor,

        });

    } catch (error) {

        console.error(
            "Get doctor error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch doctor",

            error:
                error.message,

        });
    }
};


/* =========================================================
   GET NEXT DOCTOR CODE
   GET /api/doctors/next-code
========================================================= */

const getNextDoctorCode = async (
    req,
    res
) => {

    try {

        const doctorCode =
            await generateDoctorCode();


        return res.status(200).json({

            success: true,

            doctor_code:
                doctorCode,

        });

    } catch (error) {

        console.error(
            "Generate doctor code error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to generate doctor code",

            error:
                error.message,

        });
    }
};


/* =========================================================
   ADD DOCTOR
   POST /api/doctors
========================================================= */

const addDoctor = async (
    req,
    res
) => {

    let uploadedPhoto = null;

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

        if (
            !name ||
            !name.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Doctor name is required",

            });
        }


        /* ---------------------------------------------
           STATUS
        --------------------------------------------- */

        const validStatuses = [
            "available",
            "busy",
            "offline",
        ];


        const doctorStatus =
            validStatuses.includes(status)
                ? status
                : "available";


        /* ---------------------------------------------
           PHOTO UPLOAD
        --------------------------------------------- */

        let photo = null;


        if (req.file) {

            uploadedPhoto =
                await uploadDoctorPhotoToCloudinary(
                    req.file
                );


            if (
                !uploadedPhoto ||
                !uploadedPhoto.secure_url
            ) {

                throw new Error(
                    "Doctor photo upload failed."
                );
            }


            photo =
                uploadedPhoto.secure_url;


            console.log(
                "Doctor photo uploaded:",
                photo
            );
        }


        /* ---------------------------------------------
           DOCTOR CODE
        --------------------------------------------- */

        const finalDoctorCode =
            doctor_code &&
                doctor_code.trim()
                ? doctor_code.trim()
                : await generateDoctorCode();


        /* ---------------------------------------------
           CREATE DOCTOR
        --------------------------------------------- */

        const result =
            await createDoctor({

                doctor_code:
                    finalDoctorCode,

                name:
                    name.trim(),

                photo,

                specialization:
                    specialization?.trim() ||
                    null,

                qualification:
                    qualification?.trim() ||
                    null,

                phone:
                    phone?.trim() ||
                    null,

                email:
                    email?.trim() ||
                    null,

                experience_years:
                    experience_years || 0,

                consultation_fee:
                    consultation_fee || 0,

                department_id:
                    department_id || null,

                hospital_id:
                    hospital_id || null,

                status:
                    doctorStatus,

            });


        /* ---------------------------------------------
           GET CREATED DOCTOR
        --------------------------------------------- */

        const doctor =
            await getDoctorById(
                result.id
            );


        return res.status(201).json({

            success: true,

            message:
                "Doctor added successfully",

            doctor,

        });

    } catch (error) {

        console.error(
            "Add doctor error:",
            error
        );


        /*
         * If database creation fails after
         * Cloudinary upload, delete uploaded image.
         */

        if (
            uploadedPhoto &&
            uploadedPhoto.secure_url
        ) {

            await deleteDoctorPhoto(
                uploadedPhoto.secure_url
            );
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to add doctor",

            error:
                error.message,

        });
    }
};


/* =========================================================
   EDIT DOCTOR
   PUT /api/doctors/:id
========================================================= */

const editDoctor = async (
    req,
    res
) => {

    let newUploadedPhoto = null;

    try {

        const { id } =
            req.params;


        /* ---------------------------------------------
           FIND EXISTING DOCTOR
        --------------------------------------------- */

        const existingDoctor =
            await getDoctorById(id);


        if (!existingDoctor) {

            return res.status(404).json({

                success: false,

                message:
                    "Doctor not found",

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

        if (
            !name ||
            !name.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Doctor name is required",

            });
        }


        /* ---------------------------------------------
           STATUS
        --------------------------------------------- */

        const validStatuses = [
            "available",
            "busy",
            "offline",
        ];


        const doctorStatus =
            validStatuses.includes(status)
                ? status
                : existingDoctor.status ||
                "available";


        /* ---------------------------------------------
           PHOTO
        --------------------------------------------- */

        let photo =
            existingDoctor.photo ||
            null;


        /*
         * If new photo is uploaded:
         *
         * 1. Upload new photo first
         * 2. Update database
         * 3. Delete old photo
         *
         * This prevents accidental loss of the
         * old photo if Cloudinary upload fails.
         */

        if (req.file) {

            newUploadedPhoto =
                await uploadDoctorPhotoToCloudinary(
                    req.file
                );


            if (
                !newUploadedPhoto ||
                !newUploadedPhoto.secure_url
            ) {

                throw new Error(
                    "Doctor photo upload failed."
                );
            }


            photo =
                newUploadedPhoto.secure_url;


            console.log(
                "New doctor photo uploaded:",
                photo
            );
        }


        /* ---------------------------------------------
           UPDATE DOCTOR
        --------------------------------------------- */

        await updateDoctor(
            id,
            {

                doctor_code:
                    doctor_code?.trim() ||
                    existingDoctor.doctor_code,

                name:
                    name.trim(),

                photo,

                specialization:
                    specialization?.trim() ||
                    null,

                qualification:
                    qualification?.trim() ||
                    null,

                phone:
                    phone?.trim() ||
                    null,

                email:
                    email?.trim() ||
                    null,

                experience_years:
                    experience_years || 0,

                consultation_fee:
                    consultation_fee || 0,

                department_id:
                    department_id || null,

                hospital_id:
                    hospital_id || null,

                status:
                    doctorStatus,

            }
        );


        /* ---------------------------------------------
           DELETE OLD PHOTO
        --------------------------------------------- */

        if (
            req.file &&
            existingDoctor.photo &&
            existingDoctor.photo !== photo
        ) {

            await deleteDoctorPhoto(
                existingDoctor.photo
            );
        }


        /* ---------------------------------------------
           GET UPDATED DOCTOR
        --------------------------------------------- */

        const updatedDoctor =
            await getDoctorById(id);


        return res.status(200).json({

            success: true,

            message:
                "Doctor updated successfully",

            doctor:
                updatedDoctor,

        });

    } catch (error) {

        console.error(
            "Edit doctor error:",
            error
        );


        /*
         * If new Cloudinary photo was uploaded
         * but database update failed,
         * remove the new image.
         */

        if (
            newUploadedPhoto &&
            newUploadedPhoto.secure_url
        ) {

            await deleteDoctorPhoto(
                newUploadedPhoto.secure_url
            );
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to update doctor",

            error:
                error.message,

        });
    }
};


/* =========================================================
   DELETE DOCTOR
   DELETE /api/doctors/:id
========================================================= */

const removeDoctor = async (
    req,
    res
) => {

    try {

        const { id } =
            req.params;


        /* ---------------------------------------------
           FIND DOCTOR
        --------------------------------------------- */

        const doctor =
            await getDoctorById(id);


        if (!doctor) {

            return res.status(404).json({

                success: false,

                message:
                    "Doctor not found",

            });
        }


        /* ---------------------------------------------
           DELETE DATABASE RECORD
        --------------------------------------------- */

        await deleteDoctorById(id);


        /* ---------------------------------------------
           DELETE CLOUDINARY PHOTO
        --------------------------------------------- */

        if (doctor.photo) {

            await deleteDoctorPhoto(
                doctor.photo
            );
        }


        return res.status(200).json({

            success: true,

            message:
                "Doctor deleted successfully",

        });

    } catch (error) {

        console.error(
            "Delete doctor error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to delete doctor",

            error:
                error.message,

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