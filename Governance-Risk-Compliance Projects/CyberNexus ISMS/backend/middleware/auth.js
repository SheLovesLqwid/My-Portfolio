const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const rateLimit = require('express-rate-limit');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        await logSecurityEvent(req, 'AUTH_FAILED', 'No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp - now < 300) {
      await logSecurityEvent(req, 'TOKEN_NEAR_EXPIRY', 'Token expires soon');
    }

    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      await logSecurityEvent(req, 'AUTH_FAILED', 'User not found');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (!user.isActive) {
      await logSecurityEvent(req, 'AUTH_FAILED', 'Inactive user attempted access', user._id);
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    if (user.failedLoginAttempts >= 5) {
      await logSecurityEvent(req, 'ACCOUNT_LOCKED', 'Too many failed attempts', user._id);
      return res.status(423).json({ message: 'Account temporarily locked due to suspicious activity' });
    }

    user.lastActivity = new Date();
    user.lastIP = req.ip;
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      await logSecurityEvent(req, 'TOKEN_EXPIRED', 'Expired token used');
      return res.status(401).json({ message: 'Token has expired' });
    } else if (error.name === 'JsonWebTokenError') {
      await logSecurityEvent(req, 'TOKEN_INVALID', 'Invalid token format');
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    await logSecurityEvent(req, 'AUTH_ERROR', error.message);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

const logSecurityEvent = async (req, event, details, userId = null) => {
  try {
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

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

const logActivity = (action, resource) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        await AuditLog.create({
          userId: req.user._id,
          action,
          resource,
          resourceId: req.params.id || req.body.id,
          details: {
            method: req.method,
            url: req.originalUrl,
            body: req.method !== 'GET' ? req.body : undefined
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
    next();
  };
};

module.exports = { auth, authorize, logActivity };
