import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaUserInjured,
  FaUser,
  FaVenusMars,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaTint,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSyncAlt,
  FaIdCard,
  FaArrowRight,
} from "react-icons/fa";

import PrintableReceipt from "./PrintableReceipt";

import "./PatientRegistration.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const EMPTY_FORM = {
  name: "",
  gender: "",
  date_of_birth: "",
  phone: "",
  email: "",
  blood_group: "",
  address: "",
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

function PatientRegistration() {

  const navigate = useNavigate();
  const location = useLocation();


  /* =======================================================
     HOSPITAL
  ======================================================= */

  const routeHospital =
    location.state?.hospital || null;


  const getHospitalId = (hospital) =>
    hospital?.id ??
    hospital?.hospital_id ??
    hospital?.hospitalId ??
    null;


  const patientHospitalId =
    getHospitalId(routeHospital) ??
    localStorage.getItem(
      "hms_patient_hospital_id"
    ) ??
    null;


  const patientHospitalName =
    routeHospital?.name ||
    routeHospital?.hospital_name ||
    routeHospital?.hospitalName ||
    localStorage.getItem(
      "hms_patient_hospital_name"
    ) ||
    "Hospital Management System";


  /* Header ki neechi line me hospital ka address.
     "unavailable" / sirf "India" jaise placeholder address nahi dikhate. */
  const cleanAddress = (value) => {
    const text =
      typeof value === "string"
        ? value.trim()
        : "";

    if (
      !text ||
      /unavailable/i.test(text) ||
      text.toLowerCase() === "india"
    ) {
      return "";
    }

    return text;
  };

  const patientHospitalAddress =
    cleanAddress(routeHospital?.address) ||
    cleanAddress(routeHospital?.location) ||
    cleanAddress(routeHospital?.city) ||
    cleanAddress(
      localStorage.getItem(
        "hms_patient_hospital_address"
      )
    );

  /* Reload par bhi address dikhe, isliye yaad rakho */
  useEffect(() => {
    if (patientHospitalAddress) {
      localStorage.setItem(
        "hms_patient_hospital_address",
        patientHospitalAddress
      );
    }
  }, [patientHospitalAddress]);


  /* =======================================================
     STATE
  ======================================================= */

  const [formData, setFormData] =
    useState({ ...EMPTY_FORM });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const [createdPatient, setCreatedPatient] =
    useState(null);

  const [copied, setCopied] =
    useState(false);


  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setError("");

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm = () => {

    if (!formData.name.trim()) {
      return "Full name is required.";
    }

    if (!formData.gender) {
      return "Please select gender.";
    }

    if (!formData.phone.trim()) {
      return "Phone number is required.";
    }

    if (
      !/^[0-9]{10}$/.test(
        formData.phone.trim()
      )
    ) {
      return "Please enter a valid 10-digit phone number.";
    }

    if (!formData.date_of_birth) {
      return "Please select date of birth.";
    }

    if (!formData.address.trim()) {
      return "Please enter address.";
    }

    if (formData.email.trim()) {

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          formData.email.trim()
        )
      ) {
        return "Please enter a valid email address.";
      }
    }

    return "";
  };


  /* =======================================================
     PATIENT ID
  ======================================================= */

  const getPatientIdFromObject = (patient) =>
    patient?.id ??
    patient?.patient_id ??
    patient?.patientId ??
    null;


  const getPatientId = () =>
    createdPatient?.id ??
    createdPatient?.patient_id ??
    createdPatient?.patientId ??
    null;


  const getPatientCode = () => {

    return (
      createdPatient?.patient_code ||
      createdPatient?.patientCode ||
      (
        getPatientId()
          ? `PAT-${getPatientId()}`
          : "Generated after registration"
      )
    );
  };


  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setSuccess(false);


    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }


    try {

      setSaving(true);


      if (
        !patientHospitalId ||
        !Number.isInteger(
          Number(patientHospitalId)
        ) ||
        Number(patientHospitalId) <= 0
      ) {
        throw new Error(
          "Hospital selection is missing. Please return and select a hospital first."
        );
      }


      localStorage.setItem(
        "hms_patient_hospital_id",
        String(Number(patientHospitalId))
      );


      localStorage.setItem(
        "hms_patient_hospital_name",
        patientHospitalName
      );


      const response =
        await fetch(
          `${API_URL}/patients/register`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name:
                formData.name.trim(),

              gender:
                formData.gender,

              date_of_birth:
                formData.date_of_birth ||
                null,

              phone:
                formData.phone.trim(),

              email:
                formData.email.trim() ||
                null,

              blood_group:
                formData.blood_group ||
                null,

              address:
                formData.address.trim() ||
                null,

              hospital_id:
                Number(patientHospitalId),
            }),
          }
        );


      let result = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }


      if (!response.ok) {
        throw new Error(
          result.message ||
          "Unable to register patient."
        );
      }


      if (result.success === false) {
        throw new Error(
          result.message ||
          "Unable to register patient."
        );
      }


      const patient =
        result.patient ||
        result.data?.patient ||
        result.data ||
        null;


      if (!patient) {
        throw new Error(
          "Patient was registered, but patient details were not returned by the server."
        );
      }


      const finalPatient = {
        ...patient,

        hospital_id:
          patient?.hospital_id ??
          Number(patientHospitalId),
      };


      setCreatedPatient(
        finalPatient
      );


      try {

        sessionStorage.setItem(
          "newlyRegisteredPatient",
          JSON.stringify(finalPatient)
        );


        const patientId =
          getPatientIdFromObject(
            finalPatient
          );


        if (patientId !== null) {

          sessionStorage.setItem(
            "newlyRegisteredPatientId",
            String(patientId)
          );
        }

      } catch (storageError) {

        console.warn(
          "Session storage error:",
          storageError
        );
      }


      setSuccess(true);


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    } catch (err) {

      console.error(
        "Patient Registration Error:",
        err
      );

      setError(
        err.message ||
        "Unable to connect to HMS server."
      );

    } finally {

      setSaving(false);
    }
  };


  /* =======================================================
     COPY CODE
  ======================================================= */

  const handleCopyCode = async () => {

    try {

      await navigator.clipboard.writeText(
        String(getPatientCode())
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch {

      setCopied(false);
    }
  };


  /* =======================================================
     CONTINUE
  ======================================================= */

  const handleContinue = () => {

    const patientId =
      getPatientId();


    if (!patientId) {

      setError(
        "Patient ID is missing. Please contact HMS support."
      );

      return;
    }


    navigate(
      `/new-patient-appointment?patient_id=${encodeURIComponent(
        patientId
      )}`,
      {
        state: {

          hospital_id:
            Number(patientHospitalId),

          hospital:
            routeHospital || {
              id:
                Number(patientHospitalId),

              hospital_id:
                Number(patientHospitalId),

              name:
                patientHospitalName,
            },

          patient:
            createdPatient,
        },
      }
    );
  };


  /* =======================================================
     REGISTER ANOTHER
  ======================================================= */

  const handleRegisterAnother = () => {

    setFormData({
      ...EMPTY_FORM,
    });

    setCreatedPatient(null);
    setSuccess(false);
    setError("");
    setCopied(false);


    try {

      sessionStorage.removeItem(
        "newlyRegisteredPatient"
      );

      sessionStorage.removeItem(
        "newlyRegisteredPatientId"
      );

    } catch (storageError) {

      console.warn(
        "Session storage error:",
        storageError
      );
    }


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  /* =======================================================
     BACK
  ======================================================= */

  const handleBackHome = () => {

    if (saving) {
      return;
    }

    /* Patients page se aaye the to wahin wapas, warna main page */
    navigate(location.state?.from || "/");
  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <main className="patient-registration-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="patient-registration-header">

        <button
          type="button"
          className="patient-registration-back"
          onClick={handleBackHome}
          disabled={saving}
        >
          <FaArrowLeft />

          <span>
            Back to Home
          </span>
        </button>


        {/* ONLY HOSPITAL NAME — NO LOGO */}

        <div className="patient-registration-brand">

          <h2>
            {patientHospitalName}
          </h2>

          <span>
            {patientHospitalAddress ||
              "Hospital Management System"}
          </span>

        </div>

      </header>


      {/* =================================================
          CONTAINER
      ================================================= */}

      <section className="patient-registration-container">


        {/* PAGE TITLE */}

        <div className="patient-registration-title">

          <div className="patient-registration-title-icon">
            <FaUserInjured />
          </div>

          <div>

            <h1>
              Patient Registration
            </h1>

            <p>
              Create a new patient record by entering the patient's basic information below.
            </p>

          </div>

        </div>


        {/* HOSPITAL CONTEXT */}

        <div className="patient-registration-hospital-context">

          <span>
            Registering patient at
          </span>

          <strong>
            {patientHospitalName}
          </strong>

        </div>


        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && createdPatient ? (

          <div className="patient-registration-success-card">

            <div className="patient-registration-success-icon">
              <FaCheckCircle />
            </div>


            <div className="patient-registration-success-content">

              <span className="patient-registration-success-label">
                Registration Successful
              </span>

              <h2>
                Patient Registered Successfully
              </h2>

              <p>
                The patient record has been created successfully.
              </p>


              <div className="patient-registration-id-grid">

                <div className="patient-registration-id-item">

                  <span>
                    Patient Name
                  </span>

                  <strong>
                    {createdPatient?.name ||
                      formData.name}
                  </strong>

                </div>


                <div className="patient-registration-id-item">

                  <span>
                    Patient ID
                  </span>

                  <strong>
                    #{getPatientId()}
                  </strong>

                </div>


                <div className="patient-registration-id-item patient-registration-id-highlight">

                  <span>
                    Registration Number
                  </span>

                  <strong>
                    {getPatientCode()}
                  </strong>


                  <button
                    type="button"
                    className="patient-registration-copy-button"
                    onClick={
                      handleCopyCode
                    }
                  >
                    {copied
                      ? "Copied!"
                      : "Copy"}
                  </button>

                </div>

              </div>


              <div className="patient-registration-next-info">

                <FaArrowRight />

                <div>

                  <strong>
                    Next Step
                  </strong>

                  <span>
                    Book the appointment now. You can also book it later using the Registration Number or phone number.
                  </span>

                </div>

              </div>


              <PrintableReceipt
                variant="registration"
                hospital={routeHospital}
                data={{
                  hospital:
                    patientHospitalName,

                  hospitalAddress:
                    patientHospitalAddress,

                  registrationNo:
                    String(
                      getPatientCode()
                    ),

                  patient:
                    createdPatient?.name ||
                    formData.name,

                  fee: 0,
                }}
              />


              <div className="patient-registration-success-actions">

                <button
                  type="button"
                  className="patient-registration-continue-button"
                  onClick={
                    handleContinue
                  }
                >

                  <FaCalendarAlt />

                  <span>
                    Book Appointment Now
                  </span>

                  <FaArrowRight />

                </button>


                <button
                  type="button"
                  className="patient-registration-secondary-button"
                  onClick={
                    handleRegisterAnother
                  }
                >

                  <FaUserInjured />

                  <span>
                    Register Another Patient
                  </span>

                </button>

              </div>

            </div>

          </div>

        ) : (

          <>

            {/* ERROR */}

            {error && (

              <div className="patient-registration-error">

                <FaExclamationTriangle />

                <span>
                  {error}
                </span>

              </div>

            )}


            {/* =================================================
                FORM
            ================================================= */}

            <form
              className="patient-registration-card"
              onSubmit={
                handleSubmit
              }
            >

              <div className="patient-registration-section-header">

                <div className="patient-registration-section-icon">
                  <FaUserInjured />
                </div>

                <div>

                  <h2>
                    Patient Information
                  </h2>

                  <p>
                    Enter the patient's personal details
                  </p>

                </div>

              </div>


              <div className="patient-registration-form-grid">


                {/* NAME */}

                <div className="patient-registration-form-group full-width">

                  <label htmlFor="name">
                    Full Name
                    <span>*</span>
                  </label>

                  <div className="patient-registration-input">

                    <FaUser />

                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={
                        formData.name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter patient's full name"
                      disabled={saving}
                      autoComplete="name"
                      required
                    />

                  </div>

                </div>


                {/* GENDER */}

                <div className="patient-registration-form-group">

                  <label htmlFor="gender">
                    Gender
                    <span>*</span>
                  </label>

                  <div className="patient-registration-input">

                    <FaVenusMars />

                    <select
                      id="gender"
                      name="gender"
                      value={
                        formData.gender
                      }
                      onChange={
                        handleChange
                      }
                      disabled={saving}
                      required
                    >

                      <option value="">
                        Select Gender
                      </option>

                      <option value="male">
                        Male
                      </option>

                      <option value="female">
                        Female
                      </option>

                      <option value="other">
                        Other
                      </option>

                    </select>

                  </div>

                </div>


                {/* DOB */}

                <div className="patient-registration-form-group">

                  <label htmlFor="date_of_birth">
                    Date of Birth
                    <span>*</span>
                  </label>

                  <div className="patient-registration-input">

                    <FaCalendarAlt />

                    <input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={
                        formData.date_of_birth
                      }
                      onChange={
                        handleChange
                      }
                      disabled={saving}
                      required
                    />

                  </div>

                </div>


                {/* PHONE */}

                <div className="patient-registration-form-group">

                  <label htmlFor="phone">
                    Phone
                    <span>*</span>
                  </label>

                  <div className="patient-registration-input">

                    <FaPhone />

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={
                        formData.phone
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="10-digit phone number"
                      maxLength="10"
                      inputMode="numeric"
                      disabled={saving}
                      autoComplete="tel"
                      required
                    />

                  </div>

                </div>


                {/* EMAIL */}

                <div className="patient-registration-form-group">

                  <label htmlFor="email">
                    Email
                  </label>

                  <div className="patient-registration-input">

                    <FaEnvelope />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="patient@example.com"
                      disabled={saving}
                      autoComplete="email"
                    />

                  </div>

                </div>


                {/* BLOOD GROUP */}

                <div className="patient-registration-form-group">

                  <label htmlFor="blood_group">
                    Blood Group
                  </label>

                  <div className="patient-registration-input">

                    <FaTint />

                    <select
                      id="blood_group"
                      name="blood_group"
                      value={
                        formData.blood_group
                      }
                      onChange={
                        handleChange
                      }
                      disabled={saving}
                    >

                      <option value="">
                        Select Blood Group
                      </option>

                      <option value="A+">
                        A+
                      </option>

                      <option value="A-">
                        A-
                      </option>

                      <option value="B+">
                        B+
                      </option>

                      <option value="B-">
                        B-
                      </option>

                      <option value="AB+">
                        AB+
                      </option>

                      <option value="AB-">
                        AB-
                      </option>

                      <option value="O+">
                        O+
                      </option>

                      <option value="O-">
                        O-
                      </option>

                    </select>

                  </div>

                </div>


                {/* ADDRESS */}

                <div className="patient-registration-form-group full-width">

                  <label htmlFor="address">
                    Address
                    <span>*</span>
                  </label>

                  <div className="patient-registration-textarea">

                    <FaMapMarkerAlt />

                    <textarea
                      id="address"
                      name="address"
                      value={
                        formData.address
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter patient's address"
                      rows="4"
                      disabled={saving}
                      required
                    />

                  </div>

                </div>

              </div>


              <div className="patient-registration-required-note">

                <span>*</span>

                <span>
                  Required fields
                </span>

              </div>


              <div className="patient-registration-form-footer">

                <button
                  type="button"
                  className="patient-registration-cancel-button"
                  onClick={
                    handleBackHome
                  }
                  disabled={saving}
                >

                  <FaArrowLeft />

                  <span>
                    Cancel
                  </span>

                </button>


                <button
                  type="submit"
                  className="patient-registration-submit-button"
                  disabled={saving}
                >

                  {saving ? (

                    <>
                      <FaSyncAlt className="patient-registration-spin" />

                      <span>
                        Registering Patient...
                      </span>
                    </>

                  ) : (

                    <>
                      <FaCheckCircle />

                      <span>
                        Register Patient
                      </span>
                    </>

                  )}

                </button>

              </div>

            </form>


            {/* NEXT CARD */}

            <div className="patient-registration-next-card">

              <div className="patient-registration-next-icon">
                <FaIdCard />
              </div>

              <div>

                <h3>
                  What happens next?
                </h3>

                <p>
                  After registration, the patient receives a unique Patient ID and Registration Number. You can then continue to the appointment page.
                </p>

              </div>

            </div>

          </>

        )}

      </section>


      {/* FOOTER */}

      <footer className="patient-registration-footer">

        <span>
          © {new Date().getFullYear()} HMS
        </span>

        <span>
          Hospital Management System
        </span>

      </footer>

    </main>
  );
}


export default PatientRegistration;