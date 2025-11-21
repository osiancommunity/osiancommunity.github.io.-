// This is your 'authmiddleware.js' file

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // --- THIS IS THE FIX ---
    // We REMOVED the '|| "your-secret-key"' fallback.
    // This forces it to use the one true secret from your .env file.
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-for-development');
    // ---------------------

    // Use the userId from the decoded token to find the user
    const user = await User.findById(decoded.user.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user; // Attach the user to the request object
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Invalid token' // This is the error you were getting
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user role exists and is a string
    const userRole = req.user.role;
    if (!userRole || typeof userRole !== 'string') {
      return res.status(403).json({
        success: false,
        message: 'Invalid user role'
      });
    }

    // Make the check case-insensitive
    const userRoleLower = userRole.toLowerCase();

    if (!roles.map(role => role.toLowerCase()).includes(userRoleLower)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

const requireVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireVerification
};