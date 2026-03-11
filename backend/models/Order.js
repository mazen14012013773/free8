const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  package: {
    name: {
      type: String,
      required: true,
      enum: ['basic', 'standard', 'premium']
    },
    title: String,
    price: {
      type: Number,
      required: true
    },
    deliveryTime: {
      type: Number,
      required: true
    },
    revisions: Number,
    features: [String]
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requirements: {
    type: String,
    required: function() {
      return this.status === 'pending';
    }
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'delivered', 'revision', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  price: {
    type: Number,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  deliveredAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  revisionsLeft: {
    type: Number,
    default: 0
  },
  revisionHistory: [{
    requestedAt: {
      type: Date,
      default: Date.now
    },
    reason: String,
    response: String,
    respondedAt: Date
  }],
  deliveryNotes: {
    type: String
  },
  deliveredFiles: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'held', 'released', 'refunded'],
    default: 'pending'
  },
  platformFee: {
    type: Number,
    default: 0
  },
  freelancerEarnings: {
    type: Number,
    default: 0
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    attachments: [{
      filename: String,
      url: String
    }]
  }]
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `FO${timestamp}${random}`;
  }
  
  // Calculate platform fee (20%) and freelancer earnings
  if (this.isModified('price')) {
    this.platformFee = Math.round(this.price * 0.2 * 100) / 100;
    this.freelancerEarnings = Math.round(this.price * 0.8 * 100) / 100;
  }
  
  next();
});

// Index for efficient queries
orderSchema.index({ client: 1, status: 1 });
orderSchema.index({ freelancer: 1, status: 1 });
orderSchema.index({ orderNumber: 1 });

// Method to accept order
orderSchema.methods.accept = function() {
  this.status = 'active';
  this.paymentStatus = 'held';
  return this.save();
};

// Method to deliver order
orderSchema.methods.deliver = function(notes, files) {
  this.status = 'delivered';
  this.deliveryNotes = notes;
  this.deliveredFiles = files;
  this.deliveredAt = new Date();
  return this.save();
};

// Method to request revision
orderSchema.methods.requestRevision = function(reason) {
  if (this.revisionsLeft > 0) {
    this.status = 'revision';
    this.revisionsLeft -= 1;
    this.revisionHistory.push({
      requestedAt: new Date(),
      reason: reason
    });
    return this.save();
  }
  throw new Error('No revisions left');
};

// Method to complete order
orderSchema.methods.complete = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.paymentStatus = 'released';
  
  // Update freelancer's earnings
  const User = mongoose.model('User');
  const freelancer = await User.findById(this.freelancer);
  if (freelancer) {
    freelancer.earnings.total += this.freelancerEarnings;
    freelancer.earnings.pending += this.freelancerEarnings;
    await freelancer.save();
  }
  
  // Update service orders completed
  const Service = mongoose.model('Service');
  await Service.findByIdAndUpdate(this.service, {
    $inc: { ordersCompleted: 1 }
  });
  
  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;