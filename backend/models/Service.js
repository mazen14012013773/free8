const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['basic', 'standard', 'premium']
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 5
  },
  deliveryTime: {
    type: Number,
    required: true,
    min: 1
  },
  revisions: {
    type: Number,
    default: 0
  },
  features: [{
    type: String
  }]
});

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'graphics-design',
      'digital-marketing',
      'writing-translation',
      'video-animation',
      'music-audio',
      'programming-tech',
      'business',
      'lifestyle',
      'data',
      'photography'
    ]
  },
  subcategory: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String
  }],
  video: {
    type: String
  },
  packages: [packageSchema],
  faq: [{
    question: String,
    answer: String
  }],
  requirements: [{
    type: String
  }],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  ordersCompleted: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'suspended'],
    default: 'draft'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  searchKeywords: [{
    type: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reviews
serviceSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'service'
});

// Index for search
serviceSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text',
  searchKeywords: 'text'
});

// Index for category filtering
serviceSchema.index({ category: 1, status: 1 });

// Index for freelancer
serviceSchema.index({ freelancer: 1 });

// Method to update ratings
serviceSchema.methods.updateRating = async function() {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({ service: this._id });
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.ratings.average = Math.round((totalRating / reviews.length) * 10) / 10;
    this.ratings.count = reviews.length;
  } else {
    this.ratings.average = 0;
    this.ratings.count = 0;
  }
  
  await this.save();
};

// Method to increment views
serviceSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;