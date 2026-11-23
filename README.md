# 🏥 HMS Hospital Narayanpur

A modern, responsive, and full-stack **Hospital Management System (HMS)** designed to digitally manage hospital operations from a single platform.

The system provides modules for:

* Patient Management
* Doctor Management
* Appointment Management
* Department Management
* Laboratory Management
* Pharmacy Management
* Billing
* Reports
* Settings
* User Management
* Authentication & Authorization

---

## 📌 Project Overview

**HMS Hospital Narayanpur** is a full-stack web-based Hospital Management System developed to simplify hospital administration, reduce manual work, improve data management, and provide a centralized platform for hospital staff.

### 🎯 Main Objectives

* Manage patients digitally
* Manage doctors and departments
* Schedule and manage appointments
* Manage laboratory tests
* Manage pharmacy and medicines
* Create and manage patient bills
* Generate hospital reports
* Manage hospital settings
* Manage system users and roles
* Provide secure authentication
* Provide a responsive and user-friendly interface

---

# 🚀 Features

## 👨‍⚕️ Patient Management

* Register new patients
* Generate unique patient IDs
* View patient details
* Search patients
* Update patient information
* Manage patient records
* Complete patient registration workflow

## 🩺 Doctor Management

* Add doctors
* View doctor information
* Manage doctor specialization
* Assign doctors to departments
* Search doctors
* Update doctor details
* Manage doctor availability

## 📅 Appointment Management

* Create appointments
* Select patients and doctors
* Select appointment date and time
* Manage appointment status
* Prevent duplicate doctor bookings
* New patient appointment workflow
* Existing patient appointment workflow
* Search appointments
* View appointment statistics

## 🏢 Department Management

Hospital departments can be managed from a centralized interface.

### Example Departments

* General Medicine
* Cardiology
* Orthopedics
* Pediatrics
* Gynecology
* Neurology
* Emergency
* Laboratory
* Pharmacy

## 🧪 Laboratory Management

* Manage laboratory tests
* Add laboratory tests
* View test records
* Manage test status
* Maintain patient laboratory records
* Generate laboratory reports

## 💊 Pharmacy Management

* Manage medicines
* Add medicines
* Update medicine information
* Manage medicine stock
* Check medicine availability
* Maintain pharmacy records

## 💰 Billing Management

* Create patient bills
* Manage billing records
* Calculate total amounts
* Track paid amounts
* Track pending bills
* Manage payment status
* Print invoices
* Display dynamic hospital information on invoices

## 📊 Reports

The Reports module provides an overview of hospital activities.

### Available Reports

* Total patients
* Total doctors
* Total appointments
* Scheduled appointments
* Completed appointments
* Cancelled appointments
* Billing statistics
* Laboratory statistics
* Hospital activity summary
* Printable reports

## ⚙️ Settings

Hospital settings can be managed from the Settings module.

### Available Settings

* Hospital name
* Hospital subtitle
* Hospital tagline
* System configuration
* Hospital information

Hospital information can also be used dynamically in printed documents and invoices.

## 👥 User Management

Administrators can manage system users from a centralized interface.

* Add users
* Edit users
* View users
* Delete users
* Search users
* Filter users by role
* Filter users by status
* Activate/deactivate users
* API and database integration

---

# 🔐 Authentication & Security

The system uses authentication and authorization mechanisms to protect application resources.

### Security Technologies

* JWT Authentication
* Password hashing using bcrypt
* Role-based authorization
* Protected routes
* Authorization headers
* CORS protection
* Helmet security middleware
* Environment variables
* Secure API communication

Authentication tokens are stored on the frontend and included in API requests when required.

---

# 👤 User Roles

| Role             | Description                           |
| ---------------- | ------------------------------------- |
| `super_admin`    | Full system access                    |
| `hospital_admin` | Hospital administration               |
| `receptionist`   | Patient and appointment management    |
| `doctor`         | Doctor and patient-related operations |
| `lab_technician` | Laboratory management                 |
| `pharmacist`     | Pharmacy and medicine management      |
| `accountant`     | Billing and financial operations      |
| `nurse`          | Patient-care-related operations       |
| `patient`        | Patient-specific access               |

---

# 📋 HMS Modules

| Module          | Status      |
| --------------- | ----------- |
| Dashboard       | ✅ Completed |
| Patients        | ✅ Completed |
| Doctors         | ✅ Completed |
| Appointments    | ✅ Completed |
| Departments     | ✅ Completed |
| Laboratory      | ✅ Completed |
| Pharmacy        | ✅ Completed |
| Billing         | ✅ Completed |
| Reports         | ✅ Completed |
| Settings        | ✅ Completed |
| User Management | ✅ Completed |

---

# 🛠️ Technology Stack

## Frontend

* React
* Vite
* JavaScript
* JSX
* React Router
* Axios
* React Icons
* CSS3

## Backend

* Node.js
* Express.js
* REST API
* JWT
* bcryptjs
* MySQL2
* Socket.IO
* Nodemailer
* Multer
* Helmet
* CORS
* Morgan
* dotenv

## Database

* MySQL
* SQL

---

# 📁 Project Structure

```text
HMS_NARAYANPUR/
│
├── backend/
│   ├── certs/
│   ├── config/
│   │   ├── db.js
│   │   └── email.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   ├── utils/
│   ├── .env
│   ├── app.js
│   ├── server.js
│   ├── hms_db.sql
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/35Loveislife20/HMS_NARAYANPUR.git
cd HMS_NARAYANPUR
```

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

## 3. Configure Backend Environment

Create a `.env` file inside the `backend` directory and configure the required database, authentication, and other environment variables.

## 4. Start Backend

```bash
npm start
```

The backend API runs on:

```text
http://localhost:5000
```

## 5. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

## 6. Start Frontend

```bash
npm run dev
```

The frontend will be available through the Vite development server.

---

# 🌐 Live Demo

**HMS Hospital Narayanpur**

https://hms-narayanpur-frontend.vercel.app/

---

# 👨‍💻 Developer

## Satish Kumar

**Full-Stack Web Developer**

### HMS Hospital Narayanpur

A full-stack Hospital Management System developed for digital hospital administration and management.

### Development Focus

* Frontend development
* Backend development
* REST API integration
* Database integration
* Authentication & authorization
* Responsive UI design
* Hospital management workflows
* Reporting and billing functionality

---

# 📬 Project Information

| Information  | Details                    |
| ------------ | -------------------------- |
| Developer    | Satish Kumar               |
| GitHub       | 35Loveislife20             |
| Repository   | HMS_NARAYANPUR             |
| Project Type | Full-Stack Web Application |
| Frontend     | React + Vite               |
| Backend      | Node.js + Express          |
| Database     | MySQL                      |
| Deployment   | Vercel                     |

---

# ⭐ Acknowledgement

This project was developed with a focus on clean UI, responsive design, database integration, REST API development, authentication, and practical hospital management workflows.

---

# 📄 License

This project is developed for educational and portfolio purposes.

**© 2026 Satish Kumar. All Rights Reserved.**
