const express = require('express');
const { User, Service, Review } = require('../models');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { updateProfileValidation } = require('../middleware/validation');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/users/profile/:username
// @desc    Get user profile by username
// @access  Public
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email -wallet')
      .populate('services', 'title description category images packages ratings ordersCompleted status');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get recent reviews
    const reviews = await Review.find({ freelancer: user._id, isVisible: true })
      .populate('reviewer', 'firstName lastName username profilePicture')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio,
        skills: user.skills,
        languages: user.languages,
        location: user.location,
        portfolio: user.portfolio,
        education: user.education,
        experience: user.experience,
        ratings: user.ratings,
        memberSince: user.memberSince,
        lastActive: user.lastActive,
        services: user.services,
        reviews
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, updateProfileValidation, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      'firstName', 'lastName', 'bio', 'skills', 'languages',
      'location', 'portfolio', 'education', 'experience'
    ];
    
    // Filter only allowed updates
    const updateData = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/profile-picture
// @desc    Upload profile picture
// @access  Private
router.post('/profile-picture', authenticate, upload.single('profilePicture'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: imageUrl },
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: imageUrl,
      user
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/portfolio
// @desc    Add portfolio item
// @access  Private (Freelancer only)
router.post('/portfolio', authenticate, upload.single('portfolioImage'), handleUploadError, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only freelancers can add portfolio items' });
    }
    
    const { title, description, link } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const portfolioItem = {
      title,
      description: description || '',
      link: link || '',
      createdAt: new Date()
    };
    
    if (req.file) {
      portfolioItem.imageUrl = `/uploads/portfolio/${req.file.filename}`;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { portfolio: portfolioItem } },
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Portfolio item added successfully',
      portfolio: user.portfolio
    });
  } catch (error) {
    console.error('Add portfolio error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/portfolio/:itemId
// @desc    Delete portfolio item
// @access  Private
router.delete('/portfolio/:itemId', authenticate, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { portfolio: { _id: req.params.itemId } } },
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Portfolio item deleted successfully',
      portfolio: user.portfolio
    });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/freelancers
// @desc    Get all freelancers with filters
// @access  Public
router.get('/freelancers', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      skill, 
      minRating = 0,
      search,
      sortBy = 'ratings.average'
    } = req.query;
    
    const query = { 
      role: 'freelancer',
      isActive: true,
      'ratings.average': { $gte: parseFloat(minRating) }
    };
    
    if (skill) {
      query.skills = { $in: [new RegExp(skill, 'i')] };
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const sortOptions = {};
    if (sortBy === 'ratings.average') {
      sortOptions['ratings.average'] = -1;
    } else if (sortBy === 'memberSince') {
      sortOptions.memberSince = -1;
    } else if (sortBy === 'ratings.count') {
      sortOptions['ratings.count'] = -1;
    }
    
    const freelancers = await User.find(query)
      .select('-password -email -wallet')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      freelancers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get freelancers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { Order, Service } = require('../models');
    
    // Get order statistics
    const ordersAsClient = await Order.countDocuments({ client: req.user._id });
    const ordersAsFreelancer = await Order.countDocuments({ freelancer: req.user._id });
    
    const activeOrdersAsClient = await Order.countDocuments({ 
      client: req.user._id, 
      status: { $in: ['pending', 'active', 'delivered', 'revision'] } 
    });
    
    const activeOrdersAsFreelancer = await Order.countDocuments({ 
      freelancer: req.user._id, 
      status: { $in: ['pending', 'active', 'delivered', 'revision'] } 
    });
    
    const completedOrdersAsClient = await Order.countDocuments({ 
      client: req.user._id, 
      status: 'completed' 
    });
    
    const completedOrdersAsFreelancer = await Order.countDocuments({ 
      freelancer: req.user._id, 
      status: 'completed' 
    });
    
    // Get service count for freelancers
    let servicesCount = 0;
    if (req.user.role === 'freelancer') {
      servicesCount = await Service.countDocuments({ freelancer: req.user._id });
    }
    
    res.json({
      orders: {
        asClient: {
          total: ordersAsClient,
          active: activeOrdersAsClient,
          completed: completedOrdersAsClient
        },
        asFreelancer: {
          total: ordersAsFreelancer,
          active: activeOrdersAsFreelancer,
          completed: completedOrdersAsFreelancer
        }
      },
      services: servicesCount,
      earnings: req.user.earnings,
      wallet: req.user.wallet
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/role
// @desc    Switch user role (client <-> freelancer)
// @access  Private
router.put('/role', authenticate, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['client', 'freelancer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be client or freelancer' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true }
    ).select('-password');
    
    res.json({
      message: `Role updated to ${role}`,
      user
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;