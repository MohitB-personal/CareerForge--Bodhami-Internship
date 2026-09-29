/**
 * Resume service — template registry, profile-completeness validation for
 * resume generation, and deterministic resume content building.
 *
 * Every piece of resume content is derived from the candidate's actual
 * profile data. Nothing is fabricated. The optional LLM pass (llmService)
 * may only reword existing facts, and it degrades gracefully.
 */

const CandidateModel = require('../models/candidateModel');
const llmService = require('./llmService');

const RESUME_TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern Professional',
    description:
      'Contemporary single-column layout with a bold header, accent-colored section titles and clean skill chips. Great for tech and business roles.',
    accent: '#4f46e5',
  },
  {
    id: 'classic',
    name: 'Classic Professional',
    description:
      'Timeless serif resume with centered header, ruled section headings and a conservative, ATS-friendly structure. Ideal for traditional industries.',
    accent: '#1f2937',
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description:
      'Ultra-clean airy layout with generous whitespace, thin divider lines and understated typography. Lets your experience do the talking.',
    accent: '#0f766e',
  },
];

const getTemplateById = (templateId) =>
  RESUME_TEMPLATES.find((t) => t.id === templateId) || null;

const isNonEmpty = (value) =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Validate that the candidate's profile has everything required to build a
 * professional resume. Reuses the existing candidate profile data model
 * (same fields the profile page stores) — required for a resume:
 *   fullName, phone (registration data), headline, location, education,
 *   skills, and experience (or fresher mode).
 * Bio, links, projects, certifications and achievements are optional extras
 * that are included when present.
 *
 * @param {Object} profile Candidate profile from CandidateModel
 * @returns {{ complete: Boolean, missingSections: Array<{key, label, hint}> }}
 */
const checkResumeReadiness = (profile) => {
  const missing = [];

  if (!isNonEmpty(profile?.fullName)) {
    missing.push({
      key: 'personal',
      label: 'Personal Information',
      hint: 'Full name is missing.',
    });
  }
  if (!isNonEmpty(profile?.phone)) {
    missing.push({
      key: 'personal',
      label: 'Personal Information',
      hint: 'Phone number is missing.',
    });
  }
  if (!isNonEmpty(profile?.headline)) {
    missing.push({
      key: 'personal',
      label: 'Professional Headline',
      hint: 'Add a headline such as "Aspiring Frontend Developer".',
    });
  }
  if (!isNonEmpty(profile?.location)) {
    missing.push({
      key: 'personal',
      label: 'Location',
      hint: 'Add your current city/region.',
    });
  }
  if (!Array.isArray(profile?.education) || profile.education.length === 0) {
    missing.push({
      key: 'education',
      label: 'Education',
      hint: 'Add at least one education entry (degree, institution, years).',
    });
  }
  if (!Array.isArray(profile?.skills) || profile.skills.length === 0) {
    missing.push({
      key: 'skills',
      label: 'Skills & Expertise',
      hint: 'Add at least one skill.',
    });
  }
  const hasExperience =
    profile?.isFresher ||
    (Array.isArray(profile?.experience) && profile.experience.length > 0);
  if (!hasExperience) {
    missing.push({
      key: 'experience',
      label: 'Experience',
      hint: 'Add work/internship experience, or enable Fresher mode in your profile.',
    });
  }

  return { complete: missing.length === 0, missingSections: missing };
};

/**
 * Deterministically build structured resume content using ONLY profile facts.
 * The fallback professional summary is composed from real profile data
 * (headline, skills, education, experience/fresher status) — never invented.
 */
const buildResumeFromProfile = (profile) => {
  const clean = (value) => (isNonEmpty(value) ? value.trim() : '');

  const skills = (Array.isArray(profile.skills) ? profile.skills : [])
    .map((s) => ({
      name: clean(s?.name),
      level: clean(s?.level),
      category: clean(s?.category),
    }))
    .filter((s) => s.name);

  const experience = (Array.isArray(profile.experience) ? profile.experience : [])
    .map((exp) => ({
      title: clean(exp?.title),
      company: clean(exp?.company),
      location: clean(exp?.location),
      startDate: clean(exp?.startDate),
      endDate: exp?.current ? 'Present' : clean(exp?.endDate),
      current: Boolean(exp?.current),
      description: clean(exp?.description),
    }))
    .filter((exp) => exp.title || exp.company);

  const projects = (Array.isArray(profile.projects) ? profile.projects : [])
    .map((proj) => ({
      title: clean(proj?.title),
      description: clean(proj?.description),
      techStack: clean(proj?.techStack),
      projectUrl: clean(proj?.projectUrl),
      repoUrl: clean(proj?.repoUrl),
    }))
    .filter((proj) => proj.title);

  const education = (Array.isArray(profile.education) ? profile.education : [])
    .map((edu) => ({
      degree: clean(edu?.degree),
      field: clean(edu?.field),
      school: clean(edu?.school),
      startYear: clean(edu?.startYear),
      endYear: clean(edu?.endYear),
      grade: clean(edu?.grade),
    }))
    .filter((edu) => edu.degree || edu.school);

  const certifications = (Array.isArray(profile.certifications) ? profile.certifications : [])
    .map((cert) => ({
      name: clean(cert?.name),
      organization: clean(cert?.organization),
      issueDate: clean(cert?.issueDate),
      expiryDate: clean(cert?.expiryDate),
      credentialUrl: clean(cert?.credentialUrl),
    }))
    .filter((cert) => cert.name);

  const achievements = (Array.isArray(profile.achievements) ? profile.achievements : [])
    .map((ach) => ({
      title: clean(ach?.title),
      description: clean(ach?.description),
      year: clean(ach?.year),
    }))
    .filter((ach) => ach.title);

  return {
    contact: {
      fullName: clean(profile.fullName),
      email: clean(profile.email),
      phone: clean(profile.phone),
      location: clean(profile.location),
      headline: clean(profile.headline),
      linkedin: clean(profile.linkedinUrl),
      github: clean(profile.githubUrl),
      portfolio: clean(profile.portfolioUrl),
    },
    summary: buildFallbackSummary(profile, skills, experience, education),
    education,
    skills,
    experience,
    projects,
    certifications,
    achievements,
    isFresher: Boolean(profile.isFresher),
  };
};

/**
 * Compose a professional summary strictly from existing profile facts.
 */
const buildFallbackSummary = (profile, skills, experience, education) => {
  const parts = [];
  const headline = isNonEmpty(profile.headline) ? profile.headline.trim() : null;

  if (experience.length > 0) {
    const roles = [...new Set(experience.map((e) => e.title).filter(Boolean))];
    const companies = [...new Set(experience.map((e) => e.company).filter(Boolean))];
    const roleText = roles.length > 0 ? roles.slice(0, 2).join(' and ') : 'professional roles';
    const companyText = companies.length > 0 ? ` at ${companies.slice(0, 2).join(' and ')}` : '';
    parts.push(`${headline || roleText} with hands-on experience${companyText}.`);
  } else if (profile.isFresher) {
    parts.push(`${headline || 'Motivated fresher'} eager to launch a professional career.`);
  } else if (headline) {
    parts.push(`${headline}.`);
  }

  const skillNames = skills.map((s) => s.name);
  if (skillNames.length > 0) {
    const topSkills = skillNames.slice(0, 6).join(', ');
    parts.push(`Skilled in ${topSkills}.`);
  }

  if (education.length > 0) {
    const firstEdu = education[0];
    const degreeText = [firstEdu.degree, firstEdu.field].filter(Boolean).join(' in ');
    const schoolText = firstEdu.school ? ` from ${firstEdu.school}` : '';
    if (degreeText) {
      parts.push(`Educational background includes ${degreeText}${schoolText}.`);
    }
  }

  if (Array.isArray(profile.achievements) && profile.achievements.length > 0) {
    const achTitles = profile.achievements
      .map((a) => (isNonEmpty(a?.title) ? a.title.trim() : null))
      .filter(Boolean);
    if (achTitles.length > 0) {
      parts.push(`Recognized for ${achTitles.slice(0, 2).join(' and ')}.`);
    }
  }

  if (parts.length === 0) {
    return 'Professional open to new opportunities.';
  }

  return parts.join(' ');
};

/**
 * Generate a personalized resume for the authenticated candidate:
 * 1. Load the candidate's profile from the database (facts come from here).
 * 2. Re-validate profile completeness on the backend (never trust frontend).
 * 3. Build deterministic resume content from real profile data.
 * 4. Optionally polish wording through the configured LLM provider — with
 *    graceful fallback when the provider is not configured or unavailable.
 *
 * @param {Number} candidateId Authenticated candidate (from JWT)
 * @param {String} templateId Selected template
 * @returns {Promise<{template, resumeData, llmEnhanced, llmError}>}
 * @throws {Object} error with statusCode / missingSections for the controller
 */
const generateResume = async (candidateId, templateId) => {
  const template = getTemplateById(templateId);
  if (!template) {
    const error = new Error('Invalid resume template selected.');
    error.statusCode = 400;
    throw error;
  }

  const profile = await CandidateModel.findProfileByCandidateId(candidateId);
  if (!profile) {
    const error = new Error('Candidate profile not found. Please complete your profile first.');
    error.statusCode = 404;
    throw error;
  }

  const readiness = checkResumeReadiness(profile);
  if (!readiness.complete) {
    const error = new Error('Please complete your profile before creating your resume.');
    error.statusCode = 422;
    error.missingSections = readiness.missingSections;
    throw error;
  }

  const baseResumeData = buildResumeFromProfile(profile);
  const { content, llmEnhanced, llmError } = await llmService.enhanceResumeContent(
    baseResumeData,
    template.name
  );

  return {
    template: { id: template.id, name: template.name },
    resumeData: content,
    llmEnhanced,
    llmError,
  };
};

module.exports = {
  RESUME_TEMPLATES,
  getTemplateById,
  checkResumeReadiness,
  buildResumeFromProfile,
  generateResume,
};

