import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, FileText, Sparkles, User, LogOut } from "lucide-react";
import {
  readStoredUser,
  subscribeStoredUser,
  updateStoredUser,
  resolveImageSrc,
} from "../../utils/userSync";

import API_BASE_URL from "../../utils/api";

export default function CandidateSidebar({ activeNav }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Candidate");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const applyStoredUser = (user) => {
    const name =
      user?.fullName || user?.name || localStorage.getItem("candidateName");
    if (name) setUserName(name);
    if (user?.email) setUserEmail(user.email);
    const pic =
      user?.profilePictureUrl ||
      user?.logoUrl ||
      localStorage.getItem("profilePictureUrl") ||
      "";
    setAvatarUrl(pic);
  };

  useEffect(() => {
    try {
      const stored = readStoredUser();
      if (stored) {
        applyStoredUser(stored);
      } else {
        const directName = localStorage.getItem("candidateName");
        if (directName) setUserName(directName);
        const directPic = localStorage.getItem("profilePictureUrl");
        if (directPic) setAvatarUrl(directPic);
      }
    } catch (e) {
      console.warn("Could not read user in sidebar", e);
    }

    // Live-sync: avatar updates immediately when the profile picture changes
    const unsubscribe = subscribeStoredUser(applyStoredUser);

    // Refresh stale snapshot data (e.g. right after login or a page refresh
    // when the login payload did not include the profile picture yet).
    const refreshSnapshot = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch(`${API_BASE_URL}/candidates/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();
        if (response.ok && result.success && result.data) {
          const pic = result.data.profilePictureUrl || "";
          const patch = { profilePictureUrl: pic };
          if (result.data.fullName) patch.fullName = result.data.fullName;
          updateStoredUser(patch);
          if (pic) {
            localStorage.setItem("profilePictureUrl", pic);
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
    localStorage.removeItem("candidateName");
    localStorage.removeItem("profilePictureUrl");
    navigate("/login");
  };

  // Determine current active item from route or prop
  const currentPath = location.pathname;
  const isActive = (path) => {
    if (activeNav) return activeNav === path;
    if (path === "/dashboard" && (currentPath === "/dashboard" || currentPath === "/candidate/dashboard")) return true;
    if (path === "/jobs" && (currentPath.startsWith("/jobs") || currentPath.startsWith("/candidate/jobs"))) return true;
    if (path === "/applications" && (currentPath === "/applications" || currentPath === "/candidate/applications")) return true;
    if (path === "/ai-tools" && currentPath.startsWith("/ai-tools")) return true;
    if (path === "/candidate/profile" && currentPath.startsWith("/candidate/profile")) return true;
    return false;
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: Home,
      badge: null,
    },
    {
      label: "Job Search",
      path: "/jobs",
      icon: Search,
      badge: null,
    },
    {
      label: "My Applications",
      path: "/applications",
      icon: FileText,
      badge: "Active",
    },
    {
      label: "AI Career Tools",
      path: "/ai-tools",
      icon: Sparkles,
      badge: "AI",
    },
    {
      label: "Profile",
      path: "/candidate/profile",
      icon: User,
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
                  <span className={`sidebar-pill-badge ${item.badge === "AI" ? "badge-ai" : "badge-active"}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: Candidate Profile Snippet & Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar" style={{ overflow: "hidden" }}>
            {avatarUrl ? (
              <img
                src={resolveImageSrc(avatarUrl)}
                alt={userName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
                onError={() => setAvatarUrl("")}
              />
            ) : (
              <User size={18} />
            )}
            <span className="online-dot"></span>
          </div>
          <div className="sidebar-user-details">
            <strong className="sidebar-user-name" title={userName}>
              {userName}
            </strong>
            <span className="sidebar-user-role">Job Seeker</span>
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
