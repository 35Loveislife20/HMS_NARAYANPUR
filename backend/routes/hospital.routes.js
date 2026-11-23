const express = require("express");

const hospitalController = require("../controllers/hospital.controller");

const authMiddleware = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");
const { updateHospitalSettings } = require("../controllers/hospital.settings.controller");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| HELPER: hospital admin sirf apna hospital access kare
|--------------------------------------------------------------------------
*/
const ownHospitalOnly = (req, res, next) => {
    if (req.user && req.user.role === "super_admin") return next();

    const userHospitalId =
        req.user?.hospital_id ??
        req.user?.hospitalId ??
        req.user?.hospital?.id ??
        null;

    if (
        userHospitalId !== null &&
        String(userHospitalId) === String(req.params.id)
    ) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
    });
};

/*
|--------------------------------------------------------------------------
| PUBLIC HOSPITAL READ ROUTES
|--------------------------------------------------------------------------
*/

router.get("/", hospitalController.getAllHospitals);

router.get("/search", hospitalController.searchHospitals);

/*
|--------------------------------------------------------------------------
| SUPER ADMIN ONLY ROUTES
|--------------------------------------------------------------------------
| Specific /:id/... routes hamesha /:id se pehle rakhe gaye hain.
*/

router.post(
    "/",
    authMiddleware,
    requireRole("super_admin"),
    hospitalController.createHospital
);

router.post(
    "/:id/send-welcome",
    authMiddleware,
    requireRole("super_admin"),
    hospitalController.sendHospitalWelcome
);

router.post(
    "/:id/send-credentials",
    authMiddleware,
    requireRole("super_admin"),
    hospitalController.sendHospitalCredentials
);

router.get(
    "/:id/registration-certificate",
    authMiddleware,
    requireRole("super_admin"),
    hospitalController.printHospitalCertificate
);

router.post(
    "/:id/reset-admin-password",
    authMiddleware,
    requireRole("super_admin"),
    hospitalController.resetHospitalAdminPassword
);

/*
|--------------------------------------------------------------------------
| HOSPITAL SETTINGS (JSON body, images base64 data URL ke roop mein)
| Frontend (Hospitalsettings.jsx) PUT /hospitals/:id/settings par
| JSON bhejta hai, multipart nahi. Isliye yahan multer ki zaroorat nahi.
|--------------------------------------------------------------------------
*/

router.put(
    "/:id/settings",
    authMiddleware,
    requireRole("super_admin", "hospital_admin"),
    ownHospitalOnly,
    updateHospitalSettings
);

/*
|--------------------------------------------------------------------------
| UPDATE HOSPITAL (sirf Super Admin)
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    authMiddleware,
    requireRole("super_admin"),
    hospitalController.updateHospital
);

router.delete(
    "/:id",
    authMiddleware,
    requireRole("super_admin"),
    hospitalController.deleteHospital
);

/*
|--------------------------------------------------------------------------
| GET HOSPITAL BY ID (specific /:id/... routes ke baad)
|--------------------------------------------------------------------------
*/

router.get("/:id", hospitalController.getHospitalById);

module.exports = router;