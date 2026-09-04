# 🏥 HMS Hospital Narayanpur

A modern, full-stack **Hospital Management System (HMS)** designed to manage patients, doctors, appointments, departments, laboratory services, pharmacy, billing, reports, hospital settings, and user access from one centralized application.

Built with **React + Vite** on the frontend and **Node.js + Express + MySQL** on the backend.

> **Project:** HMS Hospital Narayanpur  
> **Repository:** `35Loveislife20/HMS_NARAYANPUR`  
> **Status:** Active Development

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Modules](#-modules)
- [Role-Based Access Control](#-role-based-access-control)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Project Structure](#-project-structure)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [Application Flow](#-application-flow)
- [Security](#-security)
- [API Backend](#-api-backend)
- [Production Deployment](#-production-deployment)
- [Development](#-development)
- [Future Enhancements](#-future-enhancements)
- [Important Notes](#-important-notes)
- [License](#-license)
- [Author](#-author)

---

## 🌟 Overview

**HMS Hospital Narayanpur** is a full-stack hospital administration platform intended to simplify day-to-day hospital operations through a single web application.

The system provides a responsive frontend with protected routes and role-based permissions, while the backend follows a controller/model/route architecture and connects to a MySQL database.

The current repository contains separate `frontend` and `backend` applications. The frontend uses React 19, Vite, React Router, Axios and React Icons, while the backend uses Express, MySQL2, JWT authentication, bcryptjs, Helmet, Socket.IO and other supporting packages. fileciteturn11file0L2-L4 fileciteturn12file0L2-L4

---

## ✨ Features

### 👤 Patient Management

- Patient registration and records
- Patient information management
- Patient search and selection
- Patient-related appointment workflow
- Patient data connected with other hospital modules

### 👨‍⚕️ Doctor Management

- Doctor records
- Doctor information management
- Doctor and department association
- Doctor-related appointment workflow

### 📅 Appointment Management

- Create appointments
- Manage appointment information
- Doctor and patient selection
- Appointment status management
- New-patient appointment flow
- Existing-patient appointment flow
- Appointment scheduling and availability handling

### 🏢 Department Management

- Department management
- Department information
- Doctor/department organization

### 🧪 Laboratory Management

- Laboratory module
- Laboratory test management
- Patient-related laboratory workflow
- Laboratory information for reporting and administration

### 💊 Pharmacy Management

- Medicine management
- Pharmacy records
- Medicine-related hospital workflow

### 💳 Billing Management

- Billing records
- Patient billing information
- Bill creation and management
- Payment/status tracking
- Printable billing/invoice workflow

### 📊 Reports

- Hospital reports dashboard
- Patient-related reporting
- Doctor-related reporting
- Appointment reporting
- Billing reporting
- Laboratory reporting

### ⚙️ Hospital Settings

- Hospital configuration
- Hospital information management
- Centralized settings module

### 👥 User Management

- User administration
- Role-based access control
- Protected modules
- Permission-based navigation and access

### 🔐 Authentication

The application contains public authentication-related pages including registration, forgot-password and reset-password flows, plus protected application routes. The backend includes JWT and bcryptjs dependencies for authentication/security. fileciteturn15file0L2-L4 fileciteturn12file0L2-L4

### ⚡ Real-Time Support

The backend includes **Socket.IO**, providing a foundation for real-time features such as live dashboard updates, notifications and other event-driven hospital workflows. fileciteturn12file0L2-L4

---

## 🧩 Modules

| Module | Purpose |
|---|---|
| 🏠 Home | Public landing/home experience |
| 🔐 Authentication | Registration, login-related flows, password recovery |
| 📊 Dashboard | Centralized hospital overview |
| 👤 Patients | Patient registration and management |
| 👨‍⚕️ Doctors | Doctor management |
| 📅 Appointments | Appointment scheduling and management |
| 🏢 Departments | Department management |
| 🧪 Laboratory | Laboratory/test management |
| 💊 Pharmacy | Medicines and pharmacy management |
| 💳 Billing | Bills, payments and invoices |
| 📈 Reports | Hospital reports and analytics |
| ⚙️ Settings | Hospital configuration |
| 👥 Users | User and access management |

The frontend currently defines routes for all of these major modules. fileciteturn15file0L2-L4

---

## 🔐 Role-Based Access Control

The application defines **9 roles**:

1. `super_admin`
2. `hospital_admin`
3. `receptionist`
4. `doctor`
5. `lab_technician`
6. `pharmacist`
7. `accountant`
8. `nurse`
9. `patient`

Access is controlled through a permission matrix and protected routes. Different hospital modules are available to different roles according to their responsibilities. For example, user management is restricted to the `super_admin` role, while doctors management is restricted to administrative roles. fileciteturn15file0L2-L4

### Permission concept

```text
User Login
    │
    ▼
Authentication
    │
    ▼
Identify User Role
    │
    ▼
Permission Matrix
    │
    ├── Allowed ───────► Open Module
    │
    └── Not Allowed ───► Access Denied
```

---

## 🛠️ Technology Stack

### Frontend

- React 19
- Vite
- JavaScript / JSX
- React Router DOM
- Axios
- React Icons
- CSS

The frontend package configuration uses React 19, Vite, Axios, React Router DOM and React Icons. fileciteturn11file0L2-L4

### Backend

- Node.js
- Express 5
- MySQL / MySQL2
- JWT (`jsonwebtoken`)
- bcryptjs
- Axios
- CORS
- Helmet
- Cookie Parser
- Dotenv
- Express-compatible middleware
- Morgan
- Multer
- Nodemailer
- Socket.IO
- UUID

The backend package configuration confirms these core dependencies and uses CommonJS modules. fileciteturn12file0L2-L4

### Database

- MySQL
- SQL schema included in `backend/hms_db.sql`

---

## 🏗️ Project Architecture

```text
                    ┌─────────────────────────┐
                    │      HMS Frontend       │
                    │     React + Vite        │
                    └────────────┬────────────┘
                                 │
                                 │ HTTP / REST API
                                 ▼
                    ┌─────────────────────────┐
                    │     Express Backend     │
                    │   Node.js + Express     │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
          Authentication      Modules        Real-Time
          JWT / bcrypt       Controllers     Socket.IO
                │                │                │
                └────────────────┼────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │       MySQL Database    │
                    └─────────────────────────┘
```

---

## 📁 Project Structure

```text
HMS_NARAYANPUR/
│
├── README.md
├── .gitignore
│
├── backend/
│   ├── app.js
│   ├── server.js
│   ├── hms_db.sql
│   │
│   ├── certs/
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
│   │   ├── appointment.model.js
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
│   ├── package.json
│   └── package-lock.json
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── pages/
    │   ├── services/
    │   ├── utils/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.css
    │   └── main.jsx
    │
    ├── package.json
    └── package-lock.json
```

The repository structure includes dedicated backend configuration, controllers, middleware, models and SQL database files, plus a frontend organized into components, context, hooks, pages, services and utilities. fileciteturn10file0L2-L2 fileciteturn14file0L2-L10

---

## 💻 Requirements

Before running the project, install:

- **Node.js** 18+ recommended
- **npm**
- **MySQL** 8+ recommended
- Git

Check versions:

```bash
node -v
npm -v
mysql --version
```

---

## 📥 Installation

### 1. Clone the repository

```bash
git clone https://github.com/35Loveislife20/HMS_NARAYANPUR.git
cd HMS_NARAYANPUR
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

Open another terminal:

```bash
cd HMS_NARAYANPUR/frontend
npm install
```

---

## 🔧 Environment Configuration

Create a `.env` file inside the `backend` directory.

Example configuration:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hms_db

JWT_SECRET=replace_with_a_strong_secret

CLIENT_URL=http://localhost:5173

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
```

> **Important:** Environment variable names should match the actual configuration code used by your deployment. Never commit real database passwords, JWT secrets, email credentials or other private keys to GitHub.

---

## 🗄️ Database Setup

The repository includes the SQL database file:

```text
backend/hms_db.sql
```

### Create the database

```sql
CREATE DATABASE hms_db;
```

### Import the schema

Using MySQL CLI:

```bash
mysql -u root -p hms_db < backend/hms_db.sql
```

Or import `hms_db.sql` using MySQL Workbench/phpMyAdmin.

### Verify database connection

Confirm that:

- MySQL server is running
- Database name is correct
- Username/password are correct
- Backend `.env` values match the database configuration

---

## ▶️ Running the Application

You need **two terminals**: one for the backend and one for the frontend.

### Terminal 1 — Backend

```bash
cd HMS_NARAYANPUR/backend
npm run dev
```

The backend development script uses Nodemon and runs `server.js`. Production startup uses `node server.js`. fileciteturn12file0L2-L4

### Terminal 2 — Frontend

```bash
cd HMS_NARAYANPUR/frontend
npm run dev
```

The frontend development script runs Vite. fileciteturn11file0L2-L4

Then open the URL shown by Vite, normally:

```text
http://localhost:5173
```

---

## 🏭 Production Build

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

### Backend

```bash
cd backend
npm start
```

The package scripts define `vite build` for the frontend and `node server.js` for the backend production start. fileciteturn11file0L2-L4 fileciteturn12file0L2-L4

---

## 🔄 Application Flow

```text
                    ┌───────────────┐
                    │     Home      │
                    └───────┬───────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
             Register               Login
                 │                     │
                 └──────────┬──────────┘
                            ▼
                     Authentication
                            │
                            ▼
                    Protected Dashboard
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    Patients            Doctors          Appointments
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
        Laboratory       Pharmacy        Billing
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                         Reports
                            │
                            ▼
                       Settings
```

---

## 🔌 API Backend

The backend is organized around REST-style routes, controllers and models.

Major backend areas include:

```text
/api/auth
/api/patients
/api/doctors
/api/appointments
/api/departments
/api/laboratory
/api/medicines
/api/billing
/api/settings
/api/users
```

> Route prefixes can vary according to the current route configuration. Use the files under `backend/routes/` as the authoritative source when integrating another client.

### Backend layers

```text
Request
   │
   ▼
Route
   │
   ▼
Middleware
   │
   ▼
Controller
   │
   ▼
Model
   │
   ▼
MySQL
```

---

## 🔒 Security

The backend includes several security-related packages and middleware capabilities, including:

- JWT authentication
- bcryptjs password hashing
- Helmet security headers
- CORS configuration
- Cookie handling
- Input validation support
- Multer upload handling
- Environment-based configuration

These capabilities are reflected in the backend dependency configuration. fileciteturn12file0L2-L4

### Production security checklist

- [ ] Use HTTPS
- [ ] Use a strong `JWT_SECRET`
- [ ] Never commit `.env`
- [ ] Use a dedicated MySQL user
- [ ] Restrict CORS to trusted frontend domains
- [ ] Validate uploaded files
- [ ] Limit upload size
- [ ] Protect sensitive API routes
- [ ] Keep Node.js and npm dependencies updated
- [ ] Back up the production database
- [ ] Do not store real patient data in public repositories

---

## 📡 Real-Time Architecture

Socket.IO is included in the backend and can support event-driven features such as:

- Live dashboard updates
- Appointment notifications
- New patient notifications
- Billing updates
- Laboratory status updates
- Pharmacy notifications
- Administrative alerts

The exact real-time events should be documented alongside the corresponding backend implementation as the project evolves.

---

## 📧 Email Support

The backend includes Nodemailer and a dedicated email configuration module, providing a foundation for email-based features such as:

- Password recovery
- Appointment notifications
- Hospital notifications
- Administrative emails

SMTP credentials should always be stored in environment variables rather than source code. fileciteturn12file0L2-L4

---

## 🧪 Development

### Frontend commands

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### Backend commands

```bash
npm run dev
npm start
npm test
```

The repository currently defines these scripts in the frontend and backend package files. fileciteturn11file0L2-L4 fileciteturn12file0L2-L4

---

## 🧹 Code Quality

Recommended workflow before pushing changes:

```bash
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd ../backend
npm start
```

For larger changes, test authentication, role permissions, database operations and affected modules before merging.

---

## 🚀 Production Deployment

A typical deployment can be organized as follows:

```text
                 Internet
                    │
                    ▼
          ┌──────────────────┐
          │ Frontend Hosting │
          │ React + Vite     │
          └────────┬─────────┘
                   │
                   │ HTTPS / API
                   ▼
          ┌──────────────────┐
          │ Backend Server   │
          │ Node + Express   │
          └────────┬─────────┘
                   │
          ┌────────┴─────────┐
          │                  │
          ▼                  ▼
      MySQL DB          Socket.IO
```

### Deployment checklist

1. Build the frontend.
2. Deploy frontend to a static hosting/CDN or web server.
3. Deploy backend to a Node.js server/VPS/cloud platform.
4. Provision MySQL.
5. Import the database schema.
6. Configure production environment variables.
7. Configure frontend API URL.
8. Configure CORS.
9. Enable HTTPS.
10. Verify authentication and role permissions.
11. Test every major HMS module.
12. Configure database backups and monitoring.

---

## 📱 Extending the System

The architecture allows additional clients to consume the backend API, for example:

- Mobile application
- Doctor portal
- Nurse portal
- Patient portal
- Reception dashboard
- Pharmacy terminal
- Laboratory workstation

A future mobile client can use the same authentication and API layer rather than duplicating hospital business logic.

---

## 🔮 Future Enhancements

Possible future improvements include:

- 📱 Dedicated mobile application
- 🔔 Advanced real-time notifications
- 📊 More advanced analytics dashboards
- 🧾 PDF invoice/report generation
- 🗓️ Advanced appointment calendar
- 💬 Internal hospital messaging
- 🧑‍⚕️ Doctor-specific dashboard
- 👩‍⚕️ Nurse workflow dashboard
- 🧪 Advanced laboratory workflow
- 💊 Pharmacy stock alerts
- 📦 Inventory management
- 💰 Payment gateway integration
- ☁️ Cloud file storage
- 🛡️ Audit logs
- 🔐 Two-factor authentication
- 🏥 Multi-branch hospital support
- 🌐 Multi-language support

---

## ⚠️ Important Notes

### Patient and medical data

This application can handle sensitive hospital information. Production deployments should apply appropriate privacy, access-control, retention, encryption, backup and compliance practices.

### Credentials

Never commit:

```text
.env
Database passwords
JWT secrets
SMTP passwords
API keys
Private certificates/keys
Real patient records
```

### Certificates

The repository currently contains certificate-related files under `backend/certs/`. Review certificate handling carefully before production deployment and avoid committing private keys or sensitive credentials.

---

## 📄 License

The backend package currently declares an `ISC` package license, but the repository does not necessarily establish a single top-level project license for every component. fileciteturn12file0L2-L4

For a clearly defined GitHub distribution license, add a root-level `LICENSE` file and specify the intended project license explicitly.

---

## 👨‍💻 Author

**35Loveislife20**

GitHub: [35Loveislife20](https://github.com/35Loveislife20)

Repository: [HMS_NARAYANPUR](https://github.com/35Loveislife20/HMS_NARAYANPUR)

---

## ⭐ Support the Project

If you find this project useful:

- ⭐ Star the repository
- 🍴 Fork the repository
- 🐛 Report bugs through Issues
- 💡 Suggest improvements
- 🔧 Submit Pull Requests

---

## 📌 Project Summary

**HMS Hospital Narayanpur** is a complete hospital-management platform combining:

```text
Patients
   + Doctors
   + Appointments
   + Departments
   + Laboratory
   + Pharmacy
   + Billing
   + Reports
   + Settings
   + User Management
   + Role-Based Access
   + Authentication
   + MySQL
   + REST API
   + Real-Time Support
   =
   🏥 Hospital Management System
```

---

**Built for modern hospital administration and scalable healthcare workflows.** 🏥💚
