const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin, isApproved } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', authenticate, isApproved, isAdmin, userController.getAllUsers);

// @route   GET /api/users/pending
// @desc    Get all pending users
// @access  Private/Admin
router.get('/pending', authenticate, isApproved, isAdmin, userController.getPendingUsers);

// @route   PUT /api/users/:id/approve
// @desc    Approve a user
// @access  Private/Admin
router.put('/:id/approve', authenticate, isApproved, isAdmin, userController.approveUser);

// @route   PUT /api/users/:id/reject
// @desc    Reject a user (delete)
// @access  Private/Admin
router.put('/:id/reject', authenticate, isApproved, isAdmin, userController.rejectUser);

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', authenticate, isApproved, userController.updateUserProfile);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticate, isApproved, userController.getUserById);

module.exports = router; 