import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Briefcase,
  User,
  Sparkles,
  Home,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Building,
  Bookmark,
  ChevronRight,
  LogOut,
  X,
  Compass,
  FileText,
  Award,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import CandidateLayout from "../../Components/components/CandidateLayout";
import Button from "../../Components/components/Button";
import {
  readStoredUser,
  subscribeStoredUser,
  updateStoredUser,
  resolveImageSrc,
} from "../../utils/userSync";

import API_BASE_URL from "../../utils/api";

export default function CandidateDashboard() {
  const navigate = useNavigate();

  // User details state
  const [userName, setUserName] = useState("Candidate");
  const [userEmail, setUserEmail] = useState("");
  const [greeting, setGreeting] = useState("Good Morning");
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [showApplyBlockedModal, setShowApplyBlockedModal] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState({});
  const [savedJobs, setSavedJobs] = useState({});
  const [avatarUrl, setAvatarUrl] = useState("");

  // Dashboard Stats
  const [stats, setStats] = useState({
    applied: 0,
    shortlisted: 0,
    recommended: 0,
  });

  // Recommended Jobs & Notifications
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Calculate dynamic time greeting & retrieve user info on mount
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good Morning");
    } else if (hour < 17) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }

    const applyStoredUser = (user) => {
      const name = user?.fullName || user?.name || user?.full_name || localStorage.getItem("candidateName");
      if (name) setUserName(name);
      if (user?.email) setUserEmail(user.email);
      const nextAvatar = user?.profilePictureUrl || user?.logoUrl || localStorage.getItem("profilePictureUrl") || "";
      if (nextAvatar) {
        setAvatarUrl(nextAvatar);
      } else {
        setAvatarUrl("");
      }
    };

    try {
      const storedUser = readStoredUser();
      if (storedUser) {
        applyStoredUser(storedUser);
      } else {
        const storedName = localStorage.getItem("candidateName");
        if (storedName) setUserName(storedName);
        const directPic = localStorage.getItem("profilePictureUrl");
        if (directPic) setAvatarUrl(directPic);
      }
    } catch (e) {
      console.warn("Could not parse user from localStorage", e);
    }

    const unsubscribe = subscribeStoredUser(applyStoredUser);

    // Refresh stale snapshot data (e.g. right after login or a page refresh
    // when the login payload did not include the profile picture yet).
    const refreshSnapshot = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch(`${API_BASE_URL}/candidates/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();
        if (response.ok && result.success && result.data) {
          const pic = result.data.profilePictureUrl || "";
          const patch = { profilePictureUrl: pic };
          if (result.data.fullName) patch.fullName = result.data.fullName;
          updateStoredUser(patch);
          if (pic) {
            localStorage.setItem("profilePictureUrl", pic);
            setAvatarUrl(pic);
          }
        }
      } catch (e) {
        // Offline or logged out — keep the existing defaults
      }
    };
    refreshSnapshot();

    // Fetch dashboard data from backend if token is available
    const token = localStorage.getItem("token");
    // Fetch published jobs for recommended feed
    fetch(`${API_BASE_URL}/jobs`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setRecommendedJobs(data.data.slice(0, 3));
          setStats((prev) => ({ ...prev, recommended: data.data.length }));
        }
      })
      .catch(() => { });

    // Fetch candidate applications from backend if token is available
    if (token) {
      fetch(`${API_BASE_URL}/applications/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            const apps = data.data;
            const appliedMap = {};
            const realNotifs = [];

            apps.forEach((app) => {
              appliedMap[app.jobId] = true;
              realNotifs.push({
                id: app.id,
                type: app.status === "Interview Scheduled" || app.status === "Interview" ? "interview" : app.status === "Selected" ? "match" : "status",
                title: app.status === "Interview Scheduled" || app.status === "Interview" ? "Interview Scheduled" : `Application Status: ${app.status}`,
                description: `${app.company} • ${app.title}`,
                time: app.appliedDate || "Recently",
                unread: app.status !== "Applied",
              });
            });

            setAppliedJobs((prev) => ({ ...prev, ...appliedMap }));
            setNotifications(realNotifs);
            const shortlistedCount = apps.filter((a) => a.status === "Shortlisted" || a.status === "Interview" || a.status === "Interview Scheduled").length;
            setStats((prev) => ({
              ...prev,
              applied: apps.length,
              shortlisted: shortlistedCount,
            }));
          }
        })
        .catch(() => { });

      fetch(`${API_BASE_URL}/candidates/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success && result.data) {
            if (result.data.candidate?.fullName) {
              setUserName(result.data.candidate.fullName);
            }
            if (result.data.profileCompletion !== undefined) {
              setProfileCompletion(Number(result.data.profileCompletion) || 0);
            }
          }
        })
        .catch((err) => {
          console.warn("Backend dashboard fetch skipped.", err);
        });
    }
    return unsubscribe;
  }, []);

  const handleApply = async (jobId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (profileCompletion < 100) {
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
        body: JSON.stringify({ jobId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedJobs((prev) => ({ ...prev, [jobId]: true }));
        setStats((prev) => ({ ...prev, applied: prev.applied + 1 }));
      } else if (res.status === 403 || (data.message && data.message.includes("save your resume before applying"))) {
        setShowApplyBlockedModal(true);
      } else {
        alert(data.message || "Could not submit application.");
      }
    } catch (e) {
      console.warn("Application submit error", e);
    }
  };

  const handleSave = (jobId) => {
    setSavedJobs((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const unreadNotificationCount = (notifications || []).filter((n) => n.unread).length;

  return (
    <CandidateLayout activeNav="/dashboard">
      <div className="candidate-dashboard-page">
        <div className="dashboard-main">
          <div className="dashboard-container">

            {/* Immersive Hero: Greeting, Live Stats & Quick Actions */}
            <div className="dash-hero">
              <div className="dash-hero-main">
                <div className="dash-hero-avatar">
                  {avatarUrl ? (
                    <img
                      src={resolveImageSrc(avatarUrl)}
                      alt={userName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "50%",
                        display: "block",
                      }}
                      onError={() => setAvatarUrl("")}
                    />
                  ) : (
                    <User size={30} />
                  )}
                  <span className="online-indicator" title="Active"></span>
                </div>
                <div className="dash-hero-text">
                  <span className="dash-hero-eyebrow">Job Seeker Account</span>
                  <h1 className="dash-hero-title">
                    {greeting}, <span>{(userName || "Candidate").split(" ")[0]}</span>! 👋
                  </h1>
                  <p className="dash-hero-subtitle">
                    Here is your career overview and AI recommendations for
                    today.
                  </p>
                </div>
              </div>

              {/* Actions: Notifications & Logout (glass style on gradient) */}
              <div className="dash-hero-side">
                <button
                  type="button"
                  className="dashboard-icon-btn notification-toggle-btn"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  aria-label="Open Notifications"
                  title="Notifications"
                >
                  <Bell size={20} />
                  {unreadNotificationCount > 0 && (
                    <span className="notification-badge-count">{unreadNotificationCount}</span>
                  )}
                </button>

                <button
                  type="button"
                  className="dashboard-icon-btn logout-action-btn"
                  onClick={handleLogout}
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={19} />
                </button>
              </div>

              {/* Live snapshot chips */}
              <div className="dash-hero-stats">
                <span className="dash-hero-chip">
                  <Briefcase size={14} /> {stats.applied} active applications
                </span>
                <span className="dash-hero-chip">
                  <CheckCircle2 size={14} /> {stats.shortlisted} shortlisted
                </span>
                <span className="dash-hero-chip">
                  <Sparkles size={14} /> {profileCompletion}% profile strength
                </span>
              </div>

              {/* Quick actions */}
              <div className="dash-quick-actions">
                <button
                  type="button"
                  className="dash-quick-pill"
                  onClick={() => navigate("/jobs")}
                >
                  <Search size={15} /> Browse Jobs
                </button>
                <button
                  type="button"
                  className="dash-quick-pill"
                  onClick={() => navigate("/applications")}
                >
                  <FileText size={15} /> My Applications
                </button>
                <button
                  type="button"
                  className="dash-quick-pill"
                  onClick={() => navigate("/ai-tools")}
                >
                  <Sparkles size={15} /> Learn With AI
                </button>
                <button
                  type="button"
                  className="dash-quick-pill"
                  onClick={() => navigate("/candidate/profile")}
                >
                  <User size={15} /> My Profile
                </button>
              </div>
            </div>

            {/* Notifications Dropdown Drawer */}
            {isNotificationOpen && (
              <div className="notifications-dropdown-card">
                <div className="notifications-dropdown-header">
                  <div className="dropdown-title-wrap">
                    <Bell size={18} className="text-primary" />
                    <h3>Notifications</h3>
                    <span className="badge-chip">{unreadNotificationCount} new</span>
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

            {/* Profile Completion Card (Wireframe Component) */}
            <div className="profile-completion-card">
              <div className="profile-completion-left">
                <div className="completion-icon-box">
                  <Award size={28} />
                </div>
                <div className="completion-info">
                  <div className="completion-title-row">
                    <h3>Profile Completion</h3>
                    <span className="completion-percentage">{profileCompletion}%</span>
                  </div>
                  <p className="completion-helper-text">
                    Complete your skills and resume to increase job visibility and AI ATS match score.
                  </p>
                  {/* Progress Bar */}
                  <div className="profile-progress-bar-wrap">
                    <div
                      className="profile-progress-fill"
                      style={{ width: `${profileCompletion}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="profile-completion-right">
                <button
                  type="button"
                  className="complete-profile-btn"
                  onClick={() => navigate("/candidate/profile")}
                >
                  <span>Complete Your Profile</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* 3 Metric Cards Row (Wireframe: [12] [3] [18]) */}
            <div className="stats-metrics-grid v2">
              <div className="metric-stat-card card-applied">
                <div className="metric-header">
                  <span className="metric-label">Applied</span>
                  <span className="metric-icon-badge icon-applied">
                    <FileText size={18} />
                  </span>
                </div>
                <div className="metric-value">{stats.applied}</div>
                <div className="metric-trend positive">
                  <TrendingUp size={14} /> Active job applications
                </div>
              </div>

              <div className="metric-stat-card card-shortlisted">
                <div className="metric-header">
                  <span className="metric-label">Shortlisted</span>
                  <span className="metric-icon-badge icon-shortlisted">
                    <CheckCircle2 size={18} />
                  </span>
                </div>
                <div className="metric-value">{stats.shortlisted}</div>
                <div className="metric-trend positive">
                  <TrendingUp size={14} /> Interview stages reached
                </div>
              </div>

              <div className="metric-stat-card card-recommended">
                <div className="metric-header">
                  <span className="metric-label">Recommended</span>
                  <span className="metric-icon-badge icon-recommended">
                    <Sparkles size={18} />
                  </span>
                </div>
                <div className="metric-value">{stats.recommended}</div>
                <div className="metric-trend positive">
                  <Compass size={14} /> AI matched opportunities
                </div>
              </div>
            </div>

            {/* Recommended For You Section */}
            <div className="dashboard-section-block">
              <div className="section-header-row">
                <div>
                  <h2 className="section-title">Recommended For You</h2>
                  <p className="section-subtitle">
                    AI-curated opportunities matching your skill profile
                  </p>
                </div>
                <button
                  type="button"
                  className="view-all-link-btn"
                  onClick={() => {
                    setActiveSection("jobs");
                    navigate("/jobs");
                  }}
                >
                  <span>View All Jobs</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Recommended Job Cards Feed */}
              {recommendedJobs.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", background: "var(--bg-subtle, #f8fafc)", borderRadius: "12px" }}>
                  <Briefcase size={32} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
                  <h4 style={{ margin: "0 0 4px", fontSize: "1rem" }}>No active job openings yet</h4>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Check back soon as companies post new opportunities.</p>
                </div>
              ) : (
                <div className="recommended-jobs-list">
                  {recommendedJobs.map((job) => {
                    const isApplied = appliedJobs[job.id];
                    const isSaved = savedJobs[job.id];

                    return (
                      <div key={job.id} className="recommended-job-card">
                        <div className="job-card-top">
                          <div className="job-role-info">
                            <span className="match-pill">{job.matchScore || "90% Match"}</span>
                            <h3 className="job-title" style={{ cursor: "pointer" }}>
                              <Link to={`/jobs/${job.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                {job.title}
                              </Link>
                            </h3>
                            <div className="company-meta-row">
                              <span className="company-name">
                                <Building size={14} /> {job.company}
                              </span>
                              <span className="location-name">
                                <MapPin size={14} /> {job.location}
                              </span>
                              <span className="workplace-tag">{job.workplace || job.type}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`save-job-btn ${isSaved ? "saved-active" : ""}`}
                            onClick={() => handleSave(job.id)}
                            title={isSaved ? "Remove from saved" : "Save job"}
                            aria-label="Save Job"
                          >
                            <Bookmark size={18} />
                          </button>
                        </div>

                        <p className="job-description-preview">{job.summary || job.description}</p>

                        {/* Skill Tags */}
                        {job.skills && job.skills.length > 0 && (
                          <div className="job-skills-wrap">
                            {job.skills.map((skill, idx) => (
                              <span key={idx} className="skill-chip">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Job Card Footer */}
                        <div className="job-card-footer">
                          <div className="salary-package-text">
                            <strong>{job.salary}</strong>
                            <span className="exp-text"> • {job.experience}</span>
                          </div>

                          <div className="job-action-buttons">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/jobs/${job.id}`)}
                            >
                              Details
                            </Button>
                            <Button
                              variant={isApplied ? "outline" : "primary"}
                              size="sm"
                              onClick={() => handleApply(job.id)}
                              disabled={isApplied}
                            >
                              {isApplied ? "Applied ✓" : "Apply"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

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
    </CandidateLayout>
  );
}
