import React from "react";
import CandidateSidebar from "./CandidateSidebar";
import Navbar from "./Navbar";

export default function CandidateLayout({ children, activeNav }) {
  return (
    <div className="portal-page-wrapper">
      {/* Top Navbar with condensed logged-in header */}
      <Navbar />

      <div className="portal-layout-body">
        {/* Left Navigation Sidebar */}
        <CandidateSidebar activeNav={activeNav} />

        {/* Dynamic Main Content Container */}
        <div className="portal-main-viewport">
          {children}
        </div>
      </div>
    </div>
  );
}
