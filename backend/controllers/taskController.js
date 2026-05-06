const Task = require('../models/Task');

const calculatePriority = (task) => {
  // Completed tasks have no priority
  if (task.status === 'completed') return 0;

  const now = new Date();
  const deadline = new Date(task.deadline);
  const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24);

  if (daysUntilDeadline < 0) return 1000;
  if (daysUntilDeadline <= 1) return 100;
  if (daysUntilDeadline <= 3) return 75;
  if (daysUntilDeadline <= 7) return 50;
  return 10;
};

const createTask = async (req, res) => {
  const { title, description, category, status, deadline } = req.body;

  if (!title || !deadline) {
    return res.status(400).json({ message: 'Please provide title and deadline' });
  }

  try {
    const count = await Task.countDocuments();
    const taskId = `TASK-${count + 1}`;

    const task = await Task.create({
      user: req.user.id,
      taskId,
      title,
      description,
      category,
      status,
      deadline,
    });

    const io = req.app.get('io');
    if (io) io.emit('task-changed');

    res.status(201).json(task);
  } catch (error) {
    console.error('CREATE TASK ERROR:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });

    const sortedTasks = tasks
      .map((task) => ({
        ...task.toObject(),
        priorityScore: calculatePriority(task),
      }))
      .sort((a, b) => {
        // 0. Completed tasks always go to bottom
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (b.status === 'completed' && a.status !== 'completed') return -1;

        // 1. Sort by priority score descending
        if (b.priorityScore !== a.priorityScore)
          return b.priorityScore - a.priorityScore;

        // 2. Nearest deadline first
        const deadlineDiff = new Date(a.deadline) - new Date(b.deadline);
        if (deadlineDiff !== 0) return deadlineDiff;

        // 3. Earlier created first
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

    res.json(sortedTasks);
  } catch (error) {
    console.error('GET TASKS ERROR:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    const io = req.app.get('io');
    if (io) io.emit('task-changed');

    res.json(updatedTask);
  } catch (error) {
    console.error('UPDATE TASK ERROR:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Task.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) io.emit('task-changed');

    res.json({ message: 'Task removed' });
  } catch (error) {
    console.error('DELETE TASK ERROR:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};