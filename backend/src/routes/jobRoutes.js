const express = require('express');
const router = express.Router();
const {
  getAllJobs,
  getJobById,
  createJob,
  getCompanyJobs,
  updateJob,
  toggleJobStatus,
  deleteJob,
} = require('../controllers/jobController');
const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware');

// Soft auth middleware to attach req.user if token is provided in public routes
const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const { verifyToken } = require('../utils/tokenUtils');
      const token = authHeader.split(' ')[1];
      req.user = verifyToken(token);
    } catch (e) {
      // Ignored for public routes
    }
  }
  next();
};

// Public / Candidate job listing routes
router.get('/', optionalAuthenticateToken, getAllJobs);

// Protected Company Job Management Routes (Must come BEFORE /:id parameter route!)
router.get('/company/me', authenticateToken, authorizeRoles('company'), getCompanyJobs);
router.post('/', authenticateToken, authorizeRoles('company'), createJob);
router.put('/:id', authenticateToken, authorizeRoles('company'), updateJob);
router.patch('/:id/status', authenticateToken, authorizeRoles('company'), toggleJobStatus);
router.delete('/:id', authenticateToken, authorizeRoles('company'), deleteJob);

// Single Job Details route
router.get('/:id', optionalAuthenticateToken, getJobById);

module.exports = router;
