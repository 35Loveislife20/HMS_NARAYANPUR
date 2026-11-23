const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token missing"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        /*
         * JWT structure:
         * {
         *   id,
         *   email,
         *   role,
         *   hospital_id
         * }
         */

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            hospital_id:
                decoded.hospital_id !== undefined
                    ? decoded.hospital_id
                    : null
        };

        next();

    } catch (error) {
        console.error("Auth middleware error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        });
    }
};

module.exports = authMiddleware;