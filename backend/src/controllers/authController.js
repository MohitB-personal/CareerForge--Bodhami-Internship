const crypto = require('crypto');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { URLSearchParams } = require('url');
const CandidateModel = require('../models/candidateModel');
const CompanyModel = require('../models/companyModel');
const { getOTP, deleteOTP, generateOTP, saveOTP } = require('../utils/otpService');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetOTPEmail } = require('../utils/emailService');
const { generateToken } = require('../utils/tokenUtils');
const { validatePasswordInput } = require('../utils/validators');
const { getFrontendUrl } = require('../utils/urlHelper');

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const OAUTH_EXCHANGE_TTL_MS = 2 * 60 * 1000;
const oauthStateStore = new Map();
const oauthExchangeStore = new Map();

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const resetPasswordTokenStore = new Map();

const saveResetToken = (token, { email, role, userId }) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  resetPasswordTokenStore.set(tokenHash, {
    email: email.toLowerCase(),
    role,
    userId,
    expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
  });

  setTimeout(() => {
    if (resetPasswordTokenStore.has(tokenHash)) {
      resetPasswordTokenStore.delete(tokenHash);
    }
  }, RESET_TOKEN_TTL_MS).unref();
};

const consumeResetToken = (token, email, role) => {
  if (!token || typeof token !== 'string') return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = resetPasswordTokenStore.get(tokenHash);
  if (!record) return null;

  // Single-use guarantee: delete token immediately
  resetPasswordTokenStore.delete(tokenHash);

  if (Date.now() > record.expiresAt) return null;
  if (record.email !== (email || '').toLowerCase() || record.role !== role) return null;

  return record;
};

const sanitizeReturnTo = (returnTo, fallback = '/dashboard') => {
  if (typeof returnTo !== 'string' || !returnTo.trim()) return fallback;
  const normalized = returnTo.trim();
  if (!normalized.startsWith('/')) return fallback;
  if (normalized.startsWith('//')) return fallback;
  return normalized;
};

const buildFrontendDestination = (returnTo = '/dashboard', frontendBaseUrl = null) => {
  const safePath = sanitizeReturnTo(returnTo, '/dashboard');
  const baseUrl = (frontendBaseUrl || getFrontendUrl()).replace(/\/$/, '');
  return `${baseUrl}${safePath}`;
};

const buildOAuthFailureRedirect = (returnTo, message, frontendBaseUrl = null) => {
  const destination = new URL(buildFrontendDestination(returnTo, frontendBaseUrl));
  destination.searchParams.set('oauth_error', message);
  return destination.toString();
};

const buildEmailVerificationUrl = (email, role = 'candidate') => {
  const frontendUrl = getFrontendUrl();
  const searchParams = new URLSearchParams();
  if (email) searchParams.set('email', email);
  if (role) searchParams.set('role', role);
  const query = searchParams.toString();
  return `${frontendUrl}/verify-email${query ? `?${query}` : ''}`;
};

const saveOAuthState = (provider, state, returnTo = '/dashboard', frontendUrl = null) => {
  const key = `${provider}:${state}`;
  oauthStateStore.set(key, {
    provider,
    returnTo,
    frontendUrl: frontendUrl || getFrontendUrl(),
    createdAt: Date.now(),
  });

  setTimeout(() => {
    if (oauthStateStore.has(key)) {
      oauthStateStore.delete(key);
    }
  }, OAUTH_STATE_TTL_MS).unref();
};

const consumeOAuthState = (provider, state) => {
  const key = `${provider}:${state}`;
  const value = oauthStateStore.get(key);
  if (value) {
    oauthStateStore.delete(key);
  }
  return value || null;
};

const upsertCandidateFromSocialLogin = async ({ email, fullName, avatarUrl }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Provider did not return a valid email address.');
  }

  const safeName = (fullName || normalizedEmail.split('@')[0] || 'CareerForge Candidate').trim();
  const existingCandidate = await CandidateModel.findByEmail(normalizedEmail);

  if (existingCandidate) {
    if (!existingCandidate.email_verified) {
      await CandidateModel.verifyEmail(existingCandidate.id);
    }

    if (avatarUrl && !existingCandidate.profile_picture_url) {
      const profile = await CandidateModel.findProfileByCandidateId(existingCandidate.id);
      if (!profile || !profile.profilePictureUrl) {
        await CandidateModel.upsertProfile(existingCandidate.id, { profilePictureUrl: avatarUrl });
      }
    }

    return await CandidateModel.findById(existingCandidate.id);
  }

  const createdCandidate = await CandidateModel.create({
    full_name: safeName,
    email: normalizedEmail,
    phone: '',
    password_hash: null,
    email_verified: true,
  });

  if (avatarUrl) {
    await CandidateModel.upsertProfile(createdCandidate.id, { profilePictureUrl: avatarUrl });
  }

  return await CandidateModel.findById(createdCandidate.id);
};

const buildSocialLoginRedirect = (candidate, returnTo = '/dashboard', frontendBaseUrl = null) => {
  const payload = {
    id: candidate.id,
    fullName: candidate.full_name,
    email: candidate.email,
    phone: candidate.phone === '0000000000' ? '' : (candidate.phone || ''),
    profilePictureUrl: candidate.profile_picture_url || '',
    role: 'candidate',
  };

  const token = generateToken({
    id: candidate.id,
    email: candidate.email,
    role: 'candidate',
    name: candidate.full_name,
  });

  const code = crypto.randomBytes(24).toString('hex');
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const safeReturnTo = sanitizeReturnTo(returnTo, '/dashboard');

  oauthExchangeStore.set(codeHash, {
    token,
    user: payload,
    expiresAt: Date.now() + OAUTH_EXCHANGE_TTL_MS,
    used: false,
  });

  setTimeout(() => {
    const item = oauthExchangeStore.get(codeHash);
    if (item && !item.used) {
      oauthExchangeStore.delete(codeHash);
    }
  }, OAUTH_EXCHANGE_TTL_MS).unref();

  const baseUrl = (frontendBaseUrl || getFrontendUrl()).replace(/\/$/, '');
  const callbackUrl = new URL(`${baseUrl}/oauth/callback`);
  callbackUrl.searchParams.set('code', code);
  callbackUrl.searchParams.set('return_to', safeReturnTo);
  return callbackUrl.toString();
};

const exchangeOAuthCode = (code) => {
  if (!code || typeof code !== 'string') {
    return null;
  }

  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const exchange = oauthExchangeStore.get(codeHash);
  if (!exchange) {
    return null;
  }

  if (exchange.used) {
    oauthExchangeStore.delete(codeHash);
    return null;
  }

  if (Date.now() > exchange.expiresAt) {
    oauthExchangeStore.delete(codeHash);
    return null;
  }

  exchange.used = true;
  oauthExchangeStore.set(codeHash, exchange);

  return {
    token: exchange.token,
    user: exchange.user,
  };
};

const startGoogleOAuth = async (req, res) => {
  try {
    const { return_to } = req.query;
    const returnTo = sanitizeReturnTo(return_to, '/dashboard');

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in the backend .env file.',
      });
    }

    const frontendUrl = getFrontendUrl(req);
    const state = crypto.randomBytes(16).toString('hex');
    saveOAuthState('google', state, returnTo, frontendUrl);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_CALLBACK_URL);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    return res.redirect(authUrl.toString());
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to start Google OAuth. Please try again.',
      error: error.message,
    });
  }
};

const handleGoogleOAuthCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const currentState = typeof state === 'string' ? state : '';
    const savedState = currentState ? consumeOAuthState('google', currentState) : null;
    const returnTo = sanitizeReturnTo(savedState?.returnTo, '/dashboard');
    const frontendBaseUrl = savedState?.frontendUrl || getFrontendUrl(req);

    if (error) {
      return res.redirect(buildOAuthFailureRedirect(returnTo, 'Google sign-in was cancelled or rejected.', frontendBaseUrl));
    }

    if (!code || !currentState || !savedState) {
      return res.redirect(buildOAuthFailureRedirect(returnTo, 'Google OAuth request is invalid or expired. Please try again.', frontendBaseUrl));
    }

    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const accessToken = tokenResponse.data?.access_token;
    if (!accessToken) {
      throw new Error('Google OAuth token exchange did not return an access token.');
    }

    const profileResponse = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const profile = profileResponse.data || {};
    if (!profile.email) {
      return res.redirect(buildOAuthFailureRedirect(returnTo, 'Google did not provide a verified email address for sign-in.', frontendBaseUrl));
    }

    const candidate = await upsertCandidateFromSocialLogin({
      email: profile.email,
      fullName: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(' ') || profile.email.split('@')[0],
      avatarUrl: profile.picture || '',
    });

    return res.redirect(buildSocialLoginRedirect(candidate, returnTo, frontendBaseUrl));
  } catch (error) {
    console.error('Google OAuth callback failed:', error.response?.data || error.message);
    const fallbackFrontend = getFrontendUrl(req);
    return res.redirect(buildOAuthFailureRedirect('/login', 'Google sign-in failed. Please try again or use email/password login.', fallbackFrontend));
  }
};

/**
 * Get current authenticated user details (Candidate or Company)
 * GET /api/v1/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const { id, role } = req.user;

    if (role === 'candidate') {
      const candidate = await CandidateModel.findById(id);
      if (!candidate) {
        return res.status(404).json({ success: false, message: 'Candidate account not found.' });
      }
      return res.status(200).json({
        success: true,
        data: {
          id: candidate.id,
          name: candidate.full_name,
          email: candidate.email,
          phone: candidate.phone,
          role: 'candidate',
        },
      });
    }

    if (role === 'company') {
      const company = await CompanyModel.findById(id);
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company account not found.' });
      }
      return res.status(200).json({
        success: true,
        data: {
          id: company.id,
          name: company.company_name,
          companyType: company.company_type,
          email: company.email,
          phone: company.phone,
          website: company.website,
          gstin: company.gstin,
          verificationStatus: company.verification_status,
          role: 'company',
        },
      });
    }

    return res.status(400).json({ success: false, message: 'Unknown user role.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Email OTP
 * POST /api/v1/auth/verify-email-otp
 */
const verifyEmailOTP = async (req, res, next) => {
  try {
    const { email, role, otp } = req.body;

    // Basic validation
    if (!email || !role || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email, role, and OTP are required.',
      });
    }

    if (!['candidate', 'company'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role.',
      });
    }

    // Get OTP from temporary memory
    const otpRecord = getOTP(email, role);

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired or is invalid. Please request a new OTP.',
      });
    }

    // Check OTP
    if (otpRecord.otp !== otp.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check the OTP and try again.',
      });
    }

    // Verify the correct account
    let user;

    if (role === 'candidate') {
      user = await CandidateModel.findByEmail(email);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Candidate account not found.',
        });
      }

      user = await CandidateModel.verifyEmail(user.id);
    } else {
      user = await CompanyModel.findByEmail(email);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Company account not found.',
        });
      }

      user = await CompanyModel.verifyEmail(user.id);
    }

    // OTP can no longer be reused
    deleteOTP(email, role);

    // Send welcome email after successful verification
    try {
      await sendWelcomeEmail(
        user.email,
        role === 'candidate' ? user.full_name : user.company_name,
        role
      );
    } catch (emailError) {
      // Email failure should not undo successful account verification
      console.error('Welcome email could not be sent:', emailError.message);
    }

    // Generate JWT after successful verification
    const token = generateToken({
      id: user.id,
      email: user.email,
      role,
      name: role === 'candidate' ? user.full_name : user.company_name,
      ...(role === 'company' && {
        verification_status: user.verification_status,
      }),
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      data: {
        verificationRequired: false,
        token,
        user:
          role === 'candidate'
            ? {
              id: user.id,
              fullName: user.full_name,
              email: user.email,
              phone: user.phone,
              profilePictureUrl: user.profile_picture_url || '',
              role: 'candidate',
            }
            : {
              id: user.id,
              companyName: user.company_name,
              companyType: user.company_type,
              email: user.email,
              phone: user.phone,
              website: user.website,
              gstin: user.gstin,
              verificationStatus: user.verification_status,
              logoUrl: user.logo_url || '',
              profilePictureUrl: user.logo_url || '',
              role: 'company',
            },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend Email OTP
 * POST /api/v1/auth/resend-email-otp
 */
const resendEmailOTP = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required.',
      });
    }

    if (!['candidate', 'company'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role.',
      });
    }

    let user;

    if (role === 'candidate') {
      user = await CandidateModel.findByEmail(email);
    } else {
      user = await CompanyModel.findByEmail(email);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'This email address is already verified.',
      });
    }


    const otp = generateOTP();

    saveOTP(email, otp, {
      role,
      userId: user.id,
    });

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: 'A new OTP has been sent to your email address.',
    });
  } catch (error) {
    next(error);
  }
};

const exchangeOAuthCodeForSession = async (req, res, next) => {
  try {
    const { code } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'OAuth exchange code is required.',
      });
    }

    const exchange = exchangeOAuthCode(code);
    if (!exchange) {
      return res.status(410).json({
        success: false,
        message: 'Google sign-in session expired. Please try again.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        token: exchange.token,
        user: exchange.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request Password Reset OTP
 * POST /api/v1/auth/forgot-password
 */
const requestPasswordResetOTP = async (req, res, next) => {
  try {
    const { email, role } = req.body || {};

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email address and account type are required.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const validRole = String(role).trim().toLowerCase();

    if (!['candidate', 'company'].includes(validRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type. Must be candidate or company.',
      });
    }

    let user;
    if (validRole === 'candidate') {
      user = await CandidateModel.findByEmail(normalizedEmail);
    } else {
      user = await CompanyModel.findByEmail(normalizedEmail);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    const otp = generateOTP();
    saveOTP(normalizedEmail, otp, {
      role: validRole,
      purpose: 'password_reset',
      userId: user.id,
    });

    try {
      await sendPasswordResetOTPEmail(normalizedEmail, otp);
    } catch (emailError) {
      console.error('Password reset OTP email failed to send:', emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP has been sent to your email address.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Password Reset OTP
 * POST /api/v1/auth/verify-reset-otp
 */
const verifyPasswordResetOTP = async (req, res, next) => {
  try {
    const { email, role, otp } = req.body || {};

    if (!email || !role || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email, account type, and OTP code are required.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const validRole = String(role).trim().toLowerCase();
    const otpStr = String(otp).trim();

    if (!['candidate', 'company'].includes(validRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type.',
      });
    }

    const record = getOTP(normalizedEmail, validRole, 'password_reset');

    if (!record || record.otp !== otpStr) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please check the code and try again.',
      });
    }

    // Single-use guarantee: delete OTP immediately
    deleteOTP(normalizedEmail, validRole, 'password_reset');

    // Generate single-use reset token valid for 15 minutes
    const resetToken = crypto.randomBytes(32).toString('hex');
    saveResetToken(resetToken, {
      email: normalizedEmail,
      role: validRole,
      userId: record.userId,
    });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password with Verified Token
 * POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, role, resetToken, newPassword, confirmPassword } = req.body || {};

    if (!email || !role || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, account type, reset token, and new password are required.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const validRole = String(role).trim().toLowerCase();

    if (!['candidate', 'company'].includes(validRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    // Validate password rules: min 8 chars, 1 letter, 1 number, 1 special char (@#$&!)
    const passwordError = validatePasswordInput(newPassword);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    // Consume single-use reset token
    const tokenRecord = consumeResetToken(resetToken, normalizedEmail, validRole);
    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid, expired, or already used reset session. Please request a new OTP.',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    if (validRole === 'candidate') {
      await CandidateModel.updatePassword(tokenRecord.userId, passwordHash);
    } else {
      await CompanyModel.updatePassword(tokenRecord.userId, passwordHash);
    }

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUser,
  verifyEmailOTP,
  resendEmailOTP,
  startGoogleOAuth,
  handleGoogleOAuthCallback,
  exchangeOAuthCodeForSession,
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
  buildOAuthFailureRedirect,
  buildSocialLoginRedirect,
  buildFrontendDestination,
  buildEmailVerificationUrl,
  getFrontendUrl,
  sanitizeReturnTo,
};
