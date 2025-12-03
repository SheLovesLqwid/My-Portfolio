const mongoose = require('mongoose');

const soaSchema = new mongoose.Schema({
  controlId: {
    type: String,
    required: true,
    unique: true
  },
  controlTitle: {
    type: String,
    required: true
  },
  controlDescription: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'A.5 Information Security Policies',
      'A.6 Organization of Information Security',
      'A.7 Human Resource Security',
      'A.8 Asset Management',
      'A.9 Access Control',
      'A.10 Cryptography',
      'A.11 Physical and Environmental Security',
      'A.12 Operations Security',
      'A.13 Communications Security',
      'A.14 System Acquisition, Development and Maintenance',
      'A.15 Supplier Relationships',
      'A.16 Information Security Incident Management',
      'A.17 Information Security Aspects of Business Continuity Management',
      'A.18 Compliance'
    ]
  },
  applicability: {
    type: String,
    enum: ['Applicable', 'Not Applicable'],
    required: true
  },
  implementationStatus: {
    type: String,
    enum: ['Not Implemented', 'Partially Implemented', 'Implemented', 'Not Applicable'],
    required: true
  },
  justification: {
    type: String,
    required: true
  },
  responsibleOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  implementationDetails: {
    type: String
  },
  evidenceLocation: {
    type: String
  },
  lastReviewDate: {
    type: Date
  },
  nextReviewDate: {
    type: Date,
    required: true
  },
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

soaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SoA', soaSchema);
