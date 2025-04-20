const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, isAdmin, isApproved } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const { uploadProfilePicture, deleteProfilePicture } = require('../utils/fileUpload');

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', authenticate, isApproved, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    logger.info(`Retrieved all users: ${users.length}`);
    res.json(users);
  } catch (error) {
    logger.error('Error getting all users', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/users/pending
// @desc    Get pending users
// @access  Private/Admin
router.get('/pending', authenticate, isApproved, isAdmin, async (req, res) => {
  try {
    const pendingUsers = await User.find({ isApproved: false }).select('-password');
    logger.info(`Retrieved pending users: ${pendingUsers.length}`);
    res.json(pendingUsers);
  } catch (error) {
    logger.error('Error getting pending users', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/users/:id/approve
// @desc    Approve a user
// @access  Private/Admin
router.put('/:id/approve', authenticate, isApproved, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-password');
    
    if (!user) {
      logger.warn(`User not found for approval: ${req.params.id}`);
      return res.status(404).json({ msg: 'User not found' });
    }
    
    logger.info(`User approved: ${user.email}`);
    res.json(user);
  } catch (error) {
    logger.error(`Error approving user ${req.params.id}`, error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/users/:id/reject
// @desc    Reject/Delete a user
// @access  Private/Admin
router.put('/:id/reject', authenticate, isApproved, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      logger.warn(`User not found for rejection: ${req.params.id}`);
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Delete profile picture if exists
    if (user.profilePicture && user.profilePicture !== 'default-avatar.png') {
      deleteProfilePicture(user.profilePicture);
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    logger.info(`User rejected and deleted: ${user.email}`);
    res.json({ msg: 'User rejected and removed' });
  } catch (error) {
    logger.error(`Error rejecting user ${req.params.id}`, error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', authenticate, isApproved, async (req, res) => {
  try {
    // Make sure the user can only update their own profile (unless admin)
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      logger.warn(`User ${req.user._id} attempted to update another user's profile: ${req.params.id}`);
      return res.status(403).json({ msg: 'Not authorized to update this profile' });
    }
    
    const { name, email, phone } = req.body;
    const updateData = { name, email, phone };
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!user) {
      logger.warn(`User not found: ${req.params.id}`);
      return res.status(404).json({ msg: 'User not found' });
    }
    
    logger.info(`User profile updated: ${user.email}`);
    res.json(user);
  } catch (error) {
    logger.error(`Error updating user profile ${req.params.id}`, error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/users/:id/profile-picture
// @desc    Upload profile picture
// @access  Private
router.post('/:id/profile-picture', authenticate, isApproved, (req, res) => {
  try {
    // Make sure the user can only update their own profile picture (unless admin)
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      logger.warn(`User ${req.user._id} attempted to update another user's profile picture: ${req.params.id}`);
      return res.status(403).json({ msg: 'Not authorized to update this profile picture' });
    }
    
    uploadProfilePicture(req, res, async (err) => {
      if (err) {
        logger.error(`File upload error: ${err.message}`);
        return res.status(400).json({ msg: err.message });
      }
      
      if (!req.file) {
        logger.warn('No file was uploaded');
        return res.status(400).json({ msg: 'Please upload a file' });
      }
      
      try {
        // Get the current user to find the old profile picture
        const user = await User.findById(req.params.id);
        
        if (!user) {
          logger.warn(`User not found: ${req.params.id}`);
          return res.status(404).json({ msg: 'User not found' });
        }
        
        // Delete old profile picture if it's not the default
        if (user.profilePicture && user.profilePicture !== 'default-avatar.png') {
          deleteProfilePicture(user.profilePicture);
        }
        
        // Update the user's profile picture field with the new filename
        const updatedUser = await User.findByIdAndUpdate(
          req.params.id,
          { profilePicture: req.file.filename },
          { new: true }
        ).select('-password');
        
        logger.info(`Profile picture updated for user: ${updatedUser.email}`);
        res.json({
          msg: 'Profile picture uploaded successfully',
          user: updatedUser
        });
      } catch (error) {
        logger.error(`Error updating profile picture in database: ${error.message}`);
        res.status(500).json({ msg: 'Server error while updating profile picture' });
      }
    });
  } catch (error) {
    logger.error(`Error in profile picture upload route: ${error.message}`);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticate, isApproved, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      logger.warn(`User not found: ${req.params.id}`);
      return res.status(404).json({ msg: 'User not found' });
    }
    
    logger.info(`Retrieved user: ${user.email}`);
    res.json(user);
  } catch (error) {
    logger.error(`Error getting user ${req.params.id}`, error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 