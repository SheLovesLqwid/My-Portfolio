const express = require('express');
const Audit = require('../models/Audit');
const { auth, authorize, logActivity } = require('../middleware/auth');
const { validateAudit } = require('../middleware/validation');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const audits = await Audit.find(filter)
      .populate('leadAuditor', 'firstName lastName email')
      .populate('auditTeam', 'firstName lastName email')
      .populate('auditees', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Audit.countDocuments(filter);

    res.json({
      audits,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get audits error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id)
      .populate('leadAuditor', 'firstName lastName email department')
      .populate('auditTeam', 'firstName lastName email department')
      .populate('auditees', 'firstName lastName email department')
      .populate('createdBy', 'firstName lastName email')
      .populate('findings.actionOwner', 'firstName lastName email');

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    res.json(audit);
  } catch (error) {
    console.error('Get audit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, authorize('Admin', 'Manager', 'Auditor'), validateAudit, logActivity('CREATE', 'Audit'), async (req, res) => {
  try {
    const lastAudit = await Audit.findOne().sort({ createdAt: -1 });
    const auditNumber = lastAudit ? parseInt(lastAudit.auditId.split('-')[1]) + 1 : 1;
    const auditId = `AUD-${auditNumber.toString().padStart(4, '0')}`;

    const audit = new Audit({
      ...req.body,
      auditId,
      createdBy: req.user._id
    });

    await audit.save();
    await audit.populate('leadAuditor', 'firstName lastName email');
    await audit.populate('auditTeam', 'firstName lastName email');
    await audit.populate('auditees', 'firstName lastName email');
    await audit.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Audit created successfully',
      audit
    });
  } catch (error) {
    console.error('Create audit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, authorize('Admin', 'Manager', 'Auditor'), logActivity('UPDATE', 'Audit'), async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id);
    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    Object.assign(audit, req.body);
    await audit.save();
    await audit.populate('leadAuditor', 'firstName lastName email');
    await audit.populate('auditTeam', 'firstName lastName email');
    await audit.populate('auditees', 'firstName lastName email');
    await audit.populate('createdBy', 'firstName lastName email');

    res.json({
      message: 'Audit updated successfully',
      audit
    });
  } catch (error) {
    console.error('Update audit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/findings', auth, authorize('Admin', 'Manager', 'Auditor'), logActivity('CREATE', 'Finding'), async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id);
    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    const findingNumber = audit.findings.length + 1;
    const findingId = `${audit.auditId}-F${findingNumber.toString().padStart(2, '0')}`;

    const finding = {
      ...req.body,
      findingId
    };

    audit.findings.push(finding);
    await audit.save();

    res.status(201).json({
      message: 'Finding added successfully',
      finding: audit.findings[audit.findings.length - 1]
    });
  } catch (error) {
    console.error('Add finding error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:auditId/findings/:findingId', auth, authorize('Admin', 'Manager', 'Auditor'), logActivity('UPDATE', 'Finding'), async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.auditId);
    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    const finding = audit.findings.id(req.params.findingId);
    if (!finding) {
      return res.status(404).json({ message: 'Finding not found' });
    }

    Object.assign(finding, req.body);
    await audit.save();

    res.json({
      message: 'Finding updated successfully',
      finding
    });
  } catch (error) {
    console.error('Update finding error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, authorize('Admin', 'Manager'), logActivity('DELETE', 'Audit'), async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id);
    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    await Audit.findByIdAndDelete(req.params.id);

    res.json({ message: 'Audit deleted successfully' });
  } catch (error) {
    console.error('Delete audit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalAudits = await Audit.countDocuments();
    const auditsByStatus = await Audit.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const auditsByType = await Audit.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const findingsStats = await Audit.aggregate([
      { $unwind: '$findings' },
      { $group: { _id: '$findings.status', count: { $sum: 1 } } }
    ]);

    const totalFindings = await Audit.aggregate([
      { $unwind: '$findings' },
      { $count: 'total' }
    ]);

    res.json({
      totalAudits,
      auditsByStatus,
      auditsByType,
      findingsStats,
      totalFindings: totalFindings[0]?.total || 0
    });
  } catch (error) {
    console.error('Audit stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
