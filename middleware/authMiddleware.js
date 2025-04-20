const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate users based on session
 */
exports.authenticate = asyncHandler(async (req, res, next) => {
  // Simple authentication based on a user ID stored in headers
  // Note: This is a simplified approach for demonstration purposes
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    logger.warn('No user ID provided in headers');
    res.status(401);
    throw new Error('Not authorized, no user ID');
  }
  
  try {
    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      logger.warn(`User not found for ID: ${userId}`);
      res.status(401);
      throw new Error('User not found');
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error', error);
    res.status(401);
    throw new Error('Not authorized');
  }
});

/**
 * Middleware to check if user is an admin
 */
exports.isAdmin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    logger.warn(`User ${req.user?._id} attempted to access admin-only resource`);
    res.status(403);
    throw new Error('Not authorized as admin');
  }
});

/**
 * Middleware to check if user is a team lead or admin
 */
exports.isManager = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'teamlead')) {
    next();
  } else {
    logger.warn(`User ${req.user?._id} attempted to access manager-only resource`);
    res.status(403);
    throw new Error('Not authorized as manager');
  }
});

/**
 * Middleware to check if user is approved
 */
exports.isApproved = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.isApproved) {
    next();
  } else {
    logger.warn(`Unapproved user ${req.user?._id} attempted to access protected resource`);
    res.status(403);
    throw new Error('Account not approved yet');
  }
}); 