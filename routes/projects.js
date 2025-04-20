const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { authenticate, isManager, isApproved } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// @route   GET /api/projects
// @desc    Get all projects
// @access  Private
router.get('/', authenticate, isApproved, async (req, res) => {
  try {
    let projects;

    // If admin or team lead, get all projects
    if (req.user.role === 'admin' || req.user.role === 'teamlead') {
      projects = await Project.find()
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name');
    } else {
      // If regular user, get only assigned projects
      projects = await Project.find({ assignedTo: req.user._id })
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name');
    }

    logger.info(`Retrieved ${projects.length} projects for user ${req.user._id}`);
    res.json(projects);
  } catch (error) {
    logger.error('Error getting projects', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', authenticate, isApproved, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name');

    if (!project) {
      logger.warn(`Project not found: ${req.params.id}`);
      return res.status(404).json({ msg: 'Project not found' });
    }

    logger.info(`Retrieved project: ${req.params.id}`);
    res.json(project);
  } catch (error) {
    logger.error(`Error getting project ${req.params.id}`, error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private/Manager
router.post('/', authenticate, isApproved, isManager, async (req, res) => {
  try {
    const { title, description, assignedTo } = req.body;
    
    const newProject = new Project({
      title,
      description,
      createdBy: req.user._id,
      assignedTo
    });

    const project = await newProject.save();
    
    logger.info(`Created new project: ${project._id}`);
    res.json(project);
  } catch (error) {
    logger.error('Error creating project', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private/Manager
router.delete('/:id', authenticate, isApproved, isManager, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      logger.warn(`Project not found for deletion: ${req.params.id}`);
      return res.status(404).json({ msg: 'Project not found' });
    }

    await project.deleteOne();
    
    logger.info(`Deleted project: ${req.params.id}`);
    res.json({ msg: 'Project removed' });
  } catch (error) {
    logger.error(`Error deleting project ${req.params.id}`, error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 