import React from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

// =====================================================
// PUBLIC PAGES
// =====================================================

import Home from "./pages/home/Home";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// =====================================================
// PROTECTED PAGES
// =====================================================

import Dashboard from "./pages/dashboard/Dashboard";
import Patients from "./pages/patients/Patients";
import Doctors from "./pages/Doctors/Doctors";
import Appointments from "./pages/Appointments/Appointments";
import Departments from "./pages/Departments/Departments";
import Laboratory from "./pages/Laboratory/Laboratory";
import Pharmacy from "./pages/pharmacy/Pharmacy";
import Billing from "./pages/Billing/Billing";
import Reports from "./pages/reports/Reports";
import Settings from "./pages/settings/Settings";
import Users from "./pages/users/Users";

// =====================================================
// LAYOUT
// =====================================================

import Layout from "./components/layout/Layout";

// =====================================================
// PROTECTED ROUTE
// =====================================================

import ProtectedRoute from "./components/common/ProtectedRoute";

// =====================================================
// EXACT 9 ROLES
// =====================================================

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  HOSPITAL_ADMIN: "hospital_admin",
  RECEPTIONIST: "receptionist",
  DOCTOR: "doctor",
  LAB_TECHNICIAN: "lab_technician",
  PHARMACIST: "pharmacist",
  ACCOUNTANT: "accountant",
  NURSE: "nurse",
  PATIENT: "patient",
};

// =====================================================
// EXACT PERMISSION MATRIX
// =====================================================

export const PERMISSIONS = {

  dashboard: [
    ROLES.SUPER_ADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.RECEPTIONIST,
    ROLES.DOCTOR,
    ROLES.LAB_TECHNICIAN,
    ROLES.PHARMACIST,
    ROLES.ACCOUNTANT,
    ROLES.NURSE,
    ROLES.PATIENT,
  ],

  patients: [
    ROLES.SUPER_ADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.RECEPTIONIST,
    ROLES.DOCTOR,
    ROLES.NURSE,
  ],

  doctors: [
    ROLES.SUPER_ADMIN,
    ROLES.HOSPITAL_ADMIN,
  ],

  appointments: [
    ROLES.SUPER_ADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.RECEPTIONIST,
    ROLES.DOCTOR,
    ROLES.NURSE,
    ROLES.PATIENT,
  ],

  departments: [
    ROLES.SUPER_ADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.DOCTOR,
    ROLES.NURSE,
  ],

  laboratory: [
    ROLES.SUPER_ADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.DOCTOR,
    ROLES.LAB_TECHNICIAN,
  ],

  pharmacy: [
    ROLES.SUPER_ADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.PHARMACIST,
    ROLES.ACCOUNTANT,
  ],

  billing: [
    ROLES.SUPER_ADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.PHARMACIST,
    ROLES.ACCOUNTANT,
  ],

  reports: [
    ROLES.SUPER_ADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.DOCTOR,
    ROLES.LAB_TECHNICIAN,
    ROLES.PHARMACIST,
    ROLES.ACCOUNTANT,
  ],

  settings: [
    ROLES.SUPER_ADMIN,
    ROLES.HOSPITAL_ADMIN,
  ],

  users: [
    ROLES.SUPER_ADMIN,
  ],
};

// =====================================================
// ACCESS DENIED
// =====================================================

const AccessDenied = () => {

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#020806",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
      }}
    >

      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          padding: "40px",
          textAlign: "center",
          borderRadius: "20px",
          border: "1px solid rgba(0,255,55,.25)",
          background: "rgba(5,20,12,.95)",
          boxShadow:
            "0 25px 70px rgba(0,0,0,.5)",
          boxSizing: "border-box",
        }}
      >

        <div
          style={{
            fontSize: "60px",
            marginBottom: "15px",
          }}
        >
          🔒
        </div>

        <h1
          style={{
            margin: "0 0 12px",
            color: "#00ff37",
            fontSize: "30px",
          }}
        >
          Access Denied
        </h1>

        <p
          style={{
            margin: "0 0 25px",
            color: "#9aaea3",
            lineHeight: 1.6,
            fontSize: "14px",
          }}
        >
          You do not have permission to access
          this section of HMS.
        </p>

        <button
          type="button"
          onClick={() =>
            window.history.back()
          }
          style={{
            border: "1px solid rgba(0,255,55,.35)",
            borderRadius: "10px",
            padding: "11px 20px",
            background:
              "rgba(0,255,55,.08)",
            color: "#00ff37",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Go Back
        </button>

      </div>

    </div>
  );
};

// =====================================================
// PROTECTED PAGE
// =====================================================

const ProtectedPage = ({
  element,
  roles,
}) => {

  return (
    <ProtectedRoute
      allowedRoles={roles}
      fallback={<AccessDenied />}
    >
      {element}
    </ProtectedRoute>
  );
};

// =====================================================
// APP
// IMPORTANT:
// BrowserRouter must exist only once in main.jsx
// =====================================================

function App() {

  return (

    <AuthProvider>

      <Routes>

        {/* =================================================
                    PUBLIC ROUTES
                ================================================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* =================================================
                    RESET PASSWORD
                    PUBLIC ROUTE
                ================================================= */}

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />


        {/* =================================================
                    PROTECTED LAYOUT
                ================================================= */}

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >

          {/* =============================================
                        DASHBOARD
                    ============================================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedPage
                roles={PERMISSIONS.dashboard}
                element={<Dashboard />}
              />
            }
          />


          {/* =============================================
                        PATIENTS
                    ============================================= */}

          <Route
            path="/patients"
            element={
              <ProtectedPage
                roles={PERMISSIONS.patients}
                element={<Patients />}
              />
            }
          />


          {/* =============================================
                        DOCTORS
                    ============================================= */}

          <Route
            path="/doctors"
            element={
              <ProtectedPage
                roles={PERMISSIONS.doctors}
                element={<Doctors />}
              />
            }
          />


          {/* =============================================
                        APPOINTMENTS
                    ============================================= */}

          <Route
            path="/appointments"
            element={
              <ProtectedPage
                roles={PERMISSIONS.appointments}
                element={<Appointments />}
              />
            }
          />


          {/* =============================================
                        DEPARTMENTS
                    ============================================= */}

          <Route
            path="/departments"
            element={
              <ProtectedPage
                roles={PERMISSIONS.departments}
                element={<Departments />}
              />
            }
          />


          {/* =============================================
                        LABORATORY
                    ============================================= */}

          <Route
            path="/laboratory"
            element={
              <ProtectedPage
                roles={PERMISSIONS.laboratory}
                element={<Laboratory />}
              />
            }
          />


          {/* =============================================
                        PHARMACY
                    ============================================= */}

          <Route
            path="/pharmacy"
            element={
              <ProtectedPage
                roles={PERMISSIONS.pharmacy}
                element={<Pharmacy />}
              />
            }
          />


          {/* =============================================
                        BILLING
                    ============================================= */}

          <Route
            path="/billing"
            element={
              <ProtectedPage
                roles={PERMISSIONS.billing}
                element={<Billing />}
              />
            }
          />


          {/* =============================================
                        REPORTS
                    ============================================= */}

          <Route
            path="/reports"
            element={
              <ProtectedPage
                roles={PERMISSIONS.reports}
                element={<Reports />}
              />
            }
          />


          {/* =============================================
                        SETTINGS
                    ============================================= */}

          <Route
            path="/settings"
            element={
              <ProtectedPage
                roles={PERMISSIONS.settings}
                element={<Settings />}
              />
            }
          />


          {/* =============================================
                        USER MANAGEMENT
                    ============================================= */}

          <Route
            path="/users"
            element={
              <ProtectedPage
                roles={PERMISSIONS.users}
                element={<Users />}
              />
            }
          />

        </Route>


        {/* =================================================
                    FALLBACK
                ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </AuthProvider>
  );
}

export default App;