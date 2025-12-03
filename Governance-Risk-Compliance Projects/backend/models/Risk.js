const mongoose = require('mongoose');

const riskSchema = new mongoose.Schema({
  riskId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Operational', 'Technical', 'Financial', 'Strategic', 'Compliance', 'Reputational']
  },
  likelihood: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  impact: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  riskScore: {
    type: Number,
    default: function() {
      return this.likelihood * this.impact;
    }
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: function() {
      const score = this.likelihood * this.impact;
      if (score <= 5) return 'Low';
      if (score <= 10) return 'Medium';
      if (score <= 15) return 'High';
      return 'Critical';
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  treatment: {
    type: String,
    enum: ['Accept', 'Mitigate', 'Transfer', 'Avoid'],
    required: true
  },
  treatmentPlan: {
    type: String
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Closed', 'Monitoring'],
    default: 'Open'
  },
  residualLikelihood: {
    type: Number,
    min: 1,
    max: 5
  },
  residualImpact: {
    type: Number,
    min: 1,
    max: 5
  },
  residualScore: {
    type: Number
  },
  reviewDate: {
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

riskSchema.pre('save', function(next) {
  this.riskScore = this.likelihood * this.impact;
  
  if (this.riskScore <= 5) this.riskLevel = 'Low';
  else if (this.riskScore <= 10) this.riskLevel = 'Medium';
  else if (this.riskScore <= 15) this.riskLevel = 'High';
  else this.riskLevel = 'Critical';

  if (this.residualLikelihood && this.residualImpact) {
    this.residualScore = this.residualLikelihood * this.residualImpact;
  }

  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Risk', riskSchema);
