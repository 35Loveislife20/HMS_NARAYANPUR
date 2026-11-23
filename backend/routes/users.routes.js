const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");
const { tenantScope } = require("../middleware/tenant.middleware");

// Authentication required for every user-management endpoint
router.use(authMiddleware);

// -----------------------------------------------------
// SELF-SERVICE (any logged-in user)
// user.controller.changeProfileImage MUST check that
// req.params.id === req.user.id (unless super_admin).
// -----------------------------------------------------
router.patch(
    "/:id/profile-image",
    userController.changeProfileImage
);

// -----------------------------------------------------
// EVERYTHING BELOW: super_admin + hospital_admin only.
// Hospital users are limited to their own hospital
// (req.hospitalScope) - controller must enforce it.
// -----------------------------------------------------
router.use(requireRole("super_admin", "hospital_admin"));
router.use(tenantScope);

// Get all users within user's hospital scope
router.get("/", userController.getAllUsers);

// Get a specific user
router.get("/:id", userController.getUserById);

// Create user
router.post("/", userController.addUser);

// Update user
router.put("/:id", userController.editUser);

// Update user role
// (controller blocks any super_admin promotion/modification by hospital_admin)
router.patch("/:id/role", userController.changeUserRole);

// Update user status
router.patch("/:id/status", userController.changeUserStatus);

// Delete user
router.delete("/:id", userController.deleteUser);

module.exports = router;