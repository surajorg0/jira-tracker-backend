const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      logger.warn(`Registration attempt with existing email: ${email}`);
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      password,
      phone,
      isApproved: false,
      role: 'user'
    });
    
    await user.save();
    
    logger.info(`New user registered: ${email}, awaiting approval`);
    res.status(201).json({ 
      msg: 'User registered successfully. Your account is pending approval from an administrator.' 
    });
  } catch (error) {
    logger.error('Registration error', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    // Check if user exists using email or phone
    let user;
    if (email) {
      user = await User.findOne({ email }).select('+password');
    } else if (phone) {
      user = await User.findOne({ phone }).select('+password');
    } else {
      logger.warn('Login attempt without email or phone');
      return res.status(400).json({ msg: 'Email or phone is required' });
    }
    
    if (!user) {
      logger.warn(`Login attempt with non-existent credentials: ${email || phone}`);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(`Failed login attempt for user: ${user.email}`);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Check if user is approved
    if (!user.isApproved) {
      logger.warn(`Login attempt by unapproved user: ${user.email}`);
      return res.status(403).json({ msg: 'Your account is pending approval' });
    }
    
    // Don't return the password
    user.password = undefined;
    
    logger.info(`User logged in: ${user.email}`);
    res.json({
      userId: user._id,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        phone: user.phone
      }
    });
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      logger.warn(`User not found: ${req.user._id}`);
      return res.status(404).json({ msg: 'User not found' });
    }
    
    logger.info(`User retrieved profile: ${user.email}`);
    res.json(user);
  } catch (error) {
    logger.error('Get profile error', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 