const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  policyId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Information Security Policy',
      'Access Control Policy',
      'Acceptable Use Policy',
      'Data Classification Policy',
      'Incident Response Policy',
      'Business Continuity Policy',
      'Risk Management Policy',
      'Supplier Security Policy',
      'HR Security Policy',
      'Asset Management Policy'
    ]
  },
  version: {
    type: String,
    required: true,
    default: '1.0'
  },
  status: {
    type: String,
    enum: ['Draft', 'Under Review', 'Approved', 'Published', 'Archived'],
    default: 'Draft'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  reviewDate: {
    type: Date,
    required: true
  },
  nextReviewDate: {
    type: Date,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  relatedPolicies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

policySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Policy', policySchema);
