import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Briefcase,
  Bookmark,
  MapPin,
  Building,
  Sparkles,
  ArrowUpDown,
  Home,
  User,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  SlidersHorizontal,
  Calendar,
  DollarSign,
  Globe,
  Check,
  TrendingUp,
  Target,
  AlertCircle
} from "lucide-react";
import CandidateLayout from "../../Components/components/CandidateLayout";
import Button from "../../Components/components/Button";
import { jobs as initialMockJobs } from "../../data/mockData";
import API_BASE_URL from "../../utils/api";

export default function JobSearch() {
  const navigate = useNavigate();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'oldest' | 'match'
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // User interactions
  const [savedJobs, setSavedJobs] = useState({});
  const [appliedJobs, setAppliedJobs] = useState({});
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [showApplyBlockedModal, setShowApplyBlockedModal] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("jobs");
  const [jobsList, setJobsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Job Type Categories matching user request
  const jobTypes = [
    { label: "All", value: "All" },
    { label: "Remote", value: "Remote" },
    { label: "Full-time", value: "Full-time" },
    { label: "Internship", value: "Internship" },
    { label: "Part-time", value: "Part-time" },
    { label: "Contract", value: "Contract" },
  ];

  // Notification items
  const [notifications, setNotifications] = useState([]);

  // Load saved bookmarks & applied jobs from API & localStorage on mount
  useEffect(() => {
    try {
      const storedSaved = localStorage.getItem("savedJobs");
      if (storedSaved) {
        setSavedJobs(JSON.parse(storedSaved));
      }
    } catch (e) {
      console.warn("Could not load stored bookmarks", e);
    }

    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // 1. Fetch published jobs from backend API
    fetch(`${API_BASE_URL}/jobs`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setJobsList(data.data);
        }
      })
      .catch(() => {
        // Backend not available, continue with enriched mockData
      });

    // 2. Fetch candidate's submitted applications if authenticated
    if (token) {
      fetch(`${API_BASE_URL}/applications/me`, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            const appliedMap = {};
            const realNotifs = [];
            data.data.forEach((app) => {
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
            setAppliedJobs(appliedMap);
            setNotifications(realNotifs);
          }
        })
        .catch(() => { });

      // 3. Fetch candidate's profile to verify completion status
      fetch(`${API_BASE_URL}/candidates/profile`, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setCandidateProfile(data.data);
          }
        })
        .catch(() => { });
    }
  }, []);

  // Save bookmarked jobs to localStorage whenever updated
  const toggleBookmark = (jobId) => {
    setSavedJobs((prev) => {
      const updated = { ...prev, [jobId]: !prev[jobId] };
      try {
        localStorage.setItem("savedJobs", JSON.stringify(updated));
      } catch (e) {
        console.warn("Error saving bookmark", e);
      }
      return updated;
    });
  };

  const handleApply = async (jobId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (candidateProfile && (candidateProfile.profileCompletion < 100 || !candidateProfile.hasResume)) {
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
        setAppliedJobs((prev) => {
          const updated = { ...prev, [jobId]: true };
          try {
            localStorage.setItem("appliedJobs", JSON.stringify(updated));
          } catch (e) { }
          return updated;
        });
      } else if (res.status === 403 || (data.message && data.message.includes("save your resume before applying"))) {
        setShowApplyBlockedModal(true);
      } else {
        alert(data.message || "Could not submit application.");
      }
    } catch (e) {
      console.warn("Error submitting application", e);
    }
  };

  // Filter and Sort Logic (Ordered Newest to Oldest by default)
  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobsList];

    // 1. Filter by Job Type (All, Remote, Full-time, Internship, Part-time, Contract)
    if (selectedType !== "All") {
      const targetType = selectedType.toLowerCase();
      result = result.filter((job) => {
        if (targetType === "remote") {
          return job.workplace && job.workplace.toLowerCase() === "remote";
        }
        return (
          (job.type && job.type.toLowerCase().includes(targetType)) ||
          (job.workplace && job.workplace.toLowerCase().includes(targetType))
        );
      });
    }

    // 2. Filter by Search Query (Role title, company, location, skills)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q) ||
          (job.skills && job.skills.some((s) => s.toLowerCase().includes(q))) ||
          (job.category && job.category.toLowerCase().includes(q))
      );
    }

    // 3. Filter by Saved Only
    if (showSavedOnly) {
      result = result.filter((job) => savedJobs[job.id]);
    }

    // 4. Order from Newest to Oldest (Default) or other selected sort
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime();
      } else if (sortBy === "match") {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      return 0;
    });

    return result;
  }, [jobsList, selectedType, searchQuery, showSavedOnly, sortBy, savedJobs]);

  const savedCount = Object.values(savedJobs).filter(Boolean).length;
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <CandidateLayout activeNav="/jobs">
      <div className="job-search-page">
        <div className="search-main">
          <div className="search-container">

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

            {/* Immersive Search Hero Band */}
            <div className="search-hero-band">
              {/* Actions: Saved Filter & Notification Bell (inside banner) */}
              <div className="search-hero-actions">
                <button
                  type="button"
                  className={`bookmark-filter-btn ${showSavedOnly ? "active" : ""}`}
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                  title={showSavedOnly ? "Show all jobs" : "View bookmarked jobs"}
                >
                  <Bookmark size={17} className={showSavedOnly ? "fill-bookmark" : ""} />
                  <span>Marked ({savedCount})</span>
                </button>

                <button
                  type="button"
                  className="dashboard-icon-btn notification-toggle-btn"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  aria-label="Open Notifications"
                  title="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="notification-badge-count">{unreadCount}</span>
                  )}
                </button>
              </div>

              <span className="search-hero-chip">
                <Sparkles size={13} /> AI-Matched Results
              </span>
              <h2 className="search-hero-title">
                Discover Your Next Opportunity
              </h2>
              <p className="search-hero-subtitle">
                Curated roles ranked by AI match score for your profile
              </p>
              <div className="hero-mini-stats">
                <span className="hero-mini-stat">
                  <Briefcase size={13} /> {jobsList.length} live jobs
                </span>
                <span className="hero-mini-stat">
                  <TrendingUp size={13} /> Updated daily
                </span>
                <span className="hero-mini-stat">
                  <Target size={13} /> Match-ranked feed
                </span>
              </div>
            </div>

            {/* Search Bar Section */}
            <div className="search-bar-card pull-up">
              <div className="search-input-wrap">
                <Search size={20} className="search-input-icon" />
                <input
                  type="text"
                  className="search-input-field"
                  placeholder="Search by job title, company, required skill (e.g. React, Python), or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery("")}
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Job Type Selection Filter Buttons (All, Remote, Full-time, Internship, etc.) */}
            <div className="job-types-bar-wrapper">
              <div className="job-types-scroll-row">
                {jobTypes.map((type) => {
                  const isActive = selectedType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      className={`job-type-pill ${isActive ? "active" : ""}`}
                      onClick={() => {
                        setSelectedType(type.value);
                        setShowSavedOnly(false);
                      }}
                    >
                      {type.value === "Remote" && <Globe size={14} className="pill-icon" />}
                      {type.value === "Full-time" && <Briefcase size={14} className="pill-icon" />}
                      {type.value === "Internship" && <Sparkles size={14} className="pill-icon" />}
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controls Bar: Count Indicator & Ordering (Newest to Oldest) */}
            <div className="search-controls-bar">
              <div className="results-count-text">
                Showing <strong>{filteredAndSortedJobs.length}</strong> {filteredAndSortedJobs.length === 1 ? "job" : "jobs"}
                {selectedType !== "All" && ` in ${selectedType}`}
                {showSavedOnly && " (Marked)"}
              </div>

              {/* Order / Sort Selector */}
              <div className="sort-control-group">
                <label htmlFor="sort-select" className="sort-label">
                  <ArrowUpDown size={15} />
                  <span>Order:</span>
                </label>
                <select
                  id="sort-select"
                  className="sort-dropdown"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest to Oldest</option>
                  <option value="oldest">Oldest to Newest</option>
                  <option value="match">Highest AI Match</option>
                </select>
              </div>
            </div>

            {/* Job Listings Feed */}
            {filteredAndSortedJobs.length === 0 ? (
              <div className="empty-search-state">
                <div className="empty-icon-box">
                  <Search size={36} />
                </div>
                <h3>No jobs found</h3>
                <p>We could not find any openings matching your search or filters.</p>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ marginTop: "12px" }}
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedType("All");
                    setShowSavedOnly(false);
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="job-listings-grid">
                {filteredAndSortedJobs.map((job) => {
                  const isMarked = !!savedJobs[job.id];
                  const isApplied = !!appliedJobs[job.id];

                  return (
                    <div key={job.id} className="job-listing-card">
                      {/* Top Row: Match Score + Posted Date + Bookmark Button */}
                      <div className="job-card-header">
                        <div className="job-badge-cluster">
                          {job.matchScore && (
                            <span className="match-pill">{job.matchScore}% Match</span>
                          )}
                          <span className="posted-time-badge">
                            <Clock size={12} /> {job.postedAgo}
                          </span>
                        </div>

                        {/* Option to Mark (Save / Bookmark) Job */}
                        <button
                          type="button"
                          className={`bookmark-toggle-btn ${isMarked ? "is-marked" : ""}`}
                          onClick={() => toggleBookmark(job.id)}
                          title={isMarked ? "Remove from marked jobs" : "Mark / Save this job"}
                          aria-label="Bookmark Job"
                        >
                          <Bookmark size={18} className={isMarked ? "fill-current" : ""} />
                        </button>
                      </div>

                      {/* Job Title & Company */}
                      <div className="job-main-info">
                        <h2 className="job-card-title" style={{ cursor: "pointer" }}>
                          <Link to={`/jobs/${job.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                            {job.title}
                          </Link>
                        </h2>
                        <div className="company-details-row">
                          <span className="company-text">
                            <Building size={14} /> {job.company}
                          </span>
                          <span className="location-text">
                            <MapPin size={14} /> {job.location}
                          </span>
                          <span className="type-badge">{job.type}</span>
                          <span className="workplace-badge">{job.workplace}</span>
                        </div>
                      </div>

                      {/* Job Summary */}
                      <p className="job-summary-text">{job.summary}</p>

                      {/* Skill Tags */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="job-skill-chips-wrap">
                          {job.skills.map((skill, idx) => (
                            <span key={idx} className="skill-chip">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Salary & Action Buttons */}
                      <div className="job-listing-footer">
                        <div className="job-salary-block">
                          <span className="salary-figure">{job.salary}</span>
                          {job.experience && (
                            <span className="exp-figure"> • {job.experience}</span>
                          )}
                        </div>

                        <div className="job-footer-actions">
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
                            {isApplied ? "Applied ✓" : "Apply Now"}
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
