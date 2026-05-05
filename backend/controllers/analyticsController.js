const Task = require('../models/Task');

// @desc    Get analytics for logged-in user's tasks
// @route   GET /api/analytics
// @access  Private
const getAnalytics = async (req, res) => {
  try {
    // Get all tasks for logged-in user
    const tasks = await Task.find({ user: req.user.id });

    const totalTasks = tasks.length;

    // Completed tasks
    const completedTasks = tasks.filter(
      task => task.status === 'completed'
    ).length;

    // Pending = everything not completed
    const pendingTasks = tasks.filter(
      task => task.status !== 'completed'
    ).length;

    // Tasks completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasksCompletedToday = tasks.filter(task => {
      if (task.status !== 'completed') return false;

      const updatedDate = new Date(task.updatedAt);
      updatedDate.setHours(0, 0, 0, 0);

      return updatedDate.getTime() === today.getTime();
    }).length;

    // Category frequency
    const categoryFrequency = {};

    tasks.forEach(task => {
      const category = task.category || 'uncategorized';
      categoryFrequency[category] =
        (categoryFrequency[category] || 0) + 1;
    });

    // Most used category
    let mostUsedCategory = null;

    if (Object.keys(categoryFrequency).length > 0) {
      mostUsedCategory = Object.keys(categoryFrequency).reduce((a, b) =>
        categoryFrequency[a] > categoryFrequency[b] ? a : b
      );
    }

    // Completion rate
    const completionRate =
      totalTasks > 0
        ? ((completedTasks / totalTasks) * 100).toFixed(2) + '%'
        : '0%';

    // Response
    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      tasksCompletedToday,
      mostUsedCategory,
      completionRate,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnalytics,
};