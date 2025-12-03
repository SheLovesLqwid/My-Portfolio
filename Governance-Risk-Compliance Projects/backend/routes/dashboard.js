const express = require('express');
const Risk = require('../models/Risk');
const SoA = require('../models/SoA');
const Audit = require('../models/Audit');
const Policy = require('../models/Policy');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
  try {
    const totalRisks = await Risk.countDocuments();
    const highRisks = await Risk.countDocuments({ riskLevel: { $in: ['High', 'Critical'] } });
    const openRisks = await Risk.countDocuments({ status: 'Open' });
    
    const totalControls = await SoA.countDocuments({ applicability: 'Applicable' });
    const implementedControls = await SoA.countDocuments({ 
      applicability: 'Applicable', 
      implementationStatus: 'Implemented' 
    });
    const compliancePercentage = totalControls > 0 ? 
      Math.round((implementedControls / totalControls) * 100) : 0;

    const totalAudits = await Audit.countDocuments();
    const activeAudits = await Audit.countDocuments({ status: { $in: ['Planned', 'In Progress'] } });
    
    const totalFindings = await Audit.aggregate([
      { $unwind: '$findings' },
      { $count: 'total' }
    ]);
    
    const openFindings = await Audit.aggregate([
      { $unwind: '$findings' },
      { $match: { 'findings.status': { $in: ['Open', 'In Progress'] } } },
      { $count: 'total' }
    ]);

    const totalPolicies = await Policy.countDocuments();
    const publishedPolicies = await Policy.countDocuments({ status: 'Published' });
    const upcomingReviews = await Policy.countDocuments({
      nextReviewDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    });

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    const riskTrend = await Risk.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    const risksByCategory = await Risk.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const risksByLevel = await Risk.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);

    res.json({
      overview: {
        totalRisks,
        highRisks,
        openRisks,
        compliancePercentage,
        totalAudits,
        activeAudits,
        totalFindings: totalFindings[0]?.total || 0,
        openFindings: openFindings[0]?.total || 0,
        totalPolicies,
        publishedPolicies,
        upcomingReviews,
        totalUsers,
        activeUsers
      },
      charts: {
        riskTrend,
        risksByCategory,
        risksByLevel
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/recent-activities', auth, async (req, res) => {
  try {
    const recentRisks = await Risk.find()
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('riskId title riskLevel status createdAt createdBy');

    const recentAudits = await Audit.find()
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('auditId title type status createdAt createdBy');

    const recentPolicies = await Policy.find()
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('policyId title status createdAt createdBy');

    const activities = [
      ...recentRisks.map(risk => ({
        type: 'Risk',
        id: risk.riskId,
        title: risk.title,
        status: risk.status,
        level: risk.riskLevel,
        createdAt: risk.createdAt,
        createdBy: risk.createdBy
      })),
      ...recentAudits.map(audit => ({
        type: 'Audit',
        id: audit.auditId,
        title: audit.title,
        status: audit.status,
        level: audit.type,
        createdAt: audit.createdAt,
        createdBy: audit.createdBy
      })),
      ...recentPolicies.map(policy => ({
        type: 'Policy',
        id: policy.policyId,
        title: policy.title,
        status: policy.status,
        level: null,
        createdAt: policy.createdAt,
        createdBy: policy.createdBy
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    res.json({ activities });
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/alerts', auth, async (req, res) => {
  try {
    const criticalRisks = await Risk.find({ riskLevel: 'Critical', status: { $ne: 'Closed' } })
      .populate('owner', 'firstName lastName')
      .select('riskId title riskLevel owner reviewDate');

    const overdueRisks = await Risk.find({ 
      reviewDate: { $lt: new Date() },
      status: { $ne: 'Closed' }
    })
      .populate('owner', 'firstName lastName')
      .select('riskId title owner reviewDate');

    const upcomingAudits = await Audit.find({
      plannedStartDate: { 
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      status: 'Planned'
    })
      .populate('leadAuditor', 'firstName lastName')
      .select('auditId title plannedStartDate leadAuditor');

    const policyReviews = await Policy.find({
      nextReviewDate: { 
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      status: 'Published'
    })
      .populate('owner', 'firstName lastName')
      .select('policyId title nextReviewDate owner');

    const openFindings = await Audit.aggregate([
      { $unwind: '$findings' },
      { $match: { 'findings.status': { $in: ['Open', 'In Progress'] } } },
      { $lookup: { from: 'users', localField: 'findings.actionOwner', foreignField: '_id', as: 'actionOwner' } },
      { $project: {
        auditId: 1,
        'findings.findingId': 1,
        'findings.title': 1,
        'findings.severity': 1,
        'findings.targetDate': 1,
        'findings.status': 1,
        actionOwner: { $arrayElemAt: ['$actionOwner', 0] }
      }},
      { $limit: 10 }
    ]);

    res.json({
      criticalRisks,
      overdueRisks,
      upcomingAudits,
      policyReviews,
      openFindings
    });
  } catch (error) {
    console.error('Dashboard alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
