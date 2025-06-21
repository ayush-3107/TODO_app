const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'List name is required'],
    trim: true,
    maxlength: [100, 'List name cannot exceed 100 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#334155' // Default color matching your UI
  }
}, {
  timestamps: true
});

// Index for faster queries
listSchema.index({ user: 1, position: 1 });

module.exports = mongoose.model('List', listSchema);
