import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Building,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Search,
  Bell,
  X,
  Filter,
  ArrowRight,
  Briefcase,
  Sparkles,
  TrendingUp
} from "lucide-react";
import CandidateLayout from "../../Components/components/CandidateLayout";
import Button from "../../Components/components/Button";
import { jobs as mockJobs, candidateApplications as initialMockApps } from "../../data/mockData";
import API_BASE_URL from "../../utils/api";

export default function MyApplications() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(null);

  // Notification items (populated dynamically from applications)
  const [notifications, setNotifications] = useState([]);

  // Applications dataset (empty by default)
  const baseApplications = [];

  // Fetch real candidate applications from backend API
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      fetch(`${API_BASE_URL}/applications/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setApplications(data.data);
            const realNotifs = data.data.map((app) => ({
              id: app.id,
              type: app.status === "Interview Scheduled" || app.status === "Interview" ? "interview" : app.status === "Selected" ? "match" : "status",
              title: app.status === "Interview Scheduled" || app.status === "Interview" ? "Interview Scheduled" : `Application Status: ${app.status}`,
              description: `${app.company} • ${app.title}`,
              time: app.appliedDate || "Recently",
              unread: app.status !== "Applied",
            }));
            setNotifications(realNotifs);
          } else {
            setApplications([]);
            setNotifications([]);
          }
        })
        .catch(() => {
          setApplications([]);
          setNotifications([]);
        });
    } else {
      setApplications([]);
      setNotifications([]);
    }

    function loadLocalApplications() {
      try {
        const appliedMap = JSON.parse(localStorage.getItem("appliedJobs") || "{}");
        const dynamicApps = [...baseApplications];

        Object.keys(appliedMap).forEach((jobId) => {
          if (appliedMap[jobId] && !dynamicApps.some((a) => a.jobId === jobId)) {
            const matchedJob = mockJobs.find((j) => String(j.id) === String(jobId));
            if (matchedJob) {
              dynamicApps.unshift({
                id: `app-dynamic-${jobId}`,
                jobId: matchedJob.id,
                title: matchedJob.title,
                company: matchedJob.company,
                location: matchedJob.location,
                salary: matchedJob.salary,
                type: matchedJob.type,
                appliedDate: "Just now",
                status: "Applied",
                step: 1,
                interviewDate: null,
                note: "Application submitted via CareerForge Quick Apply.",
              });
            }
          }
        });

        setApplications(dynamicApps);
      } catch (e) {
        setApplications(baseApplications);
      }
    }
  }, []);

  // Compute counts for status tabs
  const counts = useMemo(() => {
    return {
      all: applications.length,
      applied: applications.filter((a) => a.status === "Applied").length,
      inReview: applications.filter((a) => a.status === "In Review" || a.status === "Under Review").length,
      interview: applications.filter((a) => a.status === "Interview Scheduled" || a.status === "Interview" || a.status === "Shortlisted").length,
      selected: applications.filter((a) => a.status === "Selected").length,
    };
  }, [applications]);

  // Filter applications by Tab and Search query
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // 1. Tab filter
      if (activeTab === "Applied" && app.status !== "Applied") return false;
      if (activeTab === "In Review" && app.status !== "In Review" && app.status !== "Under Review") return false;
      if (activeTab === "Interview" && app.status !== "Interview Scheduled" && app.status !== "Interview" && app.status !== "Shortlisted") return false;
      if (activeTab === "Selected" && app.status !== "Selected") return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          app.title.toLowerCase().includes(q) ||
          app.company.toLowerCase().includes(q) ||
          app.location.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [applications, activeTab, searchQuery]);

  const handleWithdraw = async (appId) => {
    setApplications((prev) => prev.filter((a) => a.id !== appId));
    setWithdrawModal(null);

    const token = localStorage.getItem("token");
    if (token && !String(appId).startsWith("app-dynamic")) {
      try {
        await fetch(`${API_BASE_URL}/applications/${appId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) { }
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <CandidateLayout activeNav="/applications">
      <div className="applications-page-view">

        {/* Immersive Applications Hero */}
        <div className="apps-hero">
          <div className="apps-hero-top">
            <div className="apps-hero-text">
              <span className="apps-hero-eyebrow">Application Tracker</span>
              <h1 className="apps-hero-title">My Applications</h1>
              <p className="apps-hero-subtitle">
                Track the progress of your submitted applications and interview
                stages
              </p>
            </div>

            <div className="header-action-cluster">
              <button
                type="button"
                className="dashboard-icon-btn notification-toggle-btn"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                aria-label="Open Notifications"
                title="Notifications"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="notification-badge-count">{unreadCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* Live Pipeline Stats */}
          <div className="apps-stats-strip">
            <div className="apps-stat-tile tone-total">
              <FileText size={17} />
              <div>
                <strong>{counts.all}</strong>
                <span>Total</span>
              </div>
            </div>
            <div className="apps-stat-tile tone-review">
              <Clock size={17} />
              <div>
                <strong>{counts.inReview}</strong>
                <span>In Review</span>
              </div>
            </div>
            <div className="apps-stat-tile tone-interview">
              <Calendar size={17} />
              <div>
                <strong>{counts.interview}</strong>
                <span>Interviews</span>
              </div>
            </div>
            <div className="apps-stat-tile tone-selected">
              <Sparkles size={17} />
              <div>
                <strong>{counts.selected}</strong>
                <span>Selected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Dropdown */}
        {isNotificationOpen && (
          <div className="notifications-dropdown-card" style={{ top: "80px", right: "24px" }}>
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
                <div key={n.id} className={`notification-item ${n.unread ? "unread-item" : ""}`}>
                  <div className="notification-icon-dot">
                    {n.type === "interview" ? <Clock size={16} /> : <CheckCircle2 size={16} />}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{n.title}</div>
                    <div className="notification-desc">{n.description}</div>
                    <div className="notification-time">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter Tabs Container */}
        <div className="applications-controls-card">
          {/* Status Tabs Matching Wireframe: Applied (4), In Review (2), Interview (1), Selected (1) */}
          <div className="status-tabs-row">
            <button
              type="button"
              className={`status-tab-btn ${activeTab === "All" ? "active" : ""}`}
              onClick={() => setActiveTab("All")}
            >
              <span>All</span>
              <span className="tab-count-badge">{counts.all}</span>
            </button>

            <button
              type="button"
              className={`status-tab-btn ${activeTab === "Applied" ? "active" : ""}`}
              onClick={() => setActiveTab("Applied")}
            >
              <span>Applied</span>
              <span className="tab-count-badge">{counts.applied}</span>
            </button>

            <button
              type="button"
              className={`status-tab-btn ${activeTab === "In Review" ? "active" : ""}`}
              onClick={() => setActiveTab("In Review")}
            >
              <span>In Review</span>
              <span className="tab-count-badge badge-warning">{counts.inReview}</span>
            </button>

            <button
              type="button"
              className={`status-tab-btn ${activeTab === "Interview" ? "active" : ""}`}
              onClick={() => setActiveTab("Interview")}
            >
              <span>Interview</span>
              <span className="tab-count-badge badge-primary">{counts.interview}</span>
            </button>

            <button
              type="button"
              className={`status-tab-btn ${activeTab === "Selected" ? "active" : ""}`}
              onClick={() => setActiveTab("Selected")}
            >
              <span>Selected</span>
              <span className="tab-count-badge badge-success">{counts.selected}</span>
            </button>
          </div>

          {/* Search Field */}
          <div className="application-search-wrap">
            <Search size={17} className="search-icon" />
            <input
              type="text"
              className="application-search-input"
              placeholder="Search your applications by role, company, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Applications List Feed */}
        {filteredApplications.length === 0 ? (
          <div className="empty-search-state">
            <div className="empty-icon-box">
              <FileText size={36} />
            </div>
            <h3>No applications found</h3>
            <p>You do not have any applications matching the selected status or query.</p>
            <Button
              variant="primary"
              onClick={() => navigate("/jobs")}
              style={{ marginTop: "12px" }}
            >
              Explore Open Jobs
            </Button>
          </div>
        ) : (
          <div className="applications-feed">
            {filteredApplications.map((app) => {
              const statusClass =
                app.status === "Selected"
                  ? "status-selected"
                  : app.status === "Interview Scheduled"
                    ? "status-interview"
                    : app.status === "In Review"
                      ? "status-review"
                      : "status-applied";

              return (
                <div key={app.id} className="application-card">
                  {/* Card Header: Role, Company, Status Pill */}
                  <div className="app-card-top">
                    <div className="app-role-block">
                      <h2 className="app-job-title">
                        <Link to={`/jobs/${app.jobId}`} className="job-link-title">
                          {app.title}
                        </Link>
                      </h2>
                      <div className="app-company-meta">
                        <span className="meta-company">
                          <Building size={14} /> {app.company}
                        </span>
                        <span className="meta-location">
                          <MapPin size={14} /> {app.location}
                        </span>
                        <span className="meta-type">{app.type}</span>
                        <span className="meta-salary">{app.salary}</span>
                      </div>
                    </div>

                    <div className={`status-pill ${statusClass}`}>
                      {app.status === "Selected" ? (
                        <Sparkles size={14} />
                      ) : app.status === "Interview Scheduled" ? (
                        <Clock size={14} />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      <span>{app.status}</span>
                    </div>
                  </div>

                  {/* Interview Schedule Callout (if active) */}
                  {app.interviewDate && (
                    <div className="interview-callout-box">
                      <Calendar size={18} className="calendar-icon" />
                      <div>
                        <strong>Upcoming Interview Scheduled:</strong>
                        <p>{app.interviewDate}</p>
                      </div>
                    </div>
                  )}

                  {/* Application Note / Status Description */}
                  <p className="app-note-text">{app.note}</p>

                  {/* 4-Step Progress Stepper */}
                  <div className="application-stepper-wrap">
                    <div className={`step-item ${app.step >= 1 ? "completed" : ""}`}>
                      <div className="step-circle">1</div>
                      <span className="step-text">Submitted</span>
                    </div>
                    <div className={`step-line ${app.step >= 2 ? "active" : ""}`}></div>

                    <div className={`step-item ${app.step >= 2 ? "completed" : ""}`}>
                      <div className="step-circle">2</div>
                      <span className="step-text">In Review</span>
                    </div>
                    <div className={`step-line ${app.step >= 3 ? "active" : ""}`}></div>

                    <div className={`step-item ${app.step >= 3 ? "completed" : ""}`}>
                      <div className="step-circle">3</div>
                      <span className="step-text">Interview</span>
                    </div>
                    <div className={`step-line ${app.step >= 4 ? "active" : ""}`}></div>

                    <div className={`step-item ${app.step >= 4 ? "completed" : ""}`}>
                      <div className="step-circle">4</div>
                      <span className="step-text">Decision</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="app-card-footer">
                    <span className="applied-date-info">
                      <Clock size={14} /> Applied on: <strong>{app.appliedDate}</strong>
                    </span>

                    <div className="app-card-actions">
                      <button
                        type="button"
                        className="btn-withdraw"
                        onClick={() => setWithdrawModal(app)}
                      >
                        Withdraw
                      </button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/jobs/${app.jobId}`)}
                        icon={ArrowRight}
                        iconPosition="right"
                      >
                        View Job Details
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Withdraw Application Confirmation Modal */}
      {withdrawModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Withdraw Application</h3>
              <button
                type="button"
                className="close-dropdown-btn"
                onClick={() => setWithdrawModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            <p className="modal-intro">
              Are you sure you want to withdraw your application for{" "}
              <strong>{withdrawModal.title}</strong> at{" "}
              <strong>{withdrawModal.company}</strong>?
            </p>
            <div className="modal-actions-row">
              <Button
                variant="outline"
                onClick={() => setWithdrawModal(null)}
              >
                Keep Application
              </Button>
              <Button
                variant="danger"
                onClick={() => handleWithdraw(withdrawModal.id)}
              >
                Confirm Withdraw
              </Button>
            </div>
          </div>
        </div>
      )}
    </CandidateLayout>
  );
}
