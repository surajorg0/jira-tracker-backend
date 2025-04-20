const Bug = require('../models/Bug');
const File = require('../models/File');
const Project = require('../models/Project');

// @route   POST /api/bugs
// @desc    Create a new bug
// @access  Private/TeamLead
exports.createBug = async (req, res) => {
  try {
    const { title, description, relatedToProject, assignedTo, severity } = req.body;
    
    // Check if project exists
    const project = await Project.findById(relatedToProject);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    const newBug = new Bug({
      title,
      description,
      relatedToProject,
      reportedBy: req.user._id,
      assignedTo,
      severity: severity || 'Medium'
    });
    
    const bug = await newBug.save();
    
    res.json(bug);
  } catch (err) {
    console.error('Create bug error', err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/bugs
// @desc    Get all bugs
// @access  Private
exports.getAllBugs = async (req, res) => {
  try {
    let bugs;
    
    // If admin or team lead, get all bugs
    if (req.user.role === 'admin' || req.user.role === 'teamlead') {
      bugs = await Bug.find()
        .populate('reportedBy', 'name')
        .populate('assignedTo', 'name')
        .populate('relatedToProject', 'title')
        .populate('attachments')
        .sort({ createdAt: -1 });
    } else {
      // If regular user, get only assigned bugs
      bugs = await Bug.find({ assignedTo: req.user._id })
        .populate('reportedBy', 'name')
        .populate('assignedTo', 'name')
        .populate('relatedToProject', 'title')
        .populate('attachments')
        .sort({ createdAt: -1 });
    }
    
    res.json(bugs);
  } catch (err) {
    console.error('Get all bugs error', err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/bugs/:id
// @desc    Get bug by ID
// @access  Private
exports.getBugById = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate('reportedBy', 'name')
      .populate('assignedTo', 'name')
      .populate('relatedToProject', 'title')
      .populate('attachments');
    
    if (!bug) {
      return res.status(404).json({ msg: 'Bug not found' });
    }
    
    // Check if user has access to this bug
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'teamlead' && 
      bug.assignedTo._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ msg: 'Not authorized to view this bug' });
    }
    
    res.json(bug);
  } catch (err) {
    console.error('Get bug by ID error', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Bug not found' });
    }
    
    res.status(500).send('Server error');
  }
};

// @route   PUT /api/bugs/:id
// @desc    Update bug
// @access  Private
exports.updateBug = async (req, res) => {
  try {
    const { title, description, assignedTo, status, severity } = req.body;
    
    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({ msg: 'Bug not found' });
    }
    
    // Check if status update is from assignee
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'teamlead' && 
      bug.assignedTo.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ msg: 'Not authorized to update this bug' });
    }
    
    // If regular user, only allow status update
    if (req.user.role === 'user') {
      bug.status = status;
    } else {
      // Team lead or admin can update everything
      if (title) bug.title = title;
      if (description) bug.description = description;
      if (assignedTo) bug.assignedTo = assignedTo;
      if (status) bug.status = status;
      if (severity) bug.severity = severity;
    }
    
    bug.updatedAt = Date.now();
    
    await bug.save();
    
    res.json(bug);
  } catch (err) {
    console.error('Update bug error', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Bug not found' });
    }
    
    res.status(500).send('Server error');
  }
};

// @route   DELETE /api/bugs/:id
// @desc    Delete a bug
// @access  Private/TeamLead
exports.deleteBug = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({ msg: 'Bug not found' });
    }
    
    // Only the reporter or admin can delete
    if (
      req.user.role !== 'admin' && 
      bug.reportedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ msg: 'Not authorized to delete this bug' });
    }
    
    // Remove associated files
    await File.deleteMany({ refType: 'bug', refId: bug._id });
    
    await bug.deleteOne();
    
    res.json({ msg: 'Bug removed' });
  } catch (err) {
    console.error('Delete bug error', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Bug not found' });
    }
    
    res.status(500).send('Server error');
  }
}; 