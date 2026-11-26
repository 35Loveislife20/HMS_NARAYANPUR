import React, { Suspense, lazy } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

// Landing page eager (pehli screen yahi hai)
import MainPage from "./pages/home/MainPage";

// Baaki sab pages lazy: har ek alag chunk, MainPage ko bhari nahi karenge
const Home = lazy(() => import("./pages/home/Home"));
const Appointments = lazy(() => import("./pages/Appointments/Appointments"));
const NewPatientAppointment = lazy(() => import("./pages/Appointments/NewPatientAppointment"));
const OldPatientAppointment = lazy(() => import("./pages/Appointments/OldPatientAppointment"));
const Patients = lazy(() => import("./pages/patients/Patients"));
const PatientRegistration = lazy(() => import("./pages/patients/PatientRegistration"));
const Doctors = lazy(() => import("./pages/Doctors/Doctors"));
const Departments = lazy(() => import("./pages/Departments/Departments"));
const Billing = lazy(() => import("./pages/Billing/Billing"));
const Laboratory = lazy(() => import("./pages/Laboratory/Laboratory"));
const Pharmacy = lazy(() => import("./pages/pharmacy/Pharmacy"));
const Reports = lazy(() => import("./pages/reports/Reports"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const HospitalSettings = lazy(() => import("./pages/settings/HospitalSettings"));
const Users = lazy(() => import("./pages/users/Users"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const SuperAdmin = lazy(() => import("./pages/super-admin/SuperAdmin"));
const PatientServices = lazy(() => import("./pages/patients/PatientServices"));

function PageLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050706",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#a6ff2e",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      Loading...
    </div>
  );
}

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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/patient-services" element={<PatientServices />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/new" element={<NewPatientAppointment />} />
        <Route path="/appointments/old" element={<OldPatientAppointment />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/register" element={<PatientRegistration />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/laboratory" element={<Laboratory />} />
        <Route path="/pharmacy" element={<Pharmacy />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<SettingsRoute />} />
        <Route path="/users" element={<Users />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;