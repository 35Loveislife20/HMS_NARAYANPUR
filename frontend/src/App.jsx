import React from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import MainPage from "./pages/home/MainPage";
import Home from "./pages/home/Home";

import Appointments from "./pages/Appointments/Appointments";
import NewPatientAppointment from "./pages/Appointments/NewPatientAppointment";
import OldPatientAppointment from "./pages/Appointments/OldPatientAppointment";

import Patients from "./pages/patients/Patients";
import PatientRegistration from "./pages/patients/PatientRegistration";

import Doctors from "./pages/Doctors/Doctors";
import Departments from "./pages/Departments/Departments";
import Billing from "./pages/Billing/Billing";
import Laboratory from "./pages/Laboratory/Laboratory";
import Pharmacy from "./pages/pharmacy/Pharmacy";
import Reports from "./pages/reports/Reports";
import Settings from "./pages/settings/Settings";
import HospitalSettings from "./pages/settings/Hospitalsettings";
import Users from "./pages/users/Users";
import Dashboard from "./pages/dashboard/Dashboard";
import SuperAdmin from "./pages/super-admin/SuperAdmin";

import PatientServices from "./pages/patients/PatientServices";

/* =========================================================
   SETTINGS ROUTE (role ke hisaab se)

   - Super Admin (seedha)            -> Settings (HMS login / branding)
   - Super Admin (hospital dashboard
     se, state.hospitalId ke saath)  -> us hospital ki HospitalSettings
   - Hospital Admin / baaki staff    -> apne hospital ki HospitalSettings
========================================================= */

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("hms_user") || "null") || {};
  } catch {
    return {};
  }
}

function isSuperAdminUser(user) {
  const role = String(user?.role ?? user?.role_name ?? user?.roleName ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return (
    user?.is_super === true ||
    role === "super" ||
    role === "superadmin" ||
    role === "super_admin"
  );
}

function getUserHospitalId(user) {
  return (
    user?.hospital_id ??
    user?.hospitalId ??
    (user?.hospital && typeof user.hospital === "object"
      ? user.hospital.id
      : user?.hospital) ??
    null
  );
}

function SettingsRoute() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = readStoredUser();
  const superAdmin = isSuperAdminUser(user);

  const stateHospitalId = location.state?.hospitalId ?? null;

  if (superAdmin && !stateHospitalId) {
    return <Settings />;
  }

  const hospitalId = superAdmin ? stateHospitalId : getUserHospitalId(user);

  if (!hospitalId) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          background: "#050706",
          color: "#e8fff0",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <p>Hospital id nahi mila. Dobara login karein.</p>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "1px solid rgba(166,255,46,0.5)",
            background: "rgba(166,255,46,0.12)",
            color: "#a6ff2e",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <HospitalSettings
      hospitalId={hospitalId}
      onClose={() => navigate("/dashboard")}
    />
  );
}

function App() {
  return (
    <Routes>
      {/* =========================
          MAIN PAGE
      ========================= */}
      <Route path="/" element={<MainPage />} />

      {/* =========================
          ADMIN / HMS
      ========================= */}
      <Route path="/home" element={<Home />} />

      {/* =========================
          PATIENT SERVICES
      ========================= */}
      <Route
        path="/patient-services"
        element={<PatientServices />}
      />

      {/* =========================
          APPOINTMENTS
      ========================= */}
      <Route
        path="/appointments"
        element={<Appointments />}
      />

      <Route
        path="/appointments/new"
        element={<NewPatientAppointment />}
      />

      <Route
        path="/appointments/old"
        element={<OldPatientAppointment />}
      />

      {/* =========================
          PATIENTS
      ========================= */}
      <Route
        path="/patients"
        element={<Patients />}
      />

      <Route
        path="/patients/register"
        element={<PatientRegistration />}
      />

      {/* =========================
          ADMIN MODULES
      ========================= */}
      <Route
        path="/doctors"
        element={<Doctors />}
      />

      <Route
        path="/departments"
        element={<Departments />}
      />

      <Route
        path="/billing"
        element={<Billing />}
      />

      <Route
        path="/laboratory"
        element={<Laboratory />}
      />

      <Route
        path="/pharmacy"
        element={<Pharmacy />}
      />

      <Route
        path="/reports"
        element={<Reports />}
      />

      <Route
        path="/settings"
        element={<SettingsRoute />}
      />

      <Route
        path="/users"
        element={<Users />}
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      <Route
        path="/super-admin"
        element={<SuperAdmin />}
      />

      {/* =========================
          FALLBACK
      ========================= */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;