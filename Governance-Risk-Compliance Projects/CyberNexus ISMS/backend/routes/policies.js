const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Policy = require('../models/Policy');
const { auth, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/policies');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const policies = await Policy.find(filter)
      .populate('owner', 'firstName lastName email')
      .populate('approver', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Policy.countDocuments(filter);

    res.json({
      policies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id)
      .populate('owner', 'firstName lastName email department')
      .populate('approver', 'firstName lastName email department')
      .populate('createdBy', 'firstName lastName email')
      .populate('relatedPolicies', 'title version status');

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    res.json(policy);
  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, authorize('Admin', 'Manager'), upload.single('file'), logActivity('CREATE', 'Policy'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Policy file is required' });
    }

    const lastPolicy = await Policy.findOne().sort({ createdAt: -1 });
    const policyNumber = lastPolicy ? parseInt(lastPolicy.policyId.split('-')[1]) + 1 : 1;
    const policyId = `POL-${policyNumber.toString().padStart(4, '0')}`;

    const policy = new Policy({
      ...req.body,
      policyId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      createdBy: req.user._id
    });

    await policy.save();
    await policy.populate('owner', 'firstName lastName email');
    await policy.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Policy created successfully',
      policy
    });
  } catch (error) {
    console.error('Create policy error:', error);
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, authorize('Admin', 'Manager'), upload.single('file'), logActivity('UPDATE', 'Policy'), async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    if (req.file) {
      if (fs.existsSync(policy.filePath)) {
        fs.unlinkSync(policy.filePath);
      }
      
      policy.fileName = req.file.originalname;
      policy.filePath = req.file.path;
      policy.fileSize = req.file.size;
      policy.mimeType = req.file.mimetype;
    }

    Object.assign(policy, req.body);
    await policy.save();
    await policy.populate('owner', 'firstName lastName email');
    await policy.populate('approver', 'firstName lastName email');
    await policy.populate('createdBy', 'firstName lastName email');

    res.json({
      message: 'Policy updated successfully',
      policy
    });
  } catch (error) {
    console.error('Update policy error:', error);
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/download', auth, async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    if (!fs.existsSync(policy.filePath)) {
      return res.status(404).json({ message: 'Policy file not found' });
    }

    res.download(policy.filePath, policy.fileName);
  } catch (error) {
    console.error('Download policy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, authorize('Admin', 'Manager'), logActivity('DELETE', 'Policy'), async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    if (fs.existsSync(policy.filePath)) {
      fs.unlinkSync(policy.filePath);
    }

    await Policy.findByIdAndDelete(req.params.id);

    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Delete policy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalPolicies = await Policy.countDocuments();
    const policiesByStatus = await Policy.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const policiesByCategory = await Policy.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const upcomingReviews = await Policy.countDocuments({
      nextReviewDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalPolicies,
      policiesByStatus,
      policiesByCategory,
      upcomingReviews
    });
  } catch (error) {
    console.error('Policy stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
