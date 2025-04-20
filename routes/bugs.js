const express = require('express');
const router = express.Router();
const bugController = require('../controllers/bugController');
const { authenticate, isTeamLead } = require('../middleware/auth');

// @route   POST /api/bugs
// @desc    Create a new bug
// @access  Private/TeamLead
router.post('/', authenticate, isTeamLead, bugController.createBug);

// @route   GET /api/bugs
// @desc    Get all bugs
// @access  Private
router.get('/', authenticate, bugController.getAllBugs);

// @route   GET /api/bugs/:id
// @desc    Get bug by ID
// @access  Private
router.get('/:id', authenticate, bugController.getBugById);

// @route   PUT /api/bugs/:id
// @desc    Update bug
// @access  Private
router.put('/:id', authenticate, bugController.updateBug);

// @route   DELETE /api/bugs/:id
// @desc    Delete a bug
// @access  Private/TeamLead
router.delete('/:id', authenticate, isTeamLead, bugController.deleteBug);

module.exports = router; 