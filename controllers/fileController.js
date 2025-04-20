const File = require('../models/File');
const Project = require('../models/Project');
const Bug = require('../models/Bug');
const fs = require('fs');
const path = require('path');

// @route   POST /api/files/upload/:type/:id
// @desc    Upload a file (type can be 'project' or 'bug')
// @access  Private
exports.uploadFile = async (req, res) => {
  try {
    const { type, id } = req.params;
    
    // Validate type
    if (type !== 'project' && type !== 'bug') {
      return res.status(400).json({ msg: 'Invalid reference type' });
    }
    
    // Check if project/bug exists
    let reference;
    if (type === 'project') {
      reference = await Project.findById(id);
    } else {
      reference = await Bug.findById(id);
    }
    
    if (!reference) {
      // Delete uploaded file if reference not found
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ msg: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` });
    }
    
    // Check if user has access (admin, team lead, or assigned user)
    const isAuthorized = 
      req.user.role === 'admin' || 
      req.user.role === 'teamlead' || 
      reference.assignedTo.toString() === req.user.id;
    
    if (!isAuthorized) {
      // Delete uploaded file if not authorized
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ msg: 'Not authorized to upload files to this resource' });
    }
    
    // Create file record
    const newFile = new File({
      fileName: req.file.originalname,
      filePath: req.file.path,
      uploadedBy: req.user.id,
      refType: type,
      refId: id
    });
    
    await newFile.save();
    
    // Add file reference to project/bug
    reference.attachments.push(newFile._id);
    await reference.save();
    
    res.json(newFile);
  } catch (err) {
    console.error('File upload error', err.message);
    
    // Delete uploaded file if error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).send('Server error');
  }
};

// @route   GET /api/files/:id
// @desc    Get file by ID
// @access  Private
exports.getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploadedBy', 'name');
    
    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }
    
    // Check reference to see if user has access
    let reference;
    if (file.refType === 'project') {
      reference = await Project.findById(file.refId);
    } else {
      reference = await Bug.findById(file.refId);
    }
    
    if (!reference) {
      return res.status(404).json({ msg: 'Referenced resource not found' });
    }
    
    // Check if user has access (admin, team lead, or assigned user)
    const isAuthorized = 
      req.user.role === 'admin' || 
      req.user.role === 'teamlead' || 
      reference.assignedTo.toString() === req.user.id ||
      (file.refType === 'bug' && reference.reportedBy.toString() === req.user.id);
    
    if (!isAuthorized) {
      return res.status(403).json({ msg: 'Not authorized to access this file' });
    }
    
    res.json(file);
  } catch (err) {
    console.error('Get file error', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'File not found' });
    }
    
    res.status(500).send('Server error');
  }
};

// @route   DELETE /api/files/:id
// @desc    Delete a file
// @access  Private
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }
    
    // Check if user is authorized (admin, team lead, or file uploader)
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'teamlead' && 
      file.uploadedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Not authorized to delete this file' });
    }
    
    // Remove file reference from project/bug
    if (file.refType === 'project') {
      await Project.findByIdAndUpdate(
        file.refId,
        { $pull: { attachments: file._id } }
      );
    } else {
      await Bug.findByIdAndUpdate(
        file.refId,
        { $pull: { attachments: file._id } }
      );
    }
    
    // Delete physical file
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }
    
    await file.remove();
    
    res.json({ msg: 'File removed' });
  } catch (err) {
    console.error('Delete file error', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'File not found' });
    }
    
    res.status(500).send('Server error');
  }
}; 