import React from "react";

import API_BASE_URL from "../../utils/api";

export default function SocialLogin({ onGoogleClick, actionText = "Sign up with" }) {
  const buildAuthUrl = () => {
    const path = window.location.pathname;
    const returnPath = path === "/login" || path === "/register/candidate" ? "/dashboard" : (path && path !== "/" ? path : "/dashboard");
    const params = new URLSearchParams({ return_to: returnPath });
    return `${API_BASE_URL}/auth/google?${params.toString()}`;
  };

  const handleGoogle = () => {
    if (onGoogleClick) {
      onGoogleClick();
      return;
    }
    window.location.href = buildAuthUrl();
  };

  return (
    <div className="social-auth-section">
      <div className="social-divider">
        <span>Or {actionText.toLowerCase()}</span>
      </div>

      <div className="social-buttons">
        <button type="button" className="btn-social" onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.1-6.68-4.93H1.32v3.15C3.31 21.32 7.37 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.32C.48 8.26 0 10.07 0 12s.48 3.74 1.32 5.42l4-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.31 2.68 1.32 6.58l4 3.15c.94-2.83 3.57-4.98 6.68-4.98z"
            />
          </svg>
          <span>Google</span>
        </button>
      </div>
    </div>
  );
}
