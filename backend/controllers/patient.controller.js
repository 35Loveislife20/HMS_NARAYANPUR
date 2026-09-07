const {
    getAllPatients,
    searchPatientsModel,
    getPatientByIdModel,
    createPatientModel,
    updatePatientModel,
    deletePatientModel,
} = require("../models/patient.model");


/*
=====================================================
GET ALL PATIENTS
GET /api/patients
=====================================================
*/

const getPatients = async (req, res) => {
    try {
        const patients = await getAllPatients();

        return res.status(200).json({
            success: true,
            count: patients.length,
            patients,
        });
    } catch (error) {
        console.error(
            "GET PATIENTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load patients",
            error: error.message,
        });
    }
};


/*
=====================================================
PUBLIC SEARCH PATIENTS
GET /api/patients/public/search?query=...
=====================================================

NO LOGIN REQUIRED

Search by:
- Patient ID
- Patient Code
- Name
- Phone
- Email
=====================================================
*/

const searchPatients = async (req, res) => {
    try {
        const query = String(
            req.query.query || ""
        ).trim();

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required",
                patients: [],
            });
        }

        if (query.length < 2) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter at least 2 characters",
                patients: [],
            });
        }

        const patients =
            await searchPatientsModel(query);

        return res.status(200).json({
            success: true,
            count: patients.length,
            patients,
        });
    } catch (error) {
        console.error(
            "PUBLIC PATIENT SEARCH ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to search patients",
            error: error.message,
            patients: [],
        });
    }
};


/*
=====================================================
PUBLIC PATIENT REGISTRATION
POST /api/patients/register
=====================================================

NO LOGIN REQUIRED

Used by:
- Public Patient Registration
- New Patient Services
=====================================================
*/

const registerPatient = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            gender,
            date_of_birth,
            address,
            blood_group,
        } = req.body;


        /*
        ---------------------------------------------
        REQUIRED FIELD VALIDATION
        ---------------------------------------------
        */

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Patient name is required",
            });
        }

        if (!phone || !String(phone).trim()) {
            return res.status(400).json({
                success: false,
                message: "Mobile number is required",
            });
        }

        if (!gender) {
            return res.status(400).json({
                success: false,
                message: "Gender is required",
            });
        }

        if (!date_of_birth) {
            return res.status(400).json({
                success: false,
                message: "Date of birth is required",
            });
        }

        if (!address || !String(address).trim()) {
            return res.status(400).json({
                success: false,
                message: "Address is required",
            });
        }


        /*
        ---------------------------------------------
        PHONE VALIDATION
        ---------------------------------------------
        */

        const cleanPhone =
            String(phone).trim();

        if (!/^[0-9]{10}$/.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message:
                    "Mobile number must contain exactly 10 digits",
            });
        }


        /*
        ---------------------------------------------
        GENDER VALIDATION
        ---------------------------------------------
        */

        const validGender = [
            "male",
            "female",
            "other",
        ];

        if (!validGender.includes(gender)) {
            return res.status(400).json({
                success: false,
                message:
                    "Gender must be male, female or other",
            });
        }


        /*
        ---------------------------------------------
        EMAIL VALIDATION
        ---------------------------------------------
        */

        const cleanEmail =
            email &&
            String(email).trim()
                ? String(email).trim()
                : null;

        if (cleanEmail) {
            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(cleanEmail)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter a valid email address",
                });
            }
        }


        /*
        ---------------------------------------------
        CREATE PATIENT
        ---------------------------------------------
        */

        const result =
            await createPatientModel({
                patient_code: null,
                name: String(name).trim(),
                gender,
                date_of_birth,
                phone: cleanPhone,
                email: cleanEmail,
                address: String(address).trim(),
                blood_group:
                    blood_group || null,
            });


        /*
        ---------------------------------------------
        GET CREATED PATIENT
        ---------------------------------------------
        */

        const patient =
            await getPatientByIdModel(
                result.insertId
            );


        return res.status(201).json({
            success: true,
            message:
                "Patient registered successfully",
            patient,
        });


    } catch (error) {

        console.error(
            "PUBLIC PATIENT REGISTRATION ERROR:",
            error
        );


        /*
        ---------------------------------------------
        DUPLICATE ENTRY
        ---------------------------------------------
        */

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Patient already exists or patient code already exists",
            });
        }


        return res.status(500).json({
            success: false,
            message:
                "Unable to register patient",
            error: error.message,
        });
    }
};


/*
=====================================================
GET PATIENT BY ID
GET /api/patients/:id
=====================================================
*/

const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;

        const patient =
            await getPatientByIdModel(id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        return res.status(200).json({
            success: true,
            patient,
        });
    } catch (error) {
        console.error(
            "GET PATIENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load patient",
            error: error.message,
        });
    }
};


/*
=====================================================
CREATE PATIENT
POST /api/patients
=====================================================

AUTHENTICATION REQUIRED
=====================================================
*/

const createPatient = async (req, res) => {
    try {
        const {
            patient_code,
            name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            blood_group,
        } = req.body;


        if (!name || !gender) {
            return res.status(400).json({
                success: false,
                message:
                    "Name and gender are required",
            });
        }


        const validGender = [
            "male",
            "female",
            "other",
        ];


        if (!validGender.includes(gender)) {
            return res.status(400).json({
                success: false,
                message:
                    "Gender must be male, female or other",
            });
        }


        const result =
            await createPatientModel({
                patient_code,
                name,
                gender,
                date_of_birth,
                phone,
                email,
                address,
                blood_group,
            });


        const patient =
            await getPatientByIdModel(
                result.insertId
            );


        return res.status(201).json({
            success: true,
            message:
                "Patient created successfully",
            patient,
        });

    } catch (error) {
        console.error(
            "CREATE PATIENT ERROR:",
            error
        );


        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Patient code already exists",
            });
        }


        return res.status(500).json({
            success: false,
            message:
                "Unable to create patient",
            error: error.message,
        });
    }
};


/*
=====================================================
UPDATE PATIENT
PUT /api/patients/:id
=====================================================
*/

const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;


        const existingPatient =
            await getPatientByIdModel(id);


        if (!existingPatient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }


        const {
            patient_code,
            name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            blood_group,
        } = req.body;


        if (!name || !gender) {
            return res.status(400).json({
                success: false,
                message:
                    "Name and gender are required",
            });
        }


        const validGender = [
            "male",
            "female",
            "other",
        ];


        if (!validGender.includes(gender)) {
            return res.status(400).json({
                success: false,
                message:
                    "Gender must be male, female or other",
            });
        }


        await updatePatientModel(
            id,
            {
                patient_code,
                name,
                gender,
                date_of_birth,
                phone,
                email,
                address,
                blood_group,
            }
        );


        const patient =
            await getPatientByIdModel(id);


        return res.status(200).json({
            success: true,
            message:
                "Patient updated successfully",
            patient,
        });

    } catch (error) {
        console.error(
            "UPDATE PATIENT ERROR:",
            error
        );


        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Patient code already exists",
            });
        }


        return res.status(500).json({
            success: false,
            message:
                "Unable to update patient",
            error: error.message,
        });
    }
};


/*
=====================================================
DELETE PATIENT
DELETE /api/patients/:id
=====================================================
*/

const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;


        const existingPatient =
            await getPatientByIdModel(id);


        if (!existingPatient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }


        await deletePatientModel(id);


        return res.status(200).json({
            success: true,
            message:
                "Patient deleted successfully",
        });

    } catch (error) {
        console.error(
            "DELETE PATIENT ERROR:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Unable to delete patient",
            error: error.message,
        });
    }
};


/*
=====================================================
EXPORTS
=====================================================
*/

module.exports = {
    getPatients,
    searchPatients,
    registerPatient,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
};