import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import CandidateLayout from "../../Components/components/CandidateLayout";
import Button from "../../Components/components/Button";

// Mock analysis data matching the wireframe (would come from AI backend later)
const OVERALL_SCORE = 75;
const SCORE_LABEL = "Great";
const SKILL_METRICS = [
  { label: "Skill Match", value: 82 },
  { label: "Experience", value: 76 },
  { label: "Resume Quality", value: 90 },
  { label: "Completeness", value: 85 },
];
const STRENGTHS = [
  "Resume quality is excellent — clear structure and strong action verbs.",
  "Your skills list aligns well with the Frontend Developer roles you are targeting.",
  "Your profile photo and headline are complete and professional.",
];
const IMPROVEMENTS = [
  "Add 2 more projects with measurable outcomes to lift your experience score.",
  "Request 1–2 skill endorsements from peers to strengthen your skill match.",
  "Add your latest certification to boost overall completeness.",
];

// Score ring geometry (viewBox 180x180)
const RADIUS = 78;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const RING_OFFSET = CIRCUMFERENCE - (OVERALL_SCORE / 100) * CIRCUMFERENCE;

export default function AIProfileAnalysis() {
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
                <h1 className="search-page-title">AI Profile Analysis</h1>
                <p className="search-page-subtitle">Overall Score</p>
              </div>
            </div>
          </div>

          {/* Overall Score Ring */}
          <div className="ai-panel ai-score-panel">
            <div
              className="ai-score-ring"
              role="img"
              aria-label={`Overall score ${OVERALL_SCORE} percent`}
            >
              <svg viewBox="0 0 180 180">
                <circle className="ai-ring-track" cx="90" cy="90" r={RADIUS} />
                <circle
                  className="ai-ring-progress"
                  cx="90"
                  cy="90"
                  r={RADIUS}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={RING_OFFSET}
                />
              </svg>
              <div className="ai-score-ring-text">
                <strong>{OVERALL_SCORE}%</strong>
                <span>{SCORE_LABEL}</span>
              </div>
            </div>
            <p className="ai-score-caption">
              Your profile is performing well. A few tweaks below can push you
              into the top candidate bracket for your target roles.
            </p>
          </div>

          {/* Skill Breakdown */}
          <div className="ai-panel">
            <div className="ai-panel-head">
              <Sparkles size={18} />
              <h2>Detailed Breakdown</h2>
            </div>
            <div className="ai-metric-list">
              {SKILL_METRICS.map((metric) => (
                <div key={metric.label} className="ai-metric-row">
                  <div className="ai-metric-top">
                    <span>{metric.label}</span>
                    <strong>{metric.value}%</strong>
                  </div>
                  <div className="ai-progress-track">
                    <div
                      className="ai-progress-fill"
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
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
                <CheckCircle2 size={18} />
                <h2>Full Report</h2>
              </div>
              <div className="ai-report-grid">
                <div className="ai-report-col">
                  <h3>What's working</h3>
                  {STRENGTHS.map((item, idx) => (
                    <p key={idx} className="ai-report-item positive">
                      <CheckCircle2 size={15} />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
                <div className="ai-report-col">
                  <h3>Focus areas</h3>
                  {IMPROVEMENTS.map((item, idx) => (
                    <p key={idx} className="ai-report-item negative">
                      <AlertCircle size={15} />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </CandidateLayout>
  );
}