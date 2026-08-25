const Department = require("../models/department.model");

// GET /api/departments
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.getAllDepartments();

        res.status(200).json({
            success: true,
            data: departments
        });
    } catch (error) {
        console.error("Get departments error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch departments"
        });
    }
};

// GET /api/departments/:id
const getDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await Department.getDepartmentById(id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.status(200).json({
            success: true,
            data: department
        });
    } catch (error) {
        console.error("Get department error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch department"
        });
    }
};

// POST /api/departments
const createDepartment = async (req, res) => {
    try {
        const { name, description, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Department name is required"
            });
        }

        const departmentId = await Department.createDepartment(
            name.trim(),
            description,
            status || "active"
        );

        const department = await Department.getDepartmentById(departmentId);

        res.status(201).json({
            success: true,
            message: "Department created successfully",
            data: department
        });
    } catch (error) {
        console.error("Create department error:", error);

        // Duplicate department name
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Department already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create department"
        });
    }
};

// PUT /api/departments/:id
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Department name is required"
            });
        }

        const existingDepartment = await Department.getDepartmentById(id);

        if (!existingDepartment) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        await Department.updateDepartment(
            id,
            name.trim(),
            description,
            status || "active"
        );

        const department = await Department.getDepartmentById(id);

        res.status(200).json({
            success: true,
            message: "Department updated successfully",
            data: department
        });
    } catch (error) {
        console.error("Update department error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Department name already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update department"
        });
    }
};

// DELETE /api/departments/:id
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const existingDepartment = await Department.getDepartmentById(id);

        if (!existingDepartment) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        await Department.deleteDepartment(id);

        res.status(200).json({
            success: true,
            message: "Department deactivated successfully"
        });
    } catch (error) {
        console.error("Delete department error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete department"
        });
    }
};

module.exports = {
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment
};