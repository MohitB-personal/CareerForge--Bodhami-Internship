const bcrypt = require('bcryptjs');
const CandidateModel = require('../models/candidateModel');
const { generateToken } = require('../utils/tokenUtils');
const { generateOTP, saveOTP } = require('../utils/otpService');
const { sendOTPEmail } = require('../utils/emailService');
const { validatePhoneInput } = require('../utils/validators');


/**
 * Register Candidate
 * POST /api/v1/candidates/register
 */
const registerCandidate = async (req, res, next) => {
  try {
    const { fullName, email, phone, password } =
      req.sanitizedBody || req.body;

    // Check if email already exists
    const existingCandidate = await CandidateModel.findByEmail(email);

    if (existingCandidate) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please login instead.',
        errors: {
          email: 'Email address is already registered.',
        },
      });
    }

    // Hash password before storing the account
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create candidate as email-unverified
    const newCandidate = await CandidateModel.create({
      full_name: fullName,
      email,
      phone,
      password_hash,
    });

    // Generate a 6-digit OTP
    const otp = generateOTP();

    // Store OTP temporarily in server memory
    // OTP is NOT stored in MySQL
    saveOTP(email, otp, {
      role: 'candidate',
      userId: newCandidate.id,
    });

    // Send OTP to candidate's email
    await sendOTPEmail(email, otp);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email using the OTP sent to your email address.',
      data: {
        verificationRequired: true,
        email: newCandidate.email,
        role: 'candidate',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Candidate Login
 * POST /api/v1/candidates/login
 */
const loginCandidate = async (req, res, next) => {
  try {
    const { email, password } = req.sanitizedBody || req.body;

    // Find candidate by email
    const candidate = await CandidateModel.findByEmail(email);

    if (!candidate) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
        errors: { email: 'No candidate account found with this email.' },
      });
    }

    // Verify password match
    const isPasswordValid = await bcrypt.compare(
      password,
      candidate.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
        errors: { password: 'Incorrect password entered.' },
      });
    }

    // Check email verification
    if (!candidate.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        data: {
          verificationRequired: true,
          email: candidate.email,
          role: 'candidate',
        },
      });
    }

    // Generate JWT Token
    const token = generateToken({
      id: candidate.id,
      email: candidate.email,
      role: 'candidate',
      name: candidate.full_name,
    });

    return res.status(200).json({
      success: true,
      message: 'Candidate login successful.',
      data: {
        candidate: {
          id: candidate.id,
          fullName: candidate.full_name,
          email: candidate.email,
          phone: candidate.phone,
          profilePictureUrl: candidate.profile_picture_url || '',
          role: 'candidate',
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to calculate candidate profile completion percentage dynamically.
 * 100% complete ONLY when all required profile fields are filled AND a resume is saved/uploaded.
 */
const calculateProfileCompletion = (profileData, hasResumeOverride = undefined) => {
  if (!profileData) return 0;
  let score = 0;

  // 1. Personal Information (15%)
  const hasPersonalInfo =
    profileData.fullName?.trim() &&
    profileData.phone?.trim() &&
    profileData.headline?.trim() &&
    profileData.location?.trim() &&
    profileData.bio?.trim();
  const partialPersonalInfo =
    profileData.fullName?.trim() && profileData.phone?.trim();
  if (hasPersonalInfo) score += 15;
  else if (partialPersonalInfo) score += 8;

  // 2. Education (15%)
  if (Array.isArray(profileData.education) && profileData.education.length > 0) {
    score += 15;
  }

  // 3. Skills (10%)
  if (Array.isArray(profileData.skills) && profileData.skills.length > 0) {
    score += 10;
  }

  // 4. Experience (15%)
  if (
    profileData.isFresher ||
    (Array.isArray(profileData.experience) && profileData.experience.length > 0)
  ) {
    score += 15;
  }

  // 5. Projects (10%)
  if (Array.isArray(profileData.projects) && profileData.projects.length > 0) {
    score += 10;
  }

  // 6. Certifications (5%)
  if (
    profileData.noCertifications ||
    (Array.isArray(profileData.certifications) && profileData.certifications.length > 0)
  ) {
    score += 5;
  }

  // 7. Achievements (5%)
  if (Array.isArray(profileData.achievements) && profileData.achievements.length > 0) {
    score += 5;
  }

  // 8. Career Interests and Preferences (5%)
  const pref = profileData.preferences || {};
  if (
    (Array.isArray(pref.desiredRoles) && pref.desiredRoles.length > 0) ||
    (typeof pref.desiredRoles === 'string' && pref.desiredRoles.trim()) ||
    (Array.isArray(pref.preferredLocations) && pref.preferredLocations.length > 0) ||
    (typeof pref.preferredLocations === 'string' && pref.preferredLocations.trim()) ||
    pref.expectedSalary ||
    pref.noticePeriod ||
    (Array.isArray(pref.jobTypes) && pref.jobTypes.length > 0)
  ) {
    score += 5;
  }

  // 9. Links (5%)
  if (
    profileData.linkedinUrl?.trim() ||
    profileData.githubUrl?.trim() ||
    profileData.portfolioUrl?.trim()
  ) {
    score += 5;
  }

  // 10. Saved or Uploaded Resume (15%)
  const hasResume =
    hasResumeOverride !== undefined
      ? Boolean(hasResumeOverride)
      : (Boolean(profileData.hasResume) || (Number(profileData.resumeCount) > 0));
  if (hasResume) {
    score += 15;
  }

  return Math.min(100, Math.max(0, score));
};

/**
 * Get Current Candidate Profile
 * GET /api/v1/candidates/profile
 */
const getCandidateProfile = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    let profile = await CandidateModel.findProfileByCandidateId(candidateId);

    if (!profile) {
      const candidate = await CandidateModel.findById(candidateId);
      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: 'Candidate profile not found.',
        });
      }
      profile = {
        candidateId: candidate.id,
        fullName: candidate.full_name,
        email: candidate.email,
        phone: candidate.phone,
        profilePictureUrl: '',
        headline: '',
        location: '',
        bio: '',
        openToWork: true,
        isFresher: false,
        noCertifications: false,
        linkedinUrl: '',
        githubUrl: '',
        portfolioUrl: '',
        education: [],
        skills: [],
        experience: [],
        projects: [],
        certifications: [],
        achievements: [],
        preferences: {},
        profileCompletion: 0,
        resumeCount: 0,
        hasResume: false,
      };
    }

    const hasResume = profile.hasResume || profile.resumeCount > 0;
    const computedCompletion = calculateProfileCompletion(profile, hasResume);
    if (profile.profileCompletion !== computedCompletion) {
      profile.profileCompletion = computedCompletion;
      await CandidateModel.updateProfileCompletion(candidateId, computedCompletion);
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Candidate Profile
 * PUT /api/v1/candidates/profile
 */
const updateCandidateProfile = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const body = req.sanitizedBody || req.body;

    const existing = (await CandidateModel.findProfileByCandidateId(candidateId)) || {};

    const updatedFullName = body.fullName !== undefined ? body.fullName : existing.fullName;
    const updatedPhone = body.phone !== undefined ? body.phone : existing.phone;
    if (body.phone !== undefined && body.phone !== null && String(body.phone).trim() !== '') {
      const phoneErr = validatePhoneInput(body.phone);
      if (phoneErr) {
        return res.status(400).json({ success: false, message: phoneErr, errors: { phone: phoneErr } });
      }
    }

    if (body.fullName !== undefined || body.phone !== undefined) {
      await CandidateModel.updateBasicInfo(candidateId, {
        fullName: updatedFullName,
        phone: updatedPhone,
      });
    }

    const mergedData = {
      fullName: updatedFullName,
      email: existing.email || req.user.email,
      phone: updatedPhone,
      headline: body.headline !== undefined ? body.headline : (existing.headline || ''),
      location: body.location !== undefined ? body.location : (existing.location || ''),
      bio: body.bio !== undefined ? body.bio : (existing.bio || ''),
      openToWork: body.openToWork !== undefined ? Boolean(body.openToWork) : (existing.openToWork ?? true),
      isFresher: body.isFresher !== undefined ? Boolean(body.isFresher) : Boolean(existing.isFresher),
      noCertifications: body.noCertifications !== undefined ? Boolean(body.noCertifications) : Boolean(existing.noCertifications),
      linkedinUrl: body.linkedinUrl !== undefined ? body.linkedinUrl : (existing.linkedinUrl || ''),
      githubUrl: body.githubUrl !== undefined ? body.githubUrl : (existing.githubUrl || ''),
      portfolioUrl: body.portfolioUrl !== undefined ? body.portfolioUrl : (existing.portfolioUrl || ''),
      education: body.education !== undefined ? body.education : (existing.education || []),
      skills: body.skills !== undefined ? body.skills : (existing.skills || []),
      experience: body.experience !== undefined ? body.experience : (existing.experience || []),
      projects: body.projects !== undefined ? body.projects : (existing.projects || []),
      certifications: body.certifications !== undefined ? body.certifications : (existing.certifications || []),
      achievements: body.achievements !== undefined ? body.achievements : (existing.achievements || []),
      preferences: body.preferences !== undefined ? body.preferences : (existing.preferences || {}),
    };

    const hasResume = existing.hasResume !== undefined ? existing.hasResume : (Number(existing.resumeCount) > 0);
    mergedData.hasResume = hasResume;
    mergedData.profileCompletion = calculateProfileCompletion(mergedData, hasResume);

    const savedProfile = await CandidateModel.upsertProfile(candidateId, mergedData);

    return res.status(200).json({
      success: true,
      message: 'Candidate profile updated successfully.',
      data: savedProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload or replace the authenticated candidate's profile picture.
 * POST /api/v1/candidates/profile/picture
 */
const uploadCandidateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No profile picture provided.' });
    }

    const candidateId = req.user.id;
    const profilePictureUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const profile = await CandidateModel.updateProfilePicture(candidateId, profilePictureUrl);

    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully.',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete Candidate Profile
 * POST /api/v1/candidates/profile/complete
 */
const completeCandidateProfile = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const body = req.sanitizedBody || req.body;

    const existing = (await CandidateModel.findProfileByCandidateId(candidateId)) || {};

    const updatedFullName = body.fullName !== undefined ? body.fullName : (existing.fullName || req.user.name);
    const updatedPhone = body.phone !== undefined ? body.phone : existing.phone;
    if (body.phone !== undefined && body.phone !== null && String(body.phone).trim() !== '') {
      const phoneErr = validatePhoneInput(body.phone);
      if (phoneErr) {
        return res.status(400).json({ success: false, message: phoneErr, errors: { phone: phoneErr } });
      }
    }

    if (body.fullName !== undefined || body.phone !== undefined) {
      await CandidateModel.updateBasicInfo(candidateId, {
        fullName: updatedFullName,
        phone: updatedPhone,
      });
    }

    const mergedData = {
      fullName: updatedFullName,
      email: existing.email || req.user.email,
      phone: updatedPhone,
      headline: body.headline !== undefined ? body.headline : (existing.headline || ''),
      location: body.location !== undefined ? body.location : (existing.location || ''),
      bio: body.bio !== undefined ? body.bio : (existing.bio || ''),
      openToWork: body.openToWork !== undefined ? Boolean(body.openToWork) : (existing.openToWork ?? true),
      isFresher: body.isFresher !== undefined ? Boolean(body.isFresher) : Boolean(existing.isFresher),
      noCertifications: body.noCertifications !== undefined ? Boolean(body.noCertifications) : Boolean(existing.noCertifications),
      linkedinUrl: body.linkedinUrl !== undefined ? body.linkedinUrl : (existing.linkedinUrl || ''),
      githubUrl: body.githubUrl !== undefined ? body.githubUrl : (existing.githubUrl || ''),
      portfolioUrl: body.portfolioUrl !== undefined ? body.portfolioUrl : (existing.portfolioUrl || ''),
      education: body.education !== undefined ? body.education : (existing.education || []),
      skills: body.skills !== undefined ? body.skills : (existing.skills || []),
      experience: body.experience !== undefined ? body.experience : (existing.experience || []),
      projects: body.projects !== undefined ? body.projects : (existing.projects || []),
      certifications: body.certifications !== undefined ? body.certifications : (existing.certifications || []),
      achievements: body.achievements !== undefined ? body.achievements : (existing.achievements || []),
      preferences: body.preferences !== undefined ? body.preferences : (existing.preferences || {}),
    };

    const hasResume = existing.hasResume !== undefined ? existing.hasResume : (Number(existing.resumeCount) > 0);
    mergedData.hasResume = hasResume;
    mergedData.profileCompletion = calculateProfileCompletion(mergedData, hasResume);

    const savedProfile = await CandidateModel.upsertProfile(candidateId, mergedData);

    return res.status(200).json({
      success: true,
      message: 'Profile completed successfully!',
      data: savedProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Candidate Dashboard Summary
 * GET /api/v1/candidates/dashboard
 */
const getCandidateDashboardData = async (req, res, next) => {
  try {
    const candidateId = req.user?.id;
    let candidate = null;
    let profile = null;

    if (candidateId) {
      candidate = await CandidateModel.findById(candidateId);
      profile = await CandidateModel.findProfileByCandidateId(candidateId);
    }

    const fullName = candidate ? candidate.full_name : (req.user?.name || 'Job Seeker');
    const hasResume = profile ? (profile.hasResume || Number(profile.resumeCount) > 0) : false;
    const profileCompletion = profile ? calculateProfileCompletion(profile, hasResume) : 0;

    return res.status(200).json({
      success: true,
      data: {
        candidate: {
          id: candidate?.id || candidateId || null,
          fullName,
          email: candidate?.email || req.user?.email || '',
        },
        profileCompletion,
        stats: {
          applied: 12,
          shortlisted: 3,
          recommended: 18,
        },
        recommendedJobs: [
          {
            id: 'frontend-developer',
            title: 'Frontend Developer',
            company: 'Tech Solutions Inc',
            location: 'Bengaluru, India',
            salary: '₹12-16 LPA',
            type: 'Full-time',
            tags: ['React', 'TypeScript', 'Tailwind'],
            posted: '2h ago',
            matchScore: 92,
          },
          {
            id: 'fullstack-engineer',
            title: 'Full Stack Engineer',
            company: 'Innovate Labs',
            location: 'Remote',
            salary: '₹18-24 LPA',
            type: 'Remote',
            tags: ['Node.js', 'Express', 'MySQL'],
            posted: '5h ago',
            matchScore: 88,
          },
          {
            id: 'software-engineer',
            title: 'Software Engineer',
            company: 'InfoTech Global',
            location: 'Bengaluru, India',
            salary: '₹14-18 LPA',
            type: 'Full-time',
            tags: ['React', 'Node.js', 'PostgreSQL'],
            posted: '1d ago',
            matchScore: 85,
          },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCandidate,
  loginCandidate,
  getCandidateProfile,
  updateCandidateProfile,
  uploadCandidateProfilePicture,
  completeCandidateProfile,
  getCandidateDashboardData,
  calculateProfileCompletion,
};
