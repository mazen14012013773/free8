const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reported: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'service', 'order', 'message', 'review'],
    required: true
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'type'
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'inappropriate_content',
      'spam',
      'harassment',
      'fake_profile',
      'scam',
      'copyright_violation',
      'terms_violation',
      'payment_issue',
      'quality_issue',
      'other'
    ]
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  evidence: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: {
    action: {
      type: String,
      enum: ['none', 'warning', 'suspension', 'ban', 'content_removed', 'refund_issued']
    },
    notes: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  followUp: [{
    message: String,
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for report lookups
reportSchema.index({ status: 1, priority: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ reported: 1 });
reportSchema.index({ type: 1, target: 1 });
reportSchema.index({ createdAt: -1 });

// Method to assign report
reportSchema.methods.assign = function(adminId) {
  this.assignedTo = adminId;
  this.status = 'under_review';
  return this.save();
};

// Method to resolve report
reportSchema.methods.resolve = function(action, notes, adminId) {
  this.status = 'resolved';
  this.resolution = {
    action: action,
    notes: notes,
    resolvedAt: new Date(),
    resolvedBy: adminId
  };
  return this.save();
};

// Method to dismiss report
reportSchema.methods.dismiss = function(notes, adminId) {
  this.status = 'dismissed';
  this.resolution = {
    action: 'none',
    notes: notes,
    resolvedAt: new Date(),
    resolvedBy: adminId
  };
  return this.save();
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;