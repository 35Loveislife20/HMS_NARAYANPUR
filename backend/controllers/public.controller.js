const {
    getAllDoctors,
} = require("../models/doctor.model");

const {
    findAllHospitals,
} = require("../models/hospital.model");


/*
|--------------------------------------------------------------------------
| PUBLIC DOCTORS
|--------------------------------------------------------------------------
| Homepage aur patient booking ke liye all hospitals ke doctors.
|
| Important:
| - Existing /api/doctors secured route ko touch nahi karta.
| - Phone aur email private fields return nahi honge.
| - Consultation fee public hai taaki patient booking se pehle
|   fee dekh sake.
| - Doctor ke saath uska actual hospital bhi attach hoga.
|--------------------------------------------------------------------------
*/

const getPublicDoctors = async (req, res) => {
    try {
        const [doctors, hospitals] = await Promise.all([
            getAllDoctors(null),
            findAllHospitals(),
        ]);

        const hospitalMap = new Map();

        hospitals.forEach((hospital) => {
            hospitalMap.set(
                Number(hospital.id),
                hospital
            );
        });

        const publicDoctors = doctors
            .map((doctor) => {
                const hospital =
                    hospitalMap.get(
                        Number(doctor.hospital_id)
                    );

                /*
                 * Doctor ka hospital record nahi mila
                 * to homepage par us doctor ko nahi dikhayenge.
                 */
                if (!hospital) {
                    return null;
                }

                return {
                    id: Number(doctor.id),

                    doctor_code:
                        doctor.doctor_code || null,

                    name:
                        doctor.name || null,

                    photo:
                        doctor.photo || null,

                    specialization:
                        doctor.specialization || null,

                    qualification:
                        doctor.qualification || null,

                    experience_years:
                        doctor.experience_years !== null &&
                        doctor.experience_years !== undefined
                            ? Number(
                                doctor.experience_years
                            )
                            : null,

                    consultation_fee:
                        doctor.consultation_fee !== null &&
                        doctor.consultation_fee !== undefined
                            ? Number(
                                doctor.consultation_fee
                            )
                            : null,

                    hospital: {
                        id: Number(hospital.id),

                        name:
                            hospital.name || null,

                        address:
                            hospital.address || null,

                        city:
                            hospital.city || null,

                        location:
                            hospital.location || null,

                        image_url:
                            hospital.image_url || null,

                        logo_url:
                            hospital.logo_url || null,
                    },
                };
            })
            .filter(Boolean);

        return res.status(200).json({
            success: true,
            count: publicDoctors.length,
            data: publicDoctors,
            doctors: publicDoctors,
        });

    } catch (error) {
        console.error(
            "========================================"
        );

        console.error(
            "PUBLIC DOCTORS API ERROR"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Stack:",
            error.stack
        );

        console.error(
            "========================================"
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load public doctors.",
        });
    }
};


module.exports = {
    getPublicDoctors,
};