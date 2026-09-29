import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  Bot,
  Compass,
  TrendingUp,
  ArrowRight,
  Award,
  Sparkles,
} from "lucide-react";
import CandidateLayout from "../../Components/components/CandidateLayout";

// Hub navigation matching the wireframe: one card per AI tool screen
const AI_TOOLS = [
  {
    title: "AI Profile Analysis",
    description: "See how recruiter-ready your profile and resume are",
    path: "/ai-tools/profile-analysis",
    icon: Target,
    accent: "primary",
    badge: "Start here",
    badgeTone: "success",
  },
  {
    title: "AI Mock Interview",
    description: "Practice with AI and get instant interview feedback",
    path: "/ai-tools/mock-interview",
    icon: Bot,
    accent: "accent",
    badge: "Most popular",
    badgeTone: "warning",
  },
  {
    title: "Learning Pathway",
    description: "Follow a guided roadmap to close your skill gaps",
    path: "/ai-tools/learning-pathway",
    icon: Compass,
    accent: "warning",
    badge: null,
    badgeTone: null,
  },
  {
    title: "Career Progress",
    description: "Track your applications, interviews and offers",
    path: "/ai-tools/career-progress",
    icon: TrendingUp,
    accent: "dark",
    badge: null,
    badgeTone: null,
  },
];

// Quick stats shown inside the hero banner
const HERO_STATS = [
  { value: "4", label: "AI Tools" },
  { value: "1:1", label: "AI Feedback" },
  { value: "Free", label: "To Get Started" },
];

// Three-step journey strip
const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Analyze your profile",
    text: "AI scores your resume and skills against your target role.",
  },
  {
    num: "02",
    title: "Practice & learn",
    text: "Mock interviews plus a guided pathway close your skill gaps.",
  },
  {
    num: "03",
    title: "Track your progress",
    text: "Watch applications, interviews and offers trend upward.",
  },
];

export default function LearnWithAI() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("there");

  // Greet the signed-in candidate by first name (same source as the sidebar)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        const name =
          parsed.fullName || parsed.name || localStorage.getItem("candidateName");
        if (name) setUserName(name.split(" ")[0]);
      } else {
        const directName = localStorage.getItem("candidateName");
        if (directName) setUserName(directName.split(" ")[0]);
      }
    } catch (e) {
      console.warn("Could not read user in LearnWithAI", e);
    }
  }, []);

  return (
    <CandidateLayout activeNav="/ai-tools">
      <div className="search-main">
        <div className="search-container">
          {/* Hero banner */}
          <section className="ai-hero">
            <span className="ai-hero-badge">
              <Sparkles size={14} />
              AI-Powered Career Toolkit
            </span>
            <h1>Learn With AI</h1>
            <p>
              Hey {userName} — analyze your profile, practice interviews,
              follow a guided learning path and track your progress, all in one
              place.
            </p>
            <div className="ai-hero-stats">
              {HERO_STATS.map((stat) => (
                <span key={stat.label} className="ai-hero-stat">
                  <strong>{stat.value}</strong> {stat.label}
                </span>
              ))}
            </div>
          </section>

          {/* Section head */}
          <div className="ai-section-head">
            <h2>AI Career Tools</h2>
            <p>Pick a tool to get started</p>
          </div>

          {/* Hub navigation cards */}
          <div className="ai-hub-grid">
            {AI_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.title}
                  type="button"
                  className={`ai-hub-card ai-v2 accent-${tool.accent}`}
                  onClick={() => navigate(tool.path)}
                >
                  {tool.badge && (
                    <span className={`ai-card-badge badge-${tool.badgeTone}`}>
                      {tool.badge}
                    </span>
                  )}
                  <span className="ai-hub-icon">
                    <Icon size={24} />
                  </span>
                  <span className="ai-hub-card-text">
                    <strong>{tool.title}</strong>
                    <small>{tool.description}</small>
                  </span>
                  <span className="ai-hub-go">
                    <ArrowRight size={16} />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Apply to Courses CTA banner */}
          <button
            type="button"
            className="ai-cta-banner"
            onClick={() => navigate("/ai-tools/courses")}
          >
            <span className="ai-cta-icon">
              <Award size={24} />
            </span>
            <span className="ai-cta-text">
              <strong>Apply to Courses</strong>
              <small>
                Browse free &amp; paid courses from leading companies and
                upskill at your own pace
              </small>
            </span>
            <span className="ai-cta-go">
              <ArrowRight size={18} />
            </span>
          </button>

          {/* How it works */}
          <div className="ai-section-head">
            <h2>How it works</h2>
            <p>Three steps to your next offer</p>
          </div>
          <div className="ai-steps">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.num} className="ai-step-card">
                <span className="ai-step-num">{step.num}</span>
                <strong>{step.title}</strong>
                <small>{step.text}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
}