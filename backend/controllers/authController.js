import { User } from '../Database/index.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import emailService from '../services/emailService.js';

const sendToken = (user, res, message = 'Success', statusCode = 200) => {
  const token = user.getJWTToken();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
  res.status(statusCode).cookie('token', token, options).json({ success: true, message, token });
};

export class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email and password are required' });
      }
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
      const user = await User.create({ name, email, password });
      
      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(email, name);
        console.log('Welcome email sent to:', email);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError.message);
        // Don't fail registration if email fails
      }
      
      sendToken(user, res, 'Registered successfully', 201);
    } catch (err) {
      res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });
      sendToken(user, res, 'Logged in');
    } catch (err) {
      res.status(500).json({ success: false, message: 'Login failed', error: err.message });
    }
  }

  static async logout(req, res) {
    res.cookie('token', '', { expires: new Date(0), httpOnly: true, sameSite: 'lax' });
    res.status(200).json({ success: true, message: 'Logged out' });
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      
      const resetToken = user.getResetPasswordToken();
      await user.save();
      
      // Send password reset email
      try {
        const emailResult = await emailService.sendPasswordResetEmail(email, resetToken, user.name);
        console.log('Password reset email sent successfully');
        console.log('Preview URL:', emailResult.previewUrl);
        
        res.status(200).json({ 
          success: true, 
          message: 'Password reset email sent successfully',
          previewUrl: emailResult.previewUrl // For testing purposes
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        
        // Clear the reset token if email fails
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();
        
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send password reset email', 
          error: emailError.message 
        });
      }
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to generate reset token', error: err.message });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      if (!password) return res.status(400).json({ success: false, message: 'Password is required' });

      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const user = await User.findOne({ where: { resetPasswordToken: hashedToken } });
      if (!user) return res.status(400).json({ success: false, message: 'Invalid token' });
      if (user.resetPasswordExpire && user.resetPasswordExpire < new Date()) {
        return res.status(400).json({ success: false, message: 'Token expired' });
      }
      user.password = password;
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();
      sendToken(user, res, 'Password reset successful');
    } catch (err) {
      res.status(500).json({ success: false, message: 'Password reset failed', error: err.message });
    }
  }

  static async getMe(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
      });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      res.status(200).json({ success: true, user });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to get user info', error: err.message });
    }
  }
}


