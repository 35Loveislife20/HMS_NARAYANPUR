const express = require("express");

const {
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} = require("../controllers/department.controller");

const authMiddleware = require("../middleware/auth.middleware");
const {
    requirePermission,
} = require("../middleware/role.middleware");

const router = express.Router();

/* =========================================================
   AUTHENTICATION
========================================================= */

router.use(authMiddleware);

/* =========================================================
   DEPARTMENT PERMISSION
========================================================= */

router.use(requirePermission("departments"));

/* =========================================================
   GET ALL DEPARTMENTS
   GET /api/departments
========================================================= */

router.get(
    "/",
    getDepartments
);


/* =========================================================
   GET DEPARTMENT BY ID
   GET /api/departments/:id
========================================================= */

router.get(
    "/:id",
    getDepartment
);


/* =========================================================
   CREATE DEPARTMENT
   POST /api/departments
========================================================= */

router.post(
    "/",
    createDepartment
);


/* =========================================================
   UPDATE DEPARTMENT
   PUT /api/departments/:id
========================================================= */

router.put(
    "/:id",
    updateDepartment
);


/* =========================================================
   DELETE / DEACTIVATE DEPARTMENT
   DELETE /api/departments/:id
========================================================= */

router.delete(
    "/:id",
    deleteDepartment
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;