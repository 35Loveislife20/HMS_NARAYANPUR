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
   ENVIRONMENT
========================================================= */

const isVercel =
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV;

/* =========================================================
   DOCTOR PHOTO UPLOAD DIRECTORY
========================================================= */

const localUploadDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "doctors"
);

/*
   IMPORTANT:

   Vercel serverless filesystem:
   /var/task -> READ ONLY

   Local development:
   backend/uploads/doctors -> writable

   Vercel:
   /tmp -> writable temporarily
*/

const uploadDirectory = isVercel
    ? path.join("/tmp", "hms", "doctors")
    : localUploadDirectory;


/* =========================================================
   CREATE UPLOAD DIRECTORY
========================================================= */

try {
    if (!fs.existsSync(uploadDirectory)) {
        fs.mkdirSync(uploadDirectory, {
            recursive: true,
        });
    }
} catch (error) {
    console.error(
        "Doctor upload directory creation failed:",
        error.message
    );
}


/* =========================================================
   MULTER STORAGE
========================================================= */

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        /*
           Make sure temporary directory exists
           before multer writes the file.
        */

        try {
            if (!fs.existsSync(uploadDirectory)) {
                fs.mkdirSync(uploadDirectory, {
                    recursive: true,
                });
            }

            cb(null, uploadDirectory);

        } catch (error) {

            console.error(
                "Doctor upload destination error:",
                error.message
            );

            cb(error);
        }
    },


    filename: (req, file, cb) => {

        const extension = path
            .extname(file.originalname)
            .toLowerCase();

        const uniqueName =
            `doctor-${Date.now()}-${Math.round(
                Math.random() * 1E9
            )}${extension}`;

        cb(null, uniqueName);
    },

});


/* =========================================================
   FILE FILTER
   JPG / JPEG / PNG / WEBP ONLY
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
   MULTER
   MAX SIZE = 5 MB
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
========================================================= */

router.get(
    "/",
    getDoctors
);


/* =========================================================
   GET NEXT DOCTOR CODE
   PROTECTED
========================================================= */

router.get(
    "/next-code",
    authMiddleware,
    getNextDoctorCode
);


/* =========================================================
   GET SINGLE DOCTOR
   PROTECTED
========================================================= */

router.get(
    "/:id",
    authMiddleware,
    getDoctor
);


/* =========================================================
   ADD DOCTOR
   PHOTO FIELD = photo
   PROTECTED
========================================================= */

router.post(
    "/",
    authMiddleware,
    uploadDoctorPhoto.single("photo"),
    addDoctor
);


/* =========================================================
   UPDATE DOCTOR
   PHOTO FIELD = photo
   PROTECTED
========================================================= */

router.put(
    "/:id",
    authMiddleware,
    uploadDoctorPhoto.single("photo"),
    editDoctor
);


/* =========================================================
   DELETE DOCTOR
   PROTECTED
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

    console.error(
        "Doctor route error:",
        error
    );


    /* -----------------------------------------------------
       FILE SIZE ERROR
    ----------------------------------------------------- */

    if (
        error instanceof multer.MulterError &&
        error.code === "LIMIT_FILE_SIZE"
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Doctor photo must be 5 MB or smaller.",

        });
    }


    /* -----------------------------------------------------
       OTHER MULTER ERRORS
    ----------------------------------------------------- */

    if (error instanceof multer.MulterError) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });
    }


    /* -----------------------------------------------------
       CUSTOM FILE VALIDATION ERROR
    ----------------------------------------------------- */

    if (error) {

        return res.status(400).json({

            success: false,

            message: error.message ||
                "Doctor photo upload failed.",

        });
    }


    next();
});


module.exports = router;