const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const securityEvents = await AuditLog.aggregate([
      {
        $match: {
          action: 'SECURITY_EVENT',
          createdAt: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: '$resource',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const failedLogins = await AuditLog.aggregate([
      {
        $match: {
          resource: 'AUTH_FAILED',
          createdAt: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 },
          lastAttempt: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const activeUsers = await User.countDocuments({
      lastActivity: { $gte: last24Hours }
    });

    const lockedAccounts = await User.countDocuments({
      failedLoginAttempts: { $gte: 5 }
    });

    const userActivities = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days },
          userId: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$userId',
          activityCount: { $sum: 1 },
          lastActivity: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          email: '$user.email',
          activityCount: 1,
          lastActivity: 1
        }
      },
      { $sort: { activityCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      securityEvents,
      failedLogins,
      activeUsers,
      lockedAccounts,
      userActivities,
      generatedAt: now
    });
  } catch (error) {
    console.error('Security dashboard error:', error);
    res.status(500).json({ message: 'Failed to generate security dashboard' });
  }
});

// Get security logs with filtering
router.get('/logs', auth, authorize('Admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      resource,
      userId,
      startDate,
      endDate,
      ipAddress
    } = req.query;

    const filter = {};
    
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (userId) filter.userId = userId;
    if (ipAddress) filter.ipAddress = ipAddress;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Security logs error:', error);
    res.status(500).json({ message: 'Failed to retrieve security logs' });
  }
});

// Unlock user account
router.post('/unlock-account/:userId', auth, authorize('Admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.failedLoginAttempts = 0;
    user.accountLockedUntil = undefined;
    await user.save();

    // Log the unlock action
    await AuditLog.create({
      userId: req.user._id,
      action: 'ADMIN_ACTION',
      resource: 'ACCOUNT_UNLOCK',
      resourceId: userId,
      details: {
        targetUser: user.email,
        adminUser: req.user.email
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Account unlocked successfully' });
  } catch (error) {
    console.error('Account unlock error:', error);
    res.status(500).json({ message: 'Failed to unlock account' });
  }
});

// Get system health metrics
router.get('/health', auth, authorize('Admin'), async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Database connection status
    const dbStatus = require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected';

    // Error rate in last 24 hours
    const errorLogs = await AuditLog.countDocuments({
      createdAt: { $gte: last24Hours },
      'details.statusCode': { $gte: 400 }
    });

    const totalRequests = await AuditLog.countDocuments({
      createdAt: { $gte: last24Hours }
    });

    const errorRate = totalRequests > 0 ? (errorLogs / totalRequests) * 100 : 0;

    // Memory usage
    const memoryUsage = process.memoryUsage();

    res.json({
      status: 'healthy',
      database: dbStatus,
      errorRate: Math.round(errorRate * 100) / 100,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      uptime: Math.round(process.uptime()),
      timestamp: now
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    });
  }
});

module.exports = router;
