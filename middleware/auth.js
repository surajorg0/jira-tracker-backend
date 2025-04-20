const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_custom_secure_jwt_secret_key_2024');
    
    // Add user from payload
    const user = await User.findById(decoded.user.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }
    
    // Allow unapproved users to be authenticated but pass approval status to the request
    // This allows the routes to decide how to handle unapproved users
    req.user = user;
    req.isApproved = user.isApproved;
    
    next();
  } catch (err) {
    console.error('Auth middleware error', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Middleware to check if user is approved
exports.isApproved = (req, res, next) => {
  if (req.user && (req.user.isApproved || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ msg: 'Your account is pending approval' });
  }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Admin access denied' });
  }
};

// Middleware to check if user is team lead
exports.isTeamLead = (req, res, next) => {
  if (req.user && (req.user.role === 'teamlead' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ msg: 'Team lead access denied' });
  }
};

// Middleware to check if user is manager (admin or team lead)
exports.isManager = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'teamlead')) {
    next();
  } else {
    res.status(403).json({ msg: 'Manager access denied' });
  }
}; 