import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  FileText,
  Check,
  DollarSign,
} from "lucide-react";
import CandidateLayout from "../../Components/components/CandidateLayout";
import Button from "../../Components/components/Button";

// Mock course catalog provided by partner companies (would come from the backend later)
const COURSES = [
  { id: "ms-react-fundamentals", title: "React Fundamentals", provider: "Microsoft", color: "#00A4EF", duration: "4 weeks", level: "Beginner", lessons: 18, rating: 4.7, price: 0, description: "Build modern UIs with components, hooks and state management.", tag: "AI Recommended" },
  { id: "meta-frontend-cert", title: "Front-End Developer Career Certificate", provider: "Meta", color: "#0668E1", duration: "5 months", level: "Beginner", lessons: 60, rating: 4.9, price: 4499, description: "Job-ready program covering HTML, CSS, JavaScript and React with a final capstone.", tag: "Bestseller" },
  { id: "google-web-js", title: "Web Development with JavaScript", provider: "Google", color: "#4285F4", duration: "3 months", level: "Intermediate", lessons: 42, rating: 4.8, price: 2999, description: "Deep-dive into modern JavaScript, the DOM and asynchronous programming." },
  { id: "ibm-intro-web", title: "Introduction to Web Development", provider: "IBM", color: "#1F70C1", duration: "3 weeks", level: "Beginner", lessons: 14, rating: 4.5, price: 0, description: "A gentle start to how the web works — HTML, CSS and your first webpage." },
  { id: "infosys-mern", title: "Full Stack MERN Bootcamp", provider: "Infosys", color: "#007CC3", duration: "12 weeks", level: "Intermediate", lessons: 80, rating: 4.7, price: 8999, description: "MongoDB, Express, React and Node.js with guided industry projects.", tag: "New" },
  { id: "amazon-cloud", title: "Cloud Practitioner Essentials", provider: "Amazon", color: "#FF9900", duration: "6 weeks", level: "Beginner", lessons: 24, rating: 4.6, price: 1999, description: "Core cloud concepts and services every modern developer should know." },
  { id: "tcs-java", title: "Java Programming Essentials", provider: "TCS", color: "#0F172A", duration: "4 weeks", level: "Beginner", lessons: 20, rating: 4.4, price: 0, description: "Object-oriented programming fundamentals with hands-on Java exercises." },
  { id: "designify-uiux", title: "UI/UX Design Foundations", provider: "Designify Studios", color: "#8B5CF6", duration: "5 weeks", level: "Beginner", lessons: 22, rating: 4.8, price: 2499, description: "Wireframes, design systems and user testing for beautiful interfaces." },
  { id: "techsol-typescript", title: "TypeScript for Professionals", provider: "Tech Solutions Inc", color: "#10B981", duration: "3 weeks", level: "Advanced", lessons: 16, rating: 4.6, price: 1799, description: "Types, generics and enterprise patterns for large-scale apps." },
  { id: "infotech-node", title: "REST APIs with Node.js", provider: "InfoTech Global", color: "#F59E0B", duration: "3 weeks", level: "Intermediate", lessons: 15, rating: 4.5, price: 0, description: "Design, build and secure production-ready REST APIs." },
];

const FILTERS = [
  { id: "all", label: "All Courses" },
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" },
];

export default function Courses() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [enrolled, setEnrolled] = useState({});

  const filteredCourses = useMemo(() => {
    if (filter === "free") return COURSES.filter((c) => c.price === 0);
    if (filter === "paid") return COURSES.filter((c) => c.price > 0);
    return COURSES;
  }, [filter]);

  const handleEnroll = (id) => {
    setEnrolled((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <CandidateLayout activeNav="/ai-tools">
      <div className="search-main">
        <div className="search-container">
          {/* Top Bar: Title + Back to Learn With AI */}
          <div className="search-top-header">
            <div className="search-title-group">
              <button
                type="button"
                className="back-btn-pill"
                onClick={() => navigate("/ai-tools")}
                title="Back to Learn With AI"
              >
                <ArrowLeft size={16} />
                <span>Learn With AI</span>
              </button>
              <div>
                <h1 className="search-page-title">Apply to Courses</h1>
                <p className="search-page-subtitle">
                  Free &amp; paid courses from leading companies
                </p>
              </div>
            </div>
          </div>

          {/* Free / Paid filter */}
          <div className="ai-filter-row">
            <div className="ai-seg-control">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`ai-seg-btn ${filter === f.id ? "active" : ""}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="ai-filter-count">
              {filteredCourses.length} course
              {filteredCourses.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Course cards */}
          {filteredCourses.length === 0 ? (
            <p className="ai-courses-empty">
              No courses match this filter yet.
            </p>
          ) : (
            <div className="ai-courses-grid">
              {filteredCourses.map((course) => (
                <div key={course.id} className="ai-course-card">
                  {course.tag && (
                    <span
                      className={`ai-card-badge badge-${
                        course.tag === "Bestseller" ? "warning" : "success"
                      }`}
                    >
                      {course.tag}
                    </span>
                  )}

                  <div className="ai-course-top">
                    <span
                      className="ai-provider-avatar"
                      style={{ backgroundColor: course.color }}
                    >
                      {course.provider.charAt(0)}
                    </span>
                    <div className="ai-course-id">
                      <h3>{course.title}</h3>
                      <span className="ai-provider-name">
                        {course.provider}
                      </span>
                    </div>
                  </div>

                  <p className="ai-course-desc">{course.description}</p>

                  <div className="ai-course-meta">
                    <span className="ai-meta-chip">
                      <Clock size={13} />
                      {course.duration}
                    </span>
                    <span className="ai-meta-chip">
                      <TrendingUp size={13} />
                      {course.level}
                    </span>
                    <span className="ai-meta-chip">
                      <FileText size={13} />
                      {course.lessons} lessons
                    </span>
                    <span className="ai-meta-chip">★ {course.rating}</span>
                  </div>

                  <div className="ai-course-foot">
                    {course.price === 0 ? (
                      <span className="ai-price-chip chip-free">
                        <Check size={14} />
                        Free
                      </span>
                    ) : (
                      <span className="ai-price-chip chip-paid">
                        <DollarSign size={14} />₹
                        {course.price.toLocaleString("en-IN")}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant={enrolled[course.id] ? "outline" : "primary"}
                      disabled={enrolled[course.id]}
                      onClick={() => handleEnroll(course.id)}
                    >
                      {enrolled[course.id] ? "Enrolled ✓" : "Enroll Now"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CandidateLayout>
  );
}