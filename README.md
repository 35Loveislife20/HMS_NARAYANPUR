# 🏥 HMS Hospital Narayanpur

A modern and responsive **Hospital Management System (HMS)** designed to manage hospital operations digitally from a single platform.

The system provides modules for patient management, doctors, appointments, departments, laboratory, pharmacy, billing, reports, settings, and user management.

---

## 📌 Project Overview

**HMS Hospital Narayanpur** is a full-stack web-based Hospital Management System built using modern web technologies.

The application is designed to simplify hospital administration, reduce manual work, improve data management, and provide a centralized system for hospital staff.

### Main Objectives

- Manage patients digitally
- Manage doctors and departments
- Schedule and manage appointments
- Manage laboratory tests
- Manage pharmacy and medicines
- Generate and manage bills
- Generate hospital reports
- Manage hospital settings
- Manage system users and roles
- Provide secure authentication
- Provide responsive and user-friendly UI

---

# 🚀 Features

## 👨‍⚕️ Patient Management

- Register new patients
- Generate unique patient IDs
- View patient details
- Search patients
- Update patient information
- Manage patient records
- Patient registration workflow

---

## 🩺 Doctor Management

- Add doctors
- View doctor information
- Manage doctor specialization
- Assign doctors to departments
- Search doctors
- Update doctor details
- Doctor availability management

---

## 📅 Appointment Management

- Create appointments
- Select patient
- Select doctor
- Select appointment date
- Select appointment time
- Appointment status management
- Prevent duplicate doctor bookings
- New patient appointment workflow
- Existing patient appointment workflow
- Search appointments
- Appointment statistics

---

## 🏢 Department Management

Hospital departments can be managed from a centralized interface.

Examples:

- General Medicine
- Cardiology
- Orthopedics
- Pediatrics
- Gynecology
- Neurology
- Emergency
- Laboratory
- Pharmacy

---

## 🧪 Laboratory Management

- Manage laboratory tests
- Add laboratory tests
- View test records
- Manage test status
- Patient laboratory records
- Laboratory reporting

---

## 💊 Pharmacy Management

- Manage medicines
- Add medicines
- Update medicine information
- Manage stock
- Medicine availability
- Pharmacy records

---

## 💰 Billing Management

- Create patient bills
- Manage billing records
- Calculate total amount
- Track paid amount
- Track pending bills
- Payment status
- Print invoices
- Dynamic hospital information on invoices

---

## 📊 Reports

The Reports module provides an overview of hospital activities.

Reports include:

- Total patients
- Total doctors
- Total appointments
- Scheduled appointments
- Completed appointments
- Cancelled appointments
- Billing statistics
- Laboratory statistics
- Hospital activity summary

Reports can also be prepared for printing.

---

## ⚙️ Settings

Hospital settings can be managed from the Settings module.

Settings include:

- Hospital name
- Hospital subtitle
- Hospital tagline
- System configuration
- Hospital information

The hospital name can also be used dynamically in printed documents and invoices.

---

## 👥 User Management

The User Management module allows administrators to manage system users.

Features include:

- Add users
- Edit users
- View users
- Delete users
- Search users
- Filter users by role
- Filter users by status
- Activate/deactivate users
- API and database integration

---

# 🔐 Authentication & Security

The system uses secure authentication mechanisms.

### Security technologies

- JWT Authentication
- Password hashing using bcrypt
- Role-based authorization
- Protected routes
- Authorization headers
- CORS protection
- Helmet security middleware
- Environment variables
- Secure API communication

Authentication tokens are stored on the frontend and sent with API requests when required.

---

# 👤 User Roles

The system supports multiple user roles.

| Role | Description |
|---|---|
| `super_admin` | Full system access |
| `hospital_admin` | Hospital administration |
| `receptionist` | Patient and appointment management |
| `doctor` | Doctor and patient-related operations |
| `lab_technician` | Laboratory management |
| `pharmacist` | Pharmacy and medicine management |
| `accountant` | Billing and financial operations |
| `nurse` | Patient care related operations |
| `patient` | Patient-specific access |

---

# 📋 HMS Modules

| Module | Status |
|---|---|
| Dashboard | ✅ Completed |
| Patients | ✅ Completed |
| Doctors | ✅ Completed |
| Appointments | ✅ Completed |
| Departments | ✅ Completed |
| Laboratory | ✅ Completed |
| Pharmacy | ✅ Completed |
| Billing | ✅ Completed |
| Reports | ✅ Completed |
| Settings | ✅ Completed |
| User Management | ✅ Completed |

---

# 🛠️ Technology Stack

## Frontend

- React
- Vite
- JavaScript
- JSX
- React Router
- Axios
- React Icons
- CSS3

## Backend

- Node.js
- Express.js
- REST API
- JWT
- bcryptjs
- MySQL2
- Socket.IO
- Nodemailer
- Multer
- Helmet
- CORS
- Morgan
- dotenv

## Database

- MySQL
- SQL

---

# 📁 Project Structure

```text
HMS/
│
├── backend/
│   │
│   ├── certs/
│   │
│   ├── config/
│   │   ├── db.js
│   │   └── email.js
│   │
│   ├── controllers/
│   │   ├── appointment.controller.js
│   │   ├── auth.controller.js
│   │   ├── billing.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── department.controller.js
│   │   ├── doctors.controller.js
│   │   ├── laboratory.controller.js
│   │   ├── medicine.controller.js
│   │   ├── patient.controller.js
│   │   ├── settings.controller.js
│   │   └── user.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── role.middleware.js
│   │
│   ├── models/
│   │   ├── appointments.model.js
│   │   ├── billing.model.js
│   │   ├── dashboard.model.js
│   │   ├── department.model.js
│   │   ├── doctor.model.js
│   │   ├── laboratory.model.js
│   │   ├── medicine.model.js
│   │   ├── patient.model.js
│   │   ├── settings.model.js
│   │   └── user.model.js
│   │
│   ├── routes/
│   │
│   ├── services/
│   │
│   ├── uploads/
│   │
│   ├── utils/
│   │
│   ├── .env
│   ├── app.js
│   ├── server.js
│   ├── hms_db.sql
│   └── package.json
│
├── frontend/
│   │
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md

## 👨‍💻 Developer

**Satish Kumar**

Full-Stack Web Developer

### Project

**HMS Hospital Narayanpur — Hospital Management System**

This project was designed and developed as a full-stack web application for managing hospital operations digitally.

---

## 📬 Contact & Repository

* **Developer:** Satish Kumar
* **GitHub:** 35Loveislife20
* **Repository:** HMS_NARAYANPUR
* **Live Application:** hms-narayanpur.vercel.app

---

## ⭐ Acknowledgement

This project was developed with a focus on clean UI, responsive design, database integration, REST API development, authentication, and practical hospital management workflows.

**© 2026 Satish Kumar. All Rights Reserved.**
