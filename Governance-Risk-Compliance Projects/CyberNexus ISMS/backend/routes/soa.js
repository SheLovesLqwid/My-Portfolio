const express = require('express');
const SoA = require('../models/SoA');
const { auth, authorize, logActivity } = require('../middleware/auth');
const { validateSoA } = require('../middleware/validation');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, applicability, implementationStatus, sortBy = 'controlId', sortOrder = 'asc' } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (applicability) filter.applicability = applicability;
    if (implementationStatus) filter.implementationStatus = implementationStatus;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const controls = await SoA.find(filter)
      .populate('responsibleOwner', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SoA.countDocuments(filter);

    res.json({
      controls,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get SoA controls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const control = await SoA.findById(req.params.id)
      .populate('responsibleOwner', 'firstName lastName email department')
      .populate('createdBy', 'firstName lastName email');

    if (!control) {
      return res.status(404).json({ message: 'Control not found' });
    }

    res.json(control);
  } catch (error) {
    console.error('Get SoA control error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, authorize('Admin', 'Manager', 'Auditor'), validateSoA, logActivity('CREATE', 'SoA'), async (req, res) => {
  try {
    const existingControl = await SoA.findOne({ controlId: req.body.controlId });
    if (existingControl) {
      return res.status(400).json({ message: 'Control with this ID already exists' });
    }

    const control = new SoA({
      ...req.body,
      createdBy: req.user._id
    });

    await control.save();
    await control.populate('responsibleOwner', 'firstName lastName email');
    await control.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Control created successfully',
      control
    });
  } catch (error) {
    console.error('Create SoA control error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, authorize('Admin', 'Manager', 'Auditor'), validateSoA, logActivity('UPDATE', 'SoA'), async (req, res) => {
  try {
    const control = await SoA.findById(req.params.id);
    if (!control) {
      return res.status(404).json({ message: 'Control not found' });
    }

    if (req.body.controlId && req.body.controlId !== control.controlId) {
      const existingControl = await SoA.findOne({ controlId: req.body.controlId });
      if (existingControl) {
        return res.status(400).json({ message: 'Control with this ID already exists' });
      }
    }

    Object.assign(control, req.body);
    await control.save();
    await control.populate('responsibleOwner', 'firstName lastName email');
    await control.populate('createdBy', 'firstName lastName email');

    res.json({
      message: 'Control updated successfully',
      control
    });
  } catch (error) {
    console.error('Update SoA control error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, authorize('Admin', 'Manager'), logActivity('DELETE', 'SoA'), async (req, res) => {
  try {
    const control = await SoA.findById(req.params.id);
    if (!control) {
      return res.status(404).json({ message: 'Control not found' });
    }

    await SoA.findByIdAndDelete(req.params.id);

    res.json({ message: 'Control deleted successfully' });
  } catch (error) {
    console.error('Delete SoA control error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalControls = await SoA.countDocuments();
    const applicableControls = await SoA.countDocuments({ applicability: 'Applicable' });
    const implementedControls = await SoA.countDocuments({ implementationStatus: 'Implemented' });
    const partiallyImplementedControls = await SoA.countDocuments({ implementationStatus: 'Partially Implemented' });
    
    const controlsByCategory = await SoA.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const implementationStats = await SoA.aggregate([
      { $group: { _id: '$implementationStatus', count: { $sum: 1 } } }
    ]);

    const compliancePercentage = applicableControls > 0 ? 
      Math.round((implementedControls / applicableControls) * 100) : 0;

    res.json({
      totalControls,
      applicableControls,
      implementedControls,
      partiallyImplementedControls,
      compliancePercentage,
      controlsByCategory,
      implementationStats
    });
  } catch (error) {
    console.error('SoA stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
