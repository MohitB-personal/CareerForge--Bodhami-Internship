/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found - [${req.method}] ${req.originalUrl}`,
  });
};

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('🔥 Server Error Stack:', err.stack || err);

  const isFileTooLarge = err.code === 'LIMIT_FILE_SIZE';
  const statusCode = isFileTooLarge ? 400 : (err.statusCode || 500);
  const message = isFileTooLarge
    ? 'File size must be 5 MB or less.'
    : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
