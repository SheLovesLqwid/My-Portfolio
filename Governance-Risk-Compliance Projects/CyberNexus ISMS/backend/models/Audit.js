const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema({
  findingId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true
  },
  category: {
    type: String,
    enum: ['Non-Conformity', 'Observation', 'Opportunity for Improvement'],
    required: true
  },
  relatedControl: {
    type: String
  },
  correctiveAction: {
    type: String
  },
  actionOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Closed', 'Verified'],
    default: 'Open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const auditSchema = new mongoose.Schema({
  auditId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Internal', 'External', 'Certification', 'Surveillance'],
    required: true
  },
  scope: {
    type: String,
    required: true
  },
  objectives: {
    type: String,
    required: true
  },
  auditCriteria: {
    type: String,
    required: true
  },
  leadAuditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  auditTeam: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  auditees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  plannedStartDate: {
    type: Date,
    required: true
  },
  plannedEndDate: {
    type: Date,
    required: true
  },
  actualStartDate: {
    type: Date
  },
  actualEndDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Planned', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Planned'
  },
  findings: [findingSchema],
  overallConclusion: {
    type: String
  },
  recommendations: {
    type: String
  },
  reportFile: {
    type: String
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

auditSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Audit', auditSchema);
