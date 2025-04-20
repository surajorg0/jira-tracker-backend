const express = require('express');
const router = express.Router();
const { authenticate, isApproved, isManager } = require('../middleware/authMiddleware');
const { 
  getAllBugs,
  getBugById,
  createBug,
  updateBug,
  deleteBug
} = require('../controllers/bugController');

// @route   GET /api/bugs
// @desc    Get all bugs
// @access  Private
router.get('/', authenticate, isApproved, getAllBugs);

// @route   GET /api/bugs/:id
// @desc    Get bug by ID
// @access  Private
router.get('/:id', authenticate, isApproved, getBugById);

// @route   POST /api/bugs
// @desc    Create a new bug
// @access  Private
router.post('/', authenticate, isApproved, createBug);

// @route   PUT /api/bugs/:id
// @desc    Update a bug
// @access  Private
router.put('/:id', authenticate, isApproved, updateBug);

// @route   DELETE /api/bugs/:id
// @desc    Delete a bug
// @access  Private/Manager
router.delete('/:id', authenticate, isApproved, isManager, deleteBug);

module.exports = router; 