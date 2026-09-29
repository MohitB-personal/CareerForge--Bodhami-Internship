import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, Building2, LogIn, LogOut } from "lucide-react";
import Button from "./Button";
import LogoMark from "./LogoMark";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const closeMobile = () => setMobileOpen(false);

  // Check auth state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (stored || token) {
        const parsed = stored ? JSON.parse(stored) : {};
        const isCompany = parsed.role === "company" || !!localStorage.getItem("companyName") || !!parsed.companyName || location.pathname.startsWith("/company");
        const role = parsed.role || (isCompany ? "company" : "candidate");
        const name = parsed.fullName || parsed.companyName || parsed.name || (isCompany ? localStorage.getItem("companyName") : localStorage.getItem("candidateName")) || "User";
        setCurrentUser({
          name,
          role,
          email: parsed.email || "",
        });
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      console.warn("Could not read auth state in Navbar", e);
      setCurrentUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("candidateName");
    localStorage.removeItem("companyName");
    setCurrentUser(null);
    closeMobile();
    navigate("/login");
  };

  const isLoggedIn = !!currentUser;

  const getBrandDestination = () => {
    if (!currentUser) return "/";
    if (currentUser.role === "company") return "/company/dashboard";
    return "/candidate/dashboard";
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo / Brand Name */}
        <Link to={getBrandDestination()} className="brand-logo" onClick={closeMobile}>
          <LogoMark height={34} />
          <span>
            Career<span>Forge</span>
          </span>
        </Link>

        {/* Desktop Navigation: Only visible when NOT logged in */}
        {!isLoggedIn && (
          <nav className="nav-links">
            <Link
              to="/"
              className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            >
              Home
            </Link>
            <Link
              to="/register/candidate"
              className={`nav-link ${location.pathname === "/register/candidate" ? "active" : ""}`}
            >
              For Job Seekers
            </Link>
            <Link
              to="/register/company"
              className={`nav-link ${location.pathname === "/register/company" ? "active" : ""}`}
            >
              For Companies
            </Link>
          </nav>
        )}

        <div className="nav-actions">
          <ThemeToggle />
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="mobile-toggle"
          onClick={toggleMobile}
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="mobile-menu open">
          {isLoggedIn ? (
            <>
              <div className="mobile-user-profile-box">
                <div className="user-mini-avatar">
                  <User size={18} />
                </div>
                <div>
                  <strong>{currentUser.name}</strong>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {currentUser.email || "Candidate Account"}
                  </div>
                </div>
              </div>
              <Link to="/dashboard" className="nav-link" onClick={closeMobile}>
                Dashboard
              </Link>
              <Link to="/jobs" className="nav-link" onClick={closeMobile}>
                Job Search
              </Link>
              <Link to="/applications" className="nav-link" onClick={closeMobile}>
                My Applications
              </Link>
              <hr style={{ borderColor: "var(--border)", margin: "8px 0" }} />
              <button
                type="button"
                className="btn btn-outline full-width"
                onClick={handleLogout}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/" className="nav-link" onClick={closeMobile}>
                Home
              </Link>
              <Link to="/register/candidate" className="nav-link" onClick={closeMobile}>
                For Job Seekers
              </Link>
              <Link to="/register/company" className="nav-link" onClick={closeMobile}>
                For Companies
              </Link>
              <hr style={{ borderColor: "var(--border)", margin: "8px 0" }} />
              <Link to="/login" onClick={closeMobile}>
                <Button variant="outline" fullWidth icon={LogIn}>
                  Login
                </Button>
              </Link>
              <Link to="/register/candidate" onClick={closeMobile}>
                <Button variant="primary" fullWidth icon={User}>
                  Get Started (Candidate)
                </Button>
              </Link>
              <Link to="/register/company" onClick={closeMobile}>
                <Button variant="secondary" fullWidth icon={Building2}>
                  Register Company
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
