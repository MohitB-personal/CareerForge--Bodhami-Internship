import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, LayoutDashboard, AlertTriangle } from "lucide-react";
import Navbar from "../Components/components/Navbar.jsx";
import Footer from "../Components/components/Footer.jsx";
import Button from "../Components/components/Button.jsx";

export default function NotFound() {
  // Auth-aware CTA: signed-in candidates are sent back to their
  // dashboard; logged-out visitors fall back to the homepage.
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      setIsLoggedIn(
        !!(localStorage.getItem("token") || localStorage.getItem("user"))
      );
    } catch (e) {
      console.warn("Could not read auth state in NotFound", e);
      setIsLoggedIn(false);
    }
  }, []);

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <div className="auth-page">
          <div className="auth-card" style={{ textAlign: "center", padding: "48px 32px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                backgroundColor: "var(--warning-light)",
                color: "var(--warning)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--secondary)", marginBottom: "12px" }}>
              404 - Page Not Found
            </h1>
            <p style={{ color: "var(--text-muted)", marginBottom: "28px", lineHeight: "1.6" }}>
              The page you are looking for does not exist or has been moved.
            </p>

            <Link to={isLoggedIn ? "/dashboard" : "/"}>
              <Button variant="primary" icon={isLoggedIn ? LayoutDashboard : Home}>
                {isLoggedIn ? "Back to Dashboard" : "Back to Homepage"}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
