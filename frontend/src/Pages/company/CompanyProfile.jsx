import React, { useState, useEffect, useRef } from "react";
import CompanyLayout from "../../Components/CompanyLayout";
import FormInput from "../../Components/components/FormInput";
import FormSelect from "../../Components/components/FormSelect";
import Button from "../../Components/components/Button";
import API_BASE_URL from "../../utils/api";
import { updateStoredUser } from "../../utils/userSync";
import { validatePhoneNumber } from "../../utils/validation";
import {
    Building2,
    Briefcase,
    Mail,
    Phone,
    Globe,
    FileText,
    MapPin,
    CheckCircle2,
    ShieldCheck,
    Save,
    Lock,
    Clock,
    X,
    Upload,
    Camera,
    Edit2,
    Award,
    Users,
    Calendar,
    Sparkles,
    ExternalLink,
    RefreshCw,
} from "lucide-react";

const companyTypes = [
    { value: "Information Technology", label: "Information Technology & Software" },
    { value: "Healthcare", label: "Healthcare & Pharmaceuticals" },
    { value: "Finance", label: "Banking, Finance & Insurance" },
    { value: "E-commerce", label: "E-Commerce & Retail" },
    { value: "Education", label: "Education & EdTech" },
    { value: "Manufacturing", label: "Manufacturing & Core Engineering" },
    { value: "Startup", label: "Early / High-Growth Startup" },
    { value: "Consulting", label: "Management & IT Consulting" },
    { value: "Media & Marketing", label: "Media, Advertising & Design" },
    { value: "Other", label: "Other Business Services" },
];

const companySizeOptions = [
    { value: "1-10", label: "1 - 10 Employees" },
    { value: "11-50", label: "11 - 50 Employees" },
    { value: "51-200", label: "51 - 200 Employees" },
    { value: "201-500", label: "201 - 500 Employees" },
    { value: "501-1000", label: "501 - 1000 Employees" },
    { value: "1000+", label: "1000+ Enterprise Employees" },
];

export default function CompanyProfile() {
    const logoInputRef = useRef(null);
    const docInputRef = useRef(null);

    // Profile State
    const [loading, setLoading] = useState(true);
    const [savingSection, setSavingSection] = useState(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [selectedDocumentType, setSelectedDocumentType] = useState("");

    const [profileData, setProfileData] = useState({
        companyId: null,
        companyName: "",
        companyType: "Information Technology",
        email: "",
        phone: "",
        website: "",
        gstin: "",
        pincode: "",
        verificationStatus: "pending", // 'pending' | 'verified' | 'rejected'
        emailVerified: true,
        logoUrl: "",
        industry: "Information Technology & Software",
        companySize: "51-200",
        foundedYear: "2018",
        headquarters: "",
        address: "",
        cin: "",
        socialLinks: {
            linkedinUrl: "",
            twitterUrl: "",
            facebookUrl: "",
        },
        profileCompletion: 0,
        documents: [],
    });

    // Section Edit Modes
    const [editingBasic, setEditingBasic] = useState(false);
    const [editingLocation, setEditingLocation] = useState(false);
    const [editingSocial, setEditingSocial] = useState(false);

    // Section Forms State
    const [basicForm, setBasicForm] = useState({
        companyName: "",
        companyType: "Information Technology",
        phone: "",
        website: "",
        companySize: "51-200",
        foundedYear: "2018",
    });

    const [locationForm, setLocationForm] = useState({
        headquarters: "",
        address: "",
        pincode: "",
        cin: "",
    });

    const [socialForm, setSocialForm] = useState({
        linkedinUrl: "",
        twitterUrl: "",
        facebookUrl: "",
    });

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 3500);
    };

    // Calculate Completion Score
    // 100% complete ONLY when all required fields are filled AND verification document is uploaded AND company is verified.
    const calculateCompletion = (p) => {
        if (!p) return 0;
        let score = 0;

        // 1. Basic Info (20%)
        if (p.companyName?.trim() && p.companyType?.trim() && p.email?.trim() && p.phone?.trim() && p.website?.trim()) {
            score += 20;
        } else if (p.companyName?.trim() && p.email?.trim()) {
            score += 10;
        }

        // 2. Headquarters & Location (20%)
        if (p.headquarters?.trim() && p.address?.trim() && p.pincode?.trim()) {
            score += 20;
        } else if (p.pincode?.trim() || p.headquarters?.trim()) {
            score += 10;
        }

        // 3. Corporate Details (20%)
        if (p.gstin?.trim() && p.companySize?.trim() && p.foundedYear) {
            score += 20;
        } else if (p.gstin?.trim()) {
            score += 10;
        }

        // 4. Social Links (10%)
        const links = p.socialLinks || {};
        if (links.linkedinUrl?.trim() || links.twitterUrl?.trim() || links.facebookUrl?.trim()) {
            score += 10;
        }

        // 5. Verification Document (15%)
        const hasDocuments = Array.isArray(p.documents) && p.documents.length > 0;
        if (hasDocuments) {
            score += 15;
        }

        // 6. Company Verification Status (15%)
        const hasVerifiedDoc = Array.isArray(p.documents) && p.documents.some(
            (d) => (d.verificationStatus || d.verification_status || "").toString().toLowerCase() === "verified"
        );
        const isVerified = hasVerifiedDoc || (p.verificationStatus || p.verification_status || "").toString().toLowerCase() === "verified";
        if (isVerified && hasDocuments) {
            score += 15;
        }

        return Math.min(100, Math.max(0, score));
    };

    const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

    // Load Profile on Mount and handle ?verified=true redirect
    useEffect(() => {
        fetchCompanyProfile(true);

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("verified") === "true") {
            showToast("🎉 Company document verified successfully!");
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchCompanyProfile(false);
        }
    }, []);

    const fetchCompanyProfile = async (showLoadingState = true) => {
        if (showLoadingState) {
            setLoading(true);
        } else {
            setIsRefreshingStatus(true);
        }
        try {
            const token = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

            if (token) {
                const response = await fetch(`${API_BASE_URL}/companies/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                const result = await response.json();

                if (response.ok && result.success && result.data) {
                    const p = result.data;
                    const completion = calculateCompletion(p);
                    const hasVerifiedDoc = Array.isArray(p.documents) && p.documents.some(
                        (d) => (d.verificationStatus || d.verification_status || "").toString().toLowerCase() === "verified"
                    );
                    const effectiveStatus = hasVerifiedDoc ? "verified" : (p.verificationStatus || "pending");
                    const merged = { ...p, verificationStatus: effectiveStatus, profileCompletion: completion };

                    setProfileData((prev) => {
                        const wasPending = (prev.verificationStatus || "").toLowerCase() === "pending" ||
                            (prev.documents || []).some(d => (d.verificationStatus || "").toLowerCase() === "pending");
                        const nowVerified = (merged.verificationStatus || "").toLowerCase() === "verified" ||
                            (merged.documents || []).some(d => (d.verificationStatus || "").toLowerCase() === "verified");

                        if (wasPending && nowVerified && !showLoadingState) {
                            showToast("🎉 Document verified! Status updated.");
                        }
                        return merged;
                    });

                    updateStoredUser({ verificationStatus: effectiveStatus });

                    if (p.logoUrl) {
                        updateStoredUser({
                            logoUrl: p.logoUrl,
                            profilePictureUrl: p.logoUrl,
                            companyName: p.companyName,
                        });
                        localStorage.setItem("companyLogo", p.logoUrl);
                        localStorage.setItem("profilePictureUrl", p.logoUrl);
                    }
                    if (showLoadingState) {
                        setBasicForm({
                            companyName: p.companyName || storedUser?.companyName || storedUser?.company_name || "",
                            companyType: p.companyType || storedUser?.companyType || "Information Technology",
                            phone: p.phone || storedUser?.phone || "",
                            website: p.website || storedUser?.website || "",
                            companySize: p.companySize || "51-200",
                            foundedYear: p.foundedYear || "2018",
                        });
                        setLocationForm({
                            headquarters: p.headquarters || "",
                            address: p.address || "",
                            pincode: p.pincode || storedUser?.pincode || "",
                            cin: p.cin || "",
                        });
                        setSocialForm({
                            linkedinUrl: p.socialLinks?.linkedinUrl || "",
                            twitterUrl: p.socialLinks?.twitterUrl || "",
                            facebookUrl: p.socialLinks?.facebookUrl || "",
                        });
                    }
                    if (showLoadingState) setLoading(false);
                    return;
                }
            }

            // Fallback from localStorage
            const name = storedUser?.companyName || storedUser?.company_name || storedUser?.name || localStorage.getItem("companyName") || "Infosys";
            const email = storedUser?.email || "recruitment@infosys.com";
            const phone = storedUser?.phone || "";
            const gstin = storedUser?.gstin || "29ABCDE1234F1Z5";
            const pincode = storedUser?.pincode || "403601";
            const website = storedUser?.website || "https://infosys.com";
            const logoUrl = storedUser?.logoUrl || localStorage.getItem("companyLogo") || "";

            const fallbackData = {
                companyId: storedUser?.id || 1,
                companyName: name,
                companyType: storedUser?.companyType || "Information Technology",
                email: email,
                phone: phone,
                website: website,
                gstin: gstin,
                pincode: pincode,
                verificationStatus: storedUser?.verificationStatus || "pending",
                emailVerified: true,
                logoUrl: logoUrl,
                industry: "Information Technology & Software",
                companySize: "51-200",
                foundedYear: "2018",
                headquarters: "Bengaluru, Karnataka, India",
                address: "Electronic City, Hosur Road, Bengaluru",
                cin: "L85110KA1981PLC013115",
                socialLinks: {
                    linkedinUrl: "https://linkedin.com/company/infosys",
                    twitterUrl: "https://twitter.com/infosys",
                    facebookUrl: "",
                },
                documents: [
                    {
                        id: 101,
                        docName: "GST Registration Certificate",
                        docType: "GST Certificate",
                        fileUrl: "#",
                        uploadDate: new Date().toISOString(),
                        verificationStatus: "pending",
                    },
                ],
            };

            fallbackData.profileCompletion = calculateCompletion(fallbackData);
            setProfileData(fallbackData);
            setBasicForm({
                companyName: fallbackData.companyName,
                companyType: fallbackData.companyType,
                phone: fallbackData.phone,
                website: fallbackData.website,
                companySize: fallbackData.companySize,
                foundedYear: fallbackData.foundedYear,
            });
            setLocationForm({
                headquarters: fallbackData.headquarters,
                address: fallbackData.address,
                pincode: fallbackData.pincode,
                cin: fallbackData.cin,
            });
            setSocialForm(fallbackData.socialLinks);
        } catch (err) {
            console.warn("Error fetching company profile:", err);
        } finally {
            if (showLoadingState) setLoading(false);
            setIsRefreshingStatus(false);
        }
    };

    // Generic API Payload Save Helper
    const saveProfileSection = async (payload, sectionName) => {
        setSavingSection(sectionName);
        try {
            const token = localStorage.getItem("token");
            const merged = { ...profileData, ...payload };
            merged.profileCompletion = calculateCompletion(merged);

            if (token) {
                const res = await fetch(`${API_BASE_URL}/companies/profile`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
                const result = await res.json();
                if (res.ok && result.success && result.data) {
                    setProfileData(result.data);
                    const patch = {
                        companyName: result.data.companyName,
                        companyType: result.data.companyType,
                        phone: result.data.phone,
                        website: result.data.website,
                    };
                    const activeLogo = result.data.logoUrl || profileData.logoUrl;
                    if (activeLogo) {
                        patch.logoUrl = activeLogo;
                        patch.profilePictureUrl = activeLogo;
                        localStorage.setItem("companyLogo", activeLogo);
                        localStorage.setItem("profilePictureUrl", activeLogo);
                    }
                    updateStoredUser(patch);
                    if (result.data.companyName) {
                        localStorage.setItem("companyName", result.data.companyName);
                    }

                    showToast(`✅ ${sectionName} saved successfully!`);
                    setSavingSection(null);
                    return;
                }
            }

            // Local fallback save
            setProfileData(merged);
            const fallbackPatch = {
                companyName: merged.companyName,
                companyType: merged.companyType,
                phone: merged.phone,
                website: merged.website,
            };
            const fallbackLogo = merged.logoUrl || profileData.logoUrl;
            if (fallbackLogo) {
                fallbackPatch.logoUrl = fallbackLogo;
                fallbackPatch.profilePictureUrl = fallbackLogo;
                localStorage.setItem("companyLogo", fallbackLogo);
                localStorage.setItem("profilePictureUrl", fallbackLogo);
            }
            updateStoredUser(fallbackPatch);
            if (merged.companyName) {
                localStorage.setItem("companyName", merged.companyName);
            }

            showToast(`✅ ${sectionName} updated!`);
        } catch (err) {
            console.error(`Error saving ${sectionName}:`, err);
            showToast(`⚠️ Could not save ${sectionName} to server.`);
        } finally {
            setSavingSection(null);
        }
    };

    // Save Section 1: Basic Info
    const handleSaveBasic = () => {
        if (basicForm.phone && basicForm.phone.trim() !== "") {
            const phoneErr = validatePhoneNumber(basicForm.phone);
            if (phoneErr) {
                showToast(`⚠️ ${phoneErr}`);
                return;
            }
        }
        const payload = {
            companyName: basicForm.companyName,
            companyType: basicForm.companyType,
            phone: basicForm.phone,
            website: basicForm.website,
            companySize: basicForm.companySize,
            foundedYear: basicForm.foundedYear,
        };
        saveProfileSection(payload, "Basic Company Information");
        setEditingBasic(false);
    };

    // Save Section 2: Location & Address
    const handleSaveLocation = () => {
        const payload = {
            headquarters: locationForm.headquarters,
            address: locationForm.address,
            pincode: locationForm.pincode,
            cin: locationForm.cin,
        };
        saveProfileSection(payload, "Headquarters & Location Details");
        setEditingLocation(false);
    };

    // Save Section 3: Social Links
    const handleSaveSocial = () => {
        const payload = {
            socialLinks: {
                linkedinUrl: socialForm.linkedinUrl,
                twitterUrl: socialForm.twitterUrl,
                facebookUrl: socialForm.facebookUrl,
            },
        };
        saveProfileSection(payload, "Company Social & Web Links");
        setEditingSocial(false);
    };

    // Handle Logo Upload
    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
        const extension = `.${(file.name || "").split(".").pop().toLowerCase()}`;
        if (!allowedExtensions.includes(extension) || !allowedMimeTypes.includes(file.type)) {
            showToast("⚠️ Invalid file type. Please select a JPG, JPEG, PNG, or WebP image.");
            e.target.value = "";
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast("⚠️ File is too large. Maximum size is 5 MB.");
            e.target.value = "";
            return;
        }

        const originalLogoUrl = profileData.logoUrl;
        const localPreview = URL.createObjectURL(file);
        setProfileData((prev) => ({ ...prev, logoUrl: localPreview }));

        setIsUploadingLogo(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result;
                    URL.revokeObjectURL(localPreview);
                    setProfileData((prev) => {
                        const updated = { ...prev, logoUrl: dataUrl };
                        updated.profileCompletion = calculateCompletion(updated);
                        return updated;
                    });
                    updateStoredUser({ logoUrl: dataUrl, profilePictureUrl: dataUrl });
                    localStorage.setItem("companyLogo", dataUrl);
                    localStorage.setItem("profilePictureUrl", dataUrl);
                    showToast("✅ Company logo uploaded successfully!");
                    setIsUploadingLogo(false);
                };
                reader.onerror = () => {
                    URL.revokeObjectURL(localPreview);
                    setProfileData((prev) => ({ ...prev, logoUrl: originalLogoUrl }));
                    showToast("⚠️ Could not read image file.");
                    setIsUploadingLogo(false);
                };
                reader.readAsDataURL(file);
                return;
            }

            const formData = new FormData();
            formData.append("logo", file);

            const response = await fetch(`${API_BASE_URL}/companies/profile/logo`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const result = await response.json();
            if (response.ok && result.success && result.data?.logoUrl) {
                const serverUrl = result.data.logoUrl;
                URL.revokeObjectURL(localPreview);
                setProfileData((prev) => {
                    const updated = { ...prev, logoUrl: serverUrl };
                    updated.profileCompletion = calculateCompletion(updated);
                    return updated;
                });
                try {
                    // Broadcast so the bottom-left sidebar logo updates immediately.
                    updateStoredUser({ logoUrl: serverUrl, profilePictureUrl: serverUrl });
                    localStorage.setItem("companyLogo", serverUrl);
                    localStorage.setItem("profilePictureUrl", serverUrl);
                } catch (e) { }

                showToast("✅ Company logo uploaded successfully!");
                setIsUploadingLogo(false);
                return;
            }
            throw new Error(result.message || "Company logo upload failed.");
        } catch (err) {
            console.error("Logo upload error:", err);
            URL.revokeObjectURL(localPreview);
            setProfileData((prev) => ({ ...prev, logoUrl: originalLogoUrl }));
            showToast(`⚠️ ${err.message || "Company logo upload failed."}`);
        } finally {
            setIsUploadingLogo(false);
            e.target.value = "";
        }
    };

    // Handle uploading one or more independent verification documents.
    const handleDocumentUploadClick = () => {
        docInputRef.current?.click();
    };

    const allowedDocumentExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const allowedDocumentMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
    const maxDocumentSize = 5 * 1024 * 1024;

    const validateDocumentFile = (file) => {
        const extension = `.${(file.name || "").split(".").pop().toLowerCase()}`;
        if (!allowedDocumentExtensions.includes(extension) || !allowedDocumentMimeTypes.includes(file.type)) {
            return "Invalid file type. Please upload a PDF, JPG, JPEG, or PNG file.";
        }
        if (file.size > maxDocumentSize) return "File size must be 5 MB or less.";
        return null;
    };

    const formatFileSize = (bytes) => bytes >= 1024 * 1024
        ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.ceil(bytes / 1024)} KB`;

    // Aggregate verification status from submitted documents:
    // 1. If ANY document is verified -> company is verified
    // 2. If NO document is verified and ANY is pending -> pending
    // 3. If NO document is verified and all submitted are rejected -> rejected
    const hasVerifiedDoc = (profileData.documents || []).some(
        (d) => (d.verificationStatus || d.verification_status || "").toString().toLowerCase() === "verified"
    );
    const hasPendingDoc = (profileData.documents || []).some(
        (d) => (d.verificationStatus || d.verification_status || "").toString().toLowerCase() === "pending"
    );
    const hasRejectedDoc = (profileData.documents || []).some(
        (d) => (d.verificationStatus || d.verification_status || "").toString().toLowerCase() === "rejected"
    );

    let companyDocumentStatus = "pending";
    if (hasVerifiedDoc || (profileData.verificationStatus || "").toLowerCase() === "verified") {
        companyDocumentStatus = "verified";
    } else if (hasPendingDoc || (profileData.verificationStatus || "").toLowerCase() === "pending") {
        companyDocumentStatus = "pending";
    } else if (hasRejectedDoc || (profileData.verificationStatus || "").toLowerCase() === "rejected") {
        companyDocumentStatus = "rejected";
    }

    const handleViewDocument = async (doc) => {
        if (!doc) return;
        const fileUrl = doc.fileUrl;
        if (!fileUrl || fileUrl === "#") {
            showToast("⚠️ Document preview is not available.");
            return;
        }

        try {
            if (fileUrl.startsWith("data:")) {
                // Convert Base64 data URL to Blob to prevent Chrome/Edge from blocking top-level navigation to data: URLs
                const parts = fileUrl.split(",");
                const mimeMatch = parts[0].match(/:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
                const binaryStr = atob(parts[1]);
                const len = binaryStr.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: mime });
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, "_blank", "noopener,noreferrer");
            } else if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://") || fileUrl.startsWith("blob:")) {
                window.open(fileUrl, "_blank", "noopener,noreferrer");
            } else if (doc.id) {
                const token = localStorage.getItem("token");
                const viewUrl = `${API_BASE_URL}/companies/profile/documents/${doc.id}/view`;
                const resp = await fetch(viewUrl, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resp.ok) {
                    const blob = await resp.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, "_blank", "noopener,noreferrer");
                } else {
                    window.open(`${API_BASE_URL.replace('/api/v1', '')}${fileUrl}`, "_blank", "noopener,noreferrer");
                }
            } else {
                window.open(`${API_BASE_URL.replace('/api/v1', '')}${fileUrl}`, "_blank", "noopener,noreferrer");
            }
        } catch (err) {
            console.error("Error opening document:", err);
            showToast("⚠️ Could not open document preview.");
        }
    };

    const handleDocFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validationMessage = validateDocumentFile(file);
        if (validationMessage) {
            showToast(`⚠️ ${validationMessage}`);
            e.target.value = "";
            return;
        }

        setSelectedDocument(file);
        setSelectedDocumentType("");
        e.target.value = "";
    };

    const handleSubmitVerification = async () => {
        if (!selectedDocument) {
            showToast("⚠️ Select a verification document first.");
            return;
        }
        if (!selectedDocumentType) {
            showToast("⚠️ Select a document type before submitting.");
            return;
        }
        const validationMessage = validateDocumentFile(selectedDocument);
        if (validationMessage) {
            showToast(`⚠️ ${validationMessage}`);
            return;
        }

        setIsUploadingDoc(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Please sign in again before uploading a document.");

            const formData = new FormData();
            formData.append("docName", selectedDocument.name || "Company Verification Document");
            formData.append("docType", selectedDocumentType);
            formData.append("document", selectedDocument);

            const response = await fetch(`${API_BASE_URL}/companies/profile/documents`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok || !result.success || !result.data) {
                throw new Error(result.message || "Document upload failed.");
            }

            setProfileData((prev) => {
                const docs = result.data.profile?.documents || [result.data.document, ...(prev.documents || [])];
                const anyVerified = docs.some(
                    (d) => (d.verificationStatus || d.verification_status || "").toString().toLowerCase() === "verified"
                );
                const updated = {
                    ...prev,
                    documents: docs,
                    verificationStatus: anyVerified ? "verified" : (prev.verificationStatus === "verified" ? "verified" : "pending"),
                };
                updated.profileCompletion = calculateCompletion(updated);
                return updated;
            });
            setSelectedDocument(null);
            setSelectedDocumentType("");
            showToast("🎉 Verification document submitted successfully!");
            // Refresh once after uploading
            await fetchCompanyProfile(false);
        } catch (err) {
            console.error("Document upload error:", err);
            showToast(`⚠️ ${err.message || "Failed to upload document."}`);
        } finally {
            setIsUploadingDoc(false);
        }
    };

    // Remove Document Handler
    const handleDeleteDoc = async (docId) => {
        try {
            const token = localStorage.getItem("token");
            if (token && typeof docId === 'number' && docId > 1000) {
                await fetch(`${API_BASE_URL}/companies/profile/documents/${docId}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }

            setProfileData((prev) => {
                const updatedDocs = (prev.documents || []).filter((d) => d.id !== docId);
                const updated = { ...prev, documents: updatedDocs };
                updated.profileCompletion = calculateCompletion(updated);
                return updated;
            });

            showToast("🗑️ Verification document removed.");
        } catch (err) {
            console.error("Delete doc error:", err);
            showToast("⚠️ Failed to delete document.");
        }
    };


    if (loading) {
        return (
            <CompanyLayout activeNav="/company/profile">
                <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
                    <Sparkles size={28} className="spin" style={{ marginBottom: "12px" }} />
                    <p>Loading company profile details...</p>
                </div>
            </CompanyLayout>
        );
    }

    return (
        <CompanyLayout activeNav="/company/profile">
            <div className="company-profile-page">
                {/* Notification Toast */}
                {toastMessage && (
                    <div className="prof-toast" style={{
                        position: "fixed",
                        bottom: "24px",
                        right: "24px",
                        background: "#1e293b",
                        color: "#ffffff",
                        padding: "12px 20px",
                        borderRadius: "8px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                        zIndex: 9999,
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        <CheckCircle2 size={16} color="#4ade80" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* Hero Band with Logo, Quick Info & Verification Status Badge inside */}
                <div className="search-hero-band" style={{ position: "relative", borderRadius: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                        {/* Circular Company Logo Container */}
                        <div style={{ position: "relative", width: "90px", height: "90px", borderRadius: "50%", background: "#ffffff", border: "3px solid #ffffff", boxShadow: "0 4px 14px rgba(0,0,0,0.15)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {profileData.logoUrl ? (
                                <img
                                    src={profileData.logoUrl.startsWith("http") || profileData.logoUrl.startsWith("data:") ? profileData.logoUrl : `${API_BASE_URL.replace('/api/v1', '')}${profileData.logoUrl}`}
                                    alt="Company Logo"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <Building2 size={40} color="var(--primary)" />
                            )}

                            {/* Camera Edit Overlay Icon */}
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                title="Change Company Logo"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "rgba(0,0,0,0.45)",
                                    color: "#ffffff",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: 0,
                                    transition: "opacity 0.2s ease"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                            >
                                <Camera size={20} />
                                <span style={{ fontSize: "0.65rem", fontWeight: 700, marginTop: "2px" }}>EDIT</span>
                            </button>

                            <input
                                type="file"
                                ref={logoInputRef}
                                accept=".jpg,.jpeg,.png,.webp"
                                style={{ display: "none" }}
                                onChange={handleLogoUpload}
                            />
                        </div>

                        {/* Title, Subtitle & Status Badge */}
                        <div style={{ flex: 1, minWidth: "260px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                                <span className="search-hero-chip" style={{ margin: 0 }}>
                                    <Building2 size={13} /> OFFICIAL RECRUITER PROFILE
                                </span>

                                {/* Verification Status Badge right inside blue box */}
                                <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    background: companyDocumentStatus === "verified" ? "rgba(34, 197, 94, 0.25)" : companyDocumentStatus === "rejected" ? "rgba(239, 68, 68, 0.25)" : "rgba(245, 158, 11, 0.3)",
                                    color: "#ffffff",
                                    border: "1px solid rgba(255,255,255,0.4)",
                                    padding: "3px 10px",
                                    borderRadius: "16px",
                                    fontSize: "0.78rem",
                                    fontWeight: 700
                                }}>
                                    {companyDocumentStatus === "verified" && <>🟢 Verified</>}
                                    {companyDocumentStatus === "pending" && <>🟡 Verification Pending</>}
                                    {companyDocumentStatus === "rejected" && <>🔴 Verification Rejected</>}
                                </span>
                            </div>

                            <h2 className="search-hero-title" style={{ margin: "4px 0 4px 0" }}>
                                {profileData.companyName || "Company Profile"}
                            </h2>
                            <p className="search-hero-subtitle" style={{ margin: 0 }}>
                                {profileData.industry || "Information Technology"} • {profileData.headquarters || "India"}
                            </p>
                        </div>

                        {/* Top Action */}
                        <div style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <button
                                    type="button"
                                    className="prof-edit-btn"
                                    onClick={() => logoInputRef.current?.click()}
                                    style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.3)" }}
                                >
                                    <Upload size={14} style={{ display: "inline", marginRight: "6px" }} />
                                    Change Logo
                                </button>
                            </div>
                            <p style={{ margin: "6px 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.82)" }}>
                                Maximum file size: 5 MB • Allowed formats: JPG, JPEG, PNG, WebP
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: "24px" }}></div>

                {/* Profile Completion Strip */}
                <div className="prof-completion-card" style={{ background: "var(--bg-surface)", padding: "20px 24px", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "24px", boxShadow: "var(--shadow-sm)", display: "block", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                                <Award size={22} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)" }}>
                                    Company Profile Completion
                                </h4>
                                <p style={{ margin: "2px 0 0 0", fontSize: "0.83rem", color: "var(--text-muted)" }}>
                                    {profileData.profileCompletion === 100
                                        ? "🎉 Excellent! Your company profile is fully completed and verified."
                                        : "Complete basic details, headquarters location, and upload verification document to reach 100%."}
                                </p>
                            </div>
                        </div>
                        <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary)", background: "var(--primary-light)", padding: "5px 14px", borderRadius: "8px", border: "1px solid var(--border-focus)", marginLeft: "auto", flexShrink: 0 }}>
                            {profileData.profileCompletion}%
                        </span>
                    </div>

                    <div style={{ width: "100%", height: "10px", background: "var(--bg-subtle)", borderRadius: "5px", overflow: "hidden", border: "1px solid var(--border)" }}>
                        <div style={{
                            width: `${profileData.profileCompletion}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #0284c7, #38bdf8)",
                            transition: "width 0.5s ease"
                        }} />
                    </div>
                </div>

                {/* SECTION 1: Basic Company Information */}
                <div className="form-card-block" style={{ marginBottom: "24px" }}>
                    <div className="prof-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                        <div className="prof-section-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Building2 size={20} className="header-icon" color="var(--primary)" />
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-main)" }}>Basic Company Information</h3>
                                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>Essential corporate identity shown on public postings.</p>
                            </div>
                        </div>
                        {!editingBasic ? (
                            <button
                                className="prof-add-btn"
                                onClick={() => setEditingBasic(true)}
                                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "6px", background: "rgba(37, 99, 235, 0.1)", color: "var(--primary)", border: "none", cursor: "pointer", fontWeight: 600 }}
                            >
                                <Edit2 size={13} /> Edit Basic Info
                            </button>
                        ) : (
                            <button
                                className="prof-section-save-btn"
                                onClick={handleSaveBasic}
                                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "6px", background: "var(--primary)", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: 600 }}
                            >
                                <Save size={13} /> Save Basic Info
                            </button>
                        )}
                    </div>

                    {editingBasic ? (
                        <div className="form-grid-two">
                            <FormInput
                                label="Company Name"
                                name="companyName"
                                value={basicForm.companyName}
                                onChange={(e) => setBasicForm((prev) => ({ ...prev, companyName: e.target.value }))}
                                required
                                icon={Building2}
                            />

                            <FormSelect
                                label="Company Type / Industry"
                                name="companyType"
                                value={basicForm.companyType}
                                onChange={(e) => setBasicForm((prev) => ({ ...prev, companyType: e.target.value }))}
                                options={companyTypes}
                                required
                                icon={Briefcase}
                            />

                            <FormInput
                                label="Company Email (Verified)"
                                name="email"
                                type="email"
                                value={profileData.email}
                                readOnly
                                disabled
                                icon={Mail}
                                helperText="Email address verified via OTP"
                            />

                            <FormInput
                                label="Phone Number"
                                name="phone"
                                type="tel"
                                placeholder="e.g. 1234567890 or +911234567890"
                                value={basicForm.phone}
                                onChange={(e) => setBasicForm((prev) => ({ ...prev, phone: e.target.value }))}
                                required
                                icon={Phone}
                            />

                            <FormInput
                                label="Company Website"
                                name="website"
                                type="url"
                                value={basicForm.website}
                                onChange={(e) => setBasicForm((prev) => ({ ...prev, website: e.target.value }))}
                                required
                                icon={Globe}
                            />

                            <FormSelect
                                label="Company Size"
                                name="companySize"
                                value={basicForm.companySize}
                                onChange={(e) => setBasicForm((prev) => ({ ...prev, companySize: e.target.value }))}
                                options={companySizeOptions}
                                icon={Users}
                            />

                            <FormInput
                                label="Founded Year"
                                name="foundedYear"
                                type="number"
                                placeholder="e.g. 2018"
                                value={basicForm.foundedYear || ""}
                                onChange={(e) => setBasicForm((prev) => ({ ...prev, foundedYear: e.target.value }))}
                                icon={Calendar}
                            />
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", fontSize: "0.9rem" }}>
                            <div><strong style={{ color: "var(--text-main)" }}>Company Name:</strong> <p style={{ margin: "2px 0", color: profileData.companyName ? "var(--text-muted)" : "var(--text-light)" }}>{profileData.companyName || "Not set"}</p></div>
                            <div><strong style={{ color: "var(--text-main)" }}>Industry / Type:</strong> <p style={{ margin: "2px 0", color: profileData.companyType ? "var(--text-muted)" : "var(--text-light)" }}>{profileData.companyType || "Not set"}</p></div>
                            <div><strong style={{ color: "var(--text-main)" }}>Company Email:</strong> <p style={{ margin: "2px 0", color: "var(--text-muted)" }}>{profileData.email}</p></div>
                            <div><strong style={{ color: "var(--text-main)" }}>Phone Number:</strong> <p style={{ margin: "2px 0", color: profileData.phone ? "var(--text-muted)" : "var(--text-light)" }}>{profileData.phone || "Not set"}</p></div>
                            <div><strong style={{ color: "var(--text-main)" }}>Website:</strong> <p style={{ margin: "2px 0", color: "var(--text-muted)" }}>{profileData.website ? <a href={profileData.website} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>{profileData.website}</a> : <span style={{ color: "var(--text-light)" }}>Not set</span>}</p></div>
                            <div><strong style={{ color: "var(--text-main)" }}>Company Size:</strong> <p style={{ margin: "2px 0", color: profileData.companySize ? "var(--text-muted)" : "var(--text-light)" }}>{profileData.companySize ? `${profileData.companySize} Employees` : "Not set"}</p></div>
                            <div><strong style={{ color: "var(--text-main)" }}>Founded Year:</strong> <p style={{ margin: "2px 0", color: profileData.foundedYear ? "var(--text-muted)" : "var(--text-light)" }}>{profileData.foundedYear || "Not set"}</p></div>
                        </div>
                    )}
                </div>

                {/* SECTION 2: Location & Address */}
                <div className="form-card-block" style={{ marginBottom: "24px" }}>
                    <div className="prof-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                        <div className="prof-section-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <MapPin size={20} className="header-icon" color="var(--primary)" />
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-main)" }}>Headquarters & Location Details</h3>
                                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>Verified postal location and corporate street address.</p>
                            </div>
                        </div>
                        {!editingLocation ? (
                            <button
                                className="prof-add-btn"
                                onClick={() => setEditingLocation(true)}
                                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "6px", background: "rgba(37, 99, 235, 0.1)", color: "var(--primary)", border: "none", cursor: "pointer", fontWeight: 600 }}
                            >
                                <Edit2 size={13} /> Edit Location & Address
                            </button>
                        ) : (
                            <button
                                className="prof-section-save-btn"
                                onClick={handleSaveLocation}
                                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "6px", background: "var(--primary)", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: 600 }}
                            >
                                <Save size={13} /> Save Location & Address
                            </button>
                        )}
                    </div>

                    {editingLocation ? (
                        <div className="form-grid-two">
                            <FormInput
                                label="Headquarters / City"
                                name="headquarters"
                                placeholder="e.g. Bengaluru, Karnataka, India"
                                value={locationForm.headquarters}
                                onChange={(e) => setLocationForm((prev) => ({ ...prev, headquarters: e.target.value }))}
                                icon={MapPin}
                            />

                            <FormInput
                                label="Pincode (Verified)"
                                name="pincode"
                                value={locationForm.pincode}
                                onChange={(e) => setLocationForm((prev) => ({ ...prev, pincode: e.target.value }))}
                                helperText="Verified via India Post API"
                            />

                            <FormInput
                                label="GSTIN Number (Verified)"
                                name="gstin"
                                value={profileData.gstin}
                                readOnly
                                disabled
                                icon={Lock}
                                helperText="Verified with Tax Registry"
                            />

                            <FormInput
                                label="CIN / Registration Number"
                                name="cin"
                                placeholder="e.g. U72200KA2018PTC112233"
                                value={locationForm.cin}
                                onChange={(e) => setLocationForm((prev) => ({ ...prev, cin: e.target.value }))}
                                icon={FileText}
                            />

                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                                    Detailed Street Address
                                </label>
                                <textarea
                                    name="address"
                                    rows={2}
                                    className="prof-about-textarea"
                                    placeholder="Enter full office floor, building name, street address..."
                                    value={locationForm.address}
                                    onChange={(e) => setLocationForm((prev) => ({ ...prev, address: e.target.value }))}
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)" }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", fontSize: "0.9rem" }}>
                            <div><strong style={{ color: "var(--text-main)" }}>Headquarters:</strong> <p style={{ margin: "2px 0", color: profileData.headquarters ? "var(--text-muted)" : "var(--text-light)" }}>{profileData.headquarters || "Not set"}</p></div>
                            <div><strong style={{ color: "var(--text-main)" }}>Pincode:</strong> <p style={{ margin: "2px 0", color: profileData.pincode ? "var(--text-muted)" : "var(--text-light)" }}>{profileData.pincode || "Not set"}</p></div>
                            <div><strong style={{ color: "var(--text-main)" }}>GSTIN Number:</strong> <p style={{ margin: "2px 0", color: profileData.gstin ? "var(--text-muted)" : "var(--text-light)" }}>{profileData.gstin || "Not set"}</p></div>
                            <div><strong style={{ color: "var(--text-main)" }}>CIN / Reg No:</strong> <p style={{ margin: "2px 0", color: profileData.cin ? "var(--text-muted)" : "var(--text-light)" }}>{profileData.cin || "Not set"}</p></div>
                            <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "var(--text-main)" }}>Street Address:</strong> <p style={{ margin: "2px 0", color: profileData.address ? "var(--text-muted)" : "var(--text-light)" }}>{profileData.address || "Not set"}</p></div>
                        </div>
                    )}
                </div>

                {/* SECTION 3: Verification Documents */}
                <div className="form-card-block" style={{ marginBottom: "24px" }}>
                    <div className="prof-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                        <div className="prof-section-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <ShieldCheck size={20} className="header-icon" color="var(--primary)" />
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-main)" }}>Company Verification Documents</h3>
                                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>Upload company documents such as GST, Incorporation, Registration, or other official certificates for verification.</p>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => fetchCompanyProfile(false)}
                                loading={isRefreshingStatus}
                                icon={RefreshCw}
                                title="Check latest verification status"
                            >
                                Refresh Status
                            </Button>

                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={handleSubmitVerification}
                                loading={isUploadingDoc}
                                icon={ShieldCheck}
                            >
                                Submit Document for Verification
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleDocumentUploadClick}
                                loading={isUploadingDoc}
                                icon={Upload}
                            >
                                Upload Document
                            </Button>

                            <input
                                type="file"
                                ref={docInputRef}
                                accept=".pdf,.png,.jpg,.jpeg"
                                style={{ display: "none" }}
                                onChange={handleDocFileSelect}
                            />
                        </div>
                    </div>

                    <p style={{ margin: "-6px 0 16px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Maximum file size: 5 MB • Allowed formats: PDF, JPG, JPEG, PNG
                    </p>

                    {selectedDocument && (
                        <div className="doc-selected-box">
                            <p style={{ margin: "0 0 8px", fontWeight: 700, color: "var(--text-main)" }}>Selected Document</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", marginBottom: "14px" }}>
                                <FileText size={18} color="var(--primary)" />
                                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{selectedDocument.name}</span>
                                <span>({formatFileSize(selectedDocument.size)})</span>
                            </div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }} htmlFor="document-type">
                                Document Type
                            </label>
                            <select
                                id="document-type"
                                value={selectedDocumentType}
                                onChange={(e) => setSelectedDocumentType(e.target.value)}
                                disabled={isUploadingDoc}
                                style={{ width: "100%", maxWidth: "360px", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-main)" }}
                            >
                                <option value="">Select document type</option>
                                <option value="GST Certificate">GST Certificate</option>
                                <option value="Incorporation Certificate">Incorporation Certificate</option>
                                <option value="Registration Certificate">Registration Certificate</option>
                                <option value="Company PAN Card">Company PAN Card</option>
                                <option value="Address Proof">Address Proof</option>
                                <option value="Other">Other</option>
                            </select>
                            <div style={{ marginTop: "14px" }}>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    disabled={isUploadingDoc}
                                    onClick={() => { setSelectedDocument(null); setSelectedDocumentType(""); }}
                                    icon={X}
                                >
                                    Remove Selected File
                                </Button>
                            </div>
                        </div>
                    )}

                    {profileData.documents && profileData.documents.length > 0 ? (
                        <div style={{
                            overflowX: "auto",
                            maxHeight: "220px",
                            overflowY: "auto",
                            borderRadius: "8px",
                            border: "1px solid var(--border)"
                        }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                                <thead style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--bg-subtle)" }}>
                                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                                        <th style={{ padding: "10px 12px", color: "var(--text-main)", fontWeight: 700 }}>Document Name</th>
                                        <th style={{ padding: "10px 12px", color: "var(--text-main)", fontWeight: 700 }}>Document Type</th>
                                        <th style={{ padding: "10px 12px", color: "var(--text-main)", fontWeight: 700 }}>Upload Date</th>
                                        <th style={{ padding: "10px 12px", color: "var(--text-main)", fontWeight: 700 }}>Status</th>
                                        <th style={{ padding: "10px 12px", color: "var(--text-main)", fontWeight: 700, textAlign: "right" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profileData.documents.map((doc) => (
                                        <tr key={doc.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                            <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-main)" }}>{doc.docName}</td>
                                            <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{doc.docType}</td>
                                            <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>
                                                {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : "Recent"}
                                            </td>
                                            <td style={{ padding: "10px 12px" }}>
                                                <span className={`verif-badge ${doc.verificationStatus || 'pending'}`} style={{
                                                    padding: "3px 10px",
                                                    borderRadius: "12px",
                                                    fontSize: "0.78rem",
                                                    fontWeight: 700,
                                                    background: doc.verificationStatus === "verified" ? "rgba(16, 185, 129, 0.15)" : doc.verificationStatus === "rejected" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                                    color: doc.verificationStatus === "verified" ? "#10b981" : doc.verificationStatus === "rejected" ? "#ef4444" : "#f59e0b",
                                                    border: `1px solid ${doc.verificationStatus === "verified" ? "rgba(16, 185, 129, 0.3)" : doc.verificationStatus === "rejected" ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
                                                }}>
                                                    {doc.verificationStatus === "verified" ? "Verified" : doc.verificationStatus === "rejected" ? "Rejected" : "Pending Verification"}
                                                </span>
                                                {doc.verificationStatus === "rejected" && doc.verificationNote && (
                                                    <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#b91c1c" }}>
                                                        Reason: {doc.verificationNote}
                                                    </p>
                                                )}
                                            </td>
                                            <td style={{ padding: "10px 12px", textAlign: "right" }}>
                                                {doc.fileUrl && doc.fileUrl !== "#" ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewDocument(doc)}
                                                        style={{
                                                            background: "transparent",
                                                            border: "none",
                                                            color: "var(--primary)",
                                                            cursor: "pointer",
                                                            fontWeight: 600,
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            fontSize: "0.85rem",
                                                            padding: "4px 8px",
                                                            borderRadius: "4px"
                                                        }}
                                                    >
                                                        <ExternalLink size={13} /> View
                                                    </button>
                                                ) : (
                                                    <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Attached</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="doc-upload-empty-box">
                            <div className="doc-upload-icon-circle">
                                <FileText size={28} />
                            </div>
                            <h4 className="doc-upload-empty-title">No verification documents uploaded yet</h4>
                            <p className="doc-upload-empty-desc">
                                Upload your GST Certificate, Incorporation Certificate, or official business license to get verified and unlock verified employer benefits.
                            </p>
                            <Button type="button" variant="primary" size="sm" onClick={handleDocumentUploadClick} icon={Upload}>
                                Upload Document Now
                            </Button>
                        </div>
                    )}
                </div>

                {/* SECTION 4: Social & Web Links */}
                <div className="form-card-block" style={{ marginBottom: "24px" }}>
                    <div className="prof-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                        <div className="prof-section-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Globe size={20} className="header-icon" color="var(--primary)" />
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-main)" }}>Company Social & Web Links</h3>
                                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>Official social presence channels and corporate handles.</p>
                            </div>
                        </div>
                        {!editingSocial ? (
                            <button
                                className="prof-add-btn"
                                onClick={() => setEditingSocial(true)}
                                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "6px", background: "rgba(37, 99, 235, 0.1)", color: "var(--primary)", border: "none", cursor: "pointer", fontWeight: 600 }}
                            >
                                <Edit2 size={13} /> Edit Social Links
                            </button>
                        ) : (
                            <button
                                className="prof-section-save-btn"
                                onClick={handleSaveSocial}
                                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "6px", background: "var(--primary)", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: 600 }}
                            >
                                <Save size={13} /> Save Social Links
                            </button>
                        )}
                    </div>

                    {editingSocial ? (
                        <div className="form-grid-two">
                            <FormInput
                                label="LinkedIn Company Page"
                                name="linkedinUrl"
                                type="url"
                                placeholder="https://linkedin.com/company/..."
                                value={socialForm.linkedinUrl}
                                onChange={(e) => setSocialForm((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
                                icon={Globe}
                            />

                            <FormInput
                                label="Twitter / X Profile"
                                name="twitterUrl"
                                type="url"
                                placeholder="https://twitter.com/..."
                                value={socialForm.twitterUrl}
                                onChange={(e) => setSocialForm((prev) => ({ ...prev, twitterUrl: e.target.value }))}
                                icon={Globe}
                            />

                            <FormInput
                                label="Facebook Page"
                                name="facebookUrl"
                                type="url"
                                placeholder="https://facebook.com/..."
                                value={socialForm.facebookUrl}
                                onChange={(e) => setSocialForm((prev) => ({ ...prev, facebookUrl: e.target.value }))}
                                icon={Globe}
                            />
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", fontSize: "0.9rem" }}>
                            <div><strong style={{ color: "var(--text-main)" }}>LinkedIn:</strong> <p style={{ margin: "2px 0", color: "var(--text-muted)" }}>{profileData.socialLinks?.linkedinUrl ? <a href={profileData.socialLinks.linkedinUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>{profileData.socialLinks.linkedinUrl}</a> : <span style={{ color: "var(--text-light)" }}>Not set</span>}</p></div>
                            <div><strong style={{ color: "var(--text-main)" }}>Twitter / X:</strong> <p style={{ margin: "2px 0", color: "var(--text-muted)" }}>{profileData.socialLinks?.twitterUrl ? <a href={profileData.socialLinks.twitterUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>{profileData.socialLinks.twitterUrl}</a> : <span style={{ color: "var(--text-light)" }}>Not set</span>}</p></div>
                            <div><strong style={{ color: "var(--text-main)" }}>Facebook:</strong> <p style={{ margin: "2px 0", color: "var(--text-muted)" }}>{profileData.socialLinks?.facebookUrl ? <a href={profileData.socialLinks.facebookUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>{profileData.socialLinks.facebookUrl}</a> : <span style={{ color: "var(--text-light)" }}>Not set</span>}</p></div>
                        </div>
                    )}
                </div>

            </div>
        </CompanyLayout>
    );
}
