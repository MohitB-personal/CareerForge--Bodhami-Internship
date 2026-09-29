import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
} from "lucide-react";
import CandidateLayout from "../../Components/components/CandidateLayout";
import Button from "../../Components/components/Button";

// Mock pathway data matching the wireframe (would come from AI backend later)
const PATH_INFO = { title: "Frontend Developer Path", progress: 30 };
const MODULES = [
  { name: "HTML & CSS", status: "Completed" },
  { name: "JavaScript", status: "In Progress" },
  { name: "React", status: "In Progress" },
  { name: "Tailwind CSS", status: "Locked" },
];

const STATUS_META = {
  Completed: { icon: CheckCircle2, chip: "chip-done" },
  "In Progress": { icon: Clock, chip: "chip-progress" },
  Locked: { icon: Lock, chip: "chip-locked" },
};

export default function LearningPathway() {
  const navigate = useNavigate();
  const [currentModule, setCurrentModule] = useState("JavaScript");
  const [resumed, setResumed] = useState(false);

  const handleContinue = () => {
    // Resume the first module that is not finished and not locked
    const next = MODULES.find(
      (m) => m.status !== "Completed" && m.status !== "Locked"
    );
    if (next) {
      setCurrentModule(next.name);
      setResumed(true);
    }
  };

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
                <h1 className="search-page-title">Learning Pathway</h1>
                <p className="search-page-subtitle">
                  Recommendation Path For You
                </p>
              </div>
            </div>
          </div>

          {/* Pathway Card */}
          <div className="ai-panel">
            <div className="ai-path-head">
              <h3>{PATH_INFO.title}</h3>
              <span className="ai-path-progress-label">
                Progress: <strong>{PATH_INFO.progress}%</strong>
              </span>
            </div>
            <div className="ai-progress-track">
              <div
                className="ai-progress-fill"
                style={{ width: `${PATH_INFO.progress}%` }}
              />
            </div>

            {/* Module steps with status chips */}
            <div className="ai-module-list">
              {MODULES.map((module) => {
                const meta = STATUS_META[module.status];
                const Icon = meta.icon;
                const isCurrent =
                  module.name === currentModule &&
                  module.status !== "Completed" &&
                  module.status !== "Locked";

                return (
                  <div
                    key={module.name}
                    className={`ai-module-item ${isCurrent ? "current" : ""}`}
                  >
                    <span className="ai-module-icon">
                      <Icon size={17} />
                    </span>
                    <span className="ai-module-name">{module.name}</span>
                    <span className={`ai-status-chip ${meta.chip}`}>
                      {module.status}
                    </span>
                  </div>
                );
              })}
            </div>

            {resumed && (
              <div className="ai-resume-note">
                <Sparkles size={15} />
                <span>
                  Resumed <strong>{currentModule}</strong> — pick up where you
                  left off.
                </span>
              </div>
            )}

            <div className="ai-actions-row">
              <Button variant="primary" fullWidth onClick={handleContinue}>
                Continue Learning
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
}