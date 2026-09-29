const express = require('express');
const router = express.Router();
const {
  registerCandidate,
  loginCandidate,
  getCandidateProfile,
  updateCandidateProfile,
  uploadCandidateProfilePicture,
  completeCandidateProfile,
  getCandidateDashboardData,
} = require('../controllers/candidateController');
const {
  validateCandidateReq,
  validateLoginReq,
} = require('../middleware/validationMiddleware');
const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware');
const { uploadProfilePicture } = require('../middleware/uploadMiddleware');
const {
  checkResumeProfileReadiness,
  getResumeTemplates,
  generateResume,
  saveResume,
  uploadResume,
  getSavedResumes,
  getSavedResume,
  deleteSavedResume,
  downloadResumePdf,
  getUploadedResumeFile,
} = require('../controllers/resumeController');
const { uploadResumePdf } = require('../middleware/uploadMiddleware');

// Public routes
router.post('/register', validateCandidateReq, registerCandidate);
router.post('/login', validateLoginReq, loginCandidate);

// Protected candidate routes
router.get('/me', authenticateToken, authorizeRoles('candidate'), getCandidateProfile);
router.get('/profile', authenticateToken, authorizeRoles('candidate'), getCandidateProfile);
router.put('/profile', authenticateToken, authorizeRoles('candidate'), updateCandidateProfile);
router.post('/profile/picture', authenticateToken, authorizeRoles('candidate'), uploadProfilePicture.single('picture'), uploadCandidateProfilePicture);
router.post('/profile/complete', authenticateToken, authorizeRoles('candidate'), completeCandidateProfile);
router.get('/dashboard', authenticateToken, authorizeRoles('candidate'), getCandidateDashboardData);

// Resume Builder routes (protected — candidate only)
router.get('/resume/profile-check', authenticateToken, authorizeRoles('candidate'), checkResumeProfileReadiness);
router.get('/resume/templates', authenticateToken, authorizeRoles('candidate'), getResumeTemplates);
router.post('/resume/generate', authenticateToken, authorizeRoles('candidate'), generateResume);
router.post('/resume', authenticateToken, authorizeRoles('candidate'), saveResume);
// Upload an existing PDF resume (strictly PDF, size-validated by multer)
router.post('/resume/upload', authenticateToken, authorizeRoles('candidate'), uploadResumePdf.single('resume'), uploadResume);
router.get('/resume', authenticateToken, authorizeRoles('candidate'), getSavedResumes);
router.get('/resume/:id', authenticateToken, authorizeRoles('candidate'), getSavedResume);
router.delete('/resume/:id', authenticateToken, authorizeRoles('candidate'), deleteSavedResume);
router.get('/resume/:id/pdf', authenticateToken, authorizeRoles('candidate'), downloadResumePdf);
// Stream the original uploaded PDF (?disposition=inline for preview)
router.get('/resume/:id/file', authenticateToken, authorizeRoles('candidate'), getUploadedResumeFile);

module.exports = router;

