const express = require('express');
const { Task, List } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tasks/list/:listId
// @desc    Get all tasks for a specific list
// @access  Private
router.get('/list/:listId', auth, async (req, res) => {
  try {
    console.log('🔍 Getting tasks for list:', req.params.listId);
    console.log('🔍 User ID:', req.user._id);

    // Verify list belongs to user
    const list = await List.findOne({ 
      _id: req.params.listId, 
      user: req.user._id 
    });

    if (!list) {
      console.log('❌ List not found or doesn\'t belong to user:', req.params.listId);
      return res.status(404).json({ error: 'List not found' });
    }

    const tasks = await Task.find({ 
      list: req.params.listId, 
      user: req.user._id 
    }).sort({ position: 1, createdAt: 1 });

    console.log('✅ Found', tasks.length, 'tasks for list:', req.params.listId);

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('❌ Get tasks error:', error);
    res.status(500).json({ error: 'Server error while fetching tasks' });
  }
});

// @route   GET /api/tasks/my-tasks
// @desc    Get all tasks for the authenticated user
// @access  Private
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ 
      user: req.user._id 
    }).populate('list', 'name').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({ error: 'Server error while fetching tasks' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, listId, deadline, priority } = req.body;

    console.log('📝 Creating task:', { name, listId, deadline, priority });
    console.log('👤 User ID:', req.user._id);

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Task name is required' });
    }

    if (!listId) {
      return res.status(400).json({ error: 'List ID is required' });
    }

    // Verify list belongs to user
    const list = await List.findOne({ 
      _id: listId, 
      user: req.user._id 
    });

    if (!list) {
      console.log('❌ List not found for task creation:', listId);
      return res.status(404).json({ error: 'List not found' });
    }

    // Get the highest position for proper ordering
    const lastTask = await Task.findOne({ 
      list: listId, 
      user: req.user._id 
    }).sort({ position: -1 });
    
    const position = lastTask ? lastTask.position + 1 : 0;

    const task = new Task({
      name: name.trim(),
      list: listId,
      user: req.user._id,
      position,
      deadline: deadline || null,
      priority: priority || 'medium',
      completed: false
    });

    await task.save();

    console.log('✅ Task created successfully:', task._id);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('❌ Create task error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid list ID format' });
    }

    res.status(500).json({ error: 'Server error while creating task' });
  }
});

// @route   POST /api/tasks/new
// @desc    Create a new task (alternative endpoint)
// @access  Private
router.post('/new', auth, async (req, res) => {
  try {
    const { name, listId, deadline, priority, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Task name is required' });
    }

    if (!listId) {
      return res.status(400).json({ error: 'List ID is required' });
    }

    // Verify list belongs to user
    const list = await List.findOne({ 
      _id: listId, 
      user: req.user._id 
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const task = new Task({
      name: name.trim(),
      description: description || '',
      list: listId,
      user: req.user._id,
      deadline: deadline || null,
      priority: priority || 'medium',
      completed: false
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error while creating task' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, completed, deadline, priority, listId, description } = req.body;

    console.log('🔧 Backend: Updating task', req.params.id);
    console.log('🔧 Backend: Request body:', req.body);
    console.log('🔧 Backend: User ID:', req.user._id);

    const task = await Task.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!task) {
      console.log('❌ Backend: Task not found or doesn\'t belong to user');
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('✅ Backend: Task found, updating...');

    // Update all fields
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Task name cannot be empty' });
      }
      task.name = name.trim();
    }

    if (description !== undefined) {
      task.description = description;
    }

    if (completed !== undefined) {
      task.completed = completed;
    }

    if (deadline !== undefined) {
      task.deadline = deadline;
    }

    if (priority !== undefined) {
      task.priority = priority;
    }

    if (listId !== undefined) {
      // Verify the new list belongs to user
      const newList = await List.findOne({ 
        _id: listId, 
        user: req.user._id 
      });

      if (!newList) {
        return res.status(404).json({ error: 'Target list not found' });
      }

      console.log('🔄 Backend: Updating task list from', task.list, 'to', listId);
      task.list = listId;
    }

    await task.save();

    console.log('✅ Backend: Task updated successfully');
    console.log('✅ Backend: Updated task list field:', task.list);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('❌ Backend: Update task error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }

    res.status(500).json({ error: 'Server error while updating task' });
  }
});

// @route   PATCH /api/tasks/:id
// @desc    Update a task (alternative method)
// @access  Private
router.patch('/:id', auth, async (req, res) => {
  try {
    const updates = req.body;
    
    const task = await Task.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        task[key] = updates[key];
      }
    });

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Patch task error:', error);
    res.status(500).json({ error: 'Server error while updating task' });
  }
});

// @route   PUT /api/tasks/:id/toggle
// @desc    Toggle task completion status
// @access  Private
router.put('/:id/toggle', auth, async (req, res) => {
  try {
    console.log('🔄 Toggling task completion:', req.params.id);

    const task = await Task.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.completed = !task.completed;
    await task.save();

    console.log('✅ Task completion toggled:', task.completed);

    res.json({
      success: true,
      message: `Task marked as ${task.completed ? 'completed' : 'incomplete'}`,
      data: task
    });
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ error: 'Server error while toggling task' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('🗑️ Deleting task:', req.params.id);

    const task = await Task.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    console.log('✅ Task deleted successfully');

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error while deleting task' });
  }
});

// @route   PUT /api/tasks/reorder
// @desc    Reorder tasks (for drag & drop)
// @access  Private
router.put('/reorder', auth, async (req, res) => {
  try {
    const { taskIds, sourceListId, destinationListId } = req.body;

    console.log('🔄 Reordering tasks:', { taskIds, sourceListId, destinationListId });

    if (!Array.isArray(taskIds)) {
      return res.status(400).json({ error: 'taskIds must be an array' });
    }

    // Verify both lists belong to user
    const listIds = [sourceListId, destinationListId].filter(Boolean);
    const uniqueListIds = [...new Set(listIds)];
    
    const lists = await List.find({ 
      _id: { $in: uniqueListIds },
      user: req.user._id 
    });

    if (lists.length !== uniqueListIds.length) {
      return res.status(404).json({ error: 'One or more lists not found' });
    }

    // Update positions for all tasks
    const updatePromises = taskIds.map((taskId, index) => 
      Task.findOneAndUpdate(
        { _id: taskId, user: req.user._id },
        { 
          position: index,
          list: destinationListId 
        },
        { new: true }
      )
    );

    const updatedTasks = await Promise.all(updatePromises);

    console.log('✅ Tasks reordered successfully');

    res.json({
      success: true,
      message: 'Tasks reordered successfully',
      data: updatedTasks.filter(Boolean)
    });
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({ error: 'Server error while reordering tasks' });
  }
});

// @route   GET /api/tasks/search
// @desc    Search tasks by name
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    const tasks = await Task.find({
      user: req.user._id,
      name: searchRegex
    }).populate('list', 'name').sort({ createdAt: -1 });

    res.json({
      success: true,
      query: q.trim(),
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Search tasks error:', error);
    res.status(500).json({ error: 'Server error during search' });
  }
});

module.exports = router;
