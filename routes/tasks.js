const express = require('express');
const router = express.Router();
const { 
  getAllTasks, 
  getMyTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  updateTaskStatus, 
  deleteTask 
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get all tasks (admin & team lead only)
router.get('/', protect, getAllTasks);

// Get current user's tasks
router.get('/me', protect, getMyTasks);

// Get task by ID
router.get('/:id', protect, getTaskById);

// Create new task (admin & team lead only)
router.post('/', protect, createTask);

// Update task
router.put('/:id', protect, updateTask);

// Update task status
router.put('/:id/status', protect, updateTaskStatus);

// Delete task
router.delete('/:id', protect, deleteTask);

module.exports = router; 