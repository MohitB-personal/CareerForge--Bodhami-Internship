import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import Navbar from "../../Components/components/Navbar";
import Footer from "../../Components/components/Footer";
import FormInput from "../../Components/components/FormInput";
import FormCheckbox from "../../Components/components/FormCheckbox";
import Button from "../../Components/components/Button";
import SocialLogin from "../../Components/components/SocialLogin";
import Particles from "../../Components/components/Particles";
import {
  validateCandidateField,
  validateCandidateForm,
  validatePasswordStrength,
} from "../../utils/validation";
import API_BASE_URL from "../../utils/api";

export default function CandidateRegistration() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Real-time password strength score
  const passwordStrength = validatePasswordStrength(formData.password);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get("oauth_error");
    if (oauthError) {
      setErrors((prev) => ({ ...prev, general: decodeURIComponent(oauthError) }));
    }
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    const newFormData = { ...formData, [name]: fieldValue };
    setFormData(newFormData);

    // Live validation if touched
    if (touched[name]) {
      const fieldError = validateCandidateField(name, fieldValue, newFormData);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateCandidateField(name, fieldValue, formData);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      terms: true,
    };

    setTouched(allTouched);

    const formErrors = validateCandidateForm(formData);
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/candidates/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              password: formData.password,
            }),
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          // Registration successful, but email verification is required
          if (data.data?.verificationRequired) {
            navigate(
              `/verify-email?email=${encodeURIComponent(
                data.data.email
              )}&role=${data.data.role}`
            );
            return;
          }

          // Fallback for an unexpected response without verification
          if (data.data?.token) {
            localStorage.setItem("token", data.data.token);
            localStorage.setItem(
              "user",
              JSON.stringify(data.data.candidate)
            );
          }
        } else {
          setErrors((prev) => ({
            ...prev,
            ...(data.errors || {}),
            general:
              data.message || "Registration failed. Please try again.",
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
          <div className="auth-card">
            <div className="auth-header">
              <span className="auth-badge">Job Seeker</span>
              <h1 className="auth-title">Create Candidate Account</h1>
              <p className="auth-subtitle">
                Join CareerForge to explore personalized job opportunities and get discovered by top companies.
              </p>
            </div>

            {errors.general && (
              <div className="alert-danger" style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}>
                {errors.general}
              </div>
            )}

            {submitSuccess ? (
              <div className="alert-success" style={{ flexDirection: "column", gap: "16px", textAlign: "center" }}>
                <CheckCircle2 size={48} style={{ color: "var(--success)", margin: "0 auto" }} />
                <div>
                  <h4>Account Created Successfully!</h4>
                  <p style={{ marginTop: "4px", color: "var(--text-muted)" }}>
                    Welcome to CareerForge, <strong>{formData.fullName}</strong>. You can now log in to explore curated jobs.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "8px" }}>
                  <Button variant="primary" fullWidth onClick={() => navigate("/dashboard")} icon={ArrowRight} iconPosition="right">
                    Go to Candidate Dashboard
                  </Button>
                  <Button variant="ghost" fullWidth onClick={() => navigate("/login")}>
                    Log In to Another Account
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {/* Full Name */}
                <FormInput
                  label="Full Name"
                  name="fullName"
                  placeholder="e.g. John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.fullName ? errors.fullName : ""}
                  required
                  icon={User}
                  autoComplete="name"
                />

                {/* Email Address */}
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="e.g. john.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email ? errors.email : ""}
                  required
                  icon={Mail}
                  autoComplete="email"
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
                  autoComplete="tel"
                />

                {/* Password */}
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

                {/* Password Strength Meter */}
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

                {/* Confirm Password */}
                <FormInput
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.confirmPassword ? errors.confirmPassword : ""}
                  required
                  icon={Lock}
                  autoComplete="new-password"
                />

                {/* Terms and Privacy Checkbox */}
                <FormCheckbox
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  error={touched.terms ? errors.terms : ""}
                  label={
                    <span>
                      I agree to CareerForge's{" "}
                      <a href="#terms" onClick={(e) => e.preventDefault()}>
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#privacy" onClick={(e) => e.preventDefault()}>
                        Privacy Policy
                      </a>
                    </span>
                  }
                  required
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  loading={isSubmitting}
                >
                  Sign Up
                </Button>
              </form>
            )}

            {/* Social Registration Options */}
            {!submitSuccess && <SocialLogin actionText="Sign up with" />}

            {/* Auth Switch Links */}
            <div className="auth-footer">
              Already have an account? <Link to="/login">Log In</Link>
              <div style={{ marginTop: "10px", fontSize: "0.85rem" }}>
                Are you a company hiring talent?{" "}
                <Link to="/register/company" style={{ fontWeight: "700" }}>
                  Register Company
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
