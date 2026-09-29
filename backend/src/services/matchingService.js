/**
 * Candidate-Job Profile Matching & Recommendation Service
 * Compares candidate profile skills, education, experience, and preferences against job requirements.
 * Designed to be modular so AI/LLM models can be hooked in smoothly.
 */

/**
 * Calculate matching score between a candidate profile/resume and a job posting
 * @param {Object} candidateProfile Candidate profile object (from CandidateModel.findProfileByCandidateId)
 * @param {Object} candidateResume Saved resume object or resume JSON content (optional)
 * @param {Object} job Job object (from JobModel.findById or row)
 * @returns {Number} Matching score between 0 and 100
 */
const calculateMatchingScore = (candidateProfile = {}, candidateResume = null, job = {}) => {
  if (!job || !job.title) return 75;

  let totalScore = 0;

  // 1. Skill Matching (Weight: 50%)
  const jobSkills = (job.skills || []).map((s) => String(s).toLowerCase().trim());
  let candidateSkills = [];

  if (candidateProfile && Array.isArray(candidateProfile.skills)) {
    candidateSkills = candidateProfile.skills.map((s) => {
      if (typeof s === 'string') return s.toLowerCase().trim();
      if (typeof s === 'object' && s.name) return String(s.name).toLowerCase().trim();
      return '';
    }).filter(Boolean);
  }

  // Also extract skills from saved resume content if present
  if (candidateResume && candidateResume.content) {
    const resContent = typeof candidateResume.content === 'string'
      ? tryParseJson(candidateResume.content)
      : candidateResume.content;
    
    if (resContent && Array.isArray(resContent.skills)) {
      resContent.skills.forEach((s) => {
        const str = typeof s === 'string' ? s : (s.name || '');
        if (str && !candidateSkills.includes(str.toLowerCase().trim())) {
          candidateSkills.push(str.toLowerCase().trim());
        }
      });
    }
  }

  let skillMatchRatio = 0.6; // baseline skill match
  if (jobSkills.length > 0 && candidateSkills.length > 0) {
    let matchedCount = 0;
    jobSkills.forEach((js) => {
      if (candidateSkills.some((cs) => cs.includes(js) || js.includes(cs))) {
        matchedCount++;
      }
    });
    skillMatchRatio = matchedCount / jobSkills.length;
    if (skillMatchRatio > 1) skillMatchRatio = 1;
    // Boost minimum ratio if candidate has skills
    if (skillMatchRatio < 0.4 && candidateSkills.length > 2) {
      skillMatchRatio = 0.5;
    }
  } else if (candidateSkills.length > 0) {
    skillMatchRatio = 0.7;
  }

  totalScore += skillMatchRatio * 50;

  // 2. Experience Level Matching (Weight: 20%)
  const reqExp = String(job.experience || job.experience_required || '').toLowerCase();
  let expScore = 15; // default moderate score

  if (candidateProfile.isFresher) {
    if (reqExp.includes('fresher') || reqExp.includes('0-1') || reqExp.includes('entry')) {
      expScore = 20;
    } else {
      expScore = 12;
    }
  } else if (Array.isArray(candidateProfile.experience) && candidateProfile.experience.length > 0) {
    const candidateYears = candidateProfile.experience.length * 1.5;
    if (reqExp.includes('senior') || reqExp.includes('5-8') || reqExp.includes('8+')) {
      expScore = candidateYears >= 5 ? 20 : 14;
    } else if (reqExp.includes('mid') || reqExp.includes('3-5') || reqExp.includes('2-4')) {
      expScore = candidateYears >= 2 ? 20 : 15;
    } else {
      expScore = 18;
    }
  }
  totalScore += expScore;

  // 3. Education / Qualifications Matching (Weight: 15%)
  const reqEdu = String(job.education || '').toLowerCase();
  let eduScore = 12;

  if (Array.isArray(candidateProfile.education) && candidateProfile.education.length > 0) {
    const candidateEduStr = JSON.stringify(candidateProfile.education).toLowerCase();
    if (!reqEdu || candidateEduStr.includes('bachelor') || candidateEduStr.includes('master') || candidateEduStr.includes('b.tech') || candidateEduStr.includes('degree')) {
      eduScore = 15;
    } else {
      eduScore = 13;
    }
  }
  totalScore += eduScore;

  // 4. Category & Location Preference Matching (Weight: 15%)
  let prefScore = 10;
  const prefs = candidateProfile.preferences || {};
  const candLoc = String(candidateProfile.location || '').toLowerCase();
  const jobLoc = String(job.location || '').toLowerCase();

  if (jobLoc.includes('remote') || (candLoc && jobLoc.includes(candLoc))) {
    prefScore += 3;
  }
  if (prefs.targetRole && String(job.title || '').toLowerCase().includes(String(prefs.targetRole).toLowerCase())) {
    prefScore += 2;
  }
  if (prefScore > 15) prefScore = 15;
  totalScore += prefScore;

  // Round final score and ensure bounds between 50 and 98
  let finalScore = Math.round(totalScore);
  if (finalScore < 50) finalScore = 55;
  if (finalScore > 98) finalScore = 98;

  return finalScore;
};

function tryParseJson(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

module.exports = {
  calculateMatchingScore,
};
