const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getCandidateApplications,
  getCompanyApplications,
  getCandidateFullProfileForCompany,
  updateApplicationStatus,
  withdrawApplication,
} = require('../controllers/applicationController');
const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware');

// Candidate Application Routes
router.post('/', authenticateToken, authorizeRoles('candidate'), applyForJob);
router.get('/me', authenticateToken, authorizeRoles('candidate'), getCandidateApplications);
router.delete('/:id', authenticateToken, authorizeRoles('candidate'), withdrawApplication);

// Company Application Management Routes
router.get('/company/me', authenticateToken, authorizeRoles('company'), getCompanyApplications);
router.get('/candidate-profile/:candidateId', authenticateToken, authorizeRoles('company'), getCandidateFullProfileForCompany);
router.patch('/:id/status', authenticateToken, authorizeRoles('company'), updateApplicationStatus);

module.exports = router;
