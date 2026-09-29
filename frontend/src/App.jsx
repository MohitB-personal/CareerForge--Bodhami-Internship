import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CandidateRegistration from "./Pages/candidate/CandidateRegistration";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import JobSearch from "./pages/candidate/JobSearch";
import JobDetails from "./pages/candidate/JobDetails";
import MyApplications from "./pages/candidate/MyApplications";
import CompanyRegistration from "./pages/company/CompanyRegistration";
import NotFound from "./pages/NotFound";
import "./App.css";
import EmailVerification from "./Pages/auth/EmailVerification";
import LearnWithAI from "./pages/candidate/LearnWithAI";
import AIProfileAnalysis from "./pages/candidate/AIProfileAnalysis";
import MockInterview from "./pages/candidate/MockInterview";
import LearningPathway from "./pages/candidate/LearningPathway";
import CareerProgress from "./pages/candidate/CareerProgress";
import Courses from "./pages/candidate/Courses";
import Profile from "./pages/candidate/Profile";
import ResumeBuilder from "./pages/candidate/ResumeBuilder";
import CompanyDashboard from "./Pages/company/CompanyDashboard";
import ManageJobPostings from "./Pages/company/ManageJobPostings";
import CreateJobPosting from "./Pages/company/CreateJobPosting";
import CompanyCandidates from "./Pages/company/CompanyCandidates";
import AICandidateRanking from "./Pages/company/AICandidateRanking";
import CompanyProfile from "./Pages/company/CompanyProfile";
import OAuthCallback from "./Pages/auth/OAuthCallback";
import ForgotPasswordPage from "./Pages/auth/ForgotPasswordPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register/candidate" element={<CandidateRegistration />} />
        <Route path="/register/company" element={<CompanyRegistration />} />
        <Route path="/company/dashboard" element={<CompanyDashboard />} />
        <Route path="/company/jobs" element={<ManageJobPostings />} />
        <Route path="/company/jobs/create" element={<CreateJobPosting />} />
        <Route path="/company/candidates" element={<CompanyCandidates />} />
        <Route path="/company/candidates/ranking" element={<AICandidateRanking />} />
        <Route path="/company/profile" element={<CompanyProfile />} />
        <Route path="/dashboard" element={<CandidateDashboard />} />
        <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
        <Route path="/jobs" element={<JobSearch />} />
        <Route path="/candidate/jobs" element={<JobSearch />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/candidate/jobs/:id" element={<JobDetails />} />
        <Route path="/applications" element={<MyApplications />} />
        <Route path="/candidate/applications" element={<MyApplications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/candidate/profile" element={<Profile />} />
        <Route path="/resume" element={<ResumeBuilder />} />
        <Route path="/candidate/resume" element={<ResumeBuilder />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        {/* Learn With AI hub + AI tool pages (sidebar "AI Career Tools") */}
        <Route path="/ai-tools" element={<LearnWithAI />} />
        <Route path="/candidate/ai-tools" element={<LearnWithAI />} />
        <Route path="/ai-tools/profile-analysis" element={<AIProfileAnalysis />} />
        <Route path="/candidate/ai-tools/profile-analysis" element={<AIProfileAnalysis />} />
        <Route path="/ai-tools/mock-interview" element={<MockInterview />} />
        <Route path="/candidate/ai-tools/mock-interview" element={<MockInterview />} />
        <Route path="/ai-tools/learning-pathway" element={<LearningPathway />} />
        <Route path="/candidate/ai-tools/learning-pathway" element={<LearningPathway />} />
        <Route path="/ai-tools/career-progress" element={<CareerProgress />} />
        <Route path="/candidate/ai-tools/career-progress" element={<CareerProgress />} />
        <Route path="/ai-tools/courses" element={<Courses />} />
        <Route path="/candidate/ai-tools/courses" element={<Courses />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
