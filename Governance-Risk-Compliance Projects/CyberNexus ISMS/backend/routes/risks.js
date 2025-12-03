const express = require('express');
const Risk = require('../models/Risk');
const { auth, authorize, logActivity } = require('../middleware/auth');
const { validateRisk } = require('../middleware/validation');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, riskLevel, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const risks = await Risk.find(filter)
      .populate('owner', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Risk.countDocuments(filter);

    res.json({
      risks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get risks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const risk = await Risk.findById(req.params.id)
      .populate('owner', 'firstName lastName email department')
      .populate('createdBy', 'firstName lastName email');

    if (!risk) {
      return res.status(404).json({ message: 'Risk not found' });
    }

    res.json(risk);
  } catch (error) {
    console.error('Get risk error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, authorize('Admin', 'Manager', 'Auditor'), validateRisk, logActivity('CREATE', 'Risk'), async (req, res) => {
  try {
    const lastRisk = await Risk.findOne().sort({ createdAt: -1 });
    const riskNumber = lastRisk ? parseInt(lastRisk.riskId.split('-')[1]) + 1 : 1;
    const riskId = `RISK-${riskNumber.toString().padStart(4, '0')}`;

    const risk = new Risk({
      ...req.body,
      riskId,
      createdBy: req.user._id
    });

    await risk.save();
    await risk.populate('owner', 'firstName lastName email');
    await risk.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Risk created successfully',
      risk
    });
  } catch (error) {
    console.error('Create risk error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, authorize('Admin', 'Manager', 'Auditor'), validateRisk, logActivity('UPDATE', 'Risk'), async (req, res) => {
  try {
    const risk = await Risk.findById(req.params.id);
    if (!risk) {
      return res.status(404).json({ message: 'Risk not found' });
    }

    Object.assign(risk, req.body);
    await risk.save();
    await risk.populate('owner', 'firstName lastName email');
    await risk.populate('createdBy', 'firstName lastName email');

    res.json({
      message: 'Risk updated successfully',
      risk
    });
  } catch (error) {
    console.error('Update risk error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, authorize('Admin', 'Manager'), logActivity('DELETE', 'Risk'), async (req, res) => {
  try {
    const risk = await Risk.findById(req.params.id);
    if (!risk) {
      return res.status(404).json({ message: 'Risk not found' });
    }

    await Risk.findByIdAndDelete(req.params.id);

    res.json({ message: 'Risk deleted successfully' });
  } catch (error) {
    console.error('Delete risk error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalRisks = await Risk.countDocuments();
    const risksByLevel = await Risk.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);
    const risksByStatus = await Risk.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const risksByCategory = await Risk.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      totalRisks,
      risksByLevel,
      risksByStatus,
      risksByCategory
    });
  } catch (error) {
    console.error('Risk stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
