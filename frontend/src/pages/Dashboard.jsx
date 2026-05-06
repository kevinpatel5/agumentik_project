import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTasks,
  createTask,
  deleteTask,
  updateTask,
} from '../redux/slices/taskSlice';
import { fetchAnalytics } from '../redux/slices/analyticsSlice';
import { logout } from '../redux/slices/authSlice';
import socket from '../socket';

import './Dashboard.css';

const Dashboard = () => {
  const dispatch = useDispatch();

  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const { stats } = useSelector((state) => state.analytics);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    deadline: '',
  });

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchAnalytics());
  }, [dispatch]);

  useEffect(() => {
    socket.on('task-changed', () => {
      dispatch(fetchTasks());
      dispatch(fetchAnalytics());
    });
    return () => socket.off('task-changed');
  }, [dispatch]);

  const handleLogout = () => dispatch(logout());

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline) return;
    await dispatch(createTask(formData));
    dispatch(fetchAnalytics());
    setFormData({ title: '', description: '', category: '', deadline: '' });
  };

  const handleStatusChange = async (task, newStatus) => {
    await dispatch(updateTask({ id: task._id, taskData: { status: newStatus } }));
    dispatch(fetchAnalytics());
  };

  const handleDelete = async (id) => {
    await dispatch(deleteTask(id));
    dispatch(fetchAnalytics());
  };

  const isOverdue = (deadline) => new Date(deadline) < new Date();
  const isHighPriority = (score) => score >= 75;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Task Manager</h2>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      {stats && (
        <div className="analytics-grid">
          <div className="card"><h4>Total Tasks</h4><p>{stats.totalTasks}</p></div>
          <div className="card"><h4>Completed</h4><p>{stats.completedTasks}</p></div>
          <div className="card"><h4>Pending</h4><p>{stats.pendingTasks}</p></div>
          <div className="card"><h4>Completed Today</h4><p>{stats.tasksCompletedToday}</p></div>
          <div className="card"><h4>Top Category</h4><p>{stats.mostUsedCategory || 'N/A'}</p></div>
          <div className="card"><h4>Completion Rate</h4><p>{stats.completionRate}</p></div>
        </div>
      )}

      <div className="task-form card">
        <h3>Add Task</h3>
        <form onSubmit={handleSubmit}>
          <input name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
          <input name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
          <input name="category" placeholder="Category" value={formData.category} onChange={handleChange} />
          <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} required />
          <button type="submit" className="primary-btn">Add Task</button>
        </form>
      </div>

      {loading && <p className="info">Loading...</p>}
      {error && <p className="error">{error}</p>}

      <div className="task-grid">
        {tasks.map((task) => {
          // FIX 1 — completed tasks never show overdue or high priority
          const overdue = isOverdue(task.deadline) && task.status !== 'completed';
          const highPriority = isHighPriority(task.priorityScore) && task.status !== 'completed';

          return (
            <div
              className={`task-card card ${overdue ? 'overdue' : ''} ${highPriority && !overdue ? 'high-priority' : ''}`}
              key={task._id}
            >
              {overdue && <span className="badge badge-overdue">⚠ OVERDUE</span>}
              {highPriority && !overdue && <span className="badge badge-high">🔥 HIGH PRIORITY</span>}

              {/* FIX 2 — show auto-generated taskId */}
              <span className="task-id-badge">{task.taskId || '—'}</span>
              <h4>{task.title}</h4>
              <p>{task.description}</p>

              <div className="task-meta">
                <span className={`status ${task.status}`}>{task.status}</span>
                <span>{task.category || 'general'}</span>
              </div>

              <p className="priority-score">Priority: {task.priorityScore ?? 0}</p>

              <p className="deadline">{new Date(task.deadline).toLocaleDateString()}</p>

              <div className="task-actions">
                <button onClick={() => handleStatusChange(task, 'pending')}>Pending</button>
                <button onClick={() => handleStatusChange(task, 'in-progress')}>Progress</button>
                <button onClick={() => handleStatusChange(task, 'completed')}>Done</button>
              </div>

              <button className="delete-btn" onClick={() => handleDelete(task._id)}>Delete</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;