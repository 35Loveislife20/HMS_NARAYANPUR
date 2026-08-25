const axios = require("axios");

const sendSMS = async (phone, message) => {
    try {
        const response = await axios.get(
            "https://www.fast2sms.com/dev/bulkV2",
            {
                params: {
                    authorization: process.env.FAST2SMS_API_KEY,
                    message: message,
                    language: "english",
                    route: "q",
                    numbers: phone,
                },
                headers: {
                    "cache-control": "no-cache",
                },
            }
        );

        console.log("SMS Sent:", response.data);
        return { success: true, data: response.data };

    } catch (error) {
        console.error("SMS Error:", error?.response?.data || error.message);
        return { success: false, error: error.message };
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