import {
  Award,
  Briefcase,
  Camera,
  CheckCircle2,
  CheckSquare,
  Compass,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  FolderGit2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../Components/components/Button";
import CandidateLayout from "../../Components/components/CandidateLayout";
import { formatFileSize, formatExternalUrl } from "../../utils/formatters";
import { validatePhoneNumber } from "../../utils/validation";
import { updateStoredUser } from "../../utils/userSync";
import API_BASE_URL from "../../utils/api";

const GithubIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// Upload Resume constraints — must match the backend multer limit (5 MB).
const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUME_EXTENSIONS = [".pdf"];
const ALLOWED_RESUME_MIME_TYPES = ["application/pdf"];

export default function Profile() {
  const navigate = useNavigate();
  const pictureInputRef = useRef(null);

  // Loading & Toast State
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Saved resumes (Create Resume + Upload Resume features)
  const [myResumes, setMyResumes] = useState([]);
  const [resumeBusyId, setResumeBusyId] = useState(null);

  // Upload Resume modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedResumeFile, setSelectedResumeFile] = useState(null);
  const [isDraggingResumeFile, setIsDraggingResumeFile] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const resumeFileInputRef = useRef(null);

  // Resume preview modal (uploaded PDFs via authenticated blob URL)
  const [resumePreview, setResumePreview] = useState({ open: false, url: "", title: "" });

  // Delete confirmation modal (existing CareerForge confirmation pattern)
  const [deleteResumeModal, setDeleteResumeModal] = useState({ open: false, resume: null });

  // Candidate Registration & Profile Data
  const [profileData, setProfileData] = useState({
    candidateId: null,
    fullName: "",
    email: "",
    phone: "",
    profilePictureUrl: "",
    headline: "",
    location: "",
    bio: "",
    openToWork: true,
    isFresher: false,
    noCertifications: false,
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    education: [],
    skills: [],
    experience: [],
    projects: [],
    certifications: [],
    achievements: [],
    preferences: {
      desiredRoles: "",
      preferredLocations: "",
      jobTypes: ["Full-time"],
      expectedSalary: "",
      noticePeriod: "Immediate",
    },
    profileCompletion: 0,
  });

  // UI Edit Modes & Temporary Form States
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    fullName: "",
    phone: "",
    headline: "",
    location: "",
    bio: "",
    openToWork: true,
  });

  // Education Form State
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduEditIndex, setEduEditIndex] = useState(null);
  const [eduForm, setEduForm] = useState({
    degree: "",
    field: "",
    school: "",
    startYear: "",
    endYear: "",
    grade: "",
  });

  // Skill Form State
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillForm, setSkillForm] = useState({
    name: "",
    level: "Intermediate",
    category: "Technical",
  });

  // Experience Form State
  const [showExpForm, setShowExpForm] = useState(false);
  const [expEditIndex, setExpEditIndex] = useState(null);
  const [expForm, setExpForm] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });

  // Project Form State
  const [showProjForm, setShowProjForm] = useState(false);
  const [projEditIndex, setProjEditIndex] = useState(null);
  const [projForm, setProjForm] = useState({
    title: "",
    description: "",
    techStack: "",
    projectUrl: "",
    repoUrl: "",
  });

  // Certification Form State
  const [showCertForm, setShowCertForm] = useState(false);
  const [certEditIndex, setCertEditIndex] = useState(null);
  const [certForm, setCertForm] = useState({
    name: "",
    organization: "",
    issueDate: "",
    expiryDate: "",
    credentialUrl: "",
  });

  // Achievement Form State
  const [showAchForm, setShowAchForm] = useState(false);
  const [achEditIndex, setAchEditIndex] = useState(null);
  const [achForm, setAchForm] = useState({
    title: "",
    description: "",
    year: new Date().getFullYear().toString(),
  });

  // Preferences Form State
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [prefsForm, setPrefsForm] = useState({
    desiredRoles: "",
    preferredLocations: "",
    jobTypes: ["Full-time"],
    expectedSalary: "",
    noticePeriod: "Immediate",
  });

  // Links Form State
  const [editingLinks, setEditingLinks] = useState(false);
  const [linksForm, setLinksForm] = useState({
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Auto-Load Registration Details & Profile on Mount
  useEffect(() => {
    fetchCandidateProfile();
    fetchSavedResumes();
  }, []);

  /**
   * Load the candidate's saved resumes for the "My Resumes" section.
   */
  const fetchSavedResumes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/candidates/resume`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setMyResumes(result.data.resumes || []);
      }
    } catch (e) {
      console.warn("Could not load saved resumes", e);
    }
  };

  /**
   * Download a saved resume as a server-rendered A4 PDF.
   */
  const handleDownloadResumePdf = async (resume) => {
    setResumeBusyId(resume.id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/candidates/resume/${resume.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "PDF download failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${resume.title || "resume"}_${resume.template}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("📄 Resume PDF downloaded!");
    } catch (e) {
      showToast(`⚠️ ${e.message || "Failed to download PDF."}`);
    } finally {
      setResumeBusyId(null);
    }
  };

  /**
   * Download the original uploaded PDF exactly as it was stored — the file is
   * never modified. Generated resumes keep using the existing PDF renderer.
   */
  const handleDownloadUploadedResume = async (resume) => {
    setResumeBusyId(resume.id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/candidates/resume/${resume.id}/file?disposition=attachment`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Download failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = resume.originalFilename || `${resume.title || "resume"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("📄 Resume downloaded!");
    } catch (e) {
      showToast(`⚠️ ${e.message || "Failed to download resume."}`);
    } finally {
      setResumeBusyId(null);
    }
  };

  /**
   * Preview an uploaded PDF in a modal. The PDF is fetched with the JWT token
   * and rendered from a temporary blob URL — the token never appears in an
   * iframe URL and no server paths are exposed.
   */
  const handlePreviewResume = async (resume) => {
    setResumeBusyId(resume.id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/candidates/resume/${resume.id}/file?disposition=inline`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Preview failed.");
      }
      const blob = await response.blob();
      setResumePreview({
        open: true,
        url: URL.createObjectURL(blob),
        title: resume.originalFilename || resume.title || "Resume",
      });
    } catch (e) {
      showToast(`⚠️ ${e.message || "Failed to preview resume."}`);
    } finally {
      setResumeBusyId(null);
    }
  };

  const closeResumePreview = () => {
    if (resumePreview.url) URL.revokeObjectURL(resumePreview.url);
    setResumePreview({ open: false, url: "", title: "" });
  };

  /**
   * Ask for confirmation (existing CareerForge confirmation modal pattern)
   * before deleting a resume.
   */
  const handleDeleteResume = (resume) => {
    setDeleteResumeModal({ open: true, resume });
  };

  const handleConfirmDeleteResume = async () => {
    const resume = deleteResumeModal.resume;
    if (!resume) return;
    setResumeBusyId(resume.id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/candidates/resume/${resume.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setMyResumes((prev) => prev.filter((r) => r.id !== resume.id));
        fetchCandidateProfile();
        showToast("🗑️ Resume deleted.");
      } else {
        showToast(`⚠️ ${result.message || "Failed to delete resume."}`);
      }
    } catch (e) {
      showToast(`⚠️ ${e.message || "Failed to delete resume."}`);
    } finally {
      setResumeBusyId(null);
      setDeleteResumeModal({ open: false, resume: null });
    }
  };

  // ---------- Upload Resume modal handlers ----------

  const openUploadModal = () => {
    setSelectedResumeFile(null);
    setIsDraggingResumeFile(false);
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    if (isUploadingResume) return;
    setIsUploadModalOpen(false);
    setSelectedResumeFile(null);
    setIsDraggingResumeFile(false);
  };

  /**
   * Frontend validation: file extension + MIME type + size.
   * The backend re-validates all three plus the actual PDF signature.
   */
  const validateResumeFile = (file) => {
    if (!file) return false;
    const extension = `.${(file.name || "").split(".").pop().toLowerCase()}`;
    if (!ALLOWED_RESUME_EXTENSIONS.includes(extension) || !ALLOWED_RESUME_MIME_TYPES.includes(file.type)) {
      showToast("⚠️ Only PDF files are allowed.");
      return false;
    }
    if (file.size > MAX_RESUME_SIZE_BYTES) {
      showToast("⚠️ File size exceeds the maximum allowed size (5 MB).");
      return false;
    }
    return true;
  };

  const handleResumeFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (validateResumeFile(file)) setSelectedResumeFile(file);
  };

  const handleResumeDrop = (event) => {
    event.preventDefault();
    setIsDraggingResumeFile(false);
    const file = event.dataTransfer?.files?.[0];
    if (validateResumeFile(file)) setSelectedResumeFile(file);
  };

  /**
   * Upload the selected PDF to the candidate's own profile.
   */
  const handleUploadResume = async () => {
    if (!selectedResumeFile || isUploadingResume) return;
    setIsUploadingResume(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please sign in again before uploading a resume.");

      const formData = new FormData();
      formData.append("resume", selectedResumeFile);

      const response = await fetch(`${API_BASE_URL}/candidates/resume/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Resume upload failed.");
      }

      setIsUploadModalOpen(false);
      setSelectedResumeFile(null);
      await fetchSavedResumes();
      await fetchCandidateProfile();
      showToast("✅ Resume uploaded successfully!");
    } catch (error) {
      showToast(`⚠️ ${error.message || "Resume upload failed."}`);
    } finally {
      setIsUploadingResume(false);
    }
  };

  // ---------- My Resumes display helpers ----------

  const formatResumeDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-GB") : "—";
  };

  const getTemplateLabel = (templateId) =>
    templateId === "modern"
      ? "Modern Professional"
      : templateId === "classic"
        ? "Classic Professional"
        : "Minimal Clean";

  const fetchCandidateProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user"))
        : null;

      if (token) {
        const response = await fetch(`${API_BASE_URL}/candidates/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();

        if (response.ok && result.success && result.data) {
          const p = result.data;
          setProfileData(p);
          if (p.profilePictureUrl) {
            updateStoredUser({ profilePictureUrl: p.profilePictureUrl, fullName: p.fullName });
            localStorage.setItem("profilePictureUrl", p.profilePictureUrl);
          }
          setPersonalForm({
            fullName: p.fullName || storedUser?.fullName || storedUser?.name || "",
            phone: (p.phone && p.phone !== "0000000000") ? p.phone : (storedUser?.phone && storedUser.phone !== "0000000000" ? storedUser.phone : ""),
            headline: p.headline || "",
            location: p.location || "",
            bio: p.bio || "",
            openToWork: p.openToWork ?? true,
          });
          setPrefsForm({
            desiredRoles: Array.isArray(p.preferences?.desiredRoles)
              ? p.preferences.desiredRoles.join(", ")
              : p.preferences?.desiredRoles || "",
            preferredLocations: Array.isArray(p.preferences?.preferredLocations)
              ? p.preferences.preferredLocations.join(", ")
              : p.preferences?.preferredLocations || "",
            jobTypes: p.preferences?.jobTypes || ["Full-time"],
            expectedSalary: p.preferences?.expectedSalary || "",
            noticePeriod: p.preferences?.noticePeriod || "Immediate",
          });
          setLinksForm({
            linkedinUrl: p.linkedinUrl || "",
            githubUrl: p.githubUrl || "",
            portfolioUrl: p.portfolioUrl || "",
          });
          setLoading(false);
          return;
        }
      }

      // Fallback: Populate from localStorage if backend offline or unauthenticated
      const name =
        storedUser?.fullName || storedUser?.name || localStorage.getItem("candidateName") || "Candidate User";
      const email = storedUser?.email || "candidate@careerforge.com";
      const phone = (storedUser?.phone && storedUser.phone !== "0000000000") ? storedUser.phone : "";

      const fallback = {
        candidateId: storedUser?.id || 1,
        fullName: name,
        email: email,
        phone: phone,
        profilePictureUrl: storedUser?.profilePictureUrl || "",
        headline: "Software Engineer",
        location: "Bengaluru, India",
        bio: "Motivated professional seeking new software development opportunities.",
        openToWork: true,
        isFresher: false,
        noCertifications: false,
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        portfolioUrl: "",
        education: [
          {
            degree: "B.Tech Computer Science",
            field: "Computer Science",
            school: "VTU Institute of Technology",
            startYear: "2020",
            endYear: "2024",
            grade: "8.5 CGPA",
          },
        ],
        skills: [
          { name: "React.js", level: "Advanced", category: "Technical" },
          { name: "Node.js", level: "Intermediate", category: "Technical" },
          { name: "MySQL", level: "Intermediate", category: "Technical" },
        ],
        experience: [
          {
            title: "Frontend Developer Intern",
            company: "Tech Solutions Inc",
            location: "Bengaluru",
            startDate: "Jan 2024",
            endDate: "Present",
            current: true,
            description: "Developed UI components using React and integrated RESTful APIs.",
          },
        ],
        projects: [
          {
            title: "CareerForge Platform",
            description: "Built candidate profile management with React, Express, and MySQL.",
            techStack: "React, Node.js, MySQL, Express",
            projectUrl: "https://careerforge.dev",
            repoUrl: "https://github.com/careerforge",
          },
        ],
        certifications: [],
        achievements: [],
        preferences: {
          desiredRoles: "Frontend Developer, Full Stack Engineer",
          preferredLocations: "Bengaluru, Remote",
          jobTypes: ["Full-time"],
          expectedSalary: "₹10 - 14 LPA",
          noticePeriod: "Immediate",
        },
        profileCompletion: 70,
      };

      setProfileData(fallback);
      setPersonalForm({
        fullName: name,
        phone: phone,
        headline: fallback.headline,
        location: fallback.location,
        bio: fallback.bio,
        openToWork: true,
      });
      setPrefsForm({
        desiredRoles: fallback.preferences.desiredRoles,
        preferredLocations: fallback.preferences.preferredLocations,
        jobTypes: fallback.preferences.jobTypes,
        expectedSalary: fallback.preferences.expectedSalary,
        noticePeriod: fallback.preferences.noticePeriod,
      });
      setLinksForm({
        linkedinUrl: fallback.linkedinUrl,
        githubUrl: fallback.githubUrl,
        portfolioUrl: fallback.portfolioUrl,
      });
    } catch (e) {
      console.warn("Failed to load candidate profile API", e);
    } finally {
      setLoading(false);
    }
  };

  // Save Section Payload API Helper
  const saveProfilePayload = async (payload, sectionName) => {
    setSavingSection(sectionName);
    try {
      const token = localStorage.getItem("token");
      const merged = { ...profileData, ...payload };

      if (token) {
        const res = await fetch(`${API_BASE_URL}/candidates/profile`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setProfileData(data.data);
          if (data.data.linkedinUrl !== undefined || data.data.githubUrl !== undefined || data.data.portfolioUrl !== undefined) {
            setLinksForm({
              linkedinUrl: data.data.linkedinUrl || "",
              githubUrl: data.data.githubUrl || "",
              portfolioUrl: data.data.portfolioUrl || "",
            });
          }
          const patch = {};
          if (data.data.fullName) patch.fullName = data.data.fullName;
          if (data.data.profilePictureUrl) {
            patch.profilePictureUrl = data.data.profilePictureUrl;
            localStorage.setItem("profilePictureUrl", data.data.profilePictureUrl);
          }
          if (Object.keys(patch).length > 0) {
            updateStoredUser(patch);
          }
          showToast(`✅ ${sectionName} saved successfully!`);
          setSavingSection(null);
          return;
        }
      }

      // Local fallback if unauthenticated / offline
      setProfileData(merged);
      const fallbackPatch = {};
      if (merged.fullName) fallbackPatch.fullName = merged.fullName;
      if (merged.profilePictureUrl) {
        fallbackPatch.profilePictureUrl = merged.profilePictureUrl;
        localStorage.setItem("profilePictureUrl", merged.profilePictureUrl);
      }
      if (Object.keys(fallbackPatch).length > 0) {
        updateStoredUser(fallbackPatch);
      }
      showToast(`✅ ${sectionName} updated!`);
    } catch (e) {
      console.error(`Error saving ${sectionName}`, e);
      showToast(`⚠️ Could not save ${sectionName} to server.`);
    } finally {
      setSavingSection(null);
    }
  };

  // Complete Profile Handler
  const handleCompleteProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const res = await fetch(`${API_BASE_URL}/candidates/profile/complete`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setProfileData(data.data);
          showToast("🎉 Profile completed and saved successfully!");
          return;
        }
      }
      showToast("🎉 Profile marked as complete!");
    } catch (e) {
      showToast("⚠️ Failed to mark profile as complete.");
    }
  };

  // 1. Personal Information Handlers
  const handleSavePersonal = () => {
    if (personalForm.phone && personalForm.phone.trim() !== "") {
      const phoneErr = validatePhoneNumber(personalForm.phone);
      if (phoneErr) {
        showToast(`⚠️ ${phoneErr}`);
        return;
      }
    }
    const payload = {
      fullName: personalForm.fullName,
      phone: personalForm.phone,
      headline: personalForm.headline,
      location: personalForm.location,
      bio: personalForm.bio,
      openToWork: personalForm.openToWork,
    };
    saveProfilePayload(payload, "Personal Information");
    setEditingPersonal(false);
  };

  // 2. Education Handlers
  const handleSaveEdu = () => {
    if (!eduForm.degree.trim() || !eduForm.school.trim()) return;
    let updated = [...profileData.education];
    if (eduEditIndex !== null) {
      updated[eduEditIndex] = eduForm;
    } else {
      updated.push(eduForm);
    }
    saveProfilePayload({ education: updated }, "Education");
    setEduForm({ degree: "", field: "", school: "", startYear: "", endYear: "", grade: "" });
    setEduEditIndex(null);
    setShowEduForm(false);
  };

  const handleRemoveEdu = (index) => {
    const updated = profileData.education.filter((_, i) => i !== index);
    saveProfilePayload({ education: updated }, "Education");
  };

  // 3. Skills Handlers
  const handleSaveSkill = () => {
    if (!skillForm.name.trim()) return;
    const updated = [...profileData.skills, skillForm];
    saveProfilePayload({ skills: updated }, "Skills");
    setSkillForm({ name: "", level: "Intermediate", category: "Technical" });
    setShowSkillForm(false);
  };

  const handleRemoveSkill = (index) => {
    const updated = profileData.skills.filter((_, i) => i !== index);
    saveProfilePayload({ skills: updated }, "Skills");
  };

  // 4. Experience Handlers
  const handleToggleFresher = (e) => {
    const isChecked = e.target.checked;
    saveProfilePayload({ isFresher: isChecked }, "Experience (Fresher Status)");
  };

  const handleSaveExp = () => {
    if (!expForm.title.trim() || !expForm.company.trim()) return;
    let updated = [...profileData.experience];
    if (expEditIndex !== null) {
      updated[expEditIndex] = expForm;
    } else {
      updated.push(expForm);
    }
    saveProfilePayload({ experience: updated }, "Experience");
    setExpForm({ title: "", company: "", location: "", startDate: "", endDate: "", current: false, description: "" });
    setExpEditIndex(null);
    setShowExpForm(false);
  };

  const handleRemoveExp = (index) => {
    const updated = profileData.experience.filter((_, i) => i !== index);
    saveProfilePayload({ experience: updated }, "Experience");
  };

  // 5. Projects Handlers
  const handleSaveProj = () => {
    if (!projForm.title.trim()) return;
    let updated = [...profileData.projects];
    if (projEditIndex !== null) {
      updated[projEditIndex] = projForm;
    } else {
      updated.push(projForm);
    }
    saveProfilePayload({ projects: updated }, "Projects");
    setProjForm({ title: "", description: "", techStack: "", projectUrl: "", repoUrl: "" });
    setProjEditIndex(null);
    setShowProjForm(false);
  };

  const handleRemoveProj = (index) => {
    const updated = profileData.projects.filter((_, i) => i !== index);
    saveProfilePayload({ projects: updated }, "Projects");
  };

  // 6. Certifications Handlers
  const handleToggleNoCertifications = (e) => {
    const isChecked = e.target.checked;
    saveProfilePayload({ noCertifications: isChecked }, "Certifications Status");
  };

  const handleSaveCert = () => {
    if (!certForm.name.trim() || !certForm.organization.trim()) return;
    let updated = [...profileData.certifications];
    if (certEditIndex !== null) {
      updated[certEditIndex] = certForm;
    } else {
      updated.push(certForm);
    }
    saveProfilePayload({ certifications: updated }, "Certifications");
    setCertForm({ name: "", organization: "", issueDate: "", expiryDate: "", credentialUrl: "" });
    setCertEditIndex(null);
    setShowCertForm(false);
  };

  const handleRemoveCert = (index) => {
    const updated = profileData.certifications.filter((_, i) => i !== index);
    saveProfilePayload({ certifications: updated }, "Certifications");
  };

  // 7. Achievements Handlers
  const handleSaveAch = () => {
    if (!achForm.title.trim()) return;
    let updated = [...profileData.achievements];
    if (achEditIndex !== null) {
      updated[achEditIndex] = achForm;
    } else {
      updated.push(achForm);
    }
    saveProfilePayload({ achievements: updated }, "Achievements");
    setAchForm({ title: "", description: "", year: new Date().getFullYear().toString() });
    setAchEditIndex(null);
    setShowAchForm(false);
  };

  const handleRemoveAch = (index) => {
    const updated = profileData.achievements.filter((_, i) => i !== index);
    saveProfilePayload({ achievements: updated }, "Achievements");
  };

  // 8. Preferences Handlers
  const handleSavePrefs = () => {
    const payload = {
      preferences: {
        desiredRoles: prefsForm.desiredRoles,
        preferredLocations: prefsForm.preferredLocations,
        jobTypes: prefsForm.jobTypes,
        expectedSalary: prefsForm.expectedSalary,
        noticePeriod: prefsForm.noticePeriod,
      },
    };
    saveProfilePayload(payload, "Career Preferences");
    setEditingPrefs(false);
  };

  // 9. Links Handlers
  const handleSaveLinks = () => {
    const payload = {
      linkedinUrl: linksForm.linkedinUrl,
      githubUrl: linksForm.githubUrl,
      portfolioUrl: linksForm.portfolioUrl,
    };
    saveProfilePayload(payload, "Social & Portfolio Links");
    setEditingLinks(false);
  };

  const allowedPictureExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const allowedPictureMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxPictureSize = 5 * 1024 * 1024;

  const handleProfilePictureSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const extension = `.${(file.name || "").split(".").pop().toLowerCase()}`;
    if (!allowedPictureExtensions.includes(extension) || !allowedPictureMimeTypes.includes(file.type)) {
      showToast("⚠️ Invalid file type. Please select a JPG, JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > maxPictureSize) {
      showToast("⚠️ File is too large. Maximum size is 5 MB.");
      return;
    }

    const originalPictureUrl = profileData.profilePictureUrl;
    const previewUrl = URL.createObjectURL(file);
    setProfileData((previous) => ({ ...previous, profilePictureUrl: previewUrl }));
    setIsUploadingPicture(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          URL.revokeObjectURL(previewUrl);
          setProfileData((previous) => ({ ...previous, profilePictureUrl: dataUrl }));
          updateStoredUser({ profilePictureUrl: dataUrl });
          localStorage.setItem("profilePictureUrl", dataUrl);
          showToast("✅ Profile picture updated successfully!");
          setIsUploadingPicture(false);
        };
        reader.onerror = () => {
          URL.revokeObjectURL(previewUrl);
          setProfileData((previous) => ({ ...previous, profilePictureUrl: originalPictureUrl }));
          showToast("⚠️ Could not read image file.");
          setIsUploadingPicture(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const formData = new FormData();
      formData.append("picture", file);
      const response = await fetch(`${API_BASE_URL}/candidates/profile/picture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Profile picture upload failed.");
      }

      URL.revokeObjectURL(previewUrl);
      setProfileData(result.data);
      const pic = result.data.profilePictureUrl || "";
      // Broadcast so the bottom-left sidebar avatar updates immediately.
      updateStoredUser({ profilePictureUrl: pic });
      if (pic) {
        localStorage.setItem("profilePictureUrl", pic);
      }
      showToast("✅ Profile picture updated successfully!");
    } catch (error) {
      URL.revokeObjectURL(previewUrl);
      setProfileData((previous) => ({ ...previous, profilePictureUrl: originalPictureUrl }));
      showToast(`⚠️ ${error.message || "Profile picture upload failed."}`);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  if (loading) {
    return (
      <CandidateLayout activeNav="/candidate/profile">
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          <Sparkles size={24} className="spin" style={{ marginBottom: "12px" }} />
          <p>Loading candidate profile from database...</p>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout activeNav="/candidate/profile">
      {/* Notification Toast */}
      {toastMessage && <div className="prof-toast">{toastMessage}</div>}

      <div className="search-main">
        <div className="search-container">
          {/* Profile Cover Banner */}
          <section className="prof-cover">
            <div className="prof-cover-main">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                <div className="prof-avatar" style={{ position: "relative", overflow: "hidden" }}>
                  {profileData.profilePictureUrl ? (
                    <img
                      src={profileData.profilePictureUrl}
                      alt={`${profileData.fullName || "Candidate"} profile`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <User size={36} />
                  )}
                  <span
                    className="prof-avatar-status"
                    title={profileData.openToWork ? "Open to Work" : "Active"}
                  ></span>
                  <button
                    type="button"
                    onClick={() => pictureInputRef.current?.click()}
                    disabled={isUploadingPicture}
                    title="Change profile picture"
                    style={{ position: "absolute", inset: 0, border: 0, background: "rgba(0,0,0,0.42)", color: "#fff", cursor: "pointer", opacity: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                    onMouseEnter={(event) => { event.currentTarget.style.opacity = 1; }}
                    onMouseLeave={(event) => { event.currentTarget.style.opacity = 0; }}
                  >
                    <Camera size={18} />
                    <span style={{ fontSize: "0.65rem", fontWeight: 700 }}>{isUploadingPicture ? "UPLOADING" : "CHANGE"}</span>
                  </button>
                  <input
                    ref={pictureInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    style={{ display: "none" }}
                    onChange={handleProfilePictureSelect}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => pictureInputRef.current?.click()}
                  disabled={isUploadingPicture}
                  style={{ border: "1px solid rgba(255,255,255,0.45)", borderRadius: "14px", background: "rgba(255,255,255,0.16)", color: "#ffffff", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 700, cursor: isUploadingPicture ? "wait" : "pointer", whiteSpace: "nowrap" }}
                >
                  <Camera size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "-2px" }} />
                  {isUploadingPicture ? "Uploading..." : "Change Photo"}
                </button>
              </div>
              <div className="prof-cover-text">
                <div className="prof-name-row">
                  <h1>{profileData.fullName || "Job Seeker"}</h1>
                  {profileData.openToWork && (
                    <span className="prof-open-badge">
                      <CheckCircle2 size={13} /> Open to Work
                    </span>
                  )}
                </div>
                <p className="prof-headline">
                  {profileData.headline || "Complete your profile to showcase your skills"}
                </p>
                <div className="prof-cover-meta">
                  <span>
                    <MapPin size={13} /> {profileData.location || "Location not set"}
                  </span>
                  <span>
                    <Mail size={13} /> {profileData.email}
                  </span>
                  {profileData.phone && (
                    <span>
                      <Phone size={13} /> {profileData.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="prof-cover-side" style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="prof-edit-btn"
                onClick={handleCompleteProfile}
                style={{ background: "#ffffff", color: "var(--primary-hover)" }}
              >
                <CheckCircle2 size={14} style={{ display: "inline", marginRight: "5px" }} />
                Complete Profile
              </button>
            </div>

            <p style={{ margin: "8px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.82)" }}>
              Maximum file size: 5 MB • Allowed formats: JPG, JPEG, PNG, WebP
            </p>

            <div className="prof-cover-stats">
              <span>
                <Briefcase size={13} />{" "}
                {profileData.isFresher
                  ? "Fresher"
                  : `${profileData.experience.length} position(s)`}
              </span>
              <span>
                <Sparkles size={13} /> {profileData.skills.length} skill(s)
              </span>
              <span>
                <Award size={13} /> {profileData.education.length} education
              </span>
              <span>
                <FolderGit2 size={13} /> {profileData.projects.length} project(s)
              </span>
            </div>
          </section>

          {/* Profile Completion Strip */}
          <div className="prof-completion-card">
            <div className="prof-completion-left">
              <span className="prof-completion-icon">
                <Award size={22} />
              </span>
              <div style={{ flex: 1 }}>
                <strong>
                  Profile Completion — {profileData.profileCompletion || 0}%
                </strong>
                <div className="prof-completion-track">
                  <div
                    className="prof-completion-fill"
                    style={{ width: `${profileData.profileCompletion || 0}%` }}
                  />
                </div>
              </div>
            </div>
            <span className="prof-completion-note">
              {profileData.profileCompletion === 100
                ? "🎉 Great job! Your profile is 100% complete and ATS-ready."
                : "Fill all required profile sections and save/upload your resume to reach 100%"}
            </span>
          </div>

          {/* Main Two-Column Profile Body */}
          <div className="prof-body-grid">
            {/* LEFT COLUMN */}
            <div className="prof-col">
              {/* SECTION 1: Personal Information */}
              <div className="prof-card">
                <div className="prof-section-header">
                  <div className="prof-section-title">
                    <User size={18} />
                    <h2>Personal Information</h2>
                  </div>
                  {!editingPersonal ? (
                    <button
                      className="prof-add-btn"
                      onClick={() => setEditingPersonal(true)}
                    >
                      <Edit2 size={12} /> Edit Personal Info
                    </button>
                  ) : (
                    <button className="prof-section-save-btn" onClick={handleSavePersonal}>
                      <Save size={13} /> Save Personal Info
                    </button>
                  )}
                </div>

                {editingPersonal ? (
                  <div className="prof-form-grid">
                    <div className="prof-form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        className="prof-form-input"
                        value={personalForm.fullName}
                        onChange={(e) =>
                          setPersonalForm((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                      />
                    </div>
                    <div className="prof-form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        className="prof-form-input"
                        placeholder="e.g. 1234567890 or +911234567890"
                        value={personalForm.phone}
                        onChange={(e) =>
                          setPersonalForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>
                    <div className="prof-form-group" style={{ gridColumn: "1 / -1" }}>
                      <label>Professional Headline</label>
                      <input
                        type="text"
                        className="prof-form-input"
                        placeholder="e.g. Full Stack Engineer | React, Node.js & MySQL"
                        value={personalForm.headline}
                        onChange={(e) =>
                          setPersonalForm((prev) => ({ ...prev, headline: e.target.value }))
                        }
                      />
                    </div>
                    <div className="prof-form-group">
                      <label>Location</label>
                      <input
                        type="text"
                        className="prof-form-input"
                        placeholder="e.g. Bengaluru, India"
                        value={personalForm.location}
                        onChange={(e) =>
                          setPersonalForm((prev) => ({ ...prev, location: e.target.value }))
                        }
                      />
                    </div>
                    <div className="prof-form-group" style={{ gridColumn: "1 / -1" }}>
                      <label>About / Professional Summary</label>
                      <textarea
                        className="prof-about-textarea"
                        rows={4}
                        placeholder="Write a brief overview of your background, career goals, and key competencies..."
                        value={personalForm.bio}
                        onChange={(e) =>
                          setPersonalForm((prev) => ({ ...prev, bio: e.target.value }))
                        }
                      />
                    </div>
                    <div className="prof-form-group" style={{ gridColumn: "1 / -1" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={personalForm.openToWork}
                          onChange={(e) =>
                            setPersonalForm((prev) => ({ ...prev, openToWork: e.target.checked }))
                          }
                        />
                        <span>Currently Open to Work & Actively Job Hunting</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="prof-about-text">
                      {profileData.bio || "No summary provided yet. Click 'Edit Personal Info' to describe your background."}
                    </p>
                    <div style={{ marginTop: "12px", display: "flex", gap: "16px", fontSize: "0.83rem", color: "var(--text-muted)" }}>
                      <span><strong>Email:</strong> {profileData.email}</span>
                      <span><strong>Phone:</strong> {profileData.phone || "Not set"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Education */}
              <div className="prof-card">
                <div className="prof-section-header">
                  <div className="prof-section-title">
                    <Award size={18} />
                    <h2>Education</h2>
                  </div>
                  <button
                    className="prof-add-btn"
                    onClick={() => {
                      setEduEditIndex(null);
                      setEduForm({ degree: "", field: "", school: "", startYear: "", endYear: "", grade: "" });
                      setShowEduForm(true);
                    }}
                  >
                    <Plus size={13} /> Add Education
                  </button>
                </div>

                {showEduForm && (
                  <div className="prof-item-card" style={{ background: "var(--bg-surface)" }}>
                    <h4 style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--primary)" }}>
                      {eduEditIndex !== null ? "Edit Education Entry" : "Add Education Entry"}
                    </h4>
                    <div className="prof-form-grid">
                      <div className="prof-form-group">
                        <label>Degree *</label>
                        <input
                          type="text"
                          className="prof-form-input"
                          placeholder="e.g. B.Tech / B.E. / B.Sc"
                          value={eduForm.degree}
                          onChange={(e) => setEduForm((p) => ({ ...p, degree: e.target.value }))}
                        />
                      </div>
                      <div className="prof-form-group">
                        <label>Field of Study</label>
                        <input
                          type="text"
                          className="prof-form-input"
                          placeholder="e.g. Computer Science"
                          value={eduForm.field}
                          onChange={(e) => setEduForm((p) => ({ ...p, field: e.target.value }))}
                        />
                      </div>
                      <div className="prof-form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Institution / University *</label>
                        <input
                          type="text"
                          className="prof-form-input"
                          placeholder="e.g. VTU Institute of Technology"
                          value={eduForm.school}
                          onChange={(e) => setEduForm((p) => ({ ...p, school: e.target.value }))}
                        />
                      </div>
                      <div className="prof-form-group">
                        <label>Start Year</label>
                        <input
                          type="text"
                          className="prof-form-input"
                          placeholder="e.g. 2020"
                          value={eduForm.startYear}
                          onChange={(e) => setEduForm((p) => ({ ...p, startYear: e.target.value }))}
                        />
                      </div>
                      <div className="prof-form-group">
                        <label>End Year / Expected</label>
                        <input
                          type="text"
                          className="prof-form-input"
                          placeholder="e.g. 2024"
                          value={eduForm.endYear}
                          onChange={(e) => setEduForm((p) => ({ ...p, endYear: e.target.value }))}
                        />
                      </div>
                      <div className="prof-form-group">
                        <label>Grade / CGPA</label>
                        <input
                          type="text"
                          className="prof-form-input"
                          placeholder="e.g. 8.5 CGPA"
                          value={eduForm.grade}
                          onChange={(e) => setEduForm((p) => ({ ...p, grade: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <Button size="sm" variant="primary" onClick={handleSaveEdu}>
                        Save Education
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowEduForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {profileData.education.length === 0 && !showEduForm ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    No education details added yet. Click 'Add Education' above.
                  </p>
                ) : (
                  profileData.education.map((ed, idx) => (
                    <div key={idx} className="prof-edu-row" style={{ position: "relative" }}>
                      <div className="prof-item-card-actions">
                        <button
                          className="prof-icon-btn"
                          onClick={() => {
                            setEduEditIndex(idx);
                            setEduForm(ed);
                            setShowEduForm(true);
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button className="prof-icon-btn danger" onClick={() => handleRemoveEdu(idx)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <strong>{ed.degree} {ed.field ? `in ${ed.field}` : ""}</strong>
                      <span>
                        {ed.school} • {ed.startYear} — {ed.endYear || "Present"}{" "}
                        {ed.grade ? `(${ed.grade})` : ""}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* SECTION 4: Experience (With Fresher Option) */}
              <div className="prof-card">
                <div className="prof-section-header">
                  <div className="prof-section-title">
                    <Briefcase size={18} />
                    <h2>Experience</h2>
                  </div>
                  {!profileData.isFresher && (
                    <button
                      className="prof-add-btn"
                      onClick={() => {
                        setExpEditIndex(null);
                        setExpForm({
                          title: "",
                          company: "",
                          location: "",
                          startDate: "",
                          endDate: "",
                          current: false,
                          description: "",
                        });
                        setShowExpForm(true);
                      }}
                    >
                      <Plus size={13} /> Add Experience
                    </button>
                  )}
                </div>

                {/* Fresher Option Checkbox */}
                <div className="prof-fresher-box">
                  <input
                    type="checkbox"
                    id="fresherCheck"
                    checked={profileData.isFresher}
                    onChange={handleToggleFresher}
                  />
                  <label htmlFor="fresherCheck" style={{ fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}>
                    I am a fresher / No work experience yet
                  </label>
                </div>

                {profileData.isFresher ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "8px 0" }}>
                    ⭐ Fresher profile active. Work experience is optional for complete profile status.
                  </p>
                ) : (
                  <>
                    {showExpForm && (
                      <div className="prof-item-card" style={{ background: "var(--bg-surface)" }}>
                        <h4 style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--primary)" }}>
                          {expEditIndex !== null ? "Edit Experience Entry" : "Add Work Experience"}
                        </h4>
                        <div className="prof-form-grid">
                          <div className="prof-form-group">
                            <label>Job Title *</label>
                            <input
                              type="text"
                              className="prof-form-input"
                              placeholder="e.g. Software Engineer"
                              value={expForm.title}
                              onChange={(e) => setExpForm((p) => ({ ...p, title: e.target.value }))}
                            />
                          </div>
                          <div className="prof-form-group">
                            <label>Company Name *</label>
                            <input
                              type="text"
                              className="prof-form-input"
                              placeholder="e.g. Tech Solutions Inc"
                              value={expForm.company}
                              onChange={(e) => setExpForm((p) => ({ ...p, company: e.target.value }))}
                            />
                          </div>
                          <div className="prof-form-group">
                            <label>Location</label>
                            <input
                              type="text"
                              className="prof-form-input"
                              placeholder="e.g. Bengaluru, India"
                              value={expForm.location}
                              onChange={(e) => setExpForm((p) => ({ ...p, location: e.target.value }))}
                            />
                          </div>
                          <div className="prof-form-group">
                            <label>Start Date</label>
                            <input
                              type="text"
                              className="prof-form-input"
                              placeholder="e.g. Jan 2023"
                              value={expForm.startDate}
                              onChange={(e) => setExpForm((p) => ({ ...p, startDate: e.target.value }))}
                            />
                          </div>
                          <div className="prof-form-group">
                            <label>End Date</label>
                            <input
                              type="text"
                              className="prof-form-input"
                              placeholder="e.g. Dec 2024"
                              disabled={expForm.current}
                              value={expForm.endDate}
                              onChange={(e) => setExpForm((p) => ({ ...p, endDate: e.target.value }))}
                            />
                          </div>
                          <div className="prof-form-group" style={{ gridColumn: "1 / -1" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={expForm.current}
                                onChange={(e) => setExpForm((p) => ({ ...p, current: e.target.checked }))}
                              />
                              <span>Currently Working Here</span>
                            </label>
                          </div>
                          <div className="prof-form-group" style={{ gridColumn: "1 / -1" }}>
                            <label>Description & Key Achievements</label>
                            <textarea
                              className="prof-form-textarea"
                              rows={3}
                              placeholder="Describe your role, accomplishments, and tech stack used..."
                              value={expForm.description}
                              onChange={(e) => setExpForm((p) => ({ ...p, description: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                          <Button size="sm" variant="primary" onClick={handleSaveExp}>
                            Save Experience
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowExpForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {profileData.experience.length === 0 && !showExpForm ? (
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        No experience added. Click 'Add Experience' or check 'I am a fresher' if applicable.
                      </p>
                    ) : (
                      <div className="prof-timeline">
                        {profileData.experience.map((exp, idx) => (
                          <div key={idx} className="prof-timeline-item">
                            <span className="prof-timeline-dot" />
                            <div className="prof-timeline-body">
                              <div className="prof-item-card-actions">
                                <button
                                  className="prof-icon-btn"
                                  onClick={() => {
                                    setExpEditIndex(idx);
                                    setExpForm(exp);
                                    setShowExpForm(true);
                                  }}
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button className="prof-icon-btn danger" onClick={() => handleRemoveExp(idx)}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                              <strong>{exp.title}</strong>
                              <span className="prof-timeline-company">
                                {exp.company} {exp.location ? `• ${exp.location}` : ""} |{" "}
                                {exp.startDate} — {exp.current ? "Present" : exp.endDate || "N/A"}
                              </span>
                              <p>{exp.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* SECTION 5: Projects */}
              <div className="prof-card">
                <div className="prof-section-header">
                  <div className="prof-section-title">
                    <FolderGit2 size={18} />
                    <h2>Projects</h2>
                  </div>
                  <button
                    className="prof-add-btn"
                    onClick={() => {
                      setProjEditIndex(null);
                      setProjForm({ title: "", description: "", techStack: "", projectUrl: "", repoUrl: "" });
                      setShowProjForm(true);
                    }}
                  >
                    <Plus size={13} /> Add Project
                  </button>
                </div>

                {showProjForm && (
                  <div className="prof-item-card" style={{ background: "var(--bg-surface)" }}>
                    <h4 style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--primary)" }}>
                      {projEditIndex !== null ? "Edit Project Entry" : "Add Project Entry"}
                    </h4>
                    <div className="prof-form-grid">
                      <div className="prof-form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Project Title *</label>
                        <input
                          type="text"
                          className="prof-form-input"
                          placeholder="e.g. E-Commerce Analytics Dashboard"
                          value={projForm.title}
                          onChange={(e) => setProjForm((p) => ({ ...p, title: e.target.value }))}
                        />
                      </div>
                      <div className="prof-form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Technologies Used</label>
                        <input
                          type="text"
                          className="prof-form-input"
                          placeholder="e.g. React, Node.js, Express, MySQL, Tailwind"
                          value={projForm.techStack}
                          onChange={(e) => setProjForm((p) => ({ ...p, techStack: e.target.value }))}
                        />
                      </div>
                      <div className="prof-form-group">
                        <label>Live Project URL</label>
                        <input
                          type="text"
                          className="prof-form-input"
                          placeholder="e.g. https://myproject.com"
                          value={projForm.projectUrl}
                          onChange={(e) => setProjForm((p) => ({ ...p, projectUrl: e.target.value }))}
                        />
                      </div>
                      <div className="prof-form-group">
                        <label>GitHub Repository URL</label>
                        <input
                          type="text"
                          className="prof-form-input"
                          placeholder="e.g. https://github.com/user/project"
                          value={projForm.repoUrl}
                          onChange={(e) => setProjForm((p) => ({ ...p, repoUrl: e.target.value }))}
                        />
                      </div>
                      <div className="prof-form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Project Description</label>
                        <textarea
                          className="prof-form-textarea"
                          rows={3}
                          placeholder="Describe feature highlights, performance improvements, or impact..."
                          value={projForm.description}
                          onChange={(e) => setProjForm((p) => ({ ...p, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <Button size="sm" variant="primary" onClick={handleSaveProj}>
                        Save Project
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowProjForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {profileData.projects.length === 0 && !showProjForm ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    No projects added yet. Adding projects helps demonstrate technical skills!
                  </p>
                ) : (
                  profileData.projects.map((proj, idx) => (
                    <div key={idx} className="prof-item-card">
                      <div className="prof-item-card-actions">
                        <button
                          className="prof-icon-btn"
                          onClick={() => {
                            setProjEditIndex(idx);
                            setProjForm(proj);
                            setShowProjForm(true);
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button className="prof-icon-btn danger" onClick={() => handleRemoveProj(idx)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <h4 style={{ margin: "0 0 4px", fontSize: "0.92rem", color: "var(--text-main)" }}>
                        {proj.title}
                      </h4>
                      {proj.techStack && (
                        <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "600" }}>
                          Tech: {proj.techStack}
                        </span>
                      )}
                      <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", margin: "6px 0 10px" }}>
                        {proj.description}
                      </p>
                      <div style={{ display: "flex", gap: "12px", fontSize: "0.78rem" }}>
                        {proj.projectUrl && (
                          <a
                            href={formatExternalUrl(proj.projectUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                          >
                            <Globe size={12} /> Live Demo <ExternalLink size={11} style={{ opacity: 0.7 }} />
                          </a>
                        )}
                        {proj.repoUrl && (
                          <a
                            href={formatExternalUrl(proj.repoUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--text-main)", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                          >
                            <GithubIcon size={12} /> Code Repo <ExternalLink size={11} style={{ opacity: 0.7 }} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* SECTION 7: Achievements */}
              <div className="prof-card">
                <div className="prof-section-header">
                  <div className="prof-section-title">
                    <Trophy size={18} />
                    <h2>Achievements & Awards</h2>
                  </div>
                  <button
                    className="prof-add-btn"
                    onClick={() => {
                      setAchEditIndex(null);
                      setAchForm({ title: "", description: "", year: new Date().getFullYear().toString() });
                      setShowAchForm(true);
                    }}
                  >
                    <Plus size={13} /> Add Achievement
                  </button>
                </div>

                {showAchForm && (
                  <div className="prof-item-card" style={{ background: "var(--bg-surface)" }}>
                    <h4 style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--primary)" }}>
                      {achEditIndex !== null ? "Edit Achievement Entry" : "Add Achievement Entry"}
                    </h4>
                    <div className="prof-form-grid">
                      <div className="prof-form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Title / Award Name *</label>
                        <input
                          type="text"
                          className="prof-form-input"
                          placeholder="e.g. 1st Place - University Hackathon 2024"
                          value={achForm.title}
                          onChange={(e) => setAchForm((p) => ({ ...p, title: e.target.value }))}
                        />
                      </div>
                      <div className="prof-form-group">
                        <label>Year / Date</label>
                        <input
                          type="text"
                          className="prof-form-input"
                          placeholder="e.g. 2024"
                          value={achForm.year}
                          onChange={(e) => setAchForm((p) => ({ ...p, year: e.target.value }))}
                        />
                      </div>
                      <div className="prof-form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Description / Context</label>
                        <textarea
                          className="prof-form-textarea"
                          rows={2}
                          placeholder="Brief details about the recognition or achievement..."
                          value={achForm.description}
                          onChange={(e) => setAchForm((p) => ({ ...p, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <Button size="sm" variant="primary" onClick={handleSaveAch}>
                        Save Achievement
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAchForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {profileData.achievements.length === 0 && !showAchForm ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    No achievements added. List hackathons, honors, or scholarships.
                  </p>
                ) : (
                  profileData.achievements.map((ach, idx) => (
                    <div key={idx} className="prof-item-card">
                      <div className="prof-item-card-actions">
                        <button
                          className="prof-icon-btn"
                          onClick={() => {
                            setAchEditIndex(idx);
                            setAchForm(ach);
                            setShowAchForm(true);
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button className="prof-icon-btn danger" onClick={() => handleRemoveAch(idx)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <strong style={{ fontSize: "0.9rem", color: "var(--text-main)" }}>
                        {ach.title} {ach.year ? `(${ach.year})` : ""}
                      </strong>
                      <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                        {ach.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="prof-col">
              {/* SECTION 3: Skills */}
              <div className="prof-card">
                <div className="prof-section-header">
                  <div className="prof-section-title">
                    <Sparkles size={18} />
                    <h2>Skills</h2>
                  </div>
                  <button className="prof-add-btn" onClick={() => setShowSkillForm(true)}>
                    <Plus size={13} /> Add Skill
                  </button>
                </div>

                {showSkillForm && (
                  <div className="prof-item-card" style={{ background: "var(--bg-surface)", marginBottom: "14px" }}>
                    <div className="prof-form-grid" style={{ gridTemplateColumns: "1fr" }}>
                      <div className="prof-form-group">
                        <label>Skill Name *</label>
                        <input
                          type="text"
                          className="prof-form-input"
                          placeholder="e.g. React.js, Python, PostgreSQL"
                          value={skillForm.name}
                          onChange={(e) => setSkillForm((p) => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                      <div className="prof-form-group">
                        <label>Proficiency Level</label>
                        <select
                          className="prof-form-select"
                          value={skillForm.level}
                          onChange={(e) => setSkillForm((p) => ({ ...p, level: e.target.value }))}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <Button size="sm" variant="primary" onClick={handleSaveSkill}>
                        Add
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowSkillForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="prof-skills-wrap">
                  {profileData.skills.length === 0 ? (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      No skills added yet. Add skills to boost job matching!
                    </p>
                  ) : (
                    profileData.skills.map((skill, idx) => (
                      <span key={idx} className="prof-skill-chip">
                        {skill.name}{" "}
                        <small style={{ opacity: 0.75, fontSize: "0.7rem", marginLeft: "2px" }}>
                          ({skill.level || "Skill"})
                        </small>
                        <button
                          type="button"
                          className="prof-skill-remove"
                          onClick={() => handleRemoveSkill(idx)}
                          title={`Remove ${skill.name}`}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION 6: Certifications */}
              <div className="prof-card">
                <div className="prof-section-header">
                  <div className="prof-section-title">
                    <CheckSquare size={18} />
                    <h2>Certifications</h2>
                  </div>
                  {!profileData.noCertifications && (
                    <button
                      className="prof-add-btn"
                      onClick={() => {
                        setCertEditIndex(null);
                        setCertForm({ name: "", organization: "", issueDate: "", expiryDate: "", credentialUrl: "" });
                        setShowCertForm(true);
                      }}
                    >
                      <Plus size={13} /> Add Certification
                    </button>
                  )}
                </div>

                <div className="prof-fresher-box" style={{ background: "var(--bg-main)", border: "1px dashed var(--border)" }}>
                  <input
                    type="checkbox"
                    id="noCertCheck"
                    checked={profileData.noCertifications}
                    onChange={handleToggleNoCertifications}
                  />
                  <label htmlFor="noCertCheck" style={{ fontSize: "0.82rem", fontWeight: "600", cursor: "pointer" }}>
                    No certifications yet
                  </label>
                </div>

                {profileData.noCertifications ? (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    No certifications flag active. Optional for full profile.
                  </p>
                ) : (
                  <>
                    {showCertForm && (
                      <div className="prof-item-card" style={{ background: "var(--bg-surface)" }}>
                        <h4 style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--primary)" }}>
                          {certEditIndex !== null ? "Edit Certification" : "Add Certification"}
                        </h4>
                        <div className="prof-form-grid" style={{ gridTemplateColumns: "1fr" }}>
                          <div className="prof-form-group">
                            <label>Certification Name *</label>
                            <input
                              type="text"
                              className="prof-form-input"
                              placeholder="e.g. AWS Certified Developer"
                              value={certForm.name}
                              onChange={(e) => setCertForm((p) => ({ ...p, name: e.target.value }))}
                            />
                          </div>
                          <div className="prof-form-group">
                            <label>Issuing Organization *</label>
                            <input
                              type="text"
                              className="prof-form-input"
                              placeholder="e.g. Amazon Web Services"
                              value={certForm.organization}
                              onChange={(e) => setCertForm((p) => ({ ...p, organization: e.target.value }))}
                            />
                          </div>
                          <div className="prof-form-group">
                            <label>Credential URL</label>
                            <input
                              type="text"
                              className="prof-form-input"
                              placeholder="e.g. https://coursera.org/verify/..."
                              value={certForm.credentialUrl}
                              onChange={(e) => setCertForm((p) => ({ ...p, credentialUrl: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                          <Button size="sm" variant="primary" onClick={handleSaveCert}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowCertForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {profileData.certifications.length === 0 && !showCertForm ? (
                      <p style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>
                        No certifications added. Click 'Add Certification' or toggle 'No certifications yet'.
                      </p>
                    ) : (
                      profileData.certifications.map((cert, idx) => (
                        <div key={idx} className="prof-item-card">
                          <div className="prof-item-card-actions">
                            <button
                              className="prof-icon-btn"
                              onClick={() => {
                                setCertEditIndex(idx);
                                setCertForm(cert);
                                setShowCertForm(true);
                              }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button className="prof-icon-btn danger" onClick={() => handleRemoveCert(idx)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <strong style={{ fontSize: "0.88rem", color: "var(--text-main)" }}>{cert.name}</strong>
                          <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 4px" }}>
                            {cert.organization}
                          </span>
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: "0.75rem", color: "var(--primary)" }}
                            >
                              View Credential
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>

              {/* SECTION 8: Career Interests & Preferences */}
              <div className="prof-card">
                <div className="prof-section-header">
                  <div className="prof-section-title">
                    <Compass size={18} />
                    <h2>Career Preferences</h2>
                  </div>
                  {!editingPrefs ? (
                    <button className="prof-add-btn" onClick={() => setEditingPrefs(true)}>
                      <Edit2 size={12} /> Edit
                    </button>
                  ) : (
                    <button className="prof-section-save-btn" onClick={handleSavePrefs}>
                      <Save size={13} /> Save
                    </button>
                  )}
                </div>

                {editingPrefs ? (
                  <div className="prof-form-grid" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="prof-form-group">
                      <label>Desired Job Roles</label>
                      <input
                        type="text"
                        className="prof-form-input"
                        placeholder="e.g. Frontend Developer, Full Stack Engineer"
                        value={prefsForm.desiredRoles}
                        onChange={(e) => setPrefsForm((p) => ({ ...p, desiredRoles: e.target.value }))}
                      />
                    </div>
                    <div className="prof-form-group">
                      <label>Preferred Locations</label>
                      <input
                        type="text"
                        className="prof-form-input"
                        placeholder="e.g. Bengaluru, Mumbai, Remote"
                        value={prefsForm.preferredLocations}
                        onChange={(e) => setPrefsForm((p) => ({ ...p, preferredLocations: e.target.value }))}
                      />
                    </div>
                    <div className="prof-form-group">
                      <label>Expected Salary</label>
                      <input
                        type="text"
                        className="prof-form-input"
                        placeholder="e.g. ₹10 - 15 LPA"
                        value={prefsForm.expectedSalary}
                        onChange={(e) => setPrefsForm((p) => ({ ...p, expectedSalary: e.target.value }))}
                      />
                    </div>
                    <div className="prof-form-group">
                      <label>Notice Period</label>
                      <select
                        className="prof-form-select"
                        value={prefsForm.noticePeriod}
                        onChange={(e) => setPrefsForm((p) => ({ ...p, noticePeriod: e.target.value }))}
                      >
                        <option value="Immediate">Immediate / Serving Notice</option>
                        <option value="15 days">15 Days</option>
                        <option value="30 days">30 Days</option>
                        <option value="60 days">60 Days</option>
                        <option value="90 days">90 Days</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <strong style={{ color: "var(--text-main)" }}>Desired Roles: </strong>
                      {prefsForm.desiredRoles || "Not specified"}
                    </div>
                    <div>
                      <strong style={{ color: "var(--text-main)" }}>Locations: </strong>
                      {prefsForm.preferredLocations || "Not specified"}
                    </div>
                    <div>
                      <strong style={{ color: "var(--text-main)" }}>Expected Salary: </strong>
                      {prefsForm.expectedSalary || "Not specified"}
                    </div>
                    <div>
                      <strong style={{ color: "var(--text-main)" }}>Notice Period: </strong>
                      {prefsForm.noticePeriod || "Immediate"}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 9: Social & Portfolio Links */}
              <div className="prof-card">
                <div className="prof-section-header">
                  <div className="prof-section-title">
                    <Globe size={18} />
                    <h2>Social & Portfolio Links</h2>
                  </div>
                  {!editingLinks ? (
                    <button className="prof-add-btn" onClick={() => setEditingLinks(true)}>
                      <Edit2 size={12} /> Edit
                    </button>
                  ) : (
                    <button className="prof-section-save-btn" onClick={handleSaveLinks}>
                      <Save size={13} /> Save
                    </button>
                  )}
                </div>

                {editingLinks ? (
                  <div className="prof-form-grid" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="prof-form-group">
                      <label>LinkedIn URL</label>
                      <input
                        type="text"
                        className="prof-form-input"
                        placeholder="https://linkedin.com/in/username"
                        value={linksForm.linkedinUrl}
                        onChange={(e) => setLinksForm((p) => ({ ...p, linkedinUrl: e.target.value }))}
                      />
                    </div>
                    <div className="prof-form-group">
                      <label>GitHub URL</label>
                      <input
                        type="text"
                        className="prof-form-input"
                        placeholder="https://github.com/username"
                        value={linksForm.githubUrl}
                        onChange={(e) => setLinksForm((p) => ({ ...p, githubUrl: e.target.value }))}
                      />
                    </div>
                    <div className="prof-form-group">
                      <label>Portfolio / Personal Website</label>
                      <input
                        type="text"
                        className="prof-form-input"
                        placeholder="https://myportfolio.dev"
                        value={linksForm.portfolioUrl}
                        onChange={(e) => setLinksForm((p) => ({ ...p, portfolioUrl: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(linksForm.linkedinUrl || profileData.linkedinUrl) ? (
                      <a
                        href={formatExternalUrl(linksForm.linkedinUrl || profileData.linkedinUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="prof-contact-row prof-link-hover"
                        style={{ textDecoration: "none", cursor: "pointer" }}
                        title={`Open ${linksForm.linkedinUrl || profileData.linkedinUrl}`}
                      >
                        <LinkedinIcon size={15} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {linksForm.linkedinUrl || profileData.linkedinUrl}
                        </span>
                        <ExternalLink size={13} style={{ opacity: 0.65, marginLeft: "auto", flexShrink: 0 }} />
                      </a>
                    ) : (
                      <div className="prof-contact-row"><LinkedinIcon size={15} /> LinkedIn not added</div>
                    )}

                    {(linksForm.githubUrl || profileData.githubUrl) ? (
                      <a
                        href={formatExternalUrl(linksForm.githubUrl || profileData.githubUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="prof-contact-row prof-link-hover"
                        style={{ textDecoration: "none", cursor: "pointer" }}
                        title={`Open ${linksForm.githubUrl || profileData.githubUrl}`}
                      >
                        <GithubIcon size={15} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {linksForm.githubUrl || profileData.githubUrl}
                        </span>
                        <ExternalLink size={13} style={{ opacity: 0.65, marginLeft: "auto", flexShrink: 0 }} />
                      </a>
                    ) : (
                      <div className="prof-contact-row"><GithubIcon size={15} /> GitHub not added</div>
                    )}

                    {(linksForm.portfolioUrl || profileData.portfolioUrl) ? (
                      <a
                        href={formatExternalUrl(linksForm.portfolioUrl || profileData.portfolioUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="prof-contact-row prof-link-hover"
                        style={{ textDecoration: "none", cursor: "pointer" }}
                        title={`Open ${linksForm.portfolioUrl || profileData.portfolioUrl}`}
                      >
                        <Globe size={15} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {linksForm.portfolioUrl || profileData.portfolioUrl}
                        </span>
                        <ExternalLink size={13} style={{ opacity: 0.65, marginLeft: "auto", flexShrink: 0 }} />
                      </a>
                    ) : (
                      <div className="prof-contact-row"><Globe size={15} /> Portfolio not added</div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* My Resumes — full-width resume management dashboard
              (Create Resume + Upload Resume side by side; generated and
              uploaded PDF resumes coexist here) */}
          <section className="prof-card rs-my-resumes">
            <div className="rs-header">
              <div className="rs-header-left">
                <span className="rs-header-icon">
                  <FileText size={22} />
                </span>
                <div className="rs-header-text">
                  <h2>My Resumes</h2>
                  <p>Create and manage your resumes</p>
                </div>
                {myResumes.length > 0 && (
                  <span className="rs-count-chip">
                    {myResumes.length} {myResumes.length === 1 ? "resume" : "resumes"}
                  </span>
                )}
              </div>
              <div className="rs-actions-row">
                <button
                  type="button"
                  className="btn btn-primary rs-action-btn"
                  onClick={() => navigate("/candidate/resume")}
                  title="Generate a personalized resume from your profile"
                >
                  <Plus size={16} /> Create Resume
                </button>
                <button
                  type="button"
                  className="btn rs-action-btn rs-action-upload"
                  onClick={openUploadModal}
                  title="Upload an existing PDF resume to your profile"
                >
                  <Upload size={16} /> Upload Resume
                </button>
              </div>
            </div>

            {myResumes.length === 0 ? (
              <div className="rs-empty-state">
                <FileText size={26} />
                <strong>No resumes yet</strong>
                <p>
                  Create a resume from your CareerForge profile or upload an existing PDF
                  resume.
                </p>
              </div>
            ) : (
              <div className="rs-resume-list">
                {myResumes.map((resume) => {
                  const isUploaded = resume.resumeType === "uploaded";
                  return (
                    <div key={resume.id} className="rs-resume-item">
                      <span className={`rs-resume-icon${isUploaded ? " uploaded" : ""}`}>
                        <FileText size={18} />
                      </span>
                      <div className="rs-resume-info">
                        <div className="rs-resume-title-row">
                          <strong className="rs-resume-title">{resume.title || "My Resume"}</strong>
                          <span
                            className={`rs-resume-type-badge ${isUploaded ? "uploaded" : "generated"}`}
                          >
                            {isUploaded ? "Uploaded PDF" : "CareerForge Generated"}
                          </span>
                        </div>
                        {isUploaded ? (
                          <span className="rs-resume-meta">
                            Uploaded: {formatResumeDate(resume.createdAt)}
                            {resume.fileSize ? ` • ${formatFileSize(resume.fileSize)}` : ""}
                            {resume.originalFilename ? ` • ${resume.originalFilename}` : ""}
                          </span>
                        ) : (
                          <span className="rs-resume-meta">
                            {getTemplateLabel(resume.template)}
                            {resume.llmEnhanced ? " • AI-polished" : ""}
                            {` • Created: ${formatResumeDate(resume.createdAt)}`}
                          </span>
                        )}
                      </div>
                      <div className="rs-resume-actions">
                        {isUploaded ? (
                          <button
                            type="button"
                            className="prof-add-btn"
                            onClick={() => handlePreviewResume(resume)}
                            disabled={resumeBusyId === resume.id}
                            title="Preview this PDF resume"
                          >
                            <Eye size={12} /> Preview
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="prof-add-btn"
                            onClick={() => navigate(`/candidate/resume?resumeId=${resume.id}`)}
                            title="Open this resume"
                          >
                            View
                          </button>
                        )}
                        <button
                          type="button"
                          className="prof-add-btn"
                          onClick={() =>
                            isUploaded
                              ? handleDownloadUploadedResume(resume)
                              : handleDownloadResumePdf(resume)
                          }
                          disabled={resumeBusyId === resume.id}
                          title={isUploaded ? "Download the original PDF" : "Download as PDF (A4)"}
                        >
                          <Download size={12} /> Download
                        </button>
                        <button
                          type="button"
                          className="prof-add-btn rs-resume-delete"
                          onClick={() => handleDeleteResume(resume)}
                          disabled={resumeBusyId === resume.id}
                          title="Delete this resume"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Upload Resume Modal — drag & drop or file picker (PDF only) */}
      {isUploadModalOpen && (
        <div className="modal-overlay" onClick={closeUploadModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Resume</h3>
              <button type="button" className="close-dropdown-btn" onClick={closeUploadModal}>
                <X size={18} />
              </button>
            </div>
            <p className="modal-intro">
              Add an existing resume to your CareerForge profile. Your PDF is stored securely
              and only you can access it.
            </p>

            <div
              className={`rs-upload-dropzone${isDraggingResumeFile ? " dragging" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingResumeFile(true);
              }}
              onDragLeave={() => setIsDraggingResumeFile(false)}
              onDrop={handleResumeDrop}
              onClick={() => resumeFileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <Upload size={30} />
              {selectedResumeFile ? (
                <>
                  <strong className="rs-upload-file-name">{selectedResumeFile.name}</strong>
                  <span className="rs-upload-file-size">
                    {formatFileSize(selectedResumeFile.size)} • PDF
                  </span>
                  <span className="rs-upload-choose">Choose a different file</span>
                </>
              ) : (
                <>
                  <strong>Drag &amp; drop your PDF here</strong>
                  <span className="rs-upload-or">or</span>
                  <span className="rs-upload-choose">Choose PDF</span>
                </>
              )}
              <input
                ref={resumeFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: "none" }}
                onChange={handleResumeFileChange}
              />
            </div>

            <p className="rs-upload-note">
              Maximum file size: 5 MB • Only PDF files are accepted (DOC/DOCX, TXT and images
              are rejected)
            </p>

            <div className="rs-upload-footer">
              <Button variant="outline" onClick={closeUploadModal} disabled={isUploadingResume}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUploadResume}
                disabled={!selectedResumeFile || isUploadingResume}
              >
                {isUploadingResume ? "Uploading..." : "Upload Resume"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Preview Modal — uploaded PDF rendered from an authenticated blob URL */}
      {resumePreview.open && (
        <div className="modal-overlay" onClick={closeResumePreview}>
          <div className="rs-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="rs-preview-head">
              <div className="rs-preview-title">
                <FileText size={18} />
                <strong>{resumePreview.title}</strong>
              </div>
              <div className="rs-preview-actions">
                <a
                  className="prof-add-btn"
                  href={resumePreview.url}
                  download={resumePreview.title}
                  title="Download this PDF"
                >
                  <Download size={12} /> Download
                </a>
                <button type="button" className="close-dropdown-btn" onClick={closeResumePreview}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <iframe src={resumePreview.url} title="Resume preview" className="rs-preview-frame" />
          </div>
        </div>
      )}

      {/* Delete Resume Confirmation Modal */}
      {deleteResumeModal.open && deleteResumeModal.resume && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteResumeModal({ open: false, resume: null })}
        >
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Resume</h3>
              <button
                type="button"
                className="close-dropdown-btn"
                onClick={() => setDeleteResumeModal({ open: false, resume: null })}
              >
                <X size={18} />
              </button>
            </div>
            <p className="modal-intro">
              Are you sure you want to delete{" "}
              <strong>{deleteResumeModal.resume.title || "this resume"}</strong>?
              {deleteResumeModal.resume.resumeType === "uploaded"
                ? " The uploaded PDF will be permanently removed from your profile."
                : " The generated resume will be permanently removed from your profile."}{" "}
              This action cannot be undone.
            </p>
            <div className="modal-actions-row">
              <Button
                variant="outline"
                onClick={() => setDeleteResumeModal({ open: false, resume: null })}
                disabled={resumeBusyId === deleteResumeModal.resume.id}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDeleteResume}
                disabled={resumeBusyId === deleteResumeModal.resume.id}
              >
                {resumeBusyId === deleteResumeModal.resume.id ? "Deleting..." : "Delete Resume"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </CandidateLayout>
  );
}
