const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, logActivity } = require('../middleware/auth');
const { validateUser, validateLogin } = require('../middleware/validation');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

router.post('/register', validateUser, logActivity('CREATE', 'User'), async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: role || 'User',
      department
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      await logSecurityEvent(req, 'AUTH_FAILED', `Failed login attempt for email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      await user.save();
      
      await logSecurityEvent(req, 'AUTH_FAILED', `Invalid password for user: ${email}`, user._id);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    user.lastActivity = new Date();
    user.lastIP = req.ip;
    await user.save();

    const token = generateToken(user._id);

    await logSecurityEvent(req, 'LOGIN_SUCCESS', `Successful login for user: ${email}`, user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    await logSecurityEvent(req, 'LOGIN_ERROR', `Login error: ${error.message}`);
    res.status(500).json({ message: 'Server error during login' });
  }
});

const logSecurityEvent = async (req, event, details, userId = null) => {
  try {
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      userId: userId,
      action: 'SECURITY_EVENT',
      resource: event,
      details: {
        event,
        details,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Security logging error:', error);
  }
};

router.get('/profile', auth, async (req, res) => {
  try {
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', auth, logActivity('UPDATE', 'User'), async (req, res) => {
  try {
    const { firstName, lastName, department } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (department) user.department = department;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
