const express = require('express');
const router = express.Router();
const {
  registerCompany,
  loginCompany,
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyLogo,
  uploadVerificationDocument,
  getCompanyDocumentFile,
  deleteVerificationDocument,
  submitForVerification,
  updateVerificationStatus,
  verifyCompanyPincode,
} = require('../controllers/companyController');
const {
  validateCompanyReq,
  validateLoginReq,
} = require('../middleware/validationMiddleware');
const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware');
const {
  uploadLogo,
  uploadDocument,
} = require('../middleware/uploadMiddleware');

// Public routes
router.post('/register', validateCompanyReq, registerCompany);
router.post('/login', validateLoginReq, loginCompany);

// Protected company routes
router.get('/me', authenticateToken, authorizeRoles('company'), getCompanyProfile);
router.get('/profile', authenticateToken, authorizeRoles('company'), getCompanyProfile);
router.put('/profile', authenticateToken, authorizeRoles('company'), updateCompanyProfile);

// Company Logo & Document Uploads
router.post('/profile/logo', authenticateToken, authorizeRoles('company'), uploadLogo.single('logo'), uploadCompanyLogo);
router.post('/profile/documents', authenticateToken, authorizeRoles('company'), uploadDocument.single('document'), uploadVerificationDocument);
router.get('/profile/documents/:docId/view', authenticateToken, authorizeRoles('company'), getCompanyDocumentFile);
router.delete('/profile/documents/:docId', authenticateToken, authorizeRoles('company'), deleteVerificationDocument);
router.post('/profile/submit-verification', authenticateToken, authorizeRoles('company'), submitForVerification);

// Public route to verify Pincode
router.post('/verify-pincode', verifyCompanyPincode);

// Admin route to verify company
router.patch('/:id/verify', authenticateToken, authorizeRoles('admin'), updateVerificationStatus);

module.exports = router;

