const express = require('express');
const router = express.Router();

const candidateRoutes = require('./candidateRoutes');
const companyRoutes = require('./companyRoutes');
const authRoutes = require('./authRoutes');
const jobRoutes = require('./jobRoutes');
const applicationRoutes = require('./applicationRoutes');
const {
  handleViewVerificationDocument,
  handleVerifyDocument,
  handleRejectDocumentPage,
  handleRejectDocumentSubmit,
} = require('../controllers/companyController');

// Root API Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'CareerForge Registration API',
    version: '1.0.0',
  });
});

// Primary Registration, Auth & Job Routes
router.use('/auth', authRoutes);
router.use('/candidates', candidateRoutes);
router.use('/companies', companyRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);

// The random, single-use token is the authentication mechanism for these
// deliberately public document-review links.
router.get('/doc-verification/:token/view', handleViewVerificationDocument);
router.get('/doc-verification/:token/verify', handleVerifyDocument);
router.get('/doc-verification/:token/reject', handleRejectDocumentPage);
router.post('/doc-verification/:token/reject', handleRejectDocumentSubmit);

module.exports = router;
