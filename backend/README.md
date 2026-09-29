# 🚀 CareerForge Backend API

A clean, modular RESTful API for **CareerForge** built with Node.js, Express.js, MySQL, and JWT authentication.

This backend handles **Candidate (Job Seeker)** and **Company (Employer)** registration, password hashing using `bcryptjs`, GSTIN verification tracking, and JWT token-based authentication.

---

## 🛠️ Tech Stack & Dependencies

- **Runtime**: [Node.js](https://nodejs.org/) (v18+ recommended)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MySQL](https://www.mysql.com/) using `mysql2` connection pools
- **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Security & Config**: `cors` and `dotenv`

---

## 📁 Project Architecture (MVC Structure)

```text
backend/
├── .env                      # Local environment variables (do NOT commit to git)
├── .env.example              # Template for environment configuration
├── package.json              # Project dependencies & npm scripts
├── server.js                 # Express application entrypoint
└── src/
    ├── config/
    │   └── db.js             # MySQL2 pool connection & query helpers
    ├── database/
    │   ├── schema.sql        # MySQL table schema (candidates & companies)
    │   └── initDb.js         # Auto database creator & migration script
    ├── middleware/
    │   ├── authMiddleware.js # JWT verification & role-based authorization
    │   ├── validationMiddleware.js # Request payload validation handler
    │   └── errorHandler.js   # 404 & global Express error handling
    ├── models/
    │   ├── candidateModel.js # SQL queries for candidate database operations
    │   └── companyModel.js   # SQL queries for company database operations
    ├── controllers/
    │   ├── candidateController.js # Handlers for candidate register, login & profile
    │   ├── companyController.js   # Handlers for company register, login & GSTIN
    │   └── authController.js     # Unified authentication & session handler
    ├── routes/
    │   ├── candidateRoutes.js # Express router for /api/v1/candidates
    │   ├── companyRoutes.js   # Express router for /api/v1/companies
    │   ├── authRoutes.js      # Express router for /api/v1/auth
    │   └── index.js           # Master API router aggregator
    └── utils/
        ├── tokenUtils.js     # JWT signing and decoding helpers
        └── validators.js     # Validation rules for email, phone, GSTIN & password
```

---

## ⚙️ Quick Setup Guide for Team Members

Follow these steps after cloning/pulling the repository from GitHub:

### 1️⃣ Open Terminal & Navigate to Backend
```bash
cd backend
```

### 2️⃣ Install Node Dependencies
```bash
npm install
```

### 3️⃣ Configure Environment Variables (`.env`)
Create a `.env` file in the root of the `backend/` directory by copying `.env.example`:

```bash
# Windows Command Prompt
copy .env.example .env

# PowerShell / Bash
cp .env.example .env
```

Open `.env` and configure your local MySQL credentials:

```env
PORT=5000
NODE_ENV=development

# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=careerforge_db
DB_CONNECTION_LIMIT=10

# JWT Authentication
JWT_SECRET=careerforge_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d

# CORS Configuration
CLIENT_URL=http://localhost:5173
```

> ⚠️ **Note**: Replace `your_mysql_password_here` with the actual password for your local MySQL `root` account.

---

### 4️⃣ Initialize MySQL Database & Tables
Run the automated initialization script to create the `careerforge_db` database and necessary tables (`candidates` and `companies`) automatically:

```bash
npm run db:init
```

---

### 5️⃣ Start the Backend Server

#### For Development (with auto-reload):
```bash
npm run dev
```

#### For Production Mode:
```bash
npm start
```

When started successfully, you will see output like:

```text
🚀 Bootstrapping CareerForge Backend Server...
📡 Connecting to MySQL server at localhost:3306...
✅ MySQL Database connected successfully.
=================================================
🔥 CareerForge Server running on port 5000
🌐 API Base URL: http://localhost:5000/api/v1
=================================================
```

---

## 🔌 API Endpoints Summary

### 👤 Candidate Endpoints (`/api/v1/candidates`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/candidates/register` | Register a new candidate (Job Seeker) | No |
| `POST` | `/api/v1/candidates/login` | Login candidate with email & password | No |
| `GET` | `/api/v1/candidates/me` | Fetch authenticated candidate profile | Yes (Bearer Token) |

### 🏢 Company Endpoints (`/api/v1/companies`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/companies/register` | Register a new company (requires 15-char GSTIN) | No |
| `POST` | `/api/v1/companies/login` | Login company with email & password | No |
| `GET` | `/api/v1/companies/me` | Fetch authenticated company profile | Yes (Bearer Token) |
| `PATCH` | `/api/v1/companies/:id/verify` | Update verification status (`pending`, `verified`, `rejected`) | Yes (Admin) |

### 🔑 Auth & Health Check

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/auth/me` | Get current user profile (Candidate or Company) | Yes (Bearer Token) |
| `GET` | `/api/v1/health` | Health check endpoint | No |

---

## ❓ Troubleshooting

- **`Access denied for user 'root'@'localhost'`**: Double check your `DB_PASSWORD` inside `backend/.env`.
- **`ECONNREFUSED 127.0.0.1:3306`**: Make sure your MySQL service is running on your machine (via MySQL Workbench, XAMPP, or Windows Services).
- **`Port 5000 is already in use`**: Change `PORT=5001` in `.env` and restart.
