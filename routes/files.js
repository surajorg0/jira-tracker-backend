const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   POST /api/files/upload/:type/:id
// @desc    Upload a file (type can be 'project' or 'bug')
// @access  Private
router.post('/upload/:type/:id', authenticate, upload.single('file'), fileController.uploadFile);

// @route   GET /api/files/:id
// @desc    Get file by ID
// @access  Private
router.get('/:id', authenticate, fileController.getFileById);

// @route   DELETE /api/files/:id
// @desc    Delete a file
// @access  Private
router.delete('/:id', authenticate, fileController.deleteFile);

module.exports = router; 