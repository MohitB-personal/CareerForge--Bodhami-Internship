import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Sparkles,
  Bot,
  FileText,
  Target,
  LineChart,
  Bell,
  ShieldCheck,
  LogIn,
} from "lucide-react";

import Button from "../Components/components/Button";
import Footer from "../Components/components/Footer";
import Navbar from "../Components/components/Navbar";
import Particles from "../Components/components/Particles";

export default function LandingPage() {
  return (
    <div className="app-container home-page">
      {/* Full-page animated particle field. Fixed behind every
          section, tracks the cursor window-wide, and never
          blocks clicks (pointer-events: none). */}
      <div className="page-particles-bg" aria-hidden="true">
        <Particles
          particleColors={["#4e1ba6"]}
          particleCount={600}
          particleSpread={10}
          speed={0.5}
          particleBaseSize={100}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation
          pixelRatio={1}
        />
      </div>

      <Navbar />

      <main className="main-content">
        {/* ==================== HERO SECTION ==================== */}
        <section className="hero-section">
          <div className="hero-inner">
            {/* LEFT SIDE */}
            <div className="hero-left">
              <div className="hero-badge">
                <Sparkles size={16} />
                <span>Next-Gen Career & Hiring Platform</span>
              </div>

              <h1 className="hero-title">
                Forge Your Future, <span>Build Your Dream Team.</span>
              </h1>

              <p className="hero-description">
                CareerForge seamlessly connects ambitious candidates with top-tier companies. Whether you're building your profile, analyzing your career trajectory, or posting job openings, we accelerate your journey with AI-driven matching and transparency.
              </p>

              <div className="hero-actions">
                {/* Candidate Registration */}
                <Link to="/register/candidate" className="hero-action-link">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Get Started
                  </Button>
                </Link>

                {/* Company Registration */}
                <Link to="/register/company" className="hero-action-link">
                  <Button variant="outline" size="lg" icon={Building2}>
                    I'm a Company
                  </Button>
                </Link>

                {/* Login */}
                <Link to="/login" className="hero-action-link">
                  <Button variant="outline" size="lg" icon={LogIn}>
                    Login
                  </Button>
                </Link>
              </div>

              {/* HERO FEATURES */}
              <div className="hero-features">
                <div className="hero-feature-item">
                  <CheckCircle2 size={18} />
                  <span>AI Profile Analysis</span>
                </div>

                <div className="hero-feature-item">
                  <CheckCircle2 size={18} />
                  <span>Verified Companies</span>
                </div>

                <div className="hero-feature-item">
                  <CheckCircle2 size={18} />
                  <span>AI Candidate Matching</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== AUDIENCE SECTION ==================== */}
        <section className="audience-section" id="audience">
          <div className="section-container">
            <div className="section-header">
              <span className="section-subtitle">Tailored Solutions</span>
              <h2 className="section-title">Built for Candidates & Companies</h2>
            </div>

            <div className="grid-2">
              {/* ==================== CANDIDATES ==================== */}
              <div className="audience-card">
                <div>
                  <h3>For Candidates</h3>
                  <p>
                    Take complete control of your career path with personalized job discovery, AI feedback, and learning pathways.
                  </p>

                  <ul className="audience-list">
                    <li>
                      <CheckCircle2 size={18} />
                      <span>Create candidate account & build profile/resume</span>
                    </li>
                    <li>
                      <CheckCircle2 size={18} />
                      <span>Search and apply for relevant jobs</span>
                    </li>
                    <li>
                      <CheckCircle2 size={18} />
                      <span>AI profile analysis & AI mock interview</span>
                    </li>
                    <li>
                      <CheckCircle2 size={18} />
                      <span>Learning pathway & career progress tracking</span>
                    </li>
                    <li>
                      <CheckCircle2 size={18} />
                      <span>Track applications and real-time notifications</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <Link to="/register/candidate">
                    <Button
                      variant="primary"
                      fullWidth
                      icon={ArrowRight}
                      iconPosition="right"
                    >
                      Create Candidate Account
                    </Button>
                  </Link>
                </div>
              </div>

              {/* ==================== COMPANIES ==================== */}
              <div className="audience-card employer">
                <div>
                  <h3>For Companies</h3>
                  <p>
                    Streamline recruitment with verified organization profiles, intelligent candidate ranking, and applicant management.
                  </p>

                  <ul className="audience-list">
                    <li>
                      <CheckCircle2 size={18} />
                      <span>Register company & manage company profile</span>
                    </li>
                    <li>
                      <CheckCircle2 size={18} />
                      <span>Verify company details & GSTIN identification</span>
                    </li>
                    <li>
                      <CheckCircle2 size={18} />
                      <span>Create and manage job postings</span>
                    </li>
                    <li>
                      <CheckCircle2 size={18} />
                      <span>View applicants & application history</span>
                    </li>
                    <li>
                      <CheckCircle2 size={18} />
                      <span>AI-based candidate ranking and skill matching</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <Link to="/register/company">
                    <Button variant="secondary" fullWidth icon={Building2}>
                      Register Your Company
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== FEATURES SECTION ==================== */}
        <section className="features-section" id="features">
          <div className="section-container">
            <div className="section-header">
              <span className="section-subtitle">Platform Capabilities</span>
              <h2 className="section-title">Core CareerForge Features</h2>
            </div>

            <div className="grid-3">
              {/* AI PROFILE ANALYSIS & MOCK INTERVIEW */}
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Bot size={26} />
                </div>
                <h3>AI Profile & Mock Interview</h3>
                <p>
                  Get automated resume analysis, skill insights, and practice interactive mock interviews to boost your confidence.
                </p>
              </div>

              {/* AI CANDIDATE RANKING */}
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Target size={26} />
                </div>
                <h3>AI Candidate Matching</h3>
                <p>
                  Connect companies with top-fit talent using AI-driven skill alignment and applicant ranking systems.
                </p>
              </div>

              {/* LEARNING PATHWAY & CAREER PROGRESS */}
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <LineChart size={26} />
                </div>
                <h3>Learning Pathways</h3>
                <p>
                  Follow structured learning paths and monitor career progress to build the skills demanded by hiring companies.
                </p>
              </div>

              {/* APPLICATION TRACKING */}
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Bell size={26} />
                </div>
                <h3>Application Tracking</h3>
                <p>
                  Track candidate application statuses in real time and receive instant notifications for interview updates.
                </p>
              </div>

              {/* GSTIN & COMPANY VERIFICATION */}
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <ShieldCheck size={26} />
                </div>
                <h3>Verified Companies</h3>
                <p>
                  Validate business entities with GSTIN checking to ensure authentic job opportunities and trusted hiring.
                </p>
              </div>

              {/* RESUME BUILDER */}
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <FileText size={26} />
                </div>
                <h3>Resume Builder</h3>
                <p>
                  Craft clean, professional candidate profiles and downloadable resumes tailored to industry standards.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}