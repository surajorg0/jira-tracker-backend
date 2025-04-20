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
const { authenticate, isManager, isApproved } = require('../middleware/authMiddleware');

// Get all tasks (admin & team lead only)
router.get('/', authenticate, isApproved, isManager, getAllTasks);

// Get current user's tasks
router.get('/me', authenticate, isApproved, getMyTasks);

// Get task by ID
router.get('/:id', authenticate, isApproved, getTaskById);

// Create new task (admin & team lead only)
router.post('/', authenticate, isApproved, isManager, createTask);

// Update task
router.put('/:id', authenticate, isApproved, updateTask);

// Update task status
router.put('/:id/status', authenticate, isApproved, updateTaskStatus);

// Delete task
router.delete('/:id', authenticate, isApproved, isManager, deleteTask);

module.exports = router; 