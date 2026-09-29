import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CompanyLayout from "../../Components/CompanyLayout";
import Button from "../../Components/components/Button";
import API_BASE_URL from "../../utils/api";
import {
    BriefcaseBusiness,
    Users,
    UserCheck,
    CalendarCheck,
    Plus,
    ArrowRight,
    Clock3,
    MapPin,
    FileText,
    TrendingUp,
    Search,
    X,
    AlertCircle,
} from "lucide-react";

const CompanyDashboard = () => {
    const navigate = useNavigate();
    const [companyName, setCompanyName] = useState("Your Company");
    const [searchQuery, setSearchQuery] = useState("");
    const [liveStats, setLiveStats] = useState({
        activeJobs: 0,
        totalApps: 0,
        shortlisted: 0,
        interviews: 0,
    });
    const [recentJobsList, setRecentJobsList] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [companyProfile, setCompanyProfile] = useState(null);
    const [showIneligibleModal, setShowIneligibleModal] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("user");
            if (stored) {
                const parsed = JSON.parse(stored);
                const name =
                    parsed.companyName ||
                    parsed.company_name ||
                    parsed.name ||
                    localStorage.getItem("companyName");
                if (name) setCompanyName(name);
            } else {
                const directName = localStorage.getItem("companyName");
                if (directName) setCompanyName(directName);
            }
        } catch (e) {
            console.warn("Could not read company user in dashboard", e);
        }

        const token = localStorage.getItem("token");
        if (token) {
            // Fetch company jobs
            fetch(`${API_BASE_URL}/jobs/company/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && Array.isArray(data.data)) {
                        const activeCount = data.data.filter((j) => j.status === "published").length;
                        setLiveStats((prev) => ({ ...prev, activeJobs: activeCount }));
                        setRecentJobsList(
                            data.data.slice(0, 3).map((j) => ({
                                title: j.title,
                                location: j.location,
                                applications: j.applicationCount || 0,
                                status: j.status === "published" ? "Active" : "Closed",
                                posted: j.postedAgo || "Recently",
                            }))
                        );
                    }
                })
                .catch(() => { });

            // Fetch company applications
            fetch(`${API_BASE_URL}/applications/company/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && Array.isArray(data.data)) {
                        const total = data.data.length;
                        const shortlisted = data.data.filter((a) => a.status === "Shortlisted").length;
                        const interviews = data.data.filter((a) => a.status === "Interview" || a.status === "Interview Scheduled").length;
                        setLiveStats((prev) => ({
                            ...prev,
                            totalApps: total,
                            shortlisted,
                            interviews,
                        }));
                        const activities = data.data.slice(0, 5).map((app) => ({
                            icon: Users,
                            title: `Candidate Applied: ${app.appliedJob}`,
                            description: `${app.name} submitted an application (${app.status}).`,
                            time: app.appliedDate || "Recently",
                        }));
                        setRecentActivity(activities);
                    }
                })
                .catch(() => { });

            // Fetch company profile for eligibility status
            fetch(`${API_BASE_URL}/companies/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && data.data) {
                        setCompanyProfile(data.data);
                    }
                })
                .catch(() => { });
        }
    }, []);

    const handlePostJobClick = () => {
        const isVerified = (companyProfile?.verificationStatus || "").toString().toLowerCase() === "verified";
        const isComplete = (companyProfile?.profileCompletion || 0) === 100;
        if (!isComplete || !isVerified) {
            setShowIneligibleModal(true);
        } else {
            navigate("/company/jobs/create");
        }
    };

    const stats = [
        {
            label: "Active Jobs",
            value: String(liveStats.activeJobs),
            icon: BriefcaseBusiness,
            description: "Currently published",
        },
        {
            label: "Applications",
            value: String(liveStats.totalApps),
            icon: Users,
            description: "Total applications",
        },
        {
            label: "Shortlisted",
            value: String(liveStats.shortlisted),
            icon: UserCheck,
            description: "Candidates shortlisted",
        },
        {
            label: "Interviews",
            value: String(liveStats.interviews),
            icon: CalendarCheck,
            description: "Upcoming interviews",
        },
    ];

    const recentJobs = recentJobsList;

    return (
        <CompanyLayout activeNav="/company/dashboard">

            <div className="company-dashboard-page">

                {/* Immersive Search Hero Band */}
                <div className="search-hero-band">
                    {/* Actions: right-side controls (inside banner) */}
                    <div className="search-hero-actions">
                        <span className="bookmark-filter-btn active" style={{ cursor: "default" }}>
                            <TrendingUp size={16} />
                            <span>Recruitment Overview</span>
                        </span>
                    </div>

                    <span className="search-hero-chip">
                        <BriefcaseBusiness size={13} /> COMPANY DASHBOARD
                    </span>
                    <h2 className="search-hero-title">
                        Welcome back, {companyName}!
                    </h2>
                    <p className="search-hero-subtitle">
                        Manage your job postings, review candidates, and track your recruitment activity from one place.
                    </p>
                    <div className="hero-mini-stats">
                        <span className="hero-mini-stat">
                            <BriefcaseBusiness size={13} /> {liveStats.activeJobs} active jobs
                        </span>
                        <span className="hero-mini-stat">
                            <Users size={13} /> {liveStats.totalApps} applications
                        </span>
                        <span className="hero-mini-stat">
                            <UserCheck size={13} /> {liveStats.shortlisted} shortlisted
                        </span>
                        <span className="hero-mini-stat">
                            <CalendarCheck size={13} /> {liveStats.interviews} interviews
                        </span>
                    </div>
                </div>

                {/* Search Bar Section attached/positioned at bottom of banner */}
                <div className="search-bar-card pull-up">
                    <div className="search-input-wrap">
                        <Search size={20} className="search-input-icon" />
                        <input
                            type="text"
                            className="search-input-field"
                            placeholder="Search jobs, candidates, or recruitment activity..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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

                {/* Quick Actions */}
                <section className="dashboard-section-block">
                    <div className="section-header-row">
                        <div>
                            <h2 className="section-title">Quick Actions</h2>
                            <p className="text-muted">
                                Get started with your recruitment activities.
                            </p>
                        </div>
                    </div>

                    <div className="dash-quick-actions">
                        <button
                            className="dash-quick-pill"
                            onClick={handlePostJobClick}
                        >
                            <Plus size={18} />
                            Post a Job
                        </button>

                        <button
                            className="dash-quick-pill"
                            onClick={() => navigate("/company/jobs")}
                        >
                            <BriefcaseBusiness size={18} />
                            Manage Jobs
                        </button>

                        <button
                            className="dash-quick-pill"
                            onClick={() => navigate("/company/candidates")}
                        >
                            <Users size={18} />
                            View Candidates
                        </button>
                    </div>
                </section>

                {/* Statistics */}
                <section className="dashboard-section-block">
                    <div className="section-header-row">
                        <div>
                            <h2 className="section-title">Recruitment Overview</h2>
                            <p className="text-muted">
                                A quick overview of your hiring activity.
                            </p>
                        </div>
                    </div>

                    <div className="stats-metrics-grid">
                        {stats.map((stat) => {
                            const Icon = stat.icon;

                            return (
                                <div className="metric-stat-card" key={stat.label}>
                                    <div className="metric-stat-icon">
                                        <Icon size={21} />
                                    </div>

                                    <div className="metric-stat-content">
                                        <span className="metric-stat-label">
                                            {stat.label}
                                        </span>

                                        <strong className="metric-stat-value">
                                            {stat.value}
                                        </strong>

                                        <span className="metric-stat-description">
                                            {stat.description}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Active Job Postings */}
                <section className="dashboard-section-block">
                    <div className="section-header-row">
                        <div>
                            <h2 className="section-title">Active Job Postings</h2>
                            <p className="text-muted">
                                Keep track of your currently published positions.
                            </p>
                        </div>

                        <button
                            className="view-all-link-btn"
                            onClick={() => navigate("/company/jobs")}
                        >
                            View All
                            <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="recommended-jobs-list">
                        {recentJobs.map((job) => (
                            <div className="recommended-job-card" key={job.title}>
                                <div className="recommended-job-main">
                                    <div className="recommended-job-icon">
                                        <BriefcaseBusiness size={20} />
                                    </div>

                                    <div>
                                        <h3>{job.title}</h3>

                                        <div className="recommended-job-meta">
                                            <span>
                                                <MapPin size={14} />
                                                {job.location}
                                            </span>

                                            <span>
                                                <Users size={14} />
                                                {job.applications} applications
                                            </span>

                                            <span>
                                                <Clock3 size={14} />
                                                {job.posted}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="recommended-job-action">
                                    <span className="status-badge status-active">
                                        {job.status}
                                    </span>

                                    <button
                                        className="icon-action-btn"
                                        onClick={() => navigate("/company/jobs")}
                                        aria-label={`View ${job.title}`}
                                    >
                                        <ArrowRight size={17} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Recent Recruitment Activity */}
                <section className="dashboard-section-block">
                    <div className="section-header-row">
                        <div>
                            <h2 className="section-title">
                                Recent Recruitment Activity
                            </h2>
                            <p className="text-muted">
                                Stay updated with the latest activity.
                            </p>
                        </div>
                    </div>

                    {recentActivity.length === 0 ? (
                        <div style={{ padding: "24px", textAlign: "center", background: "var(--bg-subtle, #f8fafc)", borderRadius: "10px" }}>
                            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>No recruitment activity recorded yet.</p>
                        </div>
                    ) : (
                        <div className="company-activity-list">
                            {recentActivity.map((activity, index) => {
                                const Icon = activity.icon;

                                return (
                                    <div
                                        className="company-activity-item"
                                        key={index}
                                    >
                                        <div className="company-activity-icon">
                                            <Icon size={19} />
                                        </div>

                                        <div className="company-activity-content">
                                            <h3>{activity.title}</h3>
                                            <p>{activity.description}</p>
                                        </div>

                                        <span className="company-activity-time">
                                            {activity.time}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Bottom CTA */}
                <section className="dashboard-section-block">
                    <div className="company-dashboard-cta">
                        <div>
                            <FileText size={28} />

                            <div>
                                <h2>Ready to find your next candidate?</h2>
                                <p>
                                    Create a new job posting and start receiving applications.
                                </p>
                            </div>
                        </div>

                        <button
                            className="Button btn btn-primary"
                            onClick={handlePostJobClick}
                        >
                            <Plus size={17} />
                            Post a Job
                        </button>
                    </div>
                </section>

                {/* Verification & Profile Ineligible Popup Modal */}
                {showIneligibleModal && (
                    <div className="modal-overlay" style={{ zIndex: 9999 }}>
                        <div className="modal-card" style={{ maxWidth: "480px", textAlign: "center", padding: "32px 24px" }}>
                            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                <AlertCircle size={32} />
                            </div>
                            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                                Action Blocked
                            </h3>
                            <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.55, marginBottom: "26px" }}>
                                Please complete your company profile and get your company verified before posting a job.
                            </p>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                                <Button variant="outline" onClick={() => setShowIneligibleModal(false)}>
                                    Close
                                </Button>
                                <Button variant="primary" onClick={() => navigate("/company/profile")}>
                                    Go to Company Profile
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </CompanyLayout>
    );
};

export default CompanyDashboard;