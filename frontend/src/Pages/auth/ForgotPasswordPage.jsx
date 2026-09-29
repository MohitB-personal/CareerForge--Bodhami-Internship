import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Building2,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import Navbar from "../../Components/components/Navbar";
import Footer from "../../Components/components/Footer";
import FormInput from "../../Components/components/FormInput";
import Button from "../../Components/components/Button";
import { validatePasswordStrength } from "../../utils/validation";
import API_BASE_URL from "../../utils/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState("candidate"); // 'candidate' | 'company'
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes

  // Read initial role from query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get("role");
    if (roleParam === "company" || roleParam === "candidate") {
      setRole(roleParam);
    }
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location.search]);

  // Countdown timer for OTP
  useEffect(() => {
    if (step !== 2 || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleRoleChange = (newRole) => {
    if (newRole !== role && step === 1) {
      setRole(newRole);
      setError("");
      setMessage("");
    }
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, role }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessage(data.message || "A 6-digit verification code has been sent to your email.");
        setStep(2);
        setCountdown(300);
      } else {
        setError(data.message || "Failed to send reset code. Please check your email.");
      }
    } catch (err) {
      setError("Unable to connect to the backend server. Please verify your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOTP = async () => {
    if (isResending || countdown > 240) return;
    setIsResending(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("A fresh verification code has been sent to your email.");
        setCountdown(300);
      } else {
        setError(data.message || "Failed to resend verification code.");
      }
    } catch (err) {
      setError("Unable to reach backend server. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role,
          otp: trimmedOtp,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.resetToken) {
        setResetToken(data.resetToken);
        setStep(3);
        setMessage("");
      } else {
        setError(data.message || "Invalid or expired OTP. Please request a new code.");
      }
    } catch (err) {
      setError("Unable to verify OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!newPassword) {
      setError("New password is required.");
      return;
    }

    const strength = validatePasswordStrength(newPassword);
    if (strength.message) {
      setError(strength.message);
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role,
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setStep(4);
      } else {
        setError(data.message || "Failed to reset password. Your reset session may have expired.");
      }
    } catch (err) {
      setError("Unable to complete password reset. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password requirement checks for visual validation indicators
  const passwordCriteria = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "At least one letter (a-z, A-Z)", met: /[a-zA-Z]/.test(newPassword) },
    { label: "At least one number (0-9)", met: /[0-9]/.test(newPassword) },
    {
      label: "At least one special character (@, #, $, &, !)",
      met: /[@#$&!]/.test(newPassword),
    },
  ];

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <div className="auth-page">
          <div className="auth-card">
            {/* Header */}
            <div className="auth-header">
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-subtle, #eff6ff)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                }}
              >
                <KeyRound size={24} />
              </div>
              <h1 className="auth-title">
                {step === 1 && "Forgot Password"}
                {step === 2 && "Enter Verification Code"}
                {step === 3 && "Create New Password"}
                {step === 4 && "Password Reset Complete"}
              </h1>
              <p className="auth-subtitle">
                {step === 1 && "Enter your email to receive a password reset code"}
                {step === 2 && `We've sent a 6-digit OTP code to ${email}`}
                {step === 3 && "Choose a strong password with letters, numbers, and symbols"}
                {step === 4 && "Your password has been successfully reset"}
              </p>
            </div>

            {/* Role Switcher Tabs (Only on Step 1) */}
            {step === 1 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  backgroundColor: "var(--bg-subtle)",
                  padding: "6px",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "24px",
                }}
              >
                <button
                  type="button"
                  className={`btn ${role === "candidate" ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                  onClick={() => handleRoleChange("candidate")}
                >
                  <User size={16} />
                  <span>Job Seeker</span>
                </button>
                <button
                  type="button"
                  className={`btn ${role === "company" ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                  onClick={() => handleRoleChange("company")}
                >
                  <Building2 size={16} />
                  <span>Company</span>
                </button>
              </div>
            )}

            {/* Error Message Alert */}
            {error && (
              <div
                className="alert-danger"
                style={{
                  marginBottom: "20px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  border: "1px solid #fca5a5",
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </div>
            )}

            {/* Success Message Alert */}
            {message && step !== 4 && (
              <div
                className="alert-success"
                style={{
                  marginBottom: "20px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#f0fdf4",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                  fontSize: "0.9rem",
                }}
              >
                {message}
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {step === 1 && (
              <form onSubmit={handleRequestOTP} noValidate>
                <FormInput
                  label="Registered Email Address"
                  name="email"
                  type="email"
                  placeholder={
                    role === "candidate"
                      ? "e.g. john.doe@example.com"
                      : "e.g. hr@company.com"
                  }
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  icon={Mail}
                  autoComplete="email"
                  autoFocus
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  loading={isSubmitting}
                  style={{ marginTop: "12px" }}
                >
                  Send Reset Code
                </Button>

                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <Link
                    to={`/login?role=${role}`}
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <ArrowLeft size={14} /> Back to Login
                  </Link>
                </div>
              </form>
            )}

            {/* STEP 2: Verify OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP} noValidate>
                <div style={{ marginBottom: "20px" }}>
                  <label
                    htmlFor="otp"
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                    }}
                  >
                    6-Digit Verification Code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      if (error) setError("");
                    }}
                    placeholder="000000"
                    autoFocus
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px 16px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      letterSpacing: "8px",
                      textAlign: "center",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--text)",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "10px",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>
                      Code expires in:{" "}
                      <strong style={{ color: countdown < 60 ? "#dc2626" : "var(--text)" }}>
                        {formatTimer(countdown)}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={isResending || countdown > 240}
                      style={{
                        background: "none",
                        border: "none",
                        color: countdown > 240 ? "var(--text-muted)" : "var(--primary)",
                        fontWeight: "600",
                        cursor: countdown > 240 ? "not-allowed" : "pointer",
                        padding: "0",
                      }}
                    >
                      {isResending ? "Resending..." : "Resend Code"}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  loading={isSubmitting}
                >
                  Verify Code
                </Button>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "20px",
                    fontSize: "0.85rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                      setError("");
                      setMessage("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Change email
                  </button>

                  <Link
                    to={`/login?role=${role}`}
                    style={{
                      color: "var(--text-muted)",
                      textDecoration: "none",
                    }}
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            )}

            {/* STEP 3: Enter New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} noValidate>
                <FormInput
                  label="New Password"
                  name="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  icon={Lock}
                  autoComplete="new-password"
                  autoFocus
                />

                {/* Password Criteria checklist */}
                <div
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    marginTop: "-4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      color: "var(--text-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Password Requirements:
                  </div>
                  {passwordCriteria.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.8rem",
                        color: item.met ? "#16a34a" : "var(--text-muted)",
                        marginBottom: "4px",
                      }}
                    >
                      {item.met ? (
                        <Check size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
                      ) : (
                        <X size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                      )}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                <FormInput
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  icon={Lock}
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  loading={isSubmitting}
                  style={{ marginTop: "12px" }}
                >
                  Reset Password
                </Button>

                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <Link
                    to={`/login?role=${role}`}
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      textDecoration: "none",
                    }}
                  >
                    Cancel and return to Login
                  </Link>
                </div>
              </form>
            )}

            {/* STEP 4: Success */}
            {step === 4 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "12px 0 8px 0",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: "#f0fdf4",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px auto",
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>
                  Password Reset Successful!
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    marginBottom: "24px",
                  }}
                >
                  Your account password has been updated. You can now log in with your new password.
                </p>

                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={() => navigate(`/login?role=${role}`)}
                >
                  Log In as {role === "candidate" ? "Job Seeker" : "Company"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
