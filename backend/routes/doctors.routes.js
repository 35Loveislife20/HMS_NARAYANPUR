const express = require("express");
const multer = require("multer");

const {
    getDoctors,
    getDoctor,
    getNextDoctorCode,
    addDoctor,
    editDoctor,
    removeDoctor,
} = require("../controllers/doctors.controller");

const authMiddleware = require("../middleware/auth.middleware");

const {
    requirePermission,
} = require("../middleware/role.middleware");

const router = express.Router();


/*
=========================================================
MULTER CONFIGURATION
=========================================================
*/

const storage = multer.memoryStorage();


/*
=========================================================
DOCTOR PHOTO FILE FILTER
=========================================================

Allowed:
- JPG
- JPEG
- PNG
- WEBP
=========================================================
*/

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    return cb(
        new Error(
            "Only JPG, JPEG, PNG and WEBP images are allowed."
        ),
        false
    );
};


/*
=========================================================
DOCTOR PHOTO UPLOAD
=========================================================

Maximum file size:
5 MB
=========================================================
*/

const uploadDoctorPhoto = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
});


/*
=========================================================
AUTHENTICATION + AUTHORIZATION
=========================================================

All doctor management APIs require:

1. Valid JWT
2. "doctors" permission

Current permission matrix:
- Super Admin
- Hospital Admin
=========================================================
*/

router.use(authMiddleware);

router.use(
    requirePermission("doctors")
);


/*
=========================================================
GET ALL DOCTORS
=========================================================

GET /api/doctors

Super Admin:
    -> all hospitals

Hospital Admin:
    -> controller must restrict to own hospital
=========================================================
*/

router.get(
    "/",
    getDoctors
);


/*
=========================================================
GET NEXT DOCTOR CODE
=========================================================

GET /api/doctors/next-code
=========================================================
*/

router.get(
    "/next-code",
    getNextDoctorCode
);


/*
=========================================================
GET SINGLE DOCTOR
=========================================================

GET /api/doctors/:id

Hospital scope must be enforced by controller/model.
=========================================================
*/

router.get(
    "/:id",
    getDoctor
);


/*
=========================================================
ADD DOCTOR
=========================================================

POST /api/doctors

PHOTO FIELD:
    photo

Multipart/form-data
=========================================================
*/

router.post(
    "/",
    uploadDoctorPhoto.single("photo"),
    addDoctor
);


/*
=========================================================
UPDATE DOCTOR
=========================================================

PUT /api/doctors/:id

PHOTO FIELD:
    photo

Multipart/form-data
=========================================================
*/

router.put(
    "/:id",
    uploadDoctorPhoto.single("photo"),
    editDoctor
);


/*
=========================================================
DELETE DOCTOR
=========================================================

DELETE /api/doctors/:id
=========================================================
*/

router.delete(
    "/:id",
    removeDoctor
);


/*
=========================================================
MULTER ERROR HANDLER
=========================================================

Only upload-related errors are handled here.

Other application errors are passed to the
global Express error handler.
=========================================================
*/

router.use(
    (error, req, res, next) => {
        console.error(
            "DOCTOR ROUTE ERROR:",
            error
        );

        /*
        -------------------------------------------------
        FILE SIZE ERROR
        -------------------------------------------------
        */

        if (
            error instanceof multer.MulterError &&
            error.code === "LIMIT_FILE_SIZE"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor photo must be 2 MB or smaller.",
            });
        }


        /*
        -------------------------------------------------
        OTHER MULTER ERRORS
        -------------------------------------------------
        */

        if (
            error instanceof multer.MulterError
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor photo upload failed.",
            });
        }


        /*
        -------------------------------------------------
        FILE TYPE VALIDATION ERROR
        -------------------------------------------------
        */

        if (
            error &&
            error.message ===
                "Only JPG, JPEG, PNG and WEBP images are allowed."
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only JPG, JPEG, PNG and WEBP images are allowed.",
            });
        }


        /*
        -------------------------------------------------
        OTHER ERRORS
        -------------------------------------------------

        Do not expose internal error.message here.
        Let app.js/global error middleware handle it.
        -------------------------------------------------
        */

        return next(error);
    }
);


/*
=========================================================
EXPORT
=========================================================
*/

module.exports = router;