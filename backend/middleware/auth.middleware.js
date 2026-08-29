const jwt = require("jsonwebtoken");


/*
=====================================================
AUTHENTICATION MIDDLEWARE
=====================================================
*/

const authMiddleware = (
    req,
    res,
    next
) => {

    try {

        const authHeader =
            req.headers.authorization;


        /*
        ================================
        CHECK HEADER
        ================================
        */

        if (
            !authHeader ||
            !authHeader.startsWith(
                "Bearer "
            )
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Authorization token required",

            });
        }


        /*
        ================================
        GET TOKEN
        ================================
        */

        const token =
            authHeader.split(" ")[1];


        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "Authorization token required",

            });
        }


        /*
        ================================
        VERIFY TOKEN
        ================================
        */

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        /*
        ================================
        ATTACH USER
        ================================
        */

        req.user = decoded;


        /*
        ================================
        NEXT
        ================================
        */

        next();

    } catch (error) {

        console.error(
            "AUTH MIDDLEWARE ERROR:",
            error.message
        );


        if (
            error.name ===
            "TokenExpiredError"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Authorization token expired",

            });
        }


        return res.status(401).json({

            success: false,

            message:
                "Invalid authorization token",

        });
    }
};


module.exports =
    authMiddleware;