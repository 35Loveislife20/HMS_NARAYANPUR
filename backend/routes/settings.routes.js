/**
 * =========================================================
 * HMS SETTINGS ROUTES
 * =========================================================
 *
 * GET   /api/settings   -> unchanged (public read)
 * PUT   /api/settings   -> super_admin only
 * PATCH /api/settings   -> super_admin only
 */

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const settingsController = require("../controllers/settings.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

/* =========================================================
   UPLOAD DIRECTORY
========================================================= */

const uploadDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "settings"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

/* =========================================================
   MULTER STORAGE
========================================================= */

const FIELD_PREFIX = {
    adminLogo: "admin-logo",
    backgroundImage: "background",
    adminSignature: "admin-signature",
    adminStamp: "admin-stamp",
};

const storage = multer.memoryStorage();

/* =========================================================
   FILE FILTER
========================================================= */

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        return cb(
            new Error(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            )
        );
    }

    cb(null, true);
};

/* =========================================================
   UPLOAD MIDDLEWARE
========================================================= */

const settingsUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 4,
    },
}).fields([
    { name: "adminLogo", maxCount: 1 },
    { name: "backgroundImage", maxCount: 1 },
    { name: "adminSignature", maxCount: 1 },
    { name: "adminStamp", maxCount: 1 },
]);

const handleUpload = (req, res, next) => {
    settingsUpload(req, res, (error) => {
        if (error) {
            if (
                error instanceof multer.MulterError &&
                error.code === "LIMIT_FILE_SIZE"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Image size must not exceed 2MB.",
                });
            }

            return res.status(400).json({
                success: false,
                message: error.message || "Image upload failed.",
            });
        }

        next();
    });
};

/* =========================================================
   CONTROLLER CALLERS
========================================================= */

const callController = (name) => async (req, res, next) => {
    try {
        const handler = settingsController?.[name];

        if (typeof handler !== "function") {
            return res.status(500).json({
                success: false,
                message: `Settings controller error: ${name} function is not exported.`,
            });
        }

        return await handler(req, res, next);
    } catch (error) {
        return next(error);
    }
};

/* =========================================================
   GET SETTINGS (public, unchanged)
========================================================= */

router.get("/", callController("getSettings"));

/* =========================================================
   PUT / PATCH SETTINGS (super admin only)
   Auth runs BEFORE the upload, so anonymous callers can
   no longer write files into uploads/settings.
========================================================= */

const writeGuard = [authMiddleware, requireRole("super_admin")];

router.put(
    "/",
    ...writeGuard,
    handleUpload,
    callController("updateSettings")
);

router.patch(
    "/",
    ...writeGuard,
    handleUpload,
    callController("updateSettings")
);

module.exports = router;