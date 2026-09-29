import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, ShieldCheck, CheckCircle2 } from "lucide-react";
import Navbar from "../../Components/components/Navbar.jsx";
import Footer from "../../Components/components/Footer.jsx";
import Button from "../../Components/components/Button.jsx";
import { updateStoredUser } from "../../utils/userSync.js";

import API_BASE_URL from "../../utils/api";

export default function EmailVerification() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const email = searchParams.get("email");
    const role = searchParams.get("role");

    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [countdown, setCountdown] = useState(300);

    useEffect(() => {
        if (countdown <= 0) return;

        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 6);

        setOtp(value);

        if (error) {
            setError("");
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (otp.length !== 6) {
            setError("Please enter the 6-digit OTP.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/auth/verify-email-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        role,
                        otp,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem("token", data.data.token);
                if (data.data.user?.profilePictureUrl) {
                    localStorage.setItem("profilePictureUrl", data.data.user.profilePictureUrl);
                }
                if (data.data.user?.logoUrl) {
                    localStorage.setItem("companyLogo", data.data.user.logoUrl);
                }

                if (role === "candidate" && data.data.user?.fullName) {
                    localStorage.setItem(
                        "candidateName",
                        data.data.user.fullName
                    );
                }
                if (role === "company" && data.data.user?.companyName) {
                    localStorage.setItem(
                        "companyName",
                        data.data.user.companyName
                    );
                }
                updateStoredUser(data.data.user);

                setVerificationSuccess(true);
            } else {
                setError(
                    data.message || "Invalid OTP. Please check the code and try again."
                );
            }
        } catch (err) {
            setError(
                "Unable to connect to the backend server. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setMessage("");
        setIsResending(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/auth/resend-email-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        role,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage("A new OTP has been sent to your email.");
                setOtp("");
                setCountdown(300);
            } else {
                setError(data.message || "Unable to resend OTP.");
            }
        } catch (err) {
            setError(
                "Unable to connect to the backend server. Please try again."
            );
        } finally {
            setIsResending(false);
        }
    };

    if (!email || !role) {
        return (
            <div className="app-container">
                <Navbar />

                <main className="main-content">
                    <div className="auth-page">
                        <div className="auth-card">
                            <div className="auth-header">
                                <h1 className="auth-title">Invalid Verification Request</h1>
                                <p className="auth-subtitle">
                                    Please register again to verify your email address.
                                </p>
                            </div>

                            <Button
                                variant="primary"
                                fullWidth
                                onClick={() => navigate("/")}
                            >
                                Go to Home
                            </Button>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        );
    }

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content">
                <div className="auth-page">
                    <div className="auth-card">
                        {!verificationSuccess ? (
                            <>
                                <div className="auth-header">
                                    <div
                                        style={{
                                            width: "64px",
                                            height: "64px",
                                            borderRadius: "50%",
                                            backgroundColor: "var(--bg-subtle)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            margin: "0 auto 20px",
                                            color: "var(--primary)",
                                        }}
                                    >
                                        <ShieldCheck size={34} />
                                    </div>

                                    <h1 className="auth-title">Verify Your Email</h1>

                                    <p className="auth-subtitle">
                                        We've sent a 6-digit verification code to
                                    </p>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            marginTop: "10px",
                                            color: "var(--text)",
                                            fontWeight: "600",
                                            fontSize: "0.9rem",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        <Mail size={17} />
                                        <span>{email}</span>
                                    </div>
                                </div>

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
                                        }}
                                    >
                                        {error}
                                    </div>
                                )}

                                {message && (
                                    <div
                                        className="alert-success"
                                        style={{
                                            marginBottom: "20px",
                                            padding: "12px 16px",
                                            borderRadius: "8px",
                                        }}
                                    >
                                        {message}
                                    </div>
                                )}

                                <form onSubmit={handleVerify} noValidate>
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
                                            Enter Verification Code
                                        </label>

                                        <input
                                            id="otp"
                                            name="otp"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            value={otp}
                                            onChange={handleOtpChange}
                                            placeholder="000000"
                                            autoFocus
                                            style={{
                                                width: "100%",
                                                boxSizing: "border-box",
                                                padding: "14px 16px",
                                                border: "1px solid var(--border)",
                                                borderRadius: "var(--radius-md)",
                                                fontSize: "1.5rem",
                                                fontWeight: "600",
                                                letterSpacing: "8px",
                                                textAlign: "center",
                                                outline: "none",
                                            }}
                                        />

                                        <div
                                            style={{
                                                textAlign: "center",
                                                marginTop: "10px",
                                                fontSize: "0.85rem",
                                                color:
                                                    countdown > 0
                                                        ? "var(--text-muted)"
                                                        : "#dc2626",
                                            }}
                                        >
                                            {countdown > 0
                                                ? `OTP expires in ${formatTime(countdown)}`
                                                : "OTP has expired. Please request a new one."}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        fullWidth
                                        size="lg"
                                        loading={isSubmitting}
                                    >
                                        Verify Email
                                    </Button>
                                </form>

                                <div
                                    style={{
                                        textAlign: "center",
                                        marginTop: "24px",
                                        paddingTop: "20px",
                                        borderTop: "1px solid var(--border)",
                                    }}
                                >
                                    <p
                                        style={{
                                            marginBottom: "8px",
                                            color: "var(--text-muted)",
                                            fontSize: "0.85rem",
                                        }}
                                    >
                                        Didn't receive the code?
                                    </p>

                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={isResending}
                                        style={{
                                            border: "none",
                                            background: "none",
                                            color: "var(--primary)",
                                            fontWeight: "600",
                                            cursor: isResending ? "default" : "pointer",
                                            fontSize: "0.9rem",
                                            opacity: isResending ? 0.6 : 1,
                                        }}
                                    >
                                        {isResending ? "Sending..." : "Resend OTP"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "10px 0",
                                }}
                            >
                                <CheckCircle2
                                    size={56}
                                    style={{
                                        color: "var(--success)",
                                        margin: "0 auto 16px",
                                    }}
                                />

                                <h1 className="auth-title">Email Verified!</h1>

                                <p
                                    className="auth-subtitle"
                                    style={{ marginBottom: "24px" }}
                                >
                                    Your email address has been successfully verified.
                                    You're ready to use CareerForge.
                                </p>

                                <Button
                                    variant="primary"
                                    fullWidth
                                    size="lg"
                                    onClick={() =>
                                        navigate(
                                            role === "candidate"
                                                ? "/candidate/dashboard"
                                                : "/company/dashboard"
                                        )
                                    }
                                >
                                    {role === "candidate"
                                        ? "Go to Candidate Dashboard"
                                        : "Go to Company Dashboard"}
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