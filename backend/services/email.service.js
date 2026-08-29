const nodemailer = require("nodemailer");

// =====================================================
// HMS EMAIL CONFIGURATION
// =====================================================

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// =====================================================
// VALIDATE ENV
// =====================================================

if (!EMAIL_USER) {
    console.warn(
        "⚠️ EMAIL_USER is not configured in .env"
    );
}

if (!EMAIL_PASS) {
    console.warn(
        "⚠️ EMAIL_PASS is not configured in .env"
    );
}

// =====================================================
// CREATE TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },

});

// =====================================================
// VERIFY EMAIL CONNECTION
// =====================================================

const verifyEmailConnection = async () => {

    try {

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
// SEND PASSWORD RESET EMAIL
// =====================================================

const sendPasswordResetEmail = async (
    email,
    resetToken,
    userName
) => {

    try {

        const frontendUrl =
            process.env.FRONTEND_URL ||
            "http://localhost:5173";

        const resetUrl =
            `${frontendUrl}/reset-password?token=${encodeURIComponent(
                resetToken
            )}`;

        const mailOptions = {

            from:
                `"HMS Hospital" <${EMAIL_USER}>`,

            to:
                email,

            subject:
                "HMS Hospital - Password Reset Request",

            text:
                `
Hello ${userName || "User"},

We received a request to reset your HMS Hospital account password.

Please use the following link to reset your password:

${resetUrl}

This password reset link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
HMS Hospital
                `.trim(),

            html:
                `
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <title>
        HMS Password Reset
    </title>

</head>

<body
    style="
        margin:0;
        padding:0;
        background:#f4f7f6;
        font-family:Arial,Helvetica,sans-serif;
    "
>

    <div
        style="
            max-width:600px;
            margin:40px auto;
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
            box-shadow:0 5px 25px rgba(0,0,0,0.08);
        "
    >

        <div
            style="
                background:#0f766e;
                padding:28px;
                text-align:center;
                color:#ffffff;
            "
        >

            <h1
                style="
                    margin:0;
                    font-size:26px;
                "
            >
                HMS Hospital
            </h1>

            <p
                style="
                    margin:8px 0 0;
                    font-size:14px;
                    opacity:0.9;
                "
            >
                Secure Password Recovery
            </p>

        </div>


        <div
            style="
                padding:35px;
                color:#333333;
            "
        >

            <h2
                style="
                    margin-top:0;
                    color:#222222;
                "
            >
                Password Reset Request
            </h2>

            <p>
                Hello ${userName || "User"},
            </p>

            <p>
                We received a request to reset your
                HMS Hospital account password.
            </p>

            <p>
                Click the button below to create
                a new password.
            </p>


            <div
                style="
                    text-align:center;
                    margin:30px 0;
                "
            >

                <a
                    href="${resetUrl}"
                    style="
                        display:inline-block;
                        padding:14px 28px;
                        background:#0f766e;
                        color:#ffffff;
                        text-decoration:none;
                        border-radius:8px;
                        font-weight:bold;
                    "
                >
                    Reset Password
                </a>

            </div>


            <p
                style="
                    font-size:13px;
                    color:#666666;
                "
            >
                This password reset link will expire
                in <strong>15 minutes</strong>.
            </p>


            <p
                style="
                    font-size:13px;
                    color:#666666;
                "
            >
                If you did not request this password
                reset, you can safely ignore this email.
            </p>

        </div>


        <div
            style="
                padding:18px;
                background:#f8faf9;
                text-align:center;
                color:#777777;
                font-size:12px;
            "
        >

            © ${new Date().getFullYear()}
            HMS Hospital.
            All rights reserved.

        </div>

    </div>

</body>

</html>
                `,

        };


        const info =
            await transporter.sendMail(
                mailOptions
            );


        console.log(
            "========================================"
        );

        console.log(
            "✅ PASSWORD RESET EMAIL SENT"
        );

        console.log(
            "📧 To:",
            email
        );

        console.log(
            "📨 Message ID:",
            info.messageId
        );

        console.log(
            "========================================"
        );


        return {

            success: true,

            messageId:
                info.messageId,

        };

    } catch (error) {

        console.error(
            "========================================"
        );

        console.error(
            "❌ PASSWORD RESET EMAIL ERROR"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "========================================"
        );


        throw error;
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    transporter,

    verifyEmailConnection,

    sendPasswordResetEmail,

};