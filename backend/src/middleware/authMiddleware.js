const { verifyToken } = require('../utils/tokenUtils');

/**
 * Protect routes requiring JWT authentication
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. ' + error.message,
    });
  }
};

/**
 * Middleware factory to authorize specific roles
 * @param  {...String} roles Allowed roles ('candidate', 'company', 'admin')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication context missing.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource. Required: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
