import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/home/Home";
import Login from "./pages/auth/Login";

import Dashboard from "./pages/dashboard/Dashboard";
import Patients from "./pages/patients/Patients";
import Doctors from "./pages/Doctors/Doctors";
import Appointments from "./pages/Appointments/Appointments";
import Departments from "./pages/Departments/Departments";
import Pharmacy from "./pages/pharmacy/Pharmacy";
import Laboratory from "./pages/Laboratory/Laboratory";
import Billing from "./pages/Billing/Billing";

import ProtectedRoute from "./components/common/ProtectedRoute";
import Layout from "./components/layout/Layout";

function App() {
  return (
    <Routes>

      {/* =====================================================
          HOME
      ===================================================== */}
      <Route
        path="/"
        element={<Home />}
      />

      {/* =====================================================
          LOGIN
      ===================================================== */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* =====================================================
          DASHBOARD
      ===================================================== */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* =====================================================
          PATIENTS
      ===================================================== */}
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <Layout>
              <Patients />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* =====================================================
          DOCTORS
      ===================================================== */}
      <Route
        path="/doctors"
        element={
          <ProtectedRoute>
            <Layout>
              <Doctors />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* =====================================================
          APPOINTMENTS
      ===================================================== */}
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <Layout>
              <Appointments />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* =====================================================
          DEPARTMENTS
      ===================================================== */}
      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <Layout>
              <Departments />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* =====================================================
          PHARMACY
      ===================================================== */}
      <Route
        path="/pharmacy"
        element={
          <ProtectedRoute>
            <Layout>
              <Pharmacy />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* =====================================================
          LABORATORY
      ===================================================== */}
      <Route
        path="/laboratory"
        element={
          <ProtectedRoute>
            <Layout>
              <Laboratory />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* =====================================================
          BILLING
      ===================================================== */}
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <Layout>
              <Billing />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* =====================================================
          UNKNOWN URL
      ===================================================== */}
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
  );
}

export default App;