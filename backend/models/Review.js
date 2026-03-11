const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  communication: {
    type: Number,
    min: 1,
    max: 5
  },
  serviceQuality: {
    type: Number,
    min: 1,
    max: 5
  },
  recommend: {
    type: Boolean,
    default: false
  },
  review: {
    type: String,
    required: [true, 'Review text is required'],
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  freelancerResponse: {
    message: String,
    respondedAt: Date
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews for same order
reviewSchema.index({ order: 1 }, { unique: true });

// Index for service reviews
reviewSchema.index({ service: 1, isVisible: 1 });

// Index for freelancer reviews
reviewSchema.index({ freelancer: 1, isVisible: 1 });

// Post save hook to update service and freelancer ratings
reviewSchema.post('save', async function() {
  const Service = mongoose.model('Service');
  const User = mongoose.model('User');
  
  // Update service rating
  const service = await Service.findById(this.service);
  if (service) {
    await service.updateRating();
  }
  
  // Update freelancer rating
  const reviews = await this.constructor.find({ freelancer: this.freelancer, isVisible: true });
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
    
    await User.findByIdAndUpdate(this.freelancer, {
      'ratings.average': averageRating,
      'ratings.count': reviews.length
    });
  }
});

// Method to add freelancer response
reviewSchema.methods.addResponse = function(message) {
  this.freelancerResponse = {
    message: message,
    respondedAt: new Date()
  };
  return this.save();
};

// Method to mark as helpful
reviewSchema.methods.markHelpful = function(userId) {
  if (!this.helpful.users.includes(userId)) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;