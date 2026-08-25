const express = require("express");

const router = express.Router();

const {
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment
} = require("../controllers/department.controller");

// GET all departments
router.get("/", getDepartments);

// GET single department
router.get("/:id", getDepartment);

// CREATE department
router.post("/", createDepartment);

// UPDATE department
router.put("/:id", updateDepartment);

// DELETE department
router.delete("/:id", deleteDepartment);

module.exports = router;