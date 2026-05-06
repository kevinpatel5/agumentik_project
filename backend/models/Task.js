const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: String,
    unique: true,
    sparse: true,   // ← allows old tasks without taskId to coexist
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  category: String,
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  deadline: {
    type: Date,
    required: true
  },
  priorityScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// REMOVED pre-save hook — taskId is now generated in controller

module.exports = mongoose.model('Task', taskSchema);