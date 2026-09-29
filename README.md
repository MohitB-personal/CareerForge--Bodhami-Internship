# 🚀 CareerForge - AI-Powered Career Platform

**CareerForge** is a full-stack career platform connecting Candidates (Job Seekers) and Employers with AI-powered resume analysis, job matching, and candidate profile management.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router v7, Lucide Icons, CSS3 (Custom CSS variables & theme tokens)
- **Backend**: Node.js, Express.js, MySQL (mysql2 pool with prepared statements), JWT Authentication, bcryptjs
- **Database**: MySQL database (`careerforge_db`) with relational tables and JSON payload storage

---

## 📋 Step-by-Step Implementation: Candidate Profile Feature

This section documents the step-by-step process executed to build, integrate, and refine the **Candidate Profile** system across the database, backend API, and frontend user interface.

```
+-----------------------------------------------------------------------------------+
|                            CANDIDATE PROFILE WORKFLOW                             |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ Candidate Dashboard ]                                                          |
|       |                                                                           |
|       +--> Click "Complete Your Profile"                                          |
|                 |                                                                 |
|                 v                                                                 |
|  [ /candidate/profile ] <-------------------+                                     |
|       |                                     |                                     |
|       +--> Tabbed Profile Form              | Live Completion Calculation          |
|       |     - Personal Info & Bio           | (0% - 100% Strength Gauge)          |
|       |     - Education & CGPA              |                                     |
|       |     - Skills & Expertise            +-----------------------+             |
|       |     - Experience / Fresher Mode                             |             |
|       |     - Projects & Demos                                      |             |
|       |     - Certifications & Badges                               |             |
|       |     - Job Preferences                                       v             |
|       |                                                    [ Real-time Save ]     |
|       +--> Save per section (PUT /api/v1/candidates/profile) ------+              |
|                                                                    |              |
|                                                                    v              |
|                                                          ( MySQL Database )       |
|                                                     `candidate_profiles` Table    |
+-----------------------------------------------------------------------------------+
```

---

### Step 1: Database Schema & Migration (`schema.sql` & `initDb.js`)
- Designed and created the `candidate_profiles` MySQL table with a Foreign Key linked to `candidates(id)` (`ON DELETE CASCADE`).
- Included fields for:
  - Basic Profile Metadata: `headline`, `location`, `bio`, `open_to_work` (boolean), `is_fresher` (boolean), `no_certifications` (boolean).
  - Social Links: `linkedin_url`, `github_url`, `portfolio_url`.
  - Rich Complex Data (JSON columns): `education`, `skills`, `experience`, `projects`, `certifications`, `achievements`, `preferences`.
  - Strength Metric: `profile_completion` (INTEGER).

---

### Step 2: Backend Model & API Controllers (`candidateModel.js` & `candidateController.js`)
- **Model Methods (`CandidateModel`)**:
  - `findProfileByCandidateId(candidateId)`: Executes a `LEFT JOIN` between `candidates` (for account credentials like name, email, phone) and `candidate_profiles` (for detailed profile fields). Parses JSON attributes safely back into JavaScript arrays and objects.
  - `upsertProfile(candidateId, data)`: Uses MySQL `INSERT ... ON DUPLICATE KEY UPDATE` to atomically insert a new profile or update existing fields without data duplication.
- **API Endpoints (`candidateRoutes.js`)**:
  - `GET /api/v1/candidates/profile`: Returns authenticated candidate's complete profile.
  - `PUT /api/v1/candidates/profile`: Receives section updates, calculates profile score server-side if needed, and saves to database.
  - `POST /api/v1/candidates/profile/complete`: Endpoint to finalize profile status.
  - `GET /api/v1/candidates/dashboard`: Computes and returns candidate profile completion percentage alongside application stats.

---

### Step 3: Frontend Candidate Profile Page (`Profile.jsx`)
- Built a multi-tab profile editor component with tab navigation:
  1. **Personal Details**: Name, Email, Phone, Headline, Location, Bio, Social links, Open To Work status toggle.
  2. **Education**: Degree, Field, Institution, Start/End Year, Grade/CGPA.
  3. **Skills & Expertise**: Add/remove skill chips with skill levels (Beginner, Intermediate, Advanced, Expert).
  4. **Work Experience**: Job Title, Company, Location, Dates, Current Job toggle, plus **Fresher Mode toggle** (makes work experience optional).
  5. **Projects**: Project Title, Description, Tech Stack tags, Live Demo link, Repository link.
  6. **Certifications & Achievements**: Certificate Title, Issuer, Date, Credential URL, plus **No Certifications toggle**.
  7. **Job Preferences**: Target Job Titles, Preferred Locations, Employment Types, Expected Salary Range.

---

### Step 4: Live Completion Strength Calculation & Auto-Persistence
- Implemented real-time calculation logic for profile strength score:
  - Basic Details (20%)
  - Education (15%)
  - Skills (15%)
  - Work Experience OR Fresher Status (20%)
  - Projects (15%)
  - Certifications OR "No Certifications" status (10%)
  - Job Preferences (5%)
- Each tab features modular inline save buttons that send section updates to the backend with feedback toasts (`🎉 Profile section updated!`).

---

### Step 5: Dashboard Navigation Integration (`CandidateDashboard.jsx`)
- Configured the candidate dashboard home hero card.
- Updated the **"Complete Your Profile"** action button in `CandidateDashboard.jsx` to navigate directly to `/candidate/profile` using React Router's `navigate("/candidate/profile")`.

---

### Step 6: UI Refinement & Cleaner Experience
- Removed redundant/duplicate sticky footer banner ("Ready to submit your Candidate Profile?") from the bottom of `Profile.jsx` to ensure a clean, modern layout focused on tab editing.

---

## 🏢 Step-by-Step Implementation: Company Profile Feature

This section documents the end-to-end implementation of the corporate **Company Profile** management module, matching the design pattern and capabilities of the Candidate Profile section.

```
+-----------------------------------------------------------------------------------+
|                             COMPANY PROFILE WORKFLOW                              |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ Company Recruiter Dashboard ]                                                  |
|       |                                                                           |
|       +--> Click "Company Profile" Navigation                                     |
|                 |                                                                 |
|                 v                                                                 |
|  [ /company/profile ] <---------------------+                                     |
|       |                                     |                                     |
|       +--> Recruiter Header Hero Banner     | Live Completion Calculation         |
|       |     - Circular Logo Upload (Camera) | (0% - 100% Strength Gauge)          |
|       |     - Official Recruiter Chip       |                                     |
|       |     - 🟢 Verified / 🟡 Pending Badge+-----------------------+             |
|       |                                                             |             |
|       +--> Section 1: Basic Company Information                     v             |
|       +--> Section 2: Headquarters & Location Details        [ Real-time Save ]   |
|       +--> Section 3: Verification Document (Strictly 1 Doc)        |             |
|       +--> Section 4: Social & Web Links (LinkedIn, X, FB)          v             |
|       |                                                    ( MySQL Database )     |
|       +--> Per-Section Save (PUT /api/v1/companies/profile) `company_profiles`    |
|       +--> Logo & Doc Upload (Base64 Data URLs in DB)      `company_documents`   |
+-----------------------------------------------------------------------------------+
```

---

### Step 1: Database Schema & Dynamic Init (`schema.sql` & `initDb.js`)
- **`company_profiles` Table**:
  - `id` (INT AUTO_INCREMENT PRIMARY KEY)
  - `company_id` (INT UNIQUE, FOREIGN KEY to `companies(id)` ON DELETE CASCADE)
  - `logo_url` (`LONGTEXT` DEFAULT NULL - stores Base64 Data URLs directly in MySQL)
  - `industry`, `company_size`, `founded_year`, `headquarters`, `address`, `cin`
  - `social_links` (JSON column: `linkedinUrl`, `twitterUrl`, `facebookUrl`)
  - `profile_completion` (INTEGER strength metric)
- **`company_documents` Table**:
  - `id` (INT AUTO_INCREMENT PRIMARY KEY)
  - `company_id` (INT, FOREIGN KEY to `companies(id)` ON DELETE CASCADE)
  - `doc_name`, `doc_type`
  - `file_url` (`LONGTEXT` NOT NULL - stores Base64 Data URLs directly in MySQL)
  - `upload_date` (TIMESTAMP)
  - `verification_status` (`ENUM('pending', 'verified', 'rejected')`)
- **Automated Column Migration (`initDb.js`)**:
  - Automatically executes `ALTER TABLE` statements on server start to modify `logo_url` and `file_url` to `LONGTEXT`, ensuring support for large file base64 data strings without truncation.

---

### Step 2: Backend Models & API Controllers (`companyModel.js` & `companyController.js`)
- **Model Methods (`CompanyModel`)**:
  - `findFullProfile(companyId)`: Executes `LEFT JOIN` between `companies` and `company_profiles`, retrieves uploaded document, and parses `social_links` JSON safely.
  - `upsertProfile(companyId, data)`: Uses `INSERT ... ON DUPLICATE KEY UPDATE` to insert or update profile attributes atomically.
  - `updateLogo(companyId, logoUrl)` & `addDocument(companyId, doc)`: Updates logo and document URLs in MySQL.
  - `deleteDocument(docId, companyId)`: Removes specified document from database.
  - `updateVerificationStatus(companyId, status)`: Sets verification status (`pending`, `verified`, `rejected`).
- **In-Memory Upload Middleware (`uploadMiddleware.js`)**:
  - Uses `multer.memoryStorage()` so uploaded files remain in RAM buffers. No files or folders are created on disk under `uploads/`.
  - Converts uploaded logos and documents into Base64 Data URLs (`data:<mime>;base64,...`) and saves them directly into MySQL columns.
- **Express Server Configuration (`server.js`)**:
  - Configured `app.use(express.json({ limit: '50mb' }))` and `app.use(express.urlencoded({ limit: '50mb' }))` to process base64 upload payloads cleanly.
- **API Endpoints (`companyRoutes.js`)**:
  - `GET /api/v1/companies/profile` - Fetch full company profile.
  - `PUT /api/v1/companies/profile` - Save section details & calculate dynamic completion score.
  - `POST /api/v1/companies/profile/logo` - Upload company logo (Base64 DB storage).
  - `POST /api/v1/companies/profile/documents` - Upload verification document (Strictly 1 max allowed).
  - `DELETE /api/v1/companies/profile/documents/:docId` - Delete verification document.
  - `POST /api/v1/companies/profile/submit-verification` - Submit company profile for verification.

---

### Step 3: Recruiter Company Profile UI (`CompanyProfile.jsx`)
- **Hero Recruiter Header**:
  - Circular logo container with camera hover button (`Camera`) for quick logo updates.
  - Official recruiter chip & company headline.
  - Integrated verification status badge (`🟢 Verified`, `🟡 Verification Pending`, `🔴 Verification Rejected`) directly inside the top blue banner.
- **Profile Completion Gauge**:
  - Progress bar calculating dynamic completion percentage (0% - 100%).
  - Displays `"🎉 Excellent! Your company profile is 100% complete."` upon reaching 100%.
- **Section 1: Basic Company Information**: Company Name, Industry/Type, Verified Email, Phone, Website, Company Size, Founded Year.
- **Section 2: Headquarters & Location Details**: Headquarters City, Pincode (verified via India Post API), GSTIN (read-only verified), CIN Number, Detailed Street Address.
- **Section 3: Company Verification Documents**:
  - Strictly enforced **1 document max**.
  - `View` action button to inspect uploaded document base64 data.
  - `Remove` button with trash icon (`Trash2`) to delete document.
  - `[Submit Document for Verification]` button to request verification.
- **Section 4: Company Social & Web Links**: LinkedIn Page, Twitter / X Profile, Facebook Page (Glassdoor removed for clean profile structure).
- **Section Edit & Save Controls**: Individual section edit/save buttons (`Edit Basic Info`, `Save Basic Info`, etc.) matching candidate profile design.

---

### Step 4: System Dependencies & Prerequisites
- **Backend Dependencies**: `multer` (multipart processing), `mysql2` (MySQL pool), `express`, `jsonwebtoken`, `bcryptjs`.
- **Frontend Dependencies**: `lucide-react` (icons), `react-router-dom` (v7 navigation).

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- MySQL Server running locally on port `3306`

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your DB_PASSWORD in .env
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📄 Resume Builder Feature

CareerForge includes a full-featured **Resume Builder** that lets candidates create, preview, save, and download professionally formatted resumes directly from their profile data.

### Features

| Feature | Description |
|---|---|
| **Resume Templates** | 3 professionally designed templates: `modern`, `classic`, and `minimal`. Candidates can switch between templates live in the editor. |
| **Profile Completion Check** | Before building, the Resume Builder verifies that the candidate's profile is sufficiently complete (contact info, headline, etc.) and provides guidance if sections are missing. |
| **Resume Preview** | Real-time WYSIWYG preview of the resume as the candidate fills out each section. |
| **Save Resume** | Resumes can be saved and stored in the `candidate_resumes` database table for future editing. Saved resumes can be listed, retrieved, and deleted via the API. |
| **A4 PDF Download** | Generate a print-ready A4 PDF of any resume template for download. |

### Optional LLM Enhancement

The Resume Builder supports **optional LLM-powered enhancement** of resume content (e.g., summarizing experience, improving headlines). When configured, the backend sends the profile data to the LLM provider and returns enhanced content snippets. When LLM is **not** configured, the builder falls back to plain rendering so the feature remains fully functional.

#### Environment Variables

Add the following to your `.env` (copy the examples below into `.env.example` to share with your team — never commit real secrets):

```bash
# --- Resume Builder LLM Enhancement (OPTIONAL) ---
# Leave these unset to disable LLM enhancement (graceful fallback)
LLM_PROVIDER=                  # 'openai' | 'gemini' | 'openrouter'
OPENAI_API_KEY=               # Required if LLM_PROVIDER=openai
OPENAI_BASE_URL=https://api.openai.com/v1  # Override if using a proxy/custom endpoint
GEMINI_API_KEY=               # Required if LLM_PROVIDER=gemini
GEMINI_MODEL=                  # e.g., gemini-1.5-flash-latest
OPENROUTER_API_KEY=           # Required if LLM_PROVIDER=openrouter
OPENROUTER_MODEL=             # e.g., mistralai/mistral-7b-instruct
```

### API Endpoints

All resume endpoints are protected (`/api/v1/candidates/resume/*`) and require a valid JWT bearer token with the `candidate` role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/candidates/resume/profile-check` | Pre-build check — verifies profile completeness before generating a resume. |
| `GET` | `/api/v1/candidates/resume/templates` | Returns the list of available templates (`modern`, `classic`, `minimal`). |
| `POST` | `/api/v1/candidates/resume/generate` | Generates (renders) a resume from profile data + selected template. Returns JSON content (and optional LLM-enhanced text). |
| `POST` | `/api/v1/candidates/resume` | Saves a generated resume to the database. |
| `GET` | `/api/v1/candidates/resume` | Lists all saved resumes for the authenticated candidate. |
| `GET` | `/api/v1/candidates/resume/:id` | Retrieves a single saved resume by ID. |
| `DELETE` | `/api/v1/candidates/resume/:id` | Deletes a saved resume by ID. |
| `GET` | `/api/v1/candidates/resume/:id/pdf` | Downloads the resume as an A4 PDF. |

### Frontend

- The Resume Builder UI is located at `frontend/src/Pages/candidate/ResumeBuilder.jsx`.
- Accessible via the routes `/resume` and `/candidate/resume` (defined in `App.jsx`).

### Backend Architecture

- **Controller**: `backend/src/controllers/resumeController.js` — handles all resume API endpoints.
- **Model**: `backend/src/models/resumeModel.js` — MySQL data-access layer for the `candidate_resumes` table.
- **Services**:
  - `backend/src/services/resumeService.js` — orchestrates profile-checking, resume generation logic, and LLM calls.
  - `frontend/src/services/pdfService.js` → `backend/src/services/pdfService.js` — A4 PDF rendering.
  - `backend/src/services/llmService.js` — optional LLM provider abstraction (OpenAI, Gemini, OpenRouter).
- **Routes**: Resume routes are registered in `backend/src/routes/candidateRoutes.js`.
- **Database**: The `candidate_resumes` table is defined in `backend/src/database/schema.sql`.
