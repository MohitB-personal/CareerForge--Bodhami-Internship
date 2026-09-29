# CareerForge Frontend

CareerForge is a modern career and hiring platform frontend built with React and Vite. This project contains the user-facing pages for the landing page, login, and candidate/company registration flows, plus the authenticated candidate portal — a shared left-sidebar layout that hosts the candidate dashboard, job search, job details, and the My Applications tracking page (Screen 7).

## Prerequisites

Before running the project, make sure you have the following installed on your computer:

- Git
- Node.js 18+ or 20+
- npm (comes with Node.js)
- VS Code is recommended but not required

## Clone the project from GitHub

Open your terminal and run:

```bash
git clone <github-repository-url>
cd CareerForge/frontend
```

If the project was downloaded as a ZIP file instead of Git clone, extract it and then open the folder in a terminal:

```bash
cd path/to/CareerForge/frontend
```

## Install dependencies

Run this command inside the frontend folder:

```bash
npm install
```

This will install all required packages from the project dependencies and devDependencies.

## Start the development server

To run the app locally:

```bash
npm run dev
```

After the command starts successfully, Vite will show a local URL similar to:

```bash
http://localhost:5173
```

Open that URL in your browser to view the app.

## Useful commands

```bash
npm run dev
```
Starts the local development server with hot reload.

```bash
npm run build
```
Builds the project for production.

```bash
npm run preview
```
Previews the production build locally.

```bash
npm run lint
```
Runs ESLint checks on the project.

## Project structure

```bash
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── Components/
│   ├── data/
│   ├── Pages/
│   ├── utils/
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── package.json
├── vite.config.js
├── index.html
├── eslint.config.js
└── README.md
```

## Pages & routes

| Route | Page component | Description |
| --- | --- | --- |
| `/` | `Pages/LandingPage.jsx` | Public marketing landing page |
| `/login` | `Pages/LoginPage.jsx` | Login for candidates and companies |
| `/register/candidate` | `Pages/candidate/CandidateRegistration.jsx` | Candidate sign-up |
| `/register/company` | `Pages/company/CompanyRegistration.jsx` | Company sign-up |
| `/dashboard`, `/candidate/dashboard` | `Pages/candidate/CandidateDashboard.jsx` | Candidate dashboard (portal layout) |
| `/jobs`, `/candidate/jobs` | `Pages/candidate/JobSearch.jsx` | Job search (portal layout) |
| `/jobs/:id`, `/candidate/jobs/:id` | `Pages/candidate/JobDetails.jsx` | Job details (portal layout) |
| `/applications`, `/candidate/applications` | `Pages/candidate/MyApplications.jsx` | My Applications — Screen 7 (portal layout) |
| `*` (any unmatched URL) | `Pages/NotFound.jsx` | 404 page with an auth-aware back button |

## Candidate portal UI (authenticated pages)

All authenticated candidate pages (`/dashboard`, `/jobs`, `/jobs/:id`, `/applications`) render inside a shared portal layout:

- `src/Components/common/CandidateLayout.jsx` — sticky top Navbar + left Sidebar + fluid main content area with the Footer pinned to the bottom.
- `src/Components/common/CandidateSidebar.jsx` — left sidebar navigation with a MAIN NAVIGATION group (Dashboard, Job Search, My Applications, AI Career Tools, Profile), active-route highlighting using `var(--primary)`, "Active" / "AI" pill badges, and a footer user card with a quick Sign Out button.
- Responsive behavior: at ≤1200px the sidebar collapses into an icon rail; at ≤900px the sidebar hides and navigation moves to the Navbar's hamburger drawer; at ≤640px application cards and the timeline stepper compact for small screens.

### Navbar behavior (login-aware)

`src/Components/common/Navbar.jsx` detects authentication from `localStorage` (`token` / `user`):

- **Logged out:** the public marketing navbar is shown (Home, For Job Seekers, For Companies, Login, Get Started).
- **Logged in:** the top bar shows only the CareerForge brand. The public links, the Login / Get Started buttons, the section title, the notification bell, the user chip, and the top-bar Sign Out button are all suppressed. Sign-out lives in the sidebar footer (and in the mobile drawer on small screens).

### 404 page (auth-aware)

`Pages/NotFound.jsx` also checks `localStorage`: signed-in users get a **Back to Dashboard** button pointing to `/dashboard`, while logged-out visitors get **Back to Homepage** pointing to `/`. Note: the sidebar's "AI Career Tools" link points to `/ai-tools`, which is not routed yet, so it currently lands on this 404 page.

## My Applications page (Screen 7)

`Pages/candidate/MyApplications.jsx` tracks application status, interview schedules, and offers:

- Status filter tabs with live counts: **All Applications**, **Applied**, **In Review**, **Interview Scheduled**, **Selected / Offers**.
- Application cards showing role, company, location, and salary package, with a color-coded status pill (Applied = blue, In Review = amber, Interview Scheduled = purple, Selected = emerald).
- A four-step timeline per application: Submitted → Review → Interview → Offer.
- Interview schedule details when an interview is booked (e.g., Friday, 10:00 AM with the hiring team).
- Actions per card: **View Job Details** (links to `/jobs/:id`) and **Withdraw Application**.
- Dynamic sync: applications submitted from Job Search / Job Details are stored in `localStorage.appliedJobs` and automatically merged with the initial mock records when the page loads.

Auth-related `localStorage` keys used by the UI: `token`, `user`, `candidateName`, and `appliedJobs`.

## Important notes

- This is the frontend-only part of the project.
- You do not need a backend to run the UI locally.
- If you see missing package errors, run `npm install` again.
- If the port is already in use, Vite will automatically suggest another local port.
- If the app does not open, make sure Node.js is installed and the terminal is opened inside the `frontend` folder.

## Troubleshooting

### 1. `npm: command not found`
Install Node.js and npm, then restart the terminal.

### 2. `node_modules` missing or install errors
Run:

```bash
rm -rf node_modules package-lock.json
npm install
```

On Windows PowerShell, use:

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### 3. App not running on localhost
Try:

```bash
npm run dev -- --host 0.0.0.0
```

Then open the local URL shown in the terminal.

## Contribution notes

If you are making changes to the frontend:

1. Pull the latest code from GitHub.
2. Create a new branch.
3. Make your changes.
4. Run `npm install` if dependencies changed.
5. Test with `npm run build` before pushing.

## End

This project is ready to run locally after cloning the repository. If you follow the steps above, the frontend should work correctly on your machine.
