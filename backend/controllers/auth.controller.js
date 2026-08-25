const bcrypt = require("bcryptjs");
const {
    createUser,
    findUserByEmail
} = require("../models/user.model");

const generateToken = require("../utils/jwt");

// =====================================================
// REGISTER
// =====================================================

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            role
        } = req.body;

        // Required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password and role are required"
            });
        }

        // Valid roles
        const validRoles = [
            "patient",
            "doctor",
            "admin"
        ];

        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be patient, doctor or admin"
            });
        }

        // Check existing email
        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered",
                existing_user: {
                    id: existingUser.id,
                    name: existingUser.name,
                    email: existingUser.email,
                    role: existingUser.role
                }
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await createUser(
            name,
            email,
            hashedPassword,
            phone,
            role
        );

        const userId = result.insertId;

        // Generate JWT
        const token = generateToken({
            id: userId,
            email,
            role
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",

            token,

            user: {
                id: userId,
                name,
                email,
                phone: phone || null,
                role
            }
        });

    } catch (error) {

        // IMPORTANT: Actual error terminal + Postman में दिखेगा
        console.error("=================================");
        console.error("REGISTER ERROR");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("SQL State:", error.sqlState);
        console.error("=================================");

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
            code: error.code || null
        });
    }
};


// =====================================================
// LOGIN
// =====================================================

const login = async (req, res) => {
    try {

        const {
            email,
            password
        } = req.body;

        // Required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {

        // IMPORTANT: Actual error terminal + Postman में दिखेगा
        console.error("=================================");
        console.error("LOGIN ERROR");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("SQL State:", error.sqlState);
        console.error("=================================");

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
            code: error.code || null
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    register,
    login
};