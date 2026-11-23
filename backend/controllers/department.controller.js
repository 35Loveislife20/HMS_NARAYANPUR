const Department = require("../models/department.model");


/* =========================================================
   CONSTANTS
========================================================= */

const SUPER_ADMIN = "super_admin";


/* =========================================================
   HELPERS
========================================================= */

const isDuplicateError = (error) => {
    return (
        error?.code === "ER_DUP_ENTRY" ||
        error?.code === "ER_DUPLICATE_KEY"
    );
};


const isValidationError = (error) => {
    return (
        error?.message &&
        (
            error.message.includes("required") ||
            error.message.includes("must be") ||
            error.message.includes("Invalid") ||
            error.message.includes("cannot exceed")
        )
    );
};


/* =========================================================
   HOSPITAL SCOPE

   super_admin
   => null = global access

   normal hospital user
   => JWT hospital_id
========================================================= */

const getHospitalScope = (req) => {
    if (
        req.user?.role ===
        SUPER_ADMIN
    ) {
        return null;
    }

    const hospitalId =
        Number(
            req.user?.hospital_id
        );

    if (
        !Number.isInteger(hospitalId) ||
        hospitalId <= 0
    ) {
        return null;
    }

    return hospitalId;
};


/* =========================================================
   REQUIRE HOSPITAL SCOPE
========================================================= */

const requireHospitalScope = (
    req,
    res
) => {
    if (
        req.user?.role ===
        SUPER_ADMIN
    ) {
        return true;
    }

    const hospitalId =
        getHospitalScope(req);

    if (!hospitalId) {
        res.status(403).json({
            success: false,
            message:
                "Hospital assignment is required.",
        });

        return false;
    }

    return true;
};


/* =========================================================
   CREATE HOSPITAL SCOPE

   super_admin:
   hospital_id must come from request body

   normal user:
   hospital_id ALWAYS comes from JWT
========================================================= */

const getCreateHospitalId = (req) => {
    if (
        req.user?.role ===
        SUPER_ADMIN
    ) {
        return (
            req.body?.hospital_id ??
            req.body?.hospitalId ??
            null
        );
    }

    return req.user?.hospital_id;
};


/* =========================================================
   GET ALL DEPARTMENTS
   GET /api/departments
========================================================= */

const getDepartments = async (
    req,
    res
) => {
    try {
        if (
            !requireHospitalScope(
                req,
                res
            )
        ) {
            return;
        }

        const hospitalId =
            getHospitalScope(req);

        const departments =
            await Department.getAllDepartments(
                hospitalId
            );

        return res.status(200).json({
            success: true,
            data: departments,
        });
    } catch (error) {
        console.error(
            "Get departments error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch departments",
        });
    }
};


/* =========================================================
   GET DEPARTMENT BY ID
   GET /api/departments/:id
========================================================= */

const getDepartment = async (
    req,
    res
) => {
    try {
        if (
            !requireHospitalScope(
                req,
                res
            )
        ) {
            return;
        }

        const { id } =
            req.params;

        const hospitalId =
            getHospitalScope(req);

        const department =
            await Department.getDepartmentById(
                id,
                hospitalId
            );

        if (!department) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: department,
        });
    } catch (error) {
        console.error(
            "Get department error:",
            error
        );

        if (
            isValidationError(error)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch department",
        });
    }
};


/* =========================================================
   CREATE DEPARTMENT
   POST /api/departments
========================================================= */

const createDepartment = async (
    req,
    res
) => {
    try {
        const {
            name,
            description,
            status,
        } = req.body || {};

        if (
            typeof name !== "string" ||
            !name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Department name is required",
            });
        }

        const trimmedName =
            name.trim();

        if (
            trimmedName.length > 150
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Department name cannot exceed 150 characters",
            });
        }


        /* -------------------------------------------------
           HOSPITAL SCOPE
        ------------------------------------------------- */

        const hospitalId =
            getCreateHospitalId(req);

        if (
            hospitalId === null ||
            hospitalId === undefined ||
            hospitalId === ""
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Hospital ID is required",
            });
        }


        /* -------------------------------------------------
           CREATE
        ------------------------------------------------- */

        const departmentId =
            await Department.createDepartment(
                trimmedName,
                description,
                status || "active",
                hospitalId
            );


        /* -------------------------------------------------
           FETCH CREATED DEPARTMENT
        ------------------------------------------------- */

        const department =
            await Department.getDepartmentById(
                departmentId,
                req.user?.role ===
                    SUPER_ADMIN
                    ? null
                    : hospitalId
            );

        return res.status(201).json({
            success: true,
            message:
                "Department created successfully",
            data: department,
        });
    } catch (error) {
        console.error(
            "Create department error:",
            error
        );

        if (
            isDuplicateError(error)
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Department already exists",
            });
        }

        if (
            isValidationError(error)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to create department",
        });
    }
};


/* =========================================================
   UPDATE DEPARTMENT
   PUT /api/departments/:id
========================================================= */

const updateDepartment = async (
    req,
    res
) => {
    try {
        if (
            !requireHospitalScope(
                req,
                res
            )
        ) {
            return;
        }

        const { id } =
            req.params;

        const {
            name,
            description,
            status,
        } = req.body || {};

        if (
            typeof name !== "string" ||
            !name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Department name is required",
            });
        }

        const trimmedName =
            name.trim();

        if (
            trimmedName.length > 150
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Department name cannot exceed 150 characters",
            });
        }


        /* -------------------------------------------------
           HOSPITAL SCOPE
        ------------------------------------------------- */

        const hospitalId =
            getHospitalScope(req);


        /* -------------------------------------------------
           FETCH ONLY WITHIN SCOPE
        ------------------------------------------------- */

        const existingDepartment =
            await Department.getDepartmentById(
                id,
                hospitalId
            );

        if (!existingDepartment) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found",
            });
        }


        /* -------------------------------------------------
           UPDATE ONLY WITHIN SCOPE
        ------------------------------------------------- */

        const affectedRows =
            await Department.updateDepartment(
                id,
                trimmedName,
                description,
                status || "active",
                hospitalId
            );

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message:
                    "Department could not be updated",
            });
        }


        /* -------------------------------------------------
           FETCH UPDATED DEPARTMENT
        ------------------------------------------------- */

        const department =
            await Department.getDepartmentById(
                id,
                hospitalId
            );

        return res.status(200).json({
            success: true,
            message:
                "Department updated successfully",
            data: department,
        });
    } catch (error) {
        console.error(
            "Update department error:",
            error
        );

        if (
            isDuplicateError(error)
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Department name already exists",
            });
        }

        if (
            isValidationError(error)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to update department",
        });
    }
};


/* =========================================================
   DELETE / DEACTIVATE DEPARTMENT
   DELETE /api/departments/:id

   Soft delete:
   status => inactive
========================================================= */

const deleteDepartment = async (
    req,
    res
) => {
    try {
        if (
            !requireHospitalScope(
                req,
                res
            )
        ) {
            return;
        }

        const { id } =
            req.params;

        const hospitalId =
            getHospitalScope(req);


        /* -------------------------------------------------
           FETCH ONLY WITHIN SCOPE
        ------------------------------------------------- */

        const existingDepartment =
            await Department.getDepartmentById(
                id,
                hospitalId
            );

        if (!existingDepartment) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found",
            });
        }


        /* -------------------------------------------------
           ALREADY INACTIVE
        ------------------------------------------------- */

        if (
            existingDepartment.status ===
            "inactive"
        ) {
            return res.status(200).json({
                success: true,
                message:
                    "Department is already inactive",
                data:
                    existingDepartment,
            });
        }


        /* -------------------------------------------------
           DELETE ONLY WITHIN SCOPE
        ------------------------------------------------- */

        const affectedRows =
            await Department.deleteDepartment(
                id,
                hospitalId
            );

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message:
                    "Department could not be deactivated",
            });
        }


        /* -------------------------------------------------
           FETCH UPDATED DEPARTMENT
        ------------------------------------------------- */

        const department =
            await Department.getDepartmentById(
                id,
                hospitalId
            );

        return res.status(200).json({
            success: true,
            message:
                "Department deactivated successfully",
            data: department,
        });
    } catch (error) {
        console.error(
            "Delete department error:",
            error
        );

        if (
            isValidationError(error)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete department",
        });
    }
};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
};