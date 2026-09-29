const express = require('express');

const router = express.Router();

const {
    getCurrentUser,
    verifyEmailOTP,
    resendEmailOTP,
    startGoogleOAuth,
    handleGoogleOAuthCallback,
    exchangeOAuthCodeForSession,
    requestPasswordResetOTP,
    verifyPasswordResetOTP,
    resetPassword,
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/authMiddleware');

// Get current authenticated user session (Candidate or Company)
router.get('/me', authenticateToken, getCurrentUser);

// Verify email using OTP
router.post('/verify-email-otp', verifyEmailOTP);

// Resend email verification OTP
router.post('/resend-email-otp', resendEmailOTP);

// Password Reset Flow (Candidate & Company)
router.post('/forgot-password', requestPasswordResetOTP);
router.post('/verify-reset-otp', verifyPasswordResetOTP);
router.post('/reset-password', resetPassword);

// Social OAuth flows for candidate sign-in/sign-up
router.get('/google', startGoogleOAuth);
router.get('/google/callback', handleGoogleOAuthCallback);
router.post('/oauth/exchange', exchangeOAuthCodeForSession);

module.exports = router;