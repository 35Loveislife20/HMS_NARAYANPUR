const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
    getDoctors,
    getDoctor,
    getNextDoctorCode,
    addDoctor,
    editDoctor,
    removeDoctor,
} = require("../controllers/doctors.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();


/* =========================================================
   DOCTOR PHOTO UPLOAD CONFIGURATION
========================================================= */

const uploadDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "doctors"
);


/* Make sure upload directory exists */
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true,
    });
}


/* =========================================================
   MULTER STORAGE
========================================================= */

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {

        const extension = path.extname(file.originalname);

        const uniqueName =
            `doctor-${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;

        cb(null, uniqueName);
    },

});


/* =========================================================
   FILE FILTER
   Allowed: JPG, JPEG, PNG, WEBP
========================================================= */

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            ),
            false
        );
    }
};


/* =========================================================
   MULTER INSTANCE
   Maximum file size: 5 MB
========================================================= */

const uploadDoctorPhoto = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});


/* =========================================================
   GET ALL DOCTORS
   PUBLIC
   Home page uses this
========================================================= */

router.get(
    "/",
    getDoctors
);


/* =========================================================
   GET NEXT DOCTOR CODE
========================================================= */

router.get(
    "/next-code",
    authMiddleware,
    getNextDoctorCode
);


/* =========================================================
   GET SINGLE DOCTOR
========================================================= */

router.get(
    "/:id",
    authMiddleware,
    getDoctor
);


/* =========================================================
   ADD DOCTOR
   PHOTO FIELD NAME = photo
========================================================= */

router.post(
    "/",
    authMiddleware,
    uploadDoctorPhoto.single("photo"),
    addDoctor
);


/* =========================================================
   UPDATE DOCTOR
   PHOTO FIELD NAME = photo
========================================================= */

router.put(
    "/:id",
    authMiddleware,
    uploadDoctorPhoto.single("photo"),
    editDoctor
);


/* =========================================================
   DELETE DOCTOR
========================================================= */

router.delete(
    "/:id",
    authMiddleware,
    removeDoctor
);


/* =========================================================
   MULTER ERROR HANDLER
========================================================= */

router.use((error, req, res, next) => {

    if (error instanceof multer.MulterError) {

        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "Doctor photo must be 5 MB or smaller.",
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }


    if (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }


    next();
});


module.exports = router;