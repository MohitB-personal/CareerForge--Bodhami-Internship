import React from "react";
import CompanySidebar from "./CompanySidebar";
import Navbar from "./components/Navbar";

export default function CompanyLayout({ children, activeNav }) {
    return (
        <div className="portal-page-wrapper company-portal">
            {/* Top Navbar */}
            <Navbar />

            <div className="portal-layout-body">
                {/* Company Navigation Sidebar */}
                <CompanySidebar activeNav={activeNav} />

                {/* Dynamic Main Content */}
                <div className="portal-main-viewport">
                    {children}
                </div>
            </div>
        </div>
    );
}