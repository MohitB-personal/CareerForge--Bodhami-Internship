import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Building2, CheckCircle2 } from "lucide-react";
import Navbar from "../Components/components/Navbar";
import Footer from "../Components/components/Footer";
import FormInput from "../Components/components/FormInput";
import Button from "../Components/components/Button";
import SocialLogin from "../Components/components/SocialLogin";
import { validateLoginForm } from "../utils/validation";
import { updateStoredUser } from "../utils/userSync";
import API_BASE_URL from "../utils/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState("candidate"); // 'candidate' | 'company'
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get("oauth_error");
    if (oauthError) {
      setErrors((prev) => ({ ...prev, general: decodeURIComponent(oauthError) }));
    }
  }, [location.search]);

  const handleRoleChange = (newRole) => {
    if (newRole !== role) {
      setRole(newRole);
      if (loginSuccess) {
        setLoginSuccess(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateLoginForm(formData);
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true);
      try {
        const endpoint =
          role === "candidate"
            ? `${API_BASE_URL}/candidates/login`
            : `${API_BASE_URL}/companies/login`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const userPayload = data.data.candidate || data.data.company || {
            email: formData.email,
            role,
            fullName: formData.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          };
          if (data.data?.token) {
            localStorage.setItem("token", data.data.token);
          }
          if (userPayload.profilePictureUrl) {
            localStorage.setItem("profilePictureUrl", userPayload.profilePictureUrl);
          }
          if (userPayload.logoUrl) {
            localStorage.setItem("companyLogo", userPayload.logoUrl);
            if (!userPayload.profilePictureUrl) {
              userPayload.profilePictureUrl = userPayload.logoUrl;
            }
          }
          if (userPayload.fullName) {
            localStorage.setItem("candidateName", userPayload.fullName);
          }
          if (userPayload.companyName) {
            localStorage.setItem("companyName", userPayload.companyName);
          }
          updateStoredUser(userPayload);
          setLoginSuccess(true);
        } else {
          setErrors((prev) => ({
            ...prev,
            ...(data.errors || {}),
            general: data.message || "Login failed. Please verify credentials.",
          }));
        }
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          general: "Unable to connect to backend server. Make sure your Express/MySQL backend is running on port 5000.",
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
          <div className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Log in to your CareerForge account</p>
            </div>

            {/* Role Switcher Tabs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                backgroundColor: "var(--bg-subtle)",
                padding: "6px",
                borderRadius: "var(--radius-md)",
                marginBottom: "28px",
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

            {errors.general && (
              <div className="alert-danger" style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}>
                {errors.general}
              </div>
            )}

            {loginSuccess ? (
              <div className="alert-success" style={{ flexDirection: "column", gap: "12px", textAlign: "center", padding: "24px" }}>
                <CheckCircle2 size={44} style={{ color: "var(--success)", margin: "0 auto" }} />
                <h4>Login Successful!</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  Logged in as <strong>{role === "candidate" ? "Candidate" : "Company"}</strong> ({formData.email}).
                </p>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() =>
                    navigate(
                      role === "candidate"
                        ? "/dashboard"
                        : "/company/dashboard"
                    )
                  }
                  style={{ marginTop: "12px" }}
                >
                  {role === "candidate"
                    ? "Go to Candidate Dashboard"
                    : "Go to Company Dashboard"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder={role === "candidate" ? "e.g. john.doe@example.com" : "e.g. hr@company.com"}
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  icon={Mail}
                  autoComplete="email"
                />

                <FormInput
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                  icon={Lock}
                  autoComplete="current-password"
                />

                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px", marginTop: "-6px" }}>
                  <Link
                    to={`/forgot-password?role=${role}`}
                    style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" variant="primary" fullWidth size="lg" loading={isSubmitting}>
                  Log In as {role === "candidate" ? "Job Seeker" : "Company"}
                </Button>
              </form>
            )}

            {!loginSuccess && role === "candidate" && <SocialLogin actionText="Log in with" />}

            <div className="auth-footer">
              Don't have an account?{" "}
              {role === "candidate" ? (
                <Link to="/register/candidate">Sign up as Job Seeker</Link>
              ) : (
                <Link to="/register/company">Register Company</Link>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
