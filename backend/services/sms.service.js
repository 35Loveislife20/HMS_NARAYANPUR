// make sure .env is loaded even if this file is imported before server.js calls dotenv
try {
    // eslint-disable-next-line global-require
    require("dotenv").config();
} catch (error) {
    /* dotenv not installed - ignore, process.env may already be filled */
}

const axios = require("axios");

/* API key from .env: removes spaces, quotes and a pasted "authorization=" prefix */
const getFast2SmsKey = () =>
    String(process.env.FAST2SMS_API_KEY || "")
        .trim()
        .replace(/^authorization\s*=\s*/i, "")
        .replace(/^["']+|["']+$/g, "")
        .trim();

/* Turns the raw Fast2SMS / network failure into a clear, actionable reason */
const explainSmsFailure = (rawMessage, status) => {
    const text = String(rawMessage || "").trim();
    const lower = text.toLowerCase();

    if (status === 401 || status === 412 || lower.includes("invalid authentication") || lower.includes("invalid api") || lower.includes("unauthorized")) {
        return `Fast2SMS rejected the API key. Copy the key again from Fast2SMS > Dev API and put it in .env as FAST2SMS_API_KEY, then restart the server. (${text})`;
    }

    if (lower.includes("balance") || lower.includes("recharge") || lower.includes("insufficient") || lower.includes("wallet") || lower.includes("transaction")) {
        return `Fast2SMS wallet problem - add balance / complete the account requirement in the Fast2SMS dashboard. (${text})`;
    }

    if (lower.includes("verification") || lower.includes("verify")) {
        return `Fast2SMS account verification is pending. Complete it in the Fast2SMS dashboard. (${text})`;
    }

    if (lower.includes("dnd")) {
        return `This number is on DND and the selected route cannot send to it. (${text})`;
    }

    return text || "Fast2SMS could not send the SMS";
};

/*
 * Fast2SMS accepts ONLY 10-digit Indian mobile numbers
 * (no 0, no +91, no spaces).
 *   08416882436    -> 8416882436
 *   +91 84168 82436 -> 8416882436
 *   918416882436   -> 8416882436
 */
const normalizeIndianPhone = (phone) => {
    let digits = String(phone || "").replace(/\D/g, "");

    if (digits.length === 12 && digits.startsWith("91")) {
        digits = digits.slice(2);
    }

    if (digits.length === 11 && digits.startsWith("0")) {
        digits = digits.slice(1);
    }

    return digits;
};

const sendSMS = async (phone, message) => {
    try {
        const numbers = normalizeIndianPhone(phone);

        if (!/^[6-9]\d{9}$/.test(numbers)) {
            return {
                success: false,
                error: `Invalid mobile number "${phone}". A valid 10-digit Indian mobile number is required.`,
            };
        }

        const apiKey = getFast2SmsKey();

        if (!apiKey) {
            return {
                success: false,
                error: "FAST2SMS_API_KEY is not configured in .env",
            };
        }

        const response = await axios.get(
            "https://www.fast2sms.com/dev/bulkV2",
            {
                params: {
                    authorization: apiKey,
                    message: message,
                    language: "english",
                    route: "q",
                    numbers,
                },
                headers: {
                    "cache-control": "no-cache",
                },
                timeout: 20000,
            }
        );

        console.log("SMS API answer:", JSON.stringify(response.data));

        // Fast2SMS can answer HTTP 200 with return:false
        if (response.data && response.data.return === false) {
            const reason = Array.isArray(response.data.message)
                ? response.data.message.join(", ")
                : response.data.message;

            console.error("SMS REJECTED by Fast2SMS:", JSON.stringify(response.data));

            return {
                success: false,
                error: explainSmsFailure(
                    reason || "Fast2SMS rejected the SMS",
                    response.data.status_code
                ),
                data: response.data,
            };
        }

        return { success: true, data: response.data };

    } catch (error) {
        const apiData = error?.response?.data;
        const status = error?.response?.status;

        console.error(
            "SMS Error:",
            status || error.code || "",
            apiData ? JSON.stringify(apiData) : error.message
        );

        // show the real Fast2SMS reason instead of "status code 400"
        const apiMessage = Array.isArray(apiData?.message)
            ? apiData.message.join(", ")
            : apiData?.message;

        // no answer from Fast2SMS at all (internet / firewall / DNS problem)
        if (!error?.response) {
            return {
                success: false,
                error: `Could not reach Fast2SMS (${error.code || error.message}). Check the server's internet connection / firewall.`,
            };
        }

        return {
            success: false,
            error: explainSmsFailure(apiMessage || error.message, status),
        };
    }
};

const sendPatientRegistrationSMS = async (patient) => {
    const message =
        `Welcome to HMS! Your registration is successful. ` +
        `Patient ID: ${patient.patient_code}. ` +
        `Name: ${patient.name}. ` +
        `Thank you for choosing our hospital.`;

    return await sendSMS(patient.phone, message);
};

module.exports = { sendSMS, sendPatientRegistrationSMS };