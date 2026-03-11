const express = require('express');
const { Review, Order } = require('../models');
const { authenticate } = require('../middleware/auth');
const { createReviewValidation } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/reviews
// @desc    Get reviews with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      serviceId, 
      freelancerId, 
      page = 1, 
      limit = 10,
      minRating,
      maxRating,
      sortBy = 'createdAt'
    } = req.query;
    
    const query = { isVisible: true };
    
    if (serviceId) query.service = serviceId;
    if (freelancerId) query.freelancer = freelancerId;
    
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseInt(minRating);
      if (maxRating) query.rating.$lte = parseInt(maxRating);
    }
    
    const sortOptions = {};
    if (sortBy === 'rating') {
      sortOptions.rating = -1;
    } else if (sortBy === 'helpful') {
      sortOptions['helpful.count'] = -1;
    } else {
      sortOptions.createdAt = -1;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find(query)
      .populate('reviewer', 'firstName lastName username profilePicture')
      .populate('service', 'title')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments(query);
    
    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: query },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);
    
    res.json({
      reviews,
      ratingDistribution,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/:id
// @desc    Get review by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewer', 'firstName lastName username profilePicture')
      .populate('freelancer', 'firstName lastName username profilePicture')
      .populate('service', 'title images');
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.json({ review });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private (Client only)
router.post('/', authenticate, createReviewValidation, async (req, res) => {
  try {
    if (req.user.role !== 'client' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only clients can leave reviews' });
    }
    
    const { orderId, rating, review, communication, serviceQuality, recommend } = req.body;
    
    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Verify client owns this order
    if (order.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this order' });
    }
    
    // Check if order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed orders' });
    }
    
    // Check if already reviewed
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({ message: 'Order has already been reviewed' });
    }
    
    // Create review
    const newReview = new Review({
      order: orderId,
      service: order.service,
      reviewer: req.user._id,
      freelancer: order.freelancer,
      rating,
      review,
      communication,
      serviceQuality,
      recommend
    });
    
    await newReview.save();
    
    // Update order with review reference
    order.review = newReview._id;
    await order.save();
    
    await newReview.populate('reviewer', 'firstName lastName username profilePicture');
    
    res.status(201).json({
      message: 'Review submitted successfully',
      review: newReview
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reviews/:id/response
// @desc    Add freelancer response to review
// @access  Private (Freelancer only)
router.put('/:id/response', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length < 10) {
      return res.status(400).json({ message: 'Response must be at least 10 characters' });
    }
    
    if (message.length > 1000) {
      return res.status(400).json({ message: 'Response cannot exceed 1000 characters' });
    }
    
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Verify freelancer owns this review
    if (review.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this review' });
    }
    
    // Check if already responded
    if (review.freelancerResponse && review.freelancerResponse.message) {
      return res.status(400).json({ message: 'You have already responded to this review' });
    }
    
    await review.addResponse(message);
    
    res.json({
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    console.error('Add response error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Cannot mark own review as helpful
    if (review.reviewer.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot mark your own review as helpful' });
    }
    
    await review.markHelpful(req.user._id);
    
    res.json({
      message: 'Review marked as helpful',
      helpfulCount: review.helpful.count
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reviews/:id/helpful
// @desc    Remove helpful mark from review
// @access  Private
router.delete('/:id/helpful', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Remove user from helpful users
    review.helpful.users = review.helpful.users.filter(
      userId => userId.toString() !== req.user._id.toString()
    );
    review.helpful.count = review.helpful.users.length;
    
    await review.save();
    
    res.json({
      message: 'Helpful mark removed',
      helpfulCount: review.helpful.count
    });
  } catch (error) {
    console.error('Remove helpful error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/freelancer/:freelancerId/stats
// @desc    Get review stats for a freelancer
// @access  Public
router.get('/freelancer/:freelancerId/stats', async (req, res) => {
  try {
    const { freelancerId } = req.params;
    
    const stats = await Review.aggregate([
      { $match: { freelancer: new require('mongoose').Types.ObjectId(freelancerId), isVisible: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          communicationAvg: { $avg: '$communication' },
          serviceQualityAvg: { $avg: '$serviceQuality' },
          recommendCount: { $sum: { $cond: ['$recommend', 1, 0] } }
        }
      }
    ]);
    
    const ratingDistribution = await Review.aggregate([
      { $match: { freelancer: new require('mongoose').Types.ObjectId(freelancerId), isVisible: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);
    
    res.json({
      stats: stats[0] || {
        averageRating: 0,
        totalReviews: 0,
        communicationAvg: 0,
        serviceQualityAvg: 0,
        recommendCount: 0
      },
      ratingDistribution
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;