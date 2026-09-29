import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CompanyLayout from "../../Components/CompanyLayout";
import {
    Users,
    Sparkles,
    Search,
    Filter,
    Calendar,
    Briefcase,
    CheckCircle2,
    Clock,
    XCircle,
    UserCheck,
    Eye,
    FileText,
    Mail,
    Phone,
    MapPin,
    ArrowRight,
    X,
} from "lucide-react";
import API_BASE_URL from "../../utils/api";

// Mock Candidates Data (empty by default)
const initialCandidates = [];

export default function CompanyCandidates() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const selectedJobParam = searchParams.get("job");

    const [candidates, setCandidates] = useState(initialCandidates);
    const [companyJobs, setCompanyJobs] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [jobFilter, setJobFilter] = useState(selectedJobParam || "All");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    const fetchCompanyApplications = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const queryUrl = jobFilter && jobFilter !== "All"
                ? `${API_BASE_URL}/applications/company/me?job=${jobFilter}`
                : `${API_BASE_URL}/applications/company/me`;

            const res = await fetch(queryUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (res.ok && data.success && Array.isArray(data.data)) {
                setCandidates(data.data);
            }
        } catch (e) {
            console.warn("Could not fetch company applications from API", e);
        }
    };

    const fetchCompanyJobsList = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/jobs/company/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && data.success && Array.isArray(data.data)) {
                setCompanyJobs(data.data);
            }
        } catch (e) { }
    };

    useEffect(() => {
        if (selectedJobParam) {
            setJobFilter(selectedJobParam);
        }
        fetchCompanyJobsList();
    }, []);

    useEffect(() => {
        fetchCompanyApplications();
    }, [selectedJobParam, jobFilter]);

    const handleStatusChange = async (candidateId, newStatus) => {
        setCandidates((prev) =>
            prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
        );
        if (selectedCandidate && selectedCandidate.id === candidateId) {
            setSelectedCandidate((prev) => ({ ...prev, status: newStatus }));
        }

        const token = localStorage.getItem("token");
        if (token && typeof candidateId === "number") {
            try {
                await fetch(`${API_BASE_URL}/applications/${candidateId}/status`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: newStatus }),
                });
            } catch (e) {
                console.warn("Failed to update status via API", e);
            }
        }
    };

    const handleViewProfile = async (candidate) => {
        setSelectedCandidate(candidate);
        const token = localStorage.getItem("token");
        const candId = candidate.candidateId || candidate.id;

        if (token && typeof candId === "number") {
            try {
                const res = await fetch(`${API_BASE_URL}/applications/candidate-profile/${candId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (res.ok && data.success && data.data) {
                    setSelectedCandidate((prev) => ({
                        ...prev,
                        ...data.data,
                        education: data.data.education || [],
                        experience: data.data.experience || [],
                        skills: data.data.skills || candidate.skills,
                        projects: data.data.projects || [],
                        certifications: data.data.certifications || [],
                        achievements: data.data.achievements || [],
                        preferences: data.data.preferences || {},
                        resumes: data.data.resumes || [],
                    }));
                }
            } catch (e) {
                console.warn("Failed to fetch full candidate profile", e);
            }
        }
    };

    const filteredCandidates = candidates.filter((c) => {
        const matchesStatus =
            statusFilter === "All" || c.status.toLowerCase() === statusFilter.toLowerCase();

        const matchesJob =
            jobFilter === "All" || String(c.jobId) === String(jobFilter);

        const matchesSearch =
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.appliedJob.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesJob && matchesSearch;
    });

    const getStatusBadgeClass = (status) => {
        switch (status.toLowerCase()) {
            case "shortlisted":
                return "status-active";
            case "interview":
                return "status-interview";
            case "rejected":
                return "status-closed";
            default:
                return "status-draft";
        }
    };

    return (
        <CompanyLayout activeNav="/company/candidates">
            <div className="company-candidates-page">
                {/* Immersive Search Hero Band */}
                <div className="search-hero-band">
                    {/* Actions: Right-side controls (inside banner) */}
                    <div className="search-hero-actions">
                        <button
                            type="button"
                            className="btn btn-primary ai-rank-btn"
                            onClick={() => navigate("/company/candidates/ranking")}
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                            <Sparkles size={16} />
                            <span>AI Candidate Ranking</span>
                        </button>
                    </div>

                    <span className="search-hero-chip">
                        <Users size={13} /> APPLICANT POOL
                    </span>
                    <h2 className="search-hero-title">
                        Candidate Applications
                    </h2>
                    <p className="search-hero-subtitle">
                        Review, filter, and track applications submitted across all job postings.
                    </p>
                    <div className="hero-mini-stats">
                        <span className="hero-mini-stat">
                            <Users size={13} /> {candidates.length} total
                        </span>
                        <span className="hero-mini-stat">
                            <Clock size={13} /> {candidates.filter(c => c.status === "Applied").length} applied
                        </span>
                        <span className="hero-mini-stat">
                            <UserCheck size={13} /> {candidates.filter(c => c.status === "Shortlisted").length} shortlisted
                        </span>
                        <span className="hero-mini-stat">
                            <Calendar size={13} /> {candidates.filter(c => c.status === "Interview").length} interview
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
                            placeholder="Search by name, job title, email..."
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

                {/* Filters Control Bar */}
                <div className="company-candidates-controls">
                    {/* Status Tabs */}
                    <div className="filter-tabs">
                        {["All", "Applied", "Shortlisted", "Interview", "Rejected"].map((st) => {
                            const count =
                                st === "All"
                                    ? candidates.length
                                    : candidates.filter((c) => c.status.toLowerCase() === st.toLowerCase()).length;

                            return (
                                <button
                                    key={st}
                                    className={`filter-tab-btn ${statusFilter === st ? "active" : ""}`}
                                    onClick={() => setStatusFilter(st)}
                                >
                                    <span>{st}</span>
                                    <span className="filter-badge">{count}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="controls-right-row">
                        {/* Job Dropdown Filter */}
                        <div className="job-filter-select">
                            <Briefcase size={16} className="select-icon" />
                            <select
                                value={jobFilter}
                                onChange={(e) => setJobFilter(e.target.value)}
                            >
                                <option value="All">All Job Postings</option>
                                {companyJobs.map((j) => (
                                    <option key={j.id} value={j.id}>
                                        {j.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Candidates List View */}
                {filteredCandidates.length === 0 ? (
                    <div className="jobs-empty-state">
                        <Users size={44} />
                        <h3>No candidates found</h3>
                        <p>Try adjusting your search query or filter selection.</p>
                    </div>
                ) : (
                    <div className="candidates-list-container">
                        {filteredCandidates.map((candidate) => (
                            <div className="candidate-item-card" key={candidate.id}>
                                <div className="candidate-main-info">
                                    <div className="candidate-avatar">
                                        {candidate.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </div>

                                    <div>
                                        <div className="candidate-name-row">
                                            <h3>{candidate.name}</h3>
                                            <span className={`status-badge ${getStatusBadgeClass(candidate.status)}`}>
                                                {candidate.status}
                                            </span>
                                        </div>

                                        <p className="candidate-job-title">
                                            Applied for: <strong>{candidate.appliedJob}</strong>
                                        </p>

                                        <div className="candidate-meta-line">
                                            <span>
                                                <Calendar size={14} />
                                                Applied on {candidate.appliedDate}
                                            </span>
                                            <span>
                                                <MapPin size={14} />
                                                {candidate.location}
                                            </span>
                                            <span>
                                                <Briefcase size={14} />
                                                {candidate.experience} exp
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="candidate-score-pill">
                                    <Sparkles size={16} />
                                    <span>{candidate.matchScore}% Match</span>
                                    <span className="match-tag">{candidate.matchLabel}</span>
                                </div>

                                <div className="candidate-actions-group">
                                    <select
                                        className="status-select-control"
                                        value={candidate.status}
                                        onChange={(e) => handleStatusChange(candidate.id, e.target.value)}
                                    >
                                        <option value="Applied">Applied</option>
                                        <option value="Shortlisted">Shortlisted</option>
                                        <option value="Interview">Interview</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>

                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleViewProfile(candidate)}
                                    >
                                        <Eye size={15} />
                                        <span>View Profile</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Candidate Profile Detail Modal */}
                {selectedCandidate && (
                    <div className="job-modal-backdrop" onClick={() => setSelectedCandidate(null)}>
                        <div className="job-modal-card wide" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "85vh", overflowY: "auto" }}>
                            <div className="modal-header">
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div className="candidate-avatar lg">
                                        {selectedCandidate.name
                                            ? selectedCandidate.name.split(" ").map((n) => n[0]).join("")
                                            : "C"}
                                    </div>
                                    <div>
                                        <h2>{selectedCandidate.name || selectedCandidate.fullName}</h2>
                                        <p className="text-muted">{selectedCandidate.headline || `${selectedCandidate.appliedJob} Applicant`}</p>
                                    </div>
                                </div>
                                <button className="modal-close-btn" onClick={() => setSelectedCandidate(null)}>×</button>
                            </div>

                            <div className="modal-body" style={{ gap: "20px", display: "flex", flexDirection: "column" }}>
                                <div className="candidate-modal-grid">
                                    <div className="modal-info-block">
                                        <h4>Contact & Personal Details</h4>
                                        <p><Mail size={14} /> {selectedCandidate.email}</p>
                                        <p><Phone size={14} /> {selectedCandidate.phone || "Not provided"}</p>
                                        <p><MapPin size={14} /> {selectedCandidate.location || "India"}</p>
                                        <p><Briefcase size={14} /> {selectedCandidate.experience ? (typeof selectedCandidate.experience === 'string' ? selectedCandidate.experience : `${selectedCandidate.experience.length} roles`) : "Fresher"} experience</p>
                                    </div>

                                    <div className="modal-info-block">
                                        <h4>AI Match & Suitability Score</h4>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "8px 0" }}>
                                            <strong style={{ fontSize: "1.5rem", color: "var(--primary)" }}>{selectedCandidate.matchScore || 85}%</strong>
                                            <span className="match-tag">{selectedCandidate.matchLabel || "Strong Match"}</span>
                                        </div>
                                        <p className="text-muted">
                                            {selectedCandidate.bio || `Candidate meets primary skill requirements for ${selectedCandidate.appliedJob}.`}
                                        </p>
                                    </div>
                                </div>

                                {/* Skills */}
                                <div>
                                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", color: "var(--text-main)" }}>Skills & Expertise</h4>
                                    <div className="skills-badge-list" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        {(selectedCandidate.skills || []).map((s, idx) => (
                                            <span key={idx} className="skill-chip">
                                                {typeof s === "string" ? s : s.name || "Skill"}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Education */}
                                {selectedCandidate.education && selectedCandidate.education.length > 0 && (
                                    <div>
                                        <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", color: "var(--text-main)" }}>Education Background</h4>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {selectedCandidate.education.map((edu, idx) => (
                                                <div key={idx} style={{ padding: "10px 14px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                                                    <strong style={{ color: "var(--text-main)" }}>{edu.degree || edu.title || "Degree"}</strong>
                                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                                        {edu.institution || edu.school} • {edu.year || edu.passoutYear || "Graduated"}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Experience */}
                                {Array.isArray(selectedCandidate.experience) && selectedCandidate.experience.length > 0 && (
                                    <div>
                                        <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", color: "var(--text-main)" }}>Work Experience</h4>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {selectedCandidate.experience.map((exp, idx) => (
                                                <div key={idx} style={{ padding: "10px 14px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                                                    <strong style={{ color: "var(--text-main)" }}>{exp.role || exp.title || "Position"}</strong> <span style={{ color: "var(--text-muted)" }}>at</span> <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{exp.company}</span>
                                                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                                        {exp.duration || exp.period || "Past role"}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Projects & Certifications */}
                                {(selectedCandidate.projects?.length > 0 || selectedCandidate.certifications?.length > 0) && (
                                    <div className="candidate-modal-grid">
                                        {selectedCandidate.projects?.length > 0 && (
                                            <div>
                                                <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", color: "var(--text-main)" }}>Projects</h4>
                                                {selectedCandidate.projects.map((p, idx) => (
                                                    <div key={idx} style={{ fontSize: "0.85rem", marginBottom: "6px", color: "var(--text-muted)" }}>
                                                        <strong style={{ color: "var(--text-main)" }}>• {p.title || p.name}</strong>: {p.description || p.techStack}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {selectedCandidate.certifications?.length > 0 && (
                                            <div>
                                                <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", color: "var(--text-main)" }}>Certifications & Achievements</h4>
                                                {selectedCandidate.certifications.map((c, idx) => (
                                                    <div key={idx} style={{ fontSize: "0.85rem", marginBottom: "6px", color: "var(--text-muted)" }}>
                                                        <strong style={{ color: "var(--text-main)" }}>• {c.name || c.title}</strong> ({c.issuer || "Verified"})
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Resumes */}
                                {selectedCandidate.resumes && selectedCandidate.resumes.length > 0 && (
                                    <div>
                                        <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", color: "var(--text-main)" }}>Generated Resume Document</h4>
                                        <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px", background: "var(--primary-light)", border: "1px solid rgba(79, 70, 229, 0.22)", borderRadius: "8px" }}>
                                            <FileText size={20} style={{ color: "var(--primary)" }} />
                                            <div style={{ flex: 1 }}>
                                                <strong style={{ fontSize: "0.9rem", color: "var(--text-main)" }}>{selectedCandidate.resumes[0].title || "Candidate Resume"}</strong>
                                                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--primary)" }}>Template: {selectedCandidate.resumes[0].template || "Professional"}</p>
                                            </div>
                                            <a
                                                href={`${API_BASE_URL}/candidates/resume/${selectedCandidate.resumes[0].id}/pdf`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn btn-secondary btn-sm"
                                                style={{ textDecoration: "none" }}
                                            >
                                                Download PDF
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedCandidate(null)}
                                >
                                    Close Window
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setSelectedCandidate(null);
                                        navigate("/company/candidates/ranking");
                                    }}
                                >
                                    <Sparkles size={16} />
                                    <span>Run AI Deep Ranking</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </CompanyLayout>
    );
}
