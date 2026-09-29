import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { updateStoredUser } from "../../utils/userSync";

import API_BASE_URL from "../../utils/api";

export default function OAuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [errorMessage, setErrorMessage] = useState("");
    const exchangeStartedRef = useRef(false);

    useEffect(() => {
        const code = searchParams.get("code");
        const returnTo = searchParams.get("return_to") || "/dashboard";

        if (!code) {
            navigate(`/login?oauth_error=${encodeURIComponent("Google sign-in failed. Please try again.")}`, { replace: true });
            return;
        }

        if (exchangeStartedRef.current) {
            return;
        }

        exchangeStartedRef.current = true;

        const exchangeCode = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/oauth/exchange`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                });

                const data = await response.json();

                if (!response.ok || !data?.success || !data?.data?.token || !data?.data?.user) {
                    const message = data?.message || "Google sign-in session expired. Please try again.";
                    setErrorMessage(message);
                    navigate(`/login?oauth_error=${encodeURIComponent(message)}`, { replace: true });
                    return;
                }

                const { token, user } = data.data;
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                localStorage.setItem("candidateName", user.fullName || user.email?.split("@")[0] || "Candidate");
                updateStoredUser(user);

                const safeReturn = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
                navigate(safeReturn, { replace: true });
            } catch (error) {
                const message = "Google sign-in session expired. Please try again.";
                setErrorMessage(message);
                navigate(`/login?oauth_error=${encodeURIComponent(message)}`, { replace: true });
            }
        };

        exchangeCode();
    }, [navigate, searchParams]);

    return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg-page)" }}>
            <div style={{ textAlign: "center", color: "var(--text-primary)", fontWeight: 600 }}>
                {errorMessage || "Finalizing your sign-in..."}
            </div>
        </div>
    );
}
