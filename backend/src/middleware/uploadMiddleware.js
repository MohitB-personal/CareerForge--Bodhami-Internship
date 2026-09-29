const multer = require('multer');
const path = require('path');

// In-Memory Storage Engine (prevents creating files/directories on disk)
const memoryStorage = multer.memoryStorage();

// File Filters
const profileImageFilter = (req, file, cb) => {
  const allowedMimeTypes = {
    '.png': ['image/png'],
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.webp': ['image/webp'],
  };
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes[ext]?.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Only JPG, JPEG, PNG, and WebP images are allowed.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const documentFilter = (req, file, cb) => {
  const allowedMimeTypes = {
    '.pdf': ['application/pdf'],
    '.png': ['image/png'],
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
  };
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes[ext]?.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Only PDF, JPG, JPEG, and PNG files are allowed for verification.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const uploadLogo = multer({
  storage: memoryStorage,
  fileFilter: profileImageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

const uploadProfilePicture = multer({
  storage: memoryStorage,
  fileFilter: profileImageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

const uploadDocument = multer({
  storage: memoryStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// Candidate resume uploads — strictly PDF only.
// Matches the project-wide 5 MB maximum file size.
const RESUME_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const resumePdfFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.pdf' && file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    const error = new Error('Only PDF files are allowed.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const uploadResumePdf = multer({
  storage: memoryStorage,
  fileFilter: resumePdfFilter,
  limits: { fileSize: RESUME_MAX_FILE_SIZE_BYTES },
});

module.exports = {
  uploadLogo,
  uploadProfilePicture,
  uploadDocument,
  uploadResumePdf,
  RESUME_MAX_FILE_SIZE_BYTES,
};
