const Task = require('../models/Task');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private (Admin, Team Lead)
const getAllTasks = asyncHandler(async (req, res) => {
  try {
    // Admin and team leads can see all tasks
    if (['admin', 'teamlead'].includes(req.user.role)) {
      const tasks = await Task.find()
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name')
        .populate('project', 'title');
      
      logger.info(`Retrieved all ${tasks.length} tasks`);
      return res.status(200).json(tasks);
    }
    
    // Regular users should only see tasks assigned to them
    res.status(403).json({ msg: 'Not authorized to view all tasks' });
  } catch (error) {
    logger.error(`Error getting all tasks: ${error.message}`);
    res.status(500).json({ msg: error.message });
  }
});

// @desc    Get tasks assigned to current user
// @route   GET /api/tasks/me
// @access  Private
const getMyTasks = asyncHandler(async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .populate('project', 'title');
    
    logger.info(`Retrieved ${tasks.length} tasks for user ${req.user.id}`);
    res.status(200).json(tasks);
  } catch (error) {
    logger.error(`Error getting user tasks: ${error.message}`);
    res.status(500).json({ msg: error.message });
  }
});

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = asyncHandler(async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .populate('project', 'title');
    
    if (!task) {
      logger.warn(`Task not found with id ${req.params.id}`);
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check if user is authorized to view this task
    if (req.user.role === 'user' && task.assignedTo._id.toString() !== req.user.id) {
      logger.warn(`User ${req.user.id} not authorized to view task ${req.params.id}`);
      return res.status(403).json({ msg: 'Not authorized to view this task' });
    }
    
    logger.info(`Retrieved task ${req.params.id}`);
    res.status(200).json(task);
  } catch (error) {
    logger.error(`Error getting task ${req.params.id}: ${error.message}`);
    res.status(500).json({ msg: error.message });
  }
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin, Team Lead)
const createTask = asyncHandler(async (req, res) => {
  try {
    // Check authorization
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      logger.warn(`User ${req.user.id} not authorized to create tasks`);
      return res.status(403).json({ msg: 'Not authorized to create tasks' });
    }
    
    const { title, description, project, assignedTo, priority, dueDate } = req.body;
    
    // Validation
    if (!title || !description || !project || !assignedTo || !dueDate) {
      logger.warn('Missing required task fields');
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }
    
    // Create the task
    const task = await Task.create({
      title,
      description,
      project,
      assignedTo,
      assignedBy: req.user.id,
      priority: priority || 'medium',
      dueDate,
      status: 'todo'
    });
    
    // Populate references for response
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .populate('project', 'title');
    
    logger.info(`Created new task ${task._id}`);
    res.status(201).json(populatedTask);
  } catch (error) {
    logger.error(`Error creating task: ${error.message}`);
    res.status(500).json({ msg: error.message });
  }
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private (Admin, Team Lead, Task Owner)
const updateTask = asyncHandler(async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      logger.warn(`Task not found with id ${req.params.id}`);
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check authorization (only admin, team lead, or task creator can update)
    const isAuthorized = ['admin', 'teamlead'].includes(req.user.role) || 
                         task.assignedBy.toString() === req.user.id;
    
    if (!isAuthorized) {
      logger.warn(`User ${req.user.id} not authorized to update task ${req.params.id}`);
      return res.status(403).json({ msg: 'Not authorized to update this task' });
    }
    
    const { title, description, assignedTo, priority, dueDate } = req.body;
    
    // Update only provided fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    
    const updatedTask = await task.save();
    
    // Populate references for response
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .populate('project', 'title');
    
    logger.info(`Updated task ${req.params.id}`);
    res.status(200).json(populatedTask);
  } catch (error) {
    logger.error(`Error updating task ${req.params.id}: ${error.message}`);
    res.status(500).json({ msg: error.message });
  }
});

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private (Admin, Team Lead, Assigned User)
const updateTaskStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['todo', 'in-progress', 'done'].includes(status)) {
      logger.warn(`Invalid status value: ${status}`);
      return res.status(400).json({ msg: 'Invalid status value' });
    }
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      logger.warn(`Task not found with id ${req.params.id}`);
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check authorization (admin, team lead, creator, or assigned user can update status)
    const isAuthorized = ['admin', 'teamlead'].includes(req.user.role) || 
                         task.assignedBy.toString() === req.user.id ||
                         task.assignedTo.toString() === req.user.id;
    
    if (!isAuthorized) {
      logger.warn(`User ${req.user.id} not authorized to update status of task ${req.params.id}`);
      return res.status(403).json({ msg: 'Not authorized to update this task status' });
    }
    
    task.status = status;
    const updatedTask = await task.save();
    
    // Populate references for response
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .populate('project', 'title');
    
    logger.info(`Updated task ${req.params.id} status to ${status}`);
    res.status(200).json(populatedTask);
  } catch (error) {
    logger.error(`Error updating task status ${req.params.id}: ${error.message}`);
    res.status(500).json({ msg: error.message });
  }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin, Team Lead, Task Owner)
const deleteTask = asyncHandler(async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      logger.warn(`Task not found with id ${req.params.id}`);
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check authorization (only admin, team lead, or task creator can delete)
    const isAuthorized = ['admin', 'teamlead'].includes(req.user.role) || 
                         task.assignedBy.toString() === req.user.id;
    
    if (!isAuthorized) {
      logger.warn(`User ${req.user.id} not authorized to delete task ${req.params.id}`);
      return res.status(403).json({ msg: 'Not authorized to delete this task' });
    }
    
    await task.deleteOne();
    
    logger.info(`Deleted task ${req.params.id}`);
    res.status(200).json({ msg: 'Task deleted' });
  } catch (error) {
    logger.error(`Error deleting task ${req.params.id}: ${error.message}`);
    res.status(500).json({ msg: error.message });
  }
});

module.exports = {
  getAllTasks,
  getMyTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask
}; 