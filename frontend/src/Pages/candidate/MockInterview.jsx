import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  Clock,
  FileText,
  Award,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import CandidateLayout from "../../Components/components/CandidateLayout";
import Button from "../../Components/components/Button";

// Interview configuration matching the wireframe
const INTERVIEW_TYPES = [
  { id: "technical", label: "Technical", role: "Frontend Developer", round: "Technical Round", difficulty: "Medium" },
  { id: "hr", label: "HR", role: "Frontend Developer", round: "HR Round", difficulty: "Easy" },
  { id: "behavioral", label: "Behavioral", role: "Frontend Developer", round: "Behavioral Round", difficulty: "Medium" },
];

const DURATION = "30 Mins";
const QUESTION_COUNT = 10;

// Score ring geometry (viewBox 180x180)
const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Mock AI feedback per interview type (would come from the AI backend later)
const MOCK_FEEDBACK = {
  technical: {
    overall: 67, label: "Good",
    rows: [
      { label: "Communication", value: 75 },
      { label: "Technical Skills", value: 60 },
      { label: "Problem Solving", value: 72 },
      { label: "Confidence", value: 80 },
    ],
    tips: [
      "Strengthen core JavaScript concepts — closures and the event loop were your weakest area.",
      "Use the STAR method for scenario questions to structure your answers more clearly.",
      "You kept a strong pace and tone throughout — carry that energy into the next round.",
    ],
  },
  hr: {
    overall: 74, label: "Good",
    rows: [
      { label: "Communication", value: 80 },
      { label: "Culture Fit", value: 78 },
      { label: "Salary Discussion", value: 65 },
      { label: "Confidence", value: 72 },
    ],
    tips: [
      "Research standard compensation bands before entering the salary conversation.",
      "Your teamwork answers landed well — keep specific examples ready.",
      "Ask at least two questions about the company to show genuine interest.",
    ],
  },
  behavioral: {
    overall: 70, label: "Good",
    rows: [
      { label: "Communication", value: 78 },
      { label: "Storytelling", value: 66 },
      { label: "Problem Solving", value: 70 },
      { label: "Confidence", value: 68 },
    ],
    tips: [
      "Structure answers with the STAR method — Situation, Task, Action, Result.",
      "Quantify your achievements; numbers make your stories more convincing.",
      "Pause briefly before tough questions instead of filling the silence.",
    ],
  },
};

export default function MockInterview() {
  const navigate = useNavigate();
  const [view, setView] = useState("setup"); // "setup" | "feedback"
  const [selectedType, setSelectedType] = useState("technical");
  const [showHistory, setShowHistory] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [history, setHistory] = useState([]);

  const activeType =
    INTERVIEW_TYPES.find((t) => t.id === selectedType) || INTERVIEW_TYPES[0];
  const feedback = MOCK_FEEDBACK[selectedType];
  const ringOffset = CIRCUMFERENCE - (feedback.overall / 100) * CIRCUMFERENCE;

  const handleSubmit = () => {
    setHistory((prev) => [
      {
        id: Date.now(),
        round: activeType.round,
        score: feedback.overall,
        when: new Date().toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...prev,
    ]);
    setShowDetail(false);
    setShowHistory(false);
    setView("feedback");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToSetup = () => {
    setView("setup");
    setShowDetail(false);
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
                <h1 className="search-page-title">
                  {view === "setup" ? "Mock Interview" : "Interview Feedback"}
                </h1>
                <p className="search-page-subtitle">
                  {view === "setup"
                    ? "Choose Interview Type"
                    : "Overall Performance"}
                </p>
              </div>
            </div>
          </div>

          {view === "setup" ? (
            /* ---------- SETUP SCREEN (wireframe screen 2) ---------- */
            <div className="ai-panel">
              {/* Interview type selector */}
              <div className="ai-seg-control">
                {INTERVIEW_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`ai-seg-btn ${
                      selectedType === t.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedType(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Role card */}
              <div className="ai-interview-card">
                <div className="ai-interview-avatar">
                  <Bot size={26} />
                </div>
                <div className="ai-interview-role">
                  <h3>{activeType.role}</h3>
                  <span className="ai-round-pill">{activeType.round}</span>
                </div>
              </div>

              {/* Session details */}
              <div className="ai-detail-list">
                <div className="ai-detail-row">
                  <Clock size={16} />
                  <span>Duration</span>
                  <strong>{DURATION}</strong>
                </div>
                <div className="ai-detail-row">
                  <FileText size={16} />
                  <span>Questions</span>
                  <strong>{QUESTION_COUNT}</strong>
                </div>
                <div className="ai-detail-row">
                  <Award size={16} />
                  <span>Difficulty</span>
                  <strong>{activeType.difficulty}</strong>
                </div>
              </div>

              <div className="ai-actions-row ai-actions-center">
                <Button variant="primary" size="lg" fullWidth onClick={handleSubmit}>
                  Submit Interview
                </Button>
              </div>

              {/* Previous interviews */}
              <div className="ai-setup-footer">
                <span>Previous Interview</span>
                <button
                  type="button"
                  className="ai-secondary-link"
                  onClick={() => setShowHistory((s) => !s)}
                >
                  {showHistory ? "Hide History" : "View History"}
                </button>
              </div>

              {showHistory && (
                <div className="ai-history-list">
                  {history.length === 0 ? (
                    <p className="ai-empty-note">
                      No interviews yet — your completed sessions will appear
                      here.
                    </p>
                  ) : (
                    history.map((h) => (
                      <div key={h.id} className="ai-history-item">
                        <CheckCircle2 size={16} />
                        <div className="ai-history-info">
                          <strong>{h.round}</strong>
                          <small>{h.when}</small>
                        </div>
                        <span className="ai-history-score">{h.score}%</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ---------- FEEDBACK SCREEN (wireframe screen 3) ---------- */
            <>
              <div className="ai-panel ai-score-panel">
                <div
                  className="ai-score-ring"
                  role="img"
                  aria-label={`Overall performance ${feedback.overall} percent`}
                >
                  <svg viewBox="0 0 180 180">
                    <circle
                      className="ai-ring-track"
                      cx="90"
                      cy="90"
                      r={RADIUS}
                    />
                    <circle
                      className="ai-ring-progress"
                      cx="90"
                      cy="90"
                      r={RADIUS}
                      strokeDasharray={CIRCUMFERENCE}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <div className="ai-score-ring-text">
                    <strong>{feedback.overall}%</strong>
                    <span>{feedback.label}</span>
                  </div>
                </div>
                <p className="ai-score-caption">
                  You completed the {activeType.round} for {activeType.role}.
                  Here is how the AI interviewer rated your performance.
                </p>
              </div>

              <div className="ai-panel">
                <div className="ai-metric-list">
                  {feedback.rows.map((row) => (
                    <div key={row.label} className="ai-metric-row">
                      <div className="ai-metric-top">
                        <span>{row.label}</span>
                        <strong>{row.value}%</strong>
                      </div>
                      <div className="ai-progress-track">
                        <div
                          className="ai-progress-fill"
                          style={{ width: `${row.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ai-actions-row ai-actions-center">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => setShowDetail((s) => !s)}
                  >
                    {showDetail
                      ? "Hide Detailed Feedback"
                      : "View Detailed Feedback"}
                  </Button>
                  <Button variant="outline" fullWidth onClick={backToSetup}>
                    Take Another Interview
                  </Button>
                </div>

                {showDetail && (
                  <div className="ai-tips-box">
                    <h3>AI Coach Tips</h3>
                    {feedback.tips.map((tip, idx) => (
                      <p key={idx} className="ai-tip-row">
                        <Sparkles size={14} />
                        <span>{tip}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </CandidateLayout>
  );
}