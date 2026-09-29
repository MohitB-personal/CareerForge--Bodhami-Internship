import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Sparkles,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CandidateLayout from "../../Components/components/CandidateLayout";
import API_BASE_URL from "../../utils/api";

const RESUME_TEMPLATES = [
  {
    id: "modern",
    name: "Modern Professional",
    description:
      "Contemporary single-column layout with a bold header, accent-colored section titles and clean skill chips. Great for tech and business roles.",
    accent: "#4f46e5",
  },
  {
    id: "classic",
    name: "Classic Professional",
    description:
      "Timeless serif resume with centered header, ruled section headings and a conservative, ATS-friendly structure. Ideal for traditional industries.",
    accent: "#1f2937",
  },
  {
    id: "minimal",
    name: "Minimal Clean",
    description:
      "Ultra-clean airy layout with generous whitespace, thin divider lines and understated typography. Lets your experience do the talking.",
    accent: "#0f766e",
  },
];

const getTemplate = (id) =>
  RESUME_TEMPLATES.find((t) => t.id === id) || RESUME_TEMPLATES[0];

export default function ResumeBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Stages: validating | incomplete | template | generating | preview | error
  const [stage, setStage] = useState("validating");
  const [errorMessage, setErrorMessage] = useState("");

  // Resume workflow state
  const [missingSections, setMissingSections] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [llmError, setLlmError] = useState(null);
  const [llmEnhanced, setLlmEnhanced] = useState(false);
  const [savedResume, setSavedResume] = useState(null);

  // Loading & toast state
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  /**
   * Backend-validated profile completeness check (the same validation the
   * generate endpoint re-runs server-side — never frontend-only).
   */
  const checkProfileReadiness = useCallback(async () => {
    setStage("validating");
    setErrorMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/resume/profile-check`, {
        headers: getAuthHeaders(),
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not validate your profile.");
      }
      if (result.data.complete) {
        setMissingSections([]);
        setStage("template");
      } else {
        setMissingSections(result.data.missingSections || []);
        setStage("incomplete");
      }
    } catch (e) {
      setErrorMessage(e.message || "Something went wrong while validating your profile.");
      setStage("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  /**
   * Load a previously saved resume (from the Profile page "My Resumes" list)
   * straight into the preview stage.
   */
  const loadSavedResume = useCallback(async (resumeId) => {
    setStage("validating");
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/resume/${resumeId}`, {
        headers: getAuthHeaders(),
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not load the saved resume.");
      }
      const resume = result.data.resume;
      setResumeData(resume.content);
      setSelectedTemplate(getTemplate(resume.template).id);
      setLlmEnhanced(resume.llmEnhanced);
      setSavedResume(resume);
      setStage("preview");
    } catch (e) {
      setErrorMessage(e.message || "Something went wrong while loading your resume.");
      setStage("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Initial mount: auth guard + routing into the correct stage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    const resumeIdParam = searchParams.get("resumeId");
    if (resumeIdParam) {
      loadSavedResume(Number(resumeIdParam));
    } else {
      checkProfileReadiness();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Generate the personalized resume with the selected template.
   */
  const handleUseTemplate = async (templateId) => {
    setSelectedTemplate(templateId);
    setStage("generating");
    setLlmError(null);
    setLlmEnhanced(false);
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/resume/generate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ template: templateId }),
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      const result = await response.json();
      if (!response.ok || !result.success) {
        if (response.status === 422 && result.data?.missingSections) {
          setMissingSections(result.data.missingSections);
          setStage("incomplete");
          return;
        }
        throw new Error(result.message || "Resume generation failed.");
      }
      setResumeData(result.data.resumeData);
      setLlmError(result.data.llmError || null);
      setLlmEnhanced(Boolean(result.data.llmEnhanced));
      setStage("preview");
    } catch (e) {
      setErrorMessage(e.message || "Something went wrong while generating your resume.");
      setStage("error");
    }
  };


  /**
   * Save (or update) the generated resume on the candidate's account.
   */
  const handleSaveResume = async () => {
    if (!resumeData || !selectedTemplate) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/resume`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          template: selectedTemplate,
          title: "My Resume",
          content: resumeData,
          llmEnhanced,
          resumeId: savedResume?.id,
        }),
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not save the resume.");
      }
      setSavedResume(result.data.resume);
      showToast("✅ Resume saved to your account!");
    } catch (e) {
      showToast(`⚠️ ${e.message || "Failed to save resume."}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Download the saved resume as a real server-rendered A4 PDF.
   * If the resume has not been saved yet, it is saved first.
   */
  const handleDownloadPdf = async () => {
    if (!resumeData || !selectedTemplate) return;
    setDownloading(true);
    try {
      let resumeId = savedResume?.id;
      if (!resumeId) {
        const saveResponse = await fetch(`${API_BASE_URL}/candidates/resume`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            template: selectedTemplate,
            title: "My Resume",
            content: resumeData,
            llmEnhanced,
            resumeId: savedResume?.id,
          }),
        });
        const saveResult = await saveResponse.json();
        if (!saveResponse.ok || !saveResult.success) {
          throw new Error(saveResult.message || "Could not save the resume before download.");
        }
        setSavedResume(saveResult.data.resume);
        resumeId = saveResult.data.resume.id;
      }

      const response = await fetch(`${API_BASE_URL}/candidates/resume/${resumeId}/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      if (!response.ok) {
        const message = await response.json().catch(() => ({}));
        throw new Error(message.message || "PDF download failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(resumeData.contact.fullName || "resume")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .toLowerCase()}_resume.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("📄 Resume PDF downloaded!");
    } catch (e) {
      showToast(`⚠️ ${e.message || "Failed to download PDF."}`);
    } finally {
      setDownloading(false);
    }
  };


  /* ============================ RENDERING ============================= */

  // Renders the resume as an A4-style document using the selected template.
  const ResumeDocument = ({ data, templateId }) => {
    if (!data) return null;
    const tpl = getTemplate(templateId);
    const contact = data.contact || {};
    const contactLine = [contact.email, contact.phone, contact.location]
      .filter(Boolean)
      .join("  •  ");
    const linkLine = [contact.linkedin, contact.github, contact.portfolio]
      .filter(Boolean)
      .join("  •  ");

    const Section = ({ title, children }) =>
      children ? (
        <div className="rs-doc-section">
          <h3 className="rs-doc-section-title">{title}</h3>
          {children}
        </div>
      ) : null;

    return (
      <div className={`rs-doc rs-doc--${tpl.id}`} data-template={tpl.id}>
        <header className="rs-doc-header">
          <h1 className="rs-doc-name">{contact.fullName || "Your Name"}</h1>
          {contact.headline && <p className="rs-doc-headline">{contact.headline}</p>}
          {(contactLine || linkLine) && (
            <div className="rs-doc-contact">
              {contactLine && <span>{contactLine}</span>}
              {linkLine && <span>{linkLine}</span>}
            </div>
          )}
        </header>

        {data.summary && (
          <section className="rs-doc-section">
            <h2 className="rs-doc-section-title">Professional Summary</h2>
            <p className="rs-doc-summary">{data.summary}</p>
          </section>
        )}

        {Array.isArray(data.skills) && data.skills.length > 0 && (
          <section className="rs-doc-section">
            <h2 className="rs-doc-section-title">Skills</h2>
            <div className="rs-doc-skills">
              {data.skills.map((skill, i) => (
                <span key={i} className={`rs-doc-skill-chip${tpl.id === "minimal" ? " chip-plain" : ""}`}>
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {Array.isArray(data.experience) && data.experience.length > 0 && (
          <section className="rs-doc-section">
            <h2 className="rs-doc-section-title">Work Experience</h2>
            {data.experience.map((exp, i) => (
              <div key={i} className="rs-doc-entry">
                <div className="rs-doc-entry-head">
                  <strong>{exp.title}</strong>
                  <span className="rs-doc-entry-dates">
                    {[exp.startDate, exp.endDate].filter(Boolean).join(" – ")}
                  </span>
                </div>
                <div className="rs-doc-entry-sub">
                  {[exp.company, exp.location].filter(Boolean).join(", ")}
                </div>
                {exp.description && (
                  <ul className="rs-doc-bullets">
                    {String(exp.description)
                      .split(/\n+/)
                      .filter(Boolean)
                      .map((line, j) => (
                        <li key={j}>{line.replace(/^[-•*]\s*/, "")}</li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {Array.isArray(data.projects) && data.projects.length > 0 && (
          <section className="rs-doc-section">
            <h2 className="rs-doc-section-title">Projects</h2>
            {data.projects.map((proj, i) => (
              <div key={i} className="rs-doc-entry">
                <div className="rs-doc-entry-head">
                  <strong>{proj.title}</strong>
                  {proj.techStack && <span className="rs-doc-entry-dates">{proj.techStack}</span>}
                </div>
                {[proj.projectUrl, proj.repoUrl].filter(Boolean).length > 0 && (
                  <div className="rs-doc-entry-sub">
                    {[proj.projectUrl, proj.repoUrl].filter(Boolean).join("  |  ")}
                  </div>
                )}
                {proj.description && (
                  <ul className="rs-doc-bullets">
                    {String(proj.description)
                      .split(/\n+/)
                      .filter(Boolean)
                      .map((line, j) => (
                        <li key={j}>{line.replace(/^[-•*]\s*/, "")}</li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {Array.isArray(data.education) && data.education.length > 0 && (
          <section className="rs-doc-section">
            <h2 className="rs-doc-section-title">Education</h2>
            {data.education.map((edu, i) => (
              <div key={i} className="rs-doc-entry">
                <div className="rs-doc-entry-head">
                  <strong>
                    {[edu.degree, edu.field].filter(Boolean).join(" in ")}
                  </strong>
                  <span className="rs-doc-entry-dates">
                    {[edu.startYear, edu.endYear].filter(Boolean).join(" – ")}
                  </span>
                </div>
                <div className="rs-doc-entry-sub">
                  {[edu.school, edu.grade ? `Grade: ${edu.grade}` : ""].filter(Boolean).join(", ")}
                </div>
              </div>
            ))}
          </section>
        )}


        {Array.isArray(data.certifications) && data.certifications.length > 0 && (
          <section className="rs-doc-section">
            <h2 className="rs-doc-section-title">Certifications</h2>
            {data.certifications.map((cert, i) => (
              <div key={i} className="rs-doc-entry">
                <div className="rs-doc-entry-head">
                  <strong>{cert.name}</strong>
                  <span className="rs-doc-entry-dates">
                    {[cert.issueDate, cert.expiryDate].filter(Boolean).join(" – ")}
                  </span>
                </div>
                {cert.organization && (
                  <div className="rs-doc-entry-sub">{cert.organization}</div>
                )}
              </div>
            ))}
          </section>
        )}

        {Array.isArray(data.achievements) && data.achievements.length > 0 && (
          <section className="rs-doc-section">
            <h2 className="rs-doc-section-title">Achievements</h2>
            {data.achievements.map((ach, i) => (
              <div key={i} className="rs-doc-entry">
                <div className="rs-doc-entry-head">
                  <strong>{ach.title}</strong>
                  {ach.year && <span className="rs-doc-entry-dates">{ach.year}</span>}
                </div>
                {ach.description && (
                  <ul className="rs-doc-bullets">
                    {String(ach.description)
                      .split(/\n+/)
                      .filter(Boolean)
                      .map((line, j) => (
                        <li key={j}>{line.replace(/^[-•*]\s*/, "")}</li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    );
  };

  /* ------------------------------ Stages ------------------------------ */

  if (stage === "validating" || stage === "generating") {
    const generating = stage === "generating";
    return (
      <CandidateLayout activeNav="/candidate/profile">
        <div className="rs-stage-center">
          <Loader2 size={30} className="rs-spin-icon" />
          <h2>{generating ? "Generating your personalized resume..." : "Checking your profile..."}</h2>
          <p>
            {generating
              ? "We're organizing your profile information into a professional resume. This takes a few seconds."
              : "Validating that your profile has everything needed for a professional resume."}
          </p>
        </div>
      </CandidateLayout>
    );
  }

  if (stage === "error") {
    return (
      <CandidateLayout activeNav="/candidate/profile">
        <div className="rs-stage-center rs-stage-error">
          <AlertTriangle size={30} />
          <h2>Something went wrong</h2>
          <p>{errorMessage || "An unexpected error occurred."}</p>
          <div className="rs-stage-actions">
            <button type="button" className="btn btn-primary" onClick={checkProfileReadiness}>
              <RefreshCw size={16} /> Try Again
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/candidate/profile")}>
              <ArrowLeft size={16} /> Back to Profile
            </button>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  if (stage === "incomplete") {
    return (
      <CandidateLayout activeNav="/candidate/profile">
        {toastMessage && <div className="prof-toast">{toastMessage}</div>}
        <div className="rs-stage-center rs-stage-incomplete">
          <div className="rs-incomplete-card">
            <div className="rs-incomplete-icon">
              <AlertTriangle size={26} />
            </div>
            <h2>Please complete your profile before creating your resume.</h2>
            <p>Your profile is missing information that every resume needs.</p>
            <div className="rs-missing-list">
              {missingSections.map((section, i) => (
                <div key={i} className="rs-missing-item">
                  <span className="rs-missing-label">
                    <AlertTriangle size={14} /> {section.label}
                  </span>
                  <span className="rs-missing-hint">{section.hint}</span>
                </div>
              ))}
            </div>
            <div className="rs-stage-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate("/candidate/profile")}
              >
                <User size={16} /> Complete Profile
              </button>
              <button type="button" className="btn btn-secondary" onClick={checkProfileReadiness}>
                <RefreshCw size={16} /> Re-check Profile
              </button>
            </div>
          </div>
        </div>
      </CandidateLayout>
    );
  }


  if (stage === "template") {
    return (
      <CandidateLayout activeNav="/candidate/profile">
        {toastMessage && <div className="prof-toast">{toastMessage}</div>}
        <div className="rs-page">
          <div className="rs-page-head">
            <h1>
              <Sparkles size={22} /> Choose Your Resume Template
            </h1>
            <p>
              Pick a professional template — your resume is generated from the profile information
              you already filled in. Nothing is invented.
            </p>
          </div>
          <div className="rs-template-grid">
            {RESUME_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className={`rs-template-card${selectedTemplate === template.id ? " selected" : ""}`}
              >
                <div className={`rs-tpl-preview rs-tpl-preview--${template.id}`}>
                  <div className="rs-tpl-page">
                    <div className="rs-tpl-line rs-tpl-name"></div>
                    <div className="rs-tpl-line rs-tpl-sub"></div>
                    <div className="rs-tpl-line rs-tpl-rule"></div>
                    <div className="rs-tpl-line rs-tpl-text"></div>
                    <div className="rs-tpl-line rs-tpl-text short"></div>
                    <div className="rs-tpl-line rs-tpl-rule second"></div>
                    <div className="rs-tpl-line rs-tpl-text"></div>
                    <div className="rs-tpl-line rs-tpl-text short"></div>
                  </div>
                </div>
                <div className="rs-template-body">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <button
                    type="button"
                    className="btn btn-primary rs-template-use"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    <FileText size={16} /> Use This Template
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="rs-page-back">
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/candidate/profile")}>
              <ArrowLeft size={16} /> Back to Profile
            </button>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout activeNav="/candidate/profile">
      {toastMessage && <div className="prof-toast">{toastMessage}</div>}
      <div className="rs-page">
        <div className="rs-preview-head">
          <div>
            <h1>
              <FileText size={22} /> Resume Preview
            </h1>
            <p className="rs-preview-template">
              Template: <strong>{getTemplate(selectedTemplate).name}</strong>
              {savedResume && (
                <span className="rs-saved-chip">
                  <CheckCircle2 size={13} /> Saved
                </span>
              )}
            </p>
          </div>
          <div className="rs-preview-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStage("template")}
            >
              <RefreshCw size={16} /> Change Template
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveResume}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className="rs-btn-spin" /> : <Save size={16} />}
              {saving ? "Saving..." : savedResume ? "Update Saved Resume" : "Save Resume"}
            </button>
            <button
              type="button"
              className="btn btn-primary rs-download-btn"
              onClick={handleDownloadPdf}
              disabled={downloading}
            >
              {downloading ? <Loader2 size={16} className="rs-btn-spin" /> : <Download size={16} />}
              {downloading ? "Preparing PDF..." : "Download PDF"}
            </button>
          </div>
        </div>

        {llmError && (
          <div className="rs-llm-note">
            <AlertTriangle size={15} /> {llmError}
          </div>
        )}

        <div className="rs-doc-viewport">
          <ResumeDocument data={resumeData} templateId={selectedTemplate} />
        </div>

        <div className="rs-page-back">
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/candidate/profile")}>
            <ArrowLeft size={16} /> Back to Profile
          </button>
        </div>
      </div>
    </CandidateLayout>
  );
}

