import express from 'express';
import { User } from '../Database/index.js';
import { isAuthenticated, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get current authenticated user's profile
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: err.message });
  }
});

// Admin: list all users
router.get('/', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list users', error: err.message });
  }
});

// Admin: get a user by id
router.get('/:id', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: err.message });
  }
});

// Admin: update a user's role
router.put('/:id/role', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.role = role;
    await user.save();
    const sanitized = user.toJSON();
    delete sanitized.password;
    delete sanitized.resetPasswordToken;
    delete sanitized.resetPasswordExpire;
    res.status(200).json({ success: true, user: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update role', error: err.message });
  }
});

// Admin: delete a user
router.delete('/:id', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await user.destroy();
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: err.message });
  }
});

export default router;


