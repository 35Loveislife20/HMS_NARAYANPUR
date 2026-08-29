require("dotenv").config();

const nodemailer = require("nodemailer");

// =====================================================
// HMS GMAIL CONFIGURATION
// =====================================================

const EMAIL_USER =
    process.env.EMAIL_USER;

const EMAIL_PASS =
    process.env.EMAIL_PASS;


// =====================================================
// CREATE TRANSPORTER
// =====================================================

const transporter =
    nodemailer.createTransport({

        service: "gmail",

        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },

    });


// =====================================================
// VERIFY EMAIL CONNECTION
// =====================================================

const verifyEmailConnection =
    async () => {

        try {

            if (!EMAIL_USER) {

                throw new Error(
                    "EMAIL_USER is missing in .env"
                );

            }

            if (!EMAIL_PASS) {

                throw new Error(
                    "EMAIL_PASS is missing in .env"
                );

            }


            await transporter.verify();


            console.log(
                "========================================"
            );

            console.log(
                "✅ HMS Email Service Connected"
            );

            console.log(
                "📧 Email:",
                EMAIL_USER
            );

            console.log(
                "========================================"
            );


            return true;

        } catch (error) {

            console.error(
                "========================================"
            );

            console.error(
                "❌ HMS Email Service Connection Failed"
            );

            console.error(
                "Message:",
                error.message
            );

            console.error(
                "========================================"
            );


            return false;
        }
    };


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    transporter,

    verifyEmailConnection,

};