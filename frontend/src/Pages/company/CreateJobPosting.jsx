import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CompanyLayout from "../../Components/CompanyLayout";
import FormInput from "../../Components/components/FormInput";
import FormSelect from "../../Components/components/FormSelect";
import Button from "../../Components/components/Button";
import API_BASE_URL from "../../utils/api";
import {
    Briefcase,
    MapPin,
    DollarSign,
    Users,
    Calendar,
    GraduationCap,
    FileText,
    Sparkles,
    ArrowLeft,
    CheckCircle2,
    Save,
    AlertCircle,
} from "lucide-react";

const jobCategories = [
    { value: "Software Engineering", label: "Software Engineering & Development" },
    { value: "Frontend Development", label: "Frontend Development" },
    { value: "Backend Development", label: "Backend Development" },
    { value: "Full Stack Development", label: "Full Stack Development" },
    { value: "Product Management", label: "Product & Project Management" },
    { value: "Product Design", label: "UI/UX & Product Design" },
    { value: "Data Science & AI", label: "Data Science, Analytics & AI" },
    { value: "DevOps & Cloud", label: "DevOps, SRE & Cloud Engineering" },
    { value: "Business Analysis", label: "Business Analysis & Strategy" },
    { value: "Marketing & Sales", label: "Digital Marketing & Growth" },
    { value: "Other", label: "Other Domain" },
];

const employmentTypes = [
    { value: "Full-time", label: "Full-Time Corporate" },
    { value: "Part-time", label: "Part-Time" },
    { value: "Contract", label: "Contractual / Freelance" },
    { value: "Remote", label: "100% Remote" },
    { value: "Hybrid", label: "Hybrid Office / Remote" },
    { value: "Internship", label: "Graduate Internship" },
];

const experienceLevels = [
    { value: "Fresher / Entry Level (0-1 yrs)", label: "Fresher / Entry Level (0-1 yrs)" },
    { value: "Junior (1-3 yrs)", label: "Junior (1-3 yrs)" },
    { value: "Mid Level (3-5 yrs)", label: "Mid Level (3-5 yrs)" },
    { value: "Senior (5-8 yrs)", label: "Senior (5-8 yrs)" },
    { value: "Lead / Manager (8+ yrs)", label: "Lead / Manager (8+ yrs)" },
];

const educationLevels = [
    { value: "Bachelor's Degree (B.E/B.Tech/B.Sc/B.CA)", label: "Bachelor's Degree (B.E / B.Tech / B.Sc / B.CA)" },
    { value: "Master's Degree (M.E/M.Tech/M.Sc/M.CA/MBA)", label: "Master's Degree (M.E / M.Tech / M.Sc / M.CA / MBA)" },
    { value: "Diploma / Higher Secondary", label: "Diploma / Higher Secondary" },
    { value: "Doctorate / Ph.D.", label: "Doctorate / Ph.D." },
    { value: "Any Graduate", label: "Any Graduate / Equivalent Experience" },
];

export default function CreateJobPosting() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "",
        category: "",
        location: "",
        employmentType: "",
        experienceRequired: "",
        salaryRange: "",
        openings: "1",
        description: "",
        skills: "",
        education: "",
        deadline: "",
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showIneligibleModal, setShowIneligibleModal] = useState(false);
    const [companyEligibility, setCompanyEligibility] = useState({ checked: false, isEligible: true });

    useEffect(() => {
        const checkEligibility = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                const res = await fetch(`${API_BASE_URL}/companies/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (res.ok && data.success && data.data) {
                    const profile = data.data;
                    const isVerified = (profile.verificationStatus || "").toString().toLowerCase() === "verified";
                    const isComplete = (profile.profileCompletion || 0) === 100;
                    if (!isComplete || !isVerified) {
                        setCompanyEligibility({ checked: true, isEligible: false });
                        setShowIneligibleModal(true);
                    } else {
                        setCompanyEligibility({ checked: true, isEligible: true });
                    }
                }
            } catch (e) {
                console.warn("Could not check company eligibility", e);
            }
        };
        checkEligibility();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (touched[name]) {
            validateField(name, value);
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        validateField(name, value);
    };

    const validateField = (name, value) => {
        let errorMsg = "";

        if (!value || (typeof value === "string" && !value.trim())) {
            if (
                name === "title" ||
                name === "category" ||
                name === "location" ||
                name === "employmentType" ||
                name === "experienceRequired" ||
                name === "description" ||
                name === "skills" ||
                name === "deadline"
            ) {
                errorMsg = "This field is required.";
            }
        }

        if (name === "openings" && (isNaN(value) || Number(value) < 1)) {
            errorMsg = "Please enter at least 1 opening.";
        }

        setErrors((prev) => ({ ...prev, [name]: errorMsg }));
        return errorMsg;
    };

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = [
            "title",
            "category",
            "location",
            "employmentType",
            "experienceRequired",
            "description",
            "skills",
            "deadline",
        ];

        requiredFields.forEach((field) => {
            if (!formData[field] || !String(formData[field]).trim()) {
                newErrors[field] = "This field is required.";
            }
        });

        if (isNaN(formData.openings) || Number(formData.openings) < 1) {
            newErrors.openings = "Please enter at least 1 opening.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (actionType) => {
        const allTouched = Object.keys(formData).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
        setTouched(allTouched);

        if (!companyEligibility.isEligible) {
            setShowIneligibleModal(true);
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setErrors((prev) => ({ ...prev, general: "" }));

        try {
            const token = localStorage.getItem("token");
            const payload = {
                title: formData.title,
                category: formData.category,
                location: formData.location,
                employmentType: formData.employmentType,
                experienceRequired: formData.experienceRequired,
                salaryRange: formData.salaryRange,
                openings: formData.openings,
                description: formData.description,
                skills: formData.skills,
                education: formData.education,
                deadline: formData.deadline,
                status: actionType === "draft" ? "draft" : "published",
            };

            const response = await fetch(`${API_BASE_URL}/jobs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                navigate("/company/jobs");
            } else if (response.status === 403 || (data.message && data.message.includes("verified before posting a job"))) {
                setCompanyEligibility({ checked: true, isEligible: false });
                setShowIneligibleModal(true);
            } else {
                setErrors((prev) => ({
                    ...prev,
                    general: data.message || "Failed to save job posting.",
                }));
            }
        } catch (err) {
            console.warn("Backend error posting job:", err);
            setErrors((prev) => ({
                ...prev,
                general: "Failed to save job posting.",
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CompanyLayout activeNav="/company/jobs">
            <div className="company-create-job-page">
                {/* Header with Back Button */}
                <div className="create-job-header">
                    <button
                        type="button"
                        className="back-link-btn"
                        onClick={() => navigate("/company/jobs")}
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Manage Jobs</span>
                    </button>

                    <div className="create-job-title-wrapper">
                        <span className="auth-badge">
                            RECRUITMENT WIZARD
                        </span>
                        <h1>Post a New Job Opening</h1>
                        <p className="text-muted">
                            Fill out position details to publish your job opportunity to CareerForge candidates.
                        </p>
                    </div>
                </div>

                <form className="create-job-form" onSubmit={(e) => e.preventDefault()} noValidate>
                    {errors.general && (
                        <div className="alert-danger" style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "8px", background: "var(--danger-light)", border: "1px solid var(--border-error)", color: "var(--danger)" }}>
                            {errors.general}
                        </div>
                    )}
                    {/* Basic Job Details Card */}
                    <div className="form-card-block">
                        <div className="form-card-header">
                            <Briefcase size={20} className="header-icon" />
                            <div>
                                <h3>Basic Information</h3>
                                <p>Define the title, role category, and job environment.</p>
                            </div>
                        </div>

                        <div className="form-grid-two">
                            <FormInput
                                label="Job Title"
                                name="title"
                                placeholder="e.g. Senior Frontend React Engineer"
                                value={formData.title}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.title ? errors.title : ""}
                                required
                                icon={Briefcase}
                            />

                            <FormSelect
                                label="Job Category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                options={jobCategories}
                                placeholder="Select role category"
                                error={touched.category ? errors.category : ""}
                                required
                            />

                            <FormInput
                                label="Location"
                                name="location"
                                placeholder="e.g. Goa, India / Remote"
                                value={formData.location}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.location ? errors.location : ""}
                                required
                                icon={MapPin}
                            />

                            <FormSelect
                                label="Employment Type"
                                name="employmentType"
                                value={formData.employmentType}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                options={employmentTypes}
                                placeholder="Select employment format"
                                error={touched.employmentType ? errors.employmentType : ""}
                                required
                            />
                        </div>
                    </div>

                    {/* Experience, Compensation & Openings Card */}
                    <div className="form-card-block">
                        <div className="form-card-header">
                            <DollarSign size={20} className="header-icon" />
                            <div>
                                <h3>Experience & Compensation</h3>
                                <p>Specify candidate requirements, salary range, and position capacity.</p>
                            </div>
                        </div>

                        <div className="form-grid-three">
                            <FormSelect
                                label="Experience Required"
                                name="experienceRequired"
                                value={formData.experienceRequired}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                options={experienceLevels}
                                placeholder="Select experience tier"
                                error={touched.experienceRequired ? errors.experienceRequired : ""}
                                required
                            />

                            <FormInput
                                label="Salary Range (Optional)"
                                name="salaryRange"
                                placeholder="e.g. ₹8 - ₹12 LPA or Competitive"
                                value={formData.salaryRange}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                icon={DollarSign}
                            />

                            <FormInput
                                label="Number of Openings"
                                name="openings"
                                type="number"
                                min="1"
                                value={formData.openings}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.openings ? errors.openings : ""}
                                required
                                icon={Users}
                            />
                        </div>
                    </div>

                    {/* Description & Skill Requirements */}
                    <div className="form-card-block">
                        <div className="form-card-header">
                            <FileText size={20} className="header-icon" />
                            <div>
                                <h3>Role Description & Qualifications</h3>
                                <p>Detail job responsibilities, skills, and academic background.</p>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="description" className="form-label">
                                <span>
                                    Job Description <span className="required-star">*</span>
                                </span>
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows="6"
                                className={`form-control ${touched.description && errors.description ? "is-invalid" : ""}`}
                                placeholder="Provide a comprehensive job description, day-to-day responsibilities, and team overview..."
                                value={formData.description}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {touched.description && errors.description && (
                                <p className="error-message">{errors.description}</p>
                            )}
                        </div>

                        <div className="form-grid-two" style={{ marginTop: "16px" }}>
                            <FormInput
                                label="Required Skills"
                                name="skills"
                                placeholder="e.g. React.js, Node.js, MySQL, REST APIs (comma separated)"
                                value={formData.skills}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.skills ? errors.skills : ""}
                                required
                                icon={Sparkles}
                                helperText="Key skills required for candidate matching"
                            />

                            <FormSelect
                                label="Required Education"
                                name="education"
                                value={formData.education}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                options={educationLevels}
                                placeholder="Select minimum education"
                                icon={GraduationCap}
                            />
                        </div>

                        <div className="form-grid-two" style={{ marginTop: "16px" }}>
                            <FormInput
                                label="Application Deadline"
                                name="deadline"
                                type="date"
                                value={formData.deadline}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.deadline ? errors.deadline : ""}
                                required
                                icon={Calendar}
                            />
                        </div>
                    </div>

                    {/* Form Action Buttons */}
                    <div className="create-job-actions">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/company/jobs")}
                        >
                            Cancel
                        </Button>

                        <div className="action-right-group">
                            <Button
                                variant="secondary"
                                onClick={() => handleSubmit("draft")}
                                loading={isSubmitting}
                                icon={Save}
                            >
                                Save as Draft
                            </Button>

                            <Button
                                variant="primary"
                                onClick={() => handleSubmit("publish")}
                                loading={isSubmitting}
                                icon={CheckCircle2}
                            >
                                Publish Job
                            </Button>
                        </div>
                    </div>
                </form>

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
                                <Button variant="outline" onClick={() => navigate("/company/jobs")}>
                                    Back to Jobs
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
