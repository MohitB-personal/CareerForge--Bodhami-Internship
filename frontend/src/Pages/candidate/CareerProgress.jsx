import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  Briefcase,
  Users,
  Award,
  User,
  FileText,
} from "lucide-react";
import CandidateLayout from "../../Components/components/CandidateLayout";
import Button from "../../Components/components/Button";

// Mock progress data matching the wireframe (would come from the backend later)
const TREND = { period: "Last 30 Days", change: "+12%" };
const ACTIVITY = [22, 40, 34, 58, 50, 76];
const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const STATS = [
  { label: "Applications", value: 21, icon: Briefcase },
  { label: "Interviews", value: 3, icon: Users },
  { label: "Offers", value: 1, icon: Award },
  { label: "Profile Score", value: 18, icon: User },
];
const REPORT_ROWS = [
  { label: "Applications", value: "21 total • 6 this month" },
  { label: "Interview conversion", value: "3 interviews from 21 applications" },
  { label: "Offers", value: "1 offer in progress" },
  { label: "Profile strength", value: "18 — keep your profile updated" },
];

// Chart geometry
const CHART_W = 640;
const CHART_H = 210;
const PAD_L = 42;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 30;
const GRID_VALUES = [0, 25, 50, 75, 100];

const CHART_POINTS = ACTIVITY.map((value, i) => ({
  x: PAD_L + (i * (CHART_W - PAD_L - PAD_R)) / (ACTIVITY.length - 1),
  y: PAD_T + (1 - value / 100) * (CHART_H - PAD_T - PAD_B),
  value,
}));
const POLYLINE_POINTS = CHART_POINTS.map((p) => `${p.x},${p.y}`).join(" ");
const gridY = (value) => PAD_T + (1 - value / 100) * (CHART_H - PAD_T - PAD_B);

export default function CareerProgress() {
  const navigate = useNavigate();
  const [showReport, setShowReport] = useState(false);

  return (
    <CandidateLayout activeNav="/ai-tools">
      <div className="search-main">
        <div className="search-container">
          {/* Top Bar: Title + Back to Learn With AI */}
          <div className="search-top-header">
            <div className="search-title-group">
              <button
                type="button"
                className="back-btn-pill"
                onClick={() => navigate("/ai-tools")}
                title="Back to Learn With AI"
              >
                <ArrowLeft size={16} />
                <span>Learn With AI</span>
              </button>
              <div>
                <h1 className="search-page-title">Career Progress</h1>
                <p className="search-page-subtitle">Your Progress</p>
              </div>
            </div>
          </div>

          {/* Trend Chart Card */}
          <div className="ai-panel">
            <div className="ai-trend-head">
              <span className="ai-trend-label">{TREND.period}</span>
              <span className="ai-trend-pill">
                <TrendingUp size={15} />
                {TREND.change}
              </span>
            </div>

            <div className="ai-chart-wrap">
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                role="img"
                aria-label="Career activity over the last six months"
              >
                {/* Horizontal grid lines + y labels */}
                {GRID_VALUES.map((g) => (
                  <g key={g}>
                    <line
                      x1={PAD_L}
                      x2={CHART_W - PAD_R}
                      y1={gridY(g)}
                      y2={gridY(g)}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      strokeDasharray="4 6"
                    />
                    <text
                      x={PAD_L - 10}
                      y={gridY(g) + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94a3b8"
                    >
                      {g}
                    </text>
                  </g>
                ))}

                {/* Activity line */}
                <polyline
                  points={POLYLINE_POINTS}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data dots + x labels */}
                {CHART_POINTS.map((p, i) => (
                  <g key={i}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill="#4f46e5"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={p.x}
                      y={CHART_H - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#94a3b8"
                    >
                      {MONTHS[i]}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Stats grid */}
            <div className="ai-stat-grid">
              {STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="ai-stat-card">
                    <Icon size={18} />
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="ai-actions-row">
              <Button
                variant="primary"
                fullWidth
                icon={FileText}
                onClick={() => setShowReport((s) => !s)}
              >
                {showReport ? "Hide Full Report" : "View Full Report"}
              </Button>
            </div>
          </div>

          {/* Full Report Panel */}
          {showReport && (
            <div className="ai-panel">
              <div className="ai-panel-head">
                <TrendingUp size={18} />
                <h2>Full Report</h2>
              </div>
              <div className="ai-detail-list">
                {REPORT_ROWS.map((row) => (
                  <div key={row.label} className="ai-detail-row">
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CandidateLayout>
  );
}