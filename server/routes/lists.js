const express = require('express');
const { List } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/lists
// @desc    Get all lists for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const lists = await List.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: lists.length,
      data: lists
    });
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({ error: 'Server error while fetching lists' });
  }
});

// @route   POST /api/lists
// @desc    Create a new list
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'List name is required' });
    }

    const list = new List({
      name: name.trim(),
      color: color || '#334155',
      user: req.user._id
    });

    await list.save();

    res.status(201).json({
      success: true,
      message: 'List created successfully',
      data: list
    });
  } catch (error) {
    console.error('Create list error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    res.status(500).json({ error: 'Server error while creating list' });
  }
});

// @route   PUT /api/lists/:id
// @desc    Update a list
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, color } = req.body;

    const list = await List.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'List name cannot be empty' });
      }
      list.name = name.trim();
    }

    if (color !== undefined) {
      list.color = color;
    }

    await list.save();

    res.json({
      success: true,
      message: 'List updated successfully',
      data: list
    });
  } catch (error) {
    console.error('Update list error:', error);
    res.status(500).json({ error: 'Server error while updating list' });
  }
});

// @route   DELETE /api/lists/:id
// @desc    Delete a list
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const list = await List.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Also delete all tasks in this list
    const { Task } = require('../models');
    await Task.deleteMany({ list: req.params.id, user: req.user._id });

    await List.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'List and all its tasks deleted successfully'
    });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({ error: 'Server error while deleting list' });
  }
});

// @route   PUT /api/lists/reorder
// @desc    Reorder lists (for drag & drop)
// @access  Private
router.put('/reorder', auth, async (req, res) => {
  try {
    const { listIds } = req.body;

    if (!Array.isArray(listIds)) {
      return res.status(400).json({ error: 'listIds must be an array' });
    }

    // Update positions for all lists
    const updatePromises = listIds.map((listId, index) => 
      List.findOneAndUpdate(
        { _id: listId, user: req.user._id },
        { position: index },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Lists reordered successfully'
    });
  } catch (error) {
    console.error('Reorder lists error:', error);
    res.status(500).json({ error: 'Server error while reordering lists' });
  }
});

module.exports = router;
