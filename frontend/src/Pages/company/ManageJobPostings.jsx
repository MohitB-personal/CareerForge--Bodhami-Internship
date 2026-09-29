import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CompanyLayout from "../../Components/CompanyLayout";
import Button from "../../Components/components/Button";
import API_BASE_URL from "../../utils/api";
import {
    Plus,
    Search,
    MapPin,
    Users,
    Clock3,
    Eye,
    Edit3,
    XCircle,
    CheckCircle2,
    Briefcase,
    Filter,
    TrendingUp,
    X,
    AlertCircle,
} from "lucide-react";

// Mock job postings data structure
const initialJobs = [
    {
        id: 1,
        title: "Senior Java Developer",
        location: "Goa, India",
        type: "Full-time",
        category: "Software Engineering",
        applications: 28,
        posted: "2 days ago",
        status: "Active",
    },
    {
        id: 2,
        title: "Frontend Developer",
        location: "Remote",
        type: "Full-time",
        category: "Frontend Development",
        applications: 41,
        posted: "5 days ago",
        status: "Active",
    },
    {
        id: 3,
        title: "Business Analyst",
        location: "Mumbai, India",
        type: "Full-time",
        category: "Business Intelligence",
        applications: 19,
        posted: "1 week ago",
        status: "Active",
    },
    {
        id: 4,
        title: "UI/UX Designer",
        location: "Bangalore, India",
        type: "Contract",
        category: "Product Design",
        applications: 14,
        posted: "2 weeks ago",
        status: "Draft",
    },
    {
        id: 5,
        title: "DevOps Engineer",
        location: "Remote",
        type: "Full-time",
        category: "Cloud Operations",
        applications: 35,
        posted: "3 weeks ago",
        status: "Closed",
    },
];

export default function ManageJobPostings() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [activeFilter, setActiveFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedJobView, setSelectedJobView] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [companyProfile, setCompanyProfile] = useState(null);
    const [showIneligibleModal, setShowIneligibleModal] = useState(false);

    const fetchCompanyJobs = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/jobs/company/me`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const data = await res.json();
            if (res.ok && data.success && Array.isArray(data.data)) {
                const formatted = data.data.map((j) => ({
                    id: j.id,
                    title: j.title || "Untitled Position",
                    location: j.location || "Location Not Specified",
                    type: j.type || j.employmentType || j.employment_type || "Full-time",
                    category: j.category || "General",
                    applications: j.applicationCount || j.applications_count || 0,
                    posted: j.postedAgo || j.posted_ago || "Recently",
                    status: j.status === "published" ? "Active" : j.status === "draft" ? "Draft" : "Closed",
                    rawStatus: j.status || "published",
                    summary: j.description || j.summary || "",
                }));
                setJobs(formatted);
            }
        } catch (e) {
            console.warn("Could not fetch company jobs from API", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyJobs();
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                const res = await fetch(`${API_BASE_URL}/companies/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (res.ok && data.success && data.data) {
                    setCompanyProfile(data.data);
                }
            } catch (e) {
                console.warn("Could not fetch company profile", e);
            }
        };
        fetchProfile();
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

    // Toggle job status between Active (published) and Closed
    const handleToggleStatus = async (jobId) => {
        const targetJob = jobs.find((j) => j.id === jobId);
        if (!targetJob) return;

        const nextStatus = targetJob.status === "Active" ? "closed" : "published";

        setJobs((prevJobs) =>
            prevJobs.map((j) => {
                if (j.id === jobId) {
                    return { ...j, status: nextStatus === "published" ? "Active" : "Closed" };
                }
                return j;
            })
        );

        try {
            const token = localStorage.getItem("token");
            await fetch(`${API_BASE_URL}/jobs/${jobId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ status: nextStatus }),
            });
        } catch (e) {
            console.warn("Failed to toggle status via API", e);
        }
    };

    // Filter jobs based on selected status tab and search query
    const filteredJobs = jobs.filter((job) => {
        const jobStatus = (job.status || "").toLowerCase();
        const filterVal = (activeFilter || "").toLowerCase();
        const matchesFilter =
            activeFilter === "All" || jobStatus === filterVal;

        const q = (searchQuery || "").toLowerCase();
        const matchesSearch =
            (job.title || "").toLowerCase().includes(q) ||
            (job.location || "").toLowerCase().includes(q) ||
            (job.category || "").toLowerCase().includes(q);

        return matchesFilter && matchesSearch;
    });

    const getCount = (status) => {
        if (status === "All") return jobs.length;
        const target = (status || "").toLowerCase();
        return jobs.filter((j) => (j.status || "").toLowerCase() === target).length;
    };

    return (
        <CompanyLayout activeNav="/company/jobs">
            <div className="company-jobs-page">

                {/* Immersive Search Hero Band */}
                <div className="search-hero-band">
                    {/* Actions: Right-side controls (inside banner) */}
                    <div className="search-hero-actions">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handlePostJobClick}
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                            <Plus size={16} />
                            <span>Post a Job</span>
                        </button>
                    </div>

                    <span className="search-hero-chip">
                        <Briefcase size={13} /> JOB MANAGEMENT
                    </span>
                    <h2 className="search-hero-title">
                        Manage Your Job Postings
                    </h2>
                    <p className="search-hero-subtitle">
                        Create, edit and manage your company's active and archived job openings.
                    </p>
                    <div className="hero-mini-stats">
                        <span className="hero-mini-stat">
                            <Briefcase size={13} /> {jobs.length} total jobs
                        </span>
                        <span className="hero-mini-stat">
                            <TrendingUp size={13} /> {getCount("Active")} active
                        </span>
                        <span className="hero-mini-stat">
                            <Clock3 size={13} /> {getCount("Draft")} draft
                        </span>
                        <span className="hero-mini-stat">
                            <XCircle size={13} /> {getCount("Closed")} closed
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
                            placeholder="Search by job title, location, or category..."
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

                {/* Filter Tabs Bar */}
                <div className="company-jobs-controls">
                    <div className="filter-tabs">
                        {["All", "Active", "Draft", "Closed"].map((tab) => (
                            <button
                                key={tab}
                                className={`filter-tab-btn ${activeFilter === tab ? "active" : ""}`}
                                onClick={() => setActiveFilter(tab)}
                            >
                                <span>{tab}</span>
                                <span className="filter-badge">{getCount(tab)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Job Cards / List View */}
                {filteredJobs.length === 0 ? (
                    <div className="jobs-empty-state">
                        <Briefcase size={44} />
                        <h3>No job postings found</h3>
                        <p>
                            {searchQuery
                                ? `No results match your search "${searchQuery}"`
                                : `There are no ${activeFilter !== "All" ? activeFilter.toLowerCase() : ""} job postings at this time.`}
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={handlePostJobClick}
                        >
                            <Plus size={16} />
                            <span>Create New Job</span>
                        </button>
                    </div>
                ) : (
                    <div className="company-jobs-list">
                        {filteredJobs.map((job) => (
                            <div className="company-job-card" key={job.id}>
                                <div className="job-card-header">
                                    <div className="job-title-group">
                                        <div className="job-avatar-icon">
                                            <Briefcase size={20} />
                                        </div>
                                        <div>
                                            <h3 className="job-card-title">{job.title}</h3>
                                            <span className="job-card-category">{job.category}</span>
                                        </div>
                                    </div>

                                    <span
                                        className={`status-badge status-${(job.status || "active").toLowerCase()}`}
                                    >
                                        {job.status}
                                    </span>
                                </div>

                                <div className="job-card-meta">
                                    <span className="meta-item">
                                        <MapPin size={14} />
                                        {job.location}
                                    </span>
                                    <span className="meta-item">
                                        <Briefcase size={14} />
                                        {job.type}
                                    </span>
                                    <span className="meta-item">
                                        <Users size={14} />
                                        <strong>{job.applications}</strong> Applications
                                    </span>
                                    <span className="meta-item">
                                        <Clock3 size={14} />
                                        Posted {job.posted}
                                    </span>
                                </div>

                                <div className="job-card-actions">
                                    <button
                                        className="job-action-btn primary"
                                        onClick={() => setSelectedJobView(job)}
                                        title="View Details"
                                    >
                                        <Eye size={15} />
                                        <span>View</span>
                                    </button>

                                    <button
                                        className="job-action-btn secondary"
                                        onClick={() => navigate(`/company/candidates?job=${job.id}`)}
                                        title="View Applicants"
                                    >
                                        <Users size={15} />
                                        <span>Candidates ({job.applications})</span>
                                    </button>

                                    <button
                                        className="job-action-btn outline"
                                        onClick={() => handleToggleStatus(job.id)}
                                        title={job.status === "Active" ? "Close Posting" : "Re-activate Posting"}
                                    >
                                        {job.status === "Active" ? (
                                            <>
                                                <XCircle size={15} />
                                                <span>Close</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={15} />
                                                <span>Re-open</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Job View Detail Modal */}
                {selectedJobView && (
                    <div className="job-modal-backdrop" onClick={() => setSelectedJobView(null)}>
                        <div className="job-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <span className={`status-badge status-${(selectedJobView.status || "active").toLowerCase()}`}>
                                        {selectedJobView.status}
                                    </span>
                                    <h2>{selectedJobView.title}</h2>
                                    <p className="text-muted">{selectedJobView.category} • {selectedJobView.location}</p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setSelectedJobView(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="modal-meta-grid">
                                    <div>
                                        <strong>Employment Type:</strong> {selectedJobView.type}
                                    </div>
                                    <div>
                                        <strong>Applications Received:</strong> {selectedJobView.applications}
                                    </div>
                                    <div>
                                        <strong>Posted Date:</strong> {selectedJobView.posted}
                                    </div>
                                    <div>
                                        <strong>Location:</strong> {selectedJobView.location}
                                    </div>
                                </div>
                                <div className="modal-description-preview">
                                    <h4>Description Preview</h4>
                                    <p>
                                        We are searching for a high-performing {selectedJobView.title} to join our engineering team. You will be responsible for creating scalable solutions, collaborating across functional teams, and maintaining backend/frontend excellence.
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedJobView(null)}
                                >
                                    Close Window
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate(`/company/candidates?job=${selectedJobView.id}`)}
                                >
                                    View Applicants
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
}
