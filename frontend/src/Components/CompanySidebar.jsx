import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Home,
    BriefcaseBusiness,
    Users,
    Building2,
    LogOut,
} from "lucide-react";
import {
    readStoredUser,
    subscribeStoredUser,
    updateStoredUser,
    resolveImageSrc,
} from "../utils/userSync";

import API_BASE_URL from "../utils/api";

export default function CompanySidebar({ activeNav }) {
    const location = useLocation();
    const navigate = useNavigate();

    const [companyName, setCompanyName] = useState("Company");
    const [companyEmail, setCompanyEmail] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [logoFailed, setLogoFailed] = useState(false);

    const applyStoredUser = (user) => {
        const name =
            user?.companyName ||
            user?.company_name ||
            user?.name ||
            localStorage.getItem("companyName");

        if (name) setCompanyName(name);
        if (user?.email) setCompanyEmail(user.email);
        const logo =
            user?.profilePictureUrl ||
            user?.logoUrl ||
            localStorage.getItem("companyLogo") ||
            localStorage.getItem("profilePictureUrl") ||
            "";
        setLogoUrl(logo || "");
        setLogoFailed(false);
    };

    useEffect(() => {
        try {
            const stored = readStoredUser();

            if (stored) {
                applyStoredUser(stored);
            } else {
                const directName = localStorage.getItem("companyName");
                if (directName) setCompanyName(directName);
                const directLogo =
                    localStorage.getItem("companyLogo") ||
                    localStorage.getItem("profilePictureUrl");
                if (directLogo) setLogoUrl(directLogo);
            }
        } catch (e) {
            console.warn("Could not read company user in sidebar", e);
        }

        // Live-sync: logo updates immediately when it is changed in the
        // company profile section.
        const unsubscribe = subscribeStoredUser(applyStoredUser);

        // Refresh stale snapshot data (e.g. right after login or a page
        // refresh when the login payload did not include the logo yet).
        const refreshSnapshot = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                const response = await fetch(`${API_BASE_URL}/companies/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                const result = await response.json();
                if (response.ok && result.success && result.data) {
                    const logo = result.data.logoUrl || "";
                    const patch = {
                        logoUrl: logo,
                        profilePictureUrl: logo,
                    };
                    if (result.data.companyName) patch.companyName = result.data.companyName;
                    updateStoredUser(patch);
                    if (logo) {
                        localStorage.setItem("companyLogo", logo);
                        localStorage.setItem("profilePictureUrl", logo);
                    }
                }
            } catch (e) {
                // Offline or logged out — keep the existing defaults
            }
        };
        refreshSnapshot();

        return unsubscribe;
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("companyName");
        localStorage.removeItem("companyLogo");
        localStorage.removeItem("profilePictureUrl");
        navigate("/login");
    };

    const currentPath = location.pathname;

    const isActive = (path) => {
        if (activeNav) return activeNav === path;

        if (
            path === "/company/dashboard" &&
            (currentPath === "/company/dashboard" ||
                currentPath === "/company")
        ) {
            return true;
        }

        if (
            path === "/company/jobs" &&
            currentPath.startsWith("/company/jobs")
        ) {
            return true;
        }

        if (
            path === "/company/candidates" &&
            currentPath.startsWith("/company/candidates")
        ) {
            return true;
        }

        if (
            path === "/company/profile" &&
            currentPath.startsWith("/company/profile")
        ) {
            return true;
        }

        return false;
    };

    const navItems = [
        {
            label: "Dashboard",
            path: "/company/dashboard",
            icon: Home,
            badge: null,
        },
        {
            label: "Manage Jobs",
            path: "/company/jobs",
            icon: BriefcaseBusiness,
            badge: null,
        },
        {
            label: "Candidates",
            path: "/company/candidates",
            icon: Users,
            badge: null,
        },
        {
            label: "My Company",
            path: "/company/profile",
            icon: Building2,
            badge: null,
        },
    ];

    return (
        <aside className="portal-sidebar">
            {/* Navigation Links Group */}
            <div className="sidebar-nav-section">
                <div className="sidebar-group-title">MAIN NAVIGATION</div>

                <nav className="sidebar-nav-list">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`sidebar-nav-link ${active ? "active" : ""}`}
                            >
                                <div className="nav-link-left">
                                    <Icon size={19} className="nav-icon" />
                                    <span>{item.label}</span>
                                </div>

                                {item.badge && (
                                    <span className="sidebar-pill-badge">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Sidebar Footer: Company Profile & Logout */}
            <div className="sidebar-footer">
                <div className="sidebar-user-card">
                    <div className="sidebar-user-avatar" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {logoUrl && !logoFailed ? (
                            <img
                                src={resolveImageSrc(logoUrl)}
                                alt="Company logo"
                                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                                onError={() => setLogoFailed(true)}
                            />
                        ) : (
                            <Building2 size={18} />
                        )}
                        <span className="online-dot"></span>
                    </div>

                    <div className="sidebar-user-details">
                        <strong
                            className="sidebar-user-name"
                            title={companyName}
                        >
                            {companyName}
                        </strong>

                        <span className="sidebar-user-role">
                            Company
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    className="sidebar-logout-btn"
                    onClick={handleLogout}
                    title="Sign out of account"
                >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}