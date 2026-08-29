const {
    getAllPatients,
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
        console.error("GET PATIENTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load patients",
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

        const patient = await getPatientByIdModel(id);

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
        console.error("GET PATIENT ERROR:", error);

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
                message: "Name and gender are required",
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
                message: "Gender must be male, female or other",
            });
        }


        const result = await createPatientModel({
            patient_code,
            name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            blood_group,
        });


        const patient = await getPatientByIdModel(
            result.insertId
        );


        return res.status(201).json({
            success: true,
            message: "Patient created successfully",
            patient,
        });

    } catch (error) {
        console.error("CREATE PATIENT ERROR:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Patient code already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create patient",
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
                message: "Name and gender are required",
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
                message: "Gender must be male, female or other",
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
            message: "Patient updated successfully",
            patient,
        });

    } catch (error) {
        console.error("UPDATE PATIENT ERROR:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Patient code already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update patient",
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
            message: "Patient deleted successfully",
        });

    } catch (error) {
        console.error("DELETE PATIENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete patient",
            error: error.message,
        });
    }
};


module.exports = {
    getPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
};