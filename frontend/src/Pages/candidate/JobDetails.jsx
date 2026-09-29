import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Bell,
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  Sparkles,
  Briefcase,
  Globe,
  DollarSign,
  Award,
  Users,
  Calendar,
  ExternalLink,
  Check,
  X,
  FileText,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import CandidateLayout from "../../Components/components/CandidateLayout";
import Button from "../../Components/components/Button";
import { jobs as mockJobs } from "../../data/mockData";
import API_BASE_URL from "../../utils/api";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMarked, setIsMarked] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [showApplyBlockedModal, setShowApplyBlockedModal] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  // Notifications matching dashboard/search
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "interview",
      title: "Interview Scheduled",
      description: "Tech Solutions Inc • Friday, 10:00 AM",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 2,
      type: "status",
      title: "Application In Review",
      description: "Designify Studios • UI/UX Designer role",
      time: "Yesterday",
      unread: true,
    },
    {
      id: 3,
      type: "match",
      title: "New Job Match",
      description: "4 new jobs matching your Frontend Developer profile",
      time: "2 days ago",
      unread: false,
    },
  ]);

  // Load Job data and check local applied/saved state
  useEffect(() => {
    setLoading(true);

    // 1. Check local saved states
    try {
      const saved = JSON.parse(localStorage.getItem("savedJobs") || "{}");
      if (saved[id]) setIsMarked(true);
    } catch (e) {
      console.warn("Could not parse localStorage", e);
    }

    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE_URL}/applications/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            const hasApplied = data.data.some((a) => String(a.jobId) === String(id));
            if (hasApplied) setIsApplied(true);
          }
        })
        .catch(() => { });

      fetch(`${API_BASE_URL}/candidates/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setCandidateProfile(data.data);
          }
        })
        .catch(() => { });
    }

    // 2. Fetch from backend API, or fall back to mock data
    fetch(`${API_BASE_URL}/jobs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setJob(data.data);
        } else {
          fallbackToMock();
        }
      })
      .catch(() => {
        fallbackToMock();
      })
      .finally(() => {
        setLoading(false);
      });

    function fallbackToMock() {
      const found = mockJobs.find((j) => j.id === id);
      if (found) {
        setJob(found);
      } else {
        // Fallback default if unknown id
        setJob(mockJobs[0]);
      }
    }
  }, [id]);

  const toggleBookmark = () => {
    if (!job) return;
    const newState = !isMarked;
    setIsMarked(newState);

    try {
      const saved = JSON.parse(localStorage.getItem("savedJobs") || "{}");
      saved[job.id] = newState;
      localStorage.setItem("savedJobs", JSON.stringify(saved));
    } catch (e) {
      console.warn("Could not save bookmark", e);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  const handleOpenApplyModal = () => {
    if (isApplied) return;
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (candidateProfile && (candidateProfile.profileCompletion < 100 || !candidateProfile.hasResume)) {
      setShowApplyBlockedModal(true);
      return;
    }
    setShowApplyModal(true);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    if (!job) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (candidateProfile && (candidateProfile.profileCompletion < 100 || !candidateProfile.hasResume)) {
      setShowApplyModal(false);
      setShowApplyBlockedModal(true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId: job.id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsApplied(true);
        setAppliedSuccess(true);
        try {
          const applied = JSON.parse(localStorage.getItem("appliedJobs") || "{}");
          applied[job.id] = true;
          localStorage.setItem("appliedJobs", JSON.stringify(applied));
        } catch (err) { }
        setTimeout(() => {
          setShowApplyModal(false);
          setAppliedSuccess(false);
        }, 2000);
      } else if (res.status === 403 || (data.message && data.message.includes("save your resume before applying"))) {
        setShowApplyModal(false);
        setShowApplyBlockedModal(true);
      } else {
        alert(data.message || "Failed to submit application.");
      }
    } catch (err) {
      console.warn("API application failed", err);
      alert("Failed to submit application. Please try again.");
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  if (loading) {
    return (
      <CandidateLayout activeNav="/jobs">
        <div className="job-details-page">
          <div className="details-container text-center" style={{ padding: "60px 0" }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: "16px", color: "var(--text-muted)" }}>
              Loading job details...
            </p>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  if (!job) {
    return (
      <CandidateLayout activeNav="/jobs">
        <div className="job-details-page">
          <div className="details-container text-center" style={{ padding: "60px 0" }}>
            <h2>Job Posting Not Found</h2>
            <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
              The job you are looking for may have expired or been removed.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/jobs")}
              style={{ marginTop: "16px" }}
            >
              Back to Job Search
            </Button>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout activeNav="/jobs">
      <div className="job-details-page">
        <div className="details-main">
          <div className="details-container">

            {/* Top Bar: Back Button, Notifications & Actions */}
            <div className="details-top-nav">
              <button
                type="button"
                className="back-btn-pill"
                onClick={() => navigate("/jobs")}
                title="Return to Job Search"
              >
                <ArrowLeft size={16} />
                <span>All Jobs</span>
              </button>

              <div className="details-top-actions">
                {/* Share Button */}
                <button
                  type="button"
                  className="dashboard-icon-btn"
                  onClick={handleShare}
                  title="Share this job"
                  aria-label="Share Job"
                >
                  <Share2 size={18} />
                </button>

                {/* Bookmark Button */}
                <button
                  type="button"
                  className={`dashboard-icon-btn ${isMarked ? "is-marked" : ""}`}
                  onClick={toggleBookmark}
                  title={isMarked ? "Remove from saved" : "Save this job"}
                  aria-label="Save Job"
                >
                  <Bookmark size={18} className={isMarked ? "fill-current" : ""} />
                </button>

                {/* Notification Bell */}
                <button
                  type="button"
                  className="dashboard-icon-btn notification-toggle-btn"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  aria-label="Open Notifications"
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="notification-badge-count">{unreadCount}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Copy Toast Alert */}
            {copyToast && (
              <div className="toast-banner alert-success">
                <Check size={16} />
                <span>Job link copied to clipboard!</span>
              </div>
            )}

            {/* Notifications Dropdown Drawer */}
            {isNotificationOpen && (
              <div className="notifications-dropdown-card">
                <div className="notifications-dropdown-header">
                  <div className="dropdown-title-wrap">
                    <Bell size={18} className="text-primary" />
                    <h3>Notifications</h3>
                    <span className="badge-chip">{unreadCount} new</span>
                  </div>
                  <button
                    type="button"
                    className="close-dropdown-btn"
                    onClick={() => setIsNotificationOpen(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="notifications-list">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.unread ? "unread-item" : ""}`}
                    >
                      <div className="notification-icon-dot">
                        {n.type === "interview" ? (
                          <Clock size={16} />
                        ) : n.type === "status" ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <Sparkles size={16} />
                        )}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{n.title}</div>
                        <div className="notification-desc">{n.description}</div>
                        <div className="notification-time">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="notifications-dropdown-footer">
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((item) => ({ ...item, unread: false }))
                      );
                    }}
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}

            {/* Job Hero Banner Card */}
            <div className="job-hero-card">
              <div className="job-hero-main">
                <div className="hero-badge-row">
                  {job.matchScore && (
                    <span className="hero-match-pill">
                      <Sparkles size={14} /> {job.matchScore}% Match for You
                    </span>
                  )}
                  <span className="hero-time-pill">
                    <Clock size={14} /> Posted {job.postedAgo || "recently"}
                  </span>
                </div>

                <h1 className="job-hero-title">{job.title}</h1>

                <div className="job-hero-company">
                  <Building size={18} className="text-primary" />
                  <span className="company-text-main">{job.company}</span>
                  <span className="divider-dot">•</span>
                  <span className="company-tagline">
                    {job.companyInfo?.tagline || "Verified Employer"}
                  </span>
                </div>

                <div className="job-meta-chips-grid">
                  <div className="meta-chip-item">
                    <MapPin size={16} className="chip-icon" />
                    <div>
                      <span className="chip-label">Location</span>
                      <strong className="chip-value">{job.location}</strong>
                    </div>
                  </div>

                  <div className="meta-chip-item">
                    <Briefcase size={16} className="chip-icon" />
                    <div>
                      <span className="chip-label">Job Type</span>
                      <strong className="chip-value">
                        {job.type} ({job.workplace})
                      </strong>
                    </div>
                  </div>

                  <div className="meta-chip-item">
                    <DollarSign size={16} className="chip-icon" />
                    <div>
                      <span className="chip-label">Compensation</span>
                      <strong className="chip-value">{job.salary}</strong>
                    </div>
                  </div>

                  <div className="meta-chip-item">
                    <Award size={16} className="chip-icon" />
                    <div>
                      <span className="chip-label">Experience</span>
                      <strong className="chip-value">{job.experience}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Hero Actions */}
              <div className="job-hero-cta">
                <Button
                  variant={isApplied ? "outline" : "primary"}
                  size="lg"
                  onClick={handleOpenApplyModal}
                  disabled={isApplied}
                  style={{ minWidth: "160px" }}
                >
                  {isApplied ? "Applied ✓" : "Apply Now"}
                </Button>
                <Button
                  variant={isMarked ? "primary" : "outline"}
                  size="lg"
                  onClick={toggleBookmark}
                  icon={Bookmark}
                >
                  {isMarked ? "Saved" : "Save Job"}
                </Button>
              </div>
            </div>

            {/* Main Content Layout: Left 2 Cols (Details) & Right 1 Col (Company Profile) */}
            <div className="job-content-grid">

              <div className="job-details-left">
                {/* 1. Role Overview */}
                <div className="detail-section-card">
                  <h2 className="section-heading">Job Overview</h2>
                  <p className="detail-paragraph">{job.summary}</p>
                </div>

                {/* 2. Key Responsibilities */}
                {job.responsibilities && job.responsibilities.length > 0 && (
                  <div className="detail-section-card">
                    <h2 className="section-heading">Key Responsibilities</h2>
                    <ul className="bullet-checklist">
                      {job.responsibilities.map((item, idx) => (
                        <li key={idx} className="bullet-item">
                          <CheckCircle2 size={18} className="bullet-icon" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3. Requirements & Qualifications */}
                {job.requirements && job.requirements.length > 0 && (
                  <div className="detail-section-card">
                    <h2 className="section-heading">Role Requirements & Qualifications</h2>
                    <ul className="bullet-checklist">
                      {job.requirements.map((req, idx) => (
                        <li key={idx} className="bullet-item">
                          <CheckCircle2 size={18} className="bullet-icon bullet-req" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 4. Required Skill Tags */}
                {job.skills && job.skills.length > 0 && (
                  <div className="detail-section-card">
                    <h2 className="section-heading">Required Skills & Technologies</h2>
                    <div className="skills-tags-cluster">
                      {job.skills.map((skill, idx) => (
                        <span key={idx} className="skill-detail-pill">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Benefits & Perks */}
                {job.benefits && job.benefits.length > 0 && (
                  <div className="detail-section-card">
                    <h2 className="section-heading">Perks & Compensation Benefits</h2>
                    <div className="benefits-grid">
                      {job.benefits.map((benefit, idx) => (
                        <div key={idx} className="benefit-card">
                          <div className="benefit-icon-wrap">
                            <Sparkles size={16} />
                          </div>
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Company Overview & Hiring Meta */}
              <div className="job-details-right">
                <div className="company-sidebar-card">
                  <div className="company-sidebar-header">
                    <div className="company-avatar-box">
                      <Building size={28} />
                    </div>
                    <div>
                      <h3 className="company-sidebar-name">{job.company}</h3>
                      <span className="industry-text">
                        {job.companyInfo?.industry || "Technology & Software"}
                      </span>
                    </div>
                  </div>

                  <p className="company-about-text">
                    {job.companyInfo?.tagline ||
                      "Leading organization building innovative solutions and fostering collaborative workplace cultures."}
                  </p>

                  <div className="company-meta-table">
                    <div className="meta-row">
                      <span className="meta-key">
                        <Users size={14} /> Company Size
                      </span>
                      <span className="meta-val">{job.companyInfo?.size || "50-250 Employees"}</span>
                    </div>

                    <div className="meta-row">
                      <span className="meta-key">
                        <Calendar size={14} /> Founded
                      </span>
                      <span className="meta-val">{job.companyInfo?.founded || "2019"}</span>
                    </div>

                    <div className="meta-row">
                      <span className="meta-key">
                        <MapPin size={14} /> Headquarters
                      </span>
                      <span className="meta-val">{job.companyInfo?.headquarters || job.location}</span>
                    </div>

                    {job.companyInfo?.website && (
                      <div className="meta-row">
                        <span className="meta-key">
                          <Globe size={14} /> Website
                        </span>
                        <a
                          href={job.companyInfo.website}
                          target="_blank"
                          rel="noreferrer"
                          className="meta-val website-link"
                        >
                          Visit Site <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="safety-badge-box">
                    <ShieldCheck size={20} className="shield-icon" />
                    <div>
                      <strong>Verified CareerForge Employer</strong>
                      <p>All job postings and compensation packages are verified by our team.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Floating Bar */}
            <div className="bottom-action-dock">
              <div className="dock-summary">
                <strong className="dock-title">{job.title}</strong>
                <span className="dock-meta">
                  {job.company} • {job.salary}
                </span>
              </div>

              <div className="dock-actions">
                <Button
                  variant={isMarked ? "primary" : "outline"}
                  size="md"
                  onClick={toggleBookmark}
                  icon={Bookmark}
                >
                  {isMarked ? "Saved" : "Save"}
                </Button>
                <Button
                  variant={isApplied ? "outline" : "primary"}
                  size="md"
                  onClick={handleOpenApplyModal}
                  disabled={isApplied}
                >
                  {isApplied ? "Applied ✓" : "Apply Now"}
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* Application Confirmation Modal */}
        {showApplyModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h3>Apply for {job.title}</h3>
                <button
                  type="button"
                  className="close-dropdown-btn"
                  onClick={() => setShowApplyModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {appliedSuccess ? (
                <div className="modal-success-body">
                  <CheckCircle2 size={48} className="text-success" />
                  <h4>Application Submitted!</h4>
                  <p>
                    Your profile and resume have been shared with <strong>{job.company}</strong>.
                    You can track this in <strong>My Applications</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={submitApplication} className="modal-form">
                  <p className="modal-intro">
                    You are submitting your application for <strong>{job.title}</strong> at{" "}
                    <strong>{job.company}</strong> ({job.location}).
                  </p>

                  <div className="modal-field-box">
                    <div className="field-label">Primary Contact</div>
                    <div className="field-val">
                      {localStorage.getItem("candidateName") || "Candidate"} (via CareerForge Profile)
                    </div>
                  </div>

                  <div className="modal-field-box">
                    <div className="field-label">Included Documents</div>
                    <div className="doc-chip">
                      <FileText size={16} />
                      <span>Candidate_Resume.pdf (ATS Match: {job.matchScore}%)</span>
                    </div>
                  </div>

                  <div className="modal-actions-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowApplyModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Confirm & Submit Application
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Candidate Profile Ineligible Application Blocked Modal */}
        {showApplyBlockedModal && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-card" style={{ maxWidth: "480px", textAlign: "center", padding: "32px 24px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <AlertCircle size={32} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                Application Blocked
              </h3>
              <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.55, marginBottom: "26px" }}>
                Please complete your profile and save your resume before applying for a job.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <Button variant="outline" onClick={() => setShowApplyBlockedModal(false)}>
                  Close
                </Button>
                <Button variant="primary" onClick={() => navigate("/candidate/profile")}>
                  Complete Profile
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </CandidateLayout>
  );
}
