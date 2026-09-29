import React from "react";
import { Link } from "react-router-dom";
import LogoMark from "./LogoMark";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="brand-logo" style={{ color: "#ffffff" }}>
            <LogoMark height={34} />
            <span style={{ color: "#ffffff" }}>
              Career<span style={{ color: "var(--primary)" }}>Forge</span>
            </span>
          </Link>
          <p>
            Forge your career path and build high-performing teams with our next-generation hiring platform.
          </p>
        </div>

        <div>
          <h4 className="footer-title">For Candidates</h4>
          <ul className="footer-links">
            <li>
              <Link to="/register/candidate">Create Profile</Link>
            </li>
            <li>
              <Link to="/register/candidate">Explore Jobs</Link>
            </li>
            <li>
              <Link to="/login">Candidate Login</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="footer-title">For Companies</h4>
          <ul className="footer-links">
            <li>
              <Link to="/register/company">Company Registration</Link>
            </li>
            <li>
              <Link to="/register/company">Post a Job</Link>
            </li>
            <li>
              <Link to="/login">Company Login</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="footer-title">Platform</h4>
          <ul className="footer-links">
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#audience">Tailored Solutions</a>
            </li>
            <li>
              <Link to="/login">Help & Support</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} CareerForge. All rights reserved.</p>
        <div style={{ display: "flex", gap: "20px" }}>
          <a href="#privacy" style={{ color: "#94a3b8" }}>Privacy Policy</a>
          <a href="#terms" style={{ color: "#94a3b8" }}>Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
