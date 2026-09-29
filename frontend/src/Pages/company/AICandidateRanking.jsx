import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CompanyLayout from "../../Components/CompanyLayout";
import {
    Sparkles,
    Briefcase,
    CheckCircle2,
    Award,
    GraduationCap,
    Clock,
    ChevronRight,
    ArrowLeft,
    TrendingUp,
    AlertCircle,
    UserCheck,
    CalendarCheck,
    Download,
    Cpu,
    Search,
    Target,
    X,
} from "lucide-react";

// Mock AI Ranked Candidates per Job Posting
const mockRankingData = {
    "1": {
        jobTitle: "Senior Java Developer",
        candidates: [
            {
                id: 201,
                name: "Rahul Sharma",
                experience: "5.5 yrs exp",
                location: "Goa, India",
                aiScore: 95,
                recommendation: "Strong Match",
                skillsMatch: 98,
                experienceMatch: 92,
                educationMatch: 95,
                summary: "Exceeds required Java 17, Spring Boot, & Microservices criteria. Excellent backend architectural fit.",
                keySkills: ["Java 17", "Spring Boot", "Microservices", "Docker", "MySQL"],
            },
            {
                id: 202,
                name: "Ananya Deshmukh",
                experience: "6.0 yrs exp",
                location: "Bangalore, India",
                aiScore: 91,
                recommendation: "Strong Match",
                skillsMatch: 94,
                experienceMatch: 95,
                educationMatch: 85,
                summary: "Strong Java background with Kafka and Cloud experience. Excellent domain experience.",
                keySkills: ["Java", "Kafka", "Spring Cloud", "Kubernetes"],
            },
            {
                id: 203,
                name: "Siddharth Rao",
                experience: "4.0 yrs exp",
                location: "Hyderabad, India",
                aiScore: 82,
                recommendation: "Good Match",
                skillsMatch: 85,
                experienceMatch: 78,
                educationMatch: 84,
                summary: "Good core Java skills. Requires slight ramp up on microservice deployment pipelines.",
                keySkills: ["Java", "Spring MVC", "PostgreSQL", "REST APIs"],
            },
            {
                id: 204,
                name: "Karan Mehta",
                experience: "2.5 yrs exp",
                location: "Pune, India",
                aiScore: 71,
                recommendation: "Consider",
                skillsMatch: 75,
                experienceMatch: 65,
                educationMatch: 74,
                summary: "Junior candidate with potential. Meets basic language requirements but under target seniority.",
                keySkills: ["Java", "Hibernate", "SQL"],
            },
        ],
    },
    "2": {
        jobTitle: "Frontend Developer",
        candidates: [
            {
                id: 301,
                name: "Priya Patel",
                experience: "4.0 yrs exp",
                location: "Remote / Ahmedabad",
                aiScore: 89,
                recommendation: "Good Match",
                skillsMatch: 92,
                experienceMatch: 88,
                educationMatch: 87,
                summary: "Strong React, TypeScript, and state management skills. Highly aligned with team UI stack.",
                keySkills: ["React.js", "TypeScript", "Redux", "CSS3", "Vite"],
            },
            {
                id: 302,
                name: "Amit Kumar",
                experience: "1.0 yrs exp",
                location: "Delhi NCR",
                aiScore: 54,
                recommendation: "Low Match",
                skillsMatch: 52,
                experienceMatch: 45,
                educationMatch: 65,
                summary: "Limited React experience. Primarily skilled in static HTML/JS web development.",
                keySkills: ["HTML5", "CSS3", "JavaScript"],
            },
        ],
    },
    "3": {
        jobTitle: "Business Analyst",
        candidates: [
            {
                id: 401,
                name: "Vikram Verma",
                experience: "3.0 yrs exp",
                location: "Mumbai, India",
                aiScore: 78,
                recommendation: "Consider",
                skillsMatch: 80,
                experienceMatch: 75,
                educationMatch: 80,
                summary: "Solid analytical capability, comfortable with SQL queries and business flow mapping.",
                keySkills: ["SQL", "Tableau", "Agile", "User Stories"],
            },
        ],
    },
};

export default function AICandidateRanking() {
    const navigate = useNavigate();
    const [selectedJobId, setSelectedJobId] = useState("1");
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const currentRanking = mockRankingData[selectedJobId] || mockRankingData["1"];

    const getRecommendationBadge = (recommendation) => {
        switch (recommendation) {
            case "Strong Match":
                return <span className="rank-badge rank-strong">★ Strong Match</span>;
            case "Good Match":
                return <span className="rank-badge rank-good">✓ Good Match</span>;
            case "Consider":
                return <span className="rank-badge rank-consider">⚡ Consider</span>;
            case "Low Match":
                return <span className="rank-badge rank-low">✕ Low Match</span>;
            default:
                return <span className="rank-badge">{recommendation}</span>;
        }
    };

    const getScoreColor = (score) => {
        if (score >= 90) return "#6366f1"; // primary indigo
        if (score >= 80) return "#7c3aed"; // royal violet
        if (score >= 70) return "#0284c7"; // sky blue
        return "#ef4444"; // red
    };

    const filteredCandidates = currentRanking.candidates.filter((c) => {
        const matchesFilter =
            selectedFilter === "All" ||
            c.recommendation.toLowerCase().includes(selectedFilter.toLowerCase());

        const matchesSearch =
            !searchQuery.trim() ||
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.keySkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
            currentRanking.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    return (
        <CompanyLayout activeNav="/company/candidates">
            <div className="company-ranking-page">

                {/* Immersive Search Hero Band */}
                <div className="search-hero-band">
                    {/* Actions: Right-side controls (inside banner) */}
                    <div className="search-hero-actions">
                        <button
                            type="button"
                            className="bookmark-filter-btn"
                            onClick={() => navigate("/company/candidates")}
                            title="Back to Candidate List"
                        >
                            <ArrowLeft size={16} />
                            <span>Back to Candidates</span>
                        </button>
                    </div>

                    <span className="search-hero-chip">
                        <Cpu size={13} /> AI RECRUITMENT
                    </span>
                    <h2 className="search-hero-title">
                        Find the Best Candidates
                    </h2>
                    <p className="search-hero-subtitle">
                        Get AI-powered candidate rankings and shortlists for your job postings.
                    </p>
                    <div className="hero-mini-stats">
                        <span className="hero-mini-stat">
                            <Sparkles size={13} /> AI-powered
                        </span>
                        <span className="hero-mini-stat">
                            <TrendingUp size={13} /> Match ranked
                        </span>
                        <span className="hero-mini-stat">
                            <Target size={13} /> Smarter hiring
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
                            placeholder="Search by candidate name, skills, or job title..."
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

                {/* Job Selector & System Disclaimer Banner */}
                <div className="ranking-selector-bar">
                    <div className="job-picker-group">
                        <label htmlFor="jobSelect">Select Job Posting to Rank:</label>
                        <div className="picker-wrapper">
                            <Briefcase size={18} className="picker-icon" />
                            <select
                                id="jobSelect"
                                value={selectedJobId}
                                onChange={(e) => setSelectedJobId(e.target.value)}
                            >
                                <option value="1">Senior Java Developer (4 applicants ranked)</option>
                                <option value="2">Frontend Developer (2 applicants ranked)</option>
                                <option value="3">Business Analyst (1 applicant ranked)</option>
                            </select>
                        </div>
                    </div>

                    <div className="ai-disclaimer-note">
                        <AlertCircle size={16} />
                        <span>Mock ranking dataset shown. Ready for live Python/ML backend integration.</span>
                    </div>
                </div>

                {/* Candidate Recommendation Filter Tabs */}
                <div className="ranking-filter-tabs">
                    {["All", "Strong Match", "Good Match", "Consider", "Low Match"].map((tab) => (
                        <button
                            key={tab}
                            className={`filter-tab-btn ${selectedFilter === tab ? "active" : ""}`}
                            onClick={() => setSelectedFilter(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Ranked Results Grid / Empty State */}
                {filteredCandidates.length === 0 ? (
                    <div className="jobs-empty-state">
                        <Target size={44} />
                        <h3>No ranked candidates found</h3>
                        <p>No candidates match your current search query or recommendation filter.</p>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedFilter("All");
                            }}
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="ranked-candidates-grid">
                    {filteredCandidates.map((candidate, idx) => (
                        <div className="ranked-candidate-card" key={candidate.id}>
                            <div className="card-top-rank-header">
                                <span className="rank-position-pill">#{idx + 1} Ranked</span>
                                {getRecommendationBadge(candidate.recommendation)}
                            </div>

                            <div className="card-candidate-header">
                                <div className="candidate-avatar lg">
                                    {candidate.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                </div>

                                <div>
                                    <h3 className="candidate-name">{candidate.name}</h3>
                                    <p className="candidate-meta">{candidate.experience} • {candidate.location}</p>
                                </div>

                                <div className="score-circle-block" style={{ borderColor: getScoreColor(candidate.aiScore) }}>
                                    <span className="score-val" style={{ color: getScoreColor(candidate.aiScore) }}>
                                        {candidate.aiScore}%
                                    </span>
                                    <span className="score-lbl">AI Score</span>
                                </div>
                            </div>

                            {/* Scores Breakdown Bars */}
                            <div className="match-metrics-breakdown">
                                <div className="metric-row">
                                    <div className="metric-label">
                                        <Award size={14} />
                                        <span>Skills Match</span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${candidate.skillsMatch}%`, backgroundColor: getScoreColor(candidate.skillsMatch) }}
                                        />
                                    </div>
                                    <span className="metric-percent">{candidate.skillsMatch}%</span>
                                </div>

                                <div className="metric-row">
                                    <div className="metric-label">
                                        <Briefcase size={14} />
                                        <span>Experience Match</span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${candidate.experienceMatch}%`, backgroundColor: getScoreColor(candidate.experienceMatch) }}
                                        />
                                    </div>
                                    <span className="metric-percent">{candidate.experienceMatch}%</span>
                                </div>

                                <div className="metric-row">
                                    <div className="metric-label">
                                        <GraduationCap size={14} />
                                        <span>Education Match</span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${candidate.educationMatch}%`, backgroundColor: getScoreColor(candidate.educationMatch) }}
                                        />
                                    </div>
                                    <span className="metric-percent">{candidate.educationMatch}%</span>
                                </div>
                            </div>

                            {/* Summary Note */}
                            <div className="ai-summary-note">
                                <strong>AI Recommendation Summary:</strong>
                                <p>{candidate.summary}</p>
                            </div>

                            {/* Skills Tags */}
                            <div className="skills-badge-list">
                                {candidate.keySkills.map((sk) => (
                                    <span key={sk} className="skill-chip">{sk}</span>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="card-actions-footer">
                                <button className="btn btn-secondary btn-sm">
                                    <UserCheck size={14} />
                                    <span>Shortlist</span>
                                </button>
                                <button className="btn btn-secondary btn-sm">
                                    <CalendarCheck size={14} />
                                    <span>Interview</span>
                                </button>
                                <button className="btn btn-outline btn-sm">
                                    <Download size={14} />
                                    <span>Resume</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                )}

            </div>
        </CompanyLayout>
    );
}
