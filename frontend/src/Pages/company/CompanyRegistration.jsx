import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  Lock,
  FileText,
  Briefcase,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Navbar from "../../Components/components/Navbar";
import Footer from "../../Components/components/Footer";
import FormInput from "../../Components/components/FormInput";
import FormSelect from "../../Components/components/FormSelect";
import FormCheckbox from "../../Components/components/FormCheckbox";
import Button from "../../Components/components/Button";
import Particles from "../../Components/components/Particles";
import API_BASE_URL from "../../utils/api";
import {
  validateCompanyField,
  validateCompanyForm,
  validatePasswordStrength,
} from "../../utils/validation";

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

export default function CompanyRegistration() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: "",
    companyType: "",
    companyEmail: "",
    phone: "",
    website: "",
    gstin: "",
    pincode: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [isVerifyingPincode, setIsVerifyingPincode] = useState(false);
  const [location, setLocation] = useState("");

  const passwordStrength = validatePasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let fieldValue = type === "checkbox" ? checked : value;

    // Convert GSTIN input to uppercase automatically
    if (name === "gstin") {
      fieldValue = String(value).toUpperCase();
    }

    // Automatically verify Pincode when 6 digits are entered
    if (name === "pincode") {
      fieldValue = String(value).replace(/\D/g, "").slice(0, 6);

      setPincodeStatus(null);
      setLocation("");

      if (fieldValue.length === 6) {
        verifyPincode(fieldValue);
      }
    }

    const newFormData = { ...formData, [name]: fieldValue };
    setFormData(newFormData);

    if (touched[name]) {
      const fieldError = validateCompanyField(name, fieldValue, newFormData);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateCompanyField(name, fieldValue, formData);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const verifyPincode = async (pincode) => {
    if (!pincode || pincode.length !== 6) {
      setPincodeStatus(null);
      setLocation("");
      return;
    }

    setIsVerifyingPincode(true);
    setPincodeStatus({
      type: "checking",
      message: "Verifying Pincode...",
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/companies/verify-pincode`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pincode,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success && data.data?.valid) {
        setPincodeStatus({
          type: "success",
          message: "Pincode Verified",
        });

        setLocation(
          `${data.data.district}, ${data.data.state}`
        );
      } else {
        setPincodeStatus({
          type: "error",
          message: "Pincode Not Verified",
        });

        setLocation("");
      }
    } catch (error) {
      console.error("Pincode verification request failed:", error);

      setPincodeStatus({
        type: "error",
        message: "Pincode Not Verified",
      });

      setLocation("");
    } finally {
      setIsVerifyingPincode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = {
      companyName: true,
      companyType: true,
      companyEmail: true,
      phone: true,
      website: true,
      gstin: true,
      pincode: true,
      password: true,
      confirmPassword: true,
      terms: true,
    };

    setTouched(allTouched);

    const formErrors = validateCompanyForm(formData);

    // Pincode must be successfully verified before registration
    if (pincodeStatus?.type !== "success") {
      formErrors.pincode =
        isVerifyingPincode
          ? "Please wait for Pincode verification to complete."
          : "Please enter a valid Pincode.";
    }

    setErrors(formErrors);

    // Stop submission if any validation failed
    if (Object.keys(formErrors).length !== 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/companies/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyName: formData.companyName,
            companyType: formData.companyType,
            companyEmail: formData.companyEmail,
            phone: formData.phone,
            website: formData.website,
            gstin: formData.gstin,
            pincode: formData.pincode,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Company registration requires email verification
        navigate(
          `/verify-email?email=${encodeURIComponent(
            formData.companyEmail
          )}&role=company`
        );
        return;
      } else {
        setErrors((prev) => ({
          ...prev,
          ...(data.errors || {}),
          general:
            data.message ||
            "Company registration failed. Please try again.",
        }));
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        general:
          "Unable to connect to backend server. Make sure your Express/MySQL backend is running on port 5000.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <div className="auth-page">
          <div className="auth-grid-bg">
            <Particles
              particleColors={["#4e1ba6"]}
              particleCount={600}
              particleSpread={10}
              speed={0.5}
              particleBaseSize={100}
              moveParticlesOnHover
              alphaParticles={false}
              disableRotation
              pixelRatio={1}
            />
          </div>
          <div className="auth-card wide">
            <div className="auth-header">
              <span className="auth-badge" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--secondary)" }}>
                Company Portal
              </span>
              <h1 className="auth-title">Register Your Company</h1>
              <p className="auth-subtitle">
                Create a verified company profile to post jobs and connect with skilled talent.
              </p>
            </div>

            {errors.general && (
              <div className="alert-danger" style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}>
                {errors.general}
              </div>
            )}

            {submitSuccess ? (
              <div className="alert-success" style={{ flexDirection: "column", gap: "16px", textAlign: "center", padding: "36px" }}>
                <CheckCircle2 size={56} style={{ color: "var(--success)", margin: "0 auto" }} />
                <div>
                  <h3 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--secondary)" }}>
                    Company Registered Successfully!
                  </h3>
                  <p style={{ marginTop: "8px", color: "var(--text-muted)", fontSize: "0.95rem" }}>
                    Your organization <strong>{formData.companyName}</strong> (GSTIN: {formData.gstin}) has been registered on CareerForge.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", width: "100%", maxWidth: "320px", margin: "16px auto 0" }}>
                  <Button variant="primary" fullWidth onClick={() => navigate("/login")} icon={ArrowRight} iconPosition="right">
                    Go to Company Login
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="auth-grid">
                  {/* Company Name */}
                  <FormInput
                    label="Company Name"
                    name="companyName"
                    placeholder="e.g. Nexus Tech Labs Solutions"
                    value={formData.companyName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.companyName ? errors.companyName : ""}
                    required
                    icon={Building2}
                  />

                  {/* Company Industry/Type */}
                  <FormSelect
                    label="Company Type / Industry"
                    name="companyType"
                    value={formData.companyType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    options={companyTypes}
                    placeholder="Select industry sector"
                    error={touched.companyType ? errors.companyType : ""}
                    required
                    icon={Briefcase}
                  />

                  {/* Company Email */}
                  <FormInput
                    label="Company Email"
                    name="companyEmail"
                    type="email"
                    placeholder="e.g. careers@nexustech.com"
                    value={formData.companyEmail}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.companyEmail ? errors.companyEmail : ""}
                    required
                    icon={Mail}
                  />

                  {/* Phone Number */}
                  <FormInput
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    placeholder="e.g. 1234567890 or +911234567890"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.phone ? errors.phone : ""}
                    required
                    icon={Phone}
                  />

                  {/* Company Website */}
                  <FormInput
                    label="Company Website"
                    name="website"
                    type="url"
                    placeholder="https://nexustech.com"
                    value={formData.website}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.website ? errors.website : ""}
                    required
                    icon={Globe}
                  />

                  {/* GSTIN */}
                  <FormInput
                    label="GSTIN Number"
                    name="gstin"
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.gstin ? errors.gstin : ""}
                    required
                    icon={FileText}
                    helperText="15-digit Tax Identification Number"
                    maxLength={15}
                  />

                  {/* Pincode */}
                  <div>
                    <FormInput
                      label="Pincode"
                      name="pincode"
                      type="text"
                      placeholder="e.g. 403601"
                      value={formData.pincode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.pincode ? errors.pincode : ""}
                      required
                      helperText="6-digit Postal Pincode"
                      maxLength={6}
                    />

                    {pincodeStatus?.type === "checking" && (
                      <div
                        style={{
                          marginTop: "-10px",
                          marginBottom: "16px",
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        🔄 {pincodeStatus.message}
                      </div>
                    )}

                    {pincodeStatus?.type === "success" && (
                      <div
                        style={{
                          marginTop: "-10px",
                          marginBottom: "16px",
                          fontSize: "0.85rem",
                          color: "var(--success)",
                        }}
                      >
                        <strong>✓ {pincodeStatus.message}</strong>
                      </div>
                    )}

                    {pincodeStatus?.type === "error" && (
                      <div
                        style={{
                          marginTop: "-10px",
                          marginBottom: "16px",
                          fontSize: "0.85rem",
                          color: "var(--danger)",
                        }}
                      >
                        <strong>✕ {pincodeStatus.message}</strong>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <FormInput
                    label="Location"
                    name="location"
                    type="text"
                    placeholder="Auto-filled from Pincode"
                    value={location}
                    readOnly
                    helperText="Automatically detected from Pincode"
                  />

                  {/* Password */}
                  <div>
                    <FormInput
                      label="Password"
                      name="password"
                      type="password"
                      placeholder="Min 8 chars (letter, number, @#$&!)"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.password ? errors.password : ""}
                      required
                      icon={Lock}
                      autoComplete="new-password"
                    />

                    {formData.password && (
                      <div className="password-strength" style={{ marginTop: "-10px", marginBottom: "16px" }}>
                        <div className="strength-bar">
                          <div
                            className="strength-segment"
                            style={{
                              width: `${(passwordStrength.score / 5) * 100}%`,
                              backgroundColor:
                                passwordStrength.score <= 2
                                  ? "var(--danger)"
                                  : passwordStrength.score <= 4
                                    ? "var(--warning)"
                                    : "var(--success)",
                            }}
                          />
                        </div>
                        <span
                          className={`strength-text ${passwordStrength.score <= 2
                            ? "strength-weak"
                            : passwordStrength.score <= 4
                              ? "strength-medium"
                              : "strength-strong"
                            }`}
                        >
                          Strength: {passwordStrength.label || "Very Weak"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <FormInput
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.confirmPassword ? errors.confirmPassword : ""}
                    required
                    icon={Lock}
                    autoComplete="new-password"
                  />
                </div>

                {/* Terms Checkbox */}
                <div style={{ marginTop: "16px" }}>
                  <FormCheckbox
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    error={touched.terms ? errors.terms : ""}
                    label={
                      <span>
                        I confirm that I am an authorized corporate representative and agree to CareerForge's{" "}
                        <a href="#terms" onClick={(e) => e.preventDefault()}>
                          Company Terms
                        </a>{" "}
                        and{" "}
                        <a href="#privacy" onClick={(e) => e.preventDefault()}>
                          Privacy Policy
                        </a>
                      </span>
                    }
                    required
                  />
                </div>

                {/* Submit Button */}
                <div style={{ marginTop: "24px" }}>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    size="lg"
                    loading={isSubmitting}
                  >
                    Create Account
                  </Button>
                </div>
              </form>
            )}

            {/* Auth Switch Links */}
            <div className="auth-footer">
              Already registered? <Link to="/login">Log In to Company Account</Link>
              <div style={{ marginTop: "10px", fontSize: "0.85rem" }}>
                Looking for job opportunities instead?{" "}
                <Link to="/register/candidate" style={{ fontWeight: "700" }}>
                  Candidate Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
