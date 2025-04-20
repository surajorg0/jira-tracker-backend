const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate, isTeamLead, isApproved, isManager } = require('../middleware/auth');

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private/Manager
router.post('/', authenticate, isApproved, isManager, projectController.createProject);

// @route   GET /api/projects
// @desc    Get all projects
// @access  Private/Approved
router.get('/', authenticate, isApproved, projectController.getAllProjects);

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private/Approved
router.get('/:id', authenticate, isApproved, projectController.getProjectById);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private/Manager
router.put('/:id', authenticate, isApproved, isManager, projectController.updateProject);

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private/Manager
router.delete('/:id', authenticate, isApproved, isManager, projectController.deleteProject);

module.exports = router; 