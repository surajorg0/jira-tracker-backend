const Project = require('../models/Project');
const File = require('../models/File');

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private/TeamLead
exports.createProject = async (req, res) => {
  try {
    const { title, description, assignedTo } = req.body;
    
    const newProject = new Project({
      title,
      description,
      createdBy: req.user.id,
      assignedTo
    });
    
    const project = await newProject.save();
    
    res.json(project);
  } catch (err) {
    console.error('Create project error', err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/projects
// @desc    Get all projects
// @access  Private
exports.getAllProjects = async (req, res) => {
  try {
    let projects;
    
    // If admin or team lead, get all projects
    if (req.user.role === 'admin' || req.user.role === 'teamlead') {
      projects = await Project.find()
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name')
        .populate('attachments')
        .sort({ createdAt: -1 });
    } else {
      // If regular user, get only assigned projects
      projects = await Project.find({ assignedTo: req.user.id })
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name')
        .populate('attachments')
        .sort({ createdAt: -1 });
    }
    
    res.json(projects);
  } catch (err) {
    console.error('Get all projects error', err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .populate('attachments');
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    // Check if user has access to this project
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'teamlead' && 
      project.assignedTo._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Not authorized to view this project' });
    }
    
    res.json(project);
  } catch (err) {
    console.error('Get project by ID error', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    res.status(500).send('Server error');
  }
};

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private/TeamLead
exports.updateProject = async (req, res) => {
  try {
    const { title, description, assignedTo, status } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    // Check if status update is from assignee
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'teamlead' && 
      project.assignedTo.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Not authorized to update this project' });
    }
    
    // If regular user, only allow status update
    if (req.user.role === 'user') {
      project.status = status;
    } else {
      // Team lead or admin can update everything
      if (title) project.title = title;
      if (description) project.description = description;
      if (assignedTo) project.assignedTo = assignedTo;
      if (status) project.status = status;
    }
    
    project.updatedAt = Date.now();
    
    await project.save();
    
    res.json(project);
  } catch (err) {
    console.error('Update project error', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    res.status(500).send('Server error');
  }
};

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private/TeamLead
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    // Only the creator or admin can delete
    if (
      req.user.role !== 'admin' && 
      project.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Not authorized to delete this project' });
    }
    
    // Remove associated files
    await File.deleteMany({ refType: 'project', refId: project._id });
    
    await project.remove();
    
    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error('Delete project error', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    res.status(500).send('Server error');
  }
}; 