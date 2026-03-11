const express = require('express');
const { Service, Review, User } = require('../models');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { createServiceValidation } = require('../middleware/validation');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/services
// @desc    Get all services with filters and search
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subcategory,
      minPrice,
      maxPrice,
      deliveryTime,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      freelancerId
    } = req.query;
    
    const query = { status: 'active' };
    
    // Apply filters
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (freelancerId) query.freelancer = freelancerId;
    
    if (minPrice || maxPrice) {
      query['packages.price'] = {};
      if (minPrice) query['packages.price'].$gte = parseFloat(minPrice);
      if (maxPrice) query['packages.price'].$lte = parseFloat(maxPrice);
    }
    
    if (deliveryTime) {
      query['packages.deliveryTime'] = { $lte: parseInt(deliveryTime) };
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    // Build sort options
    const sortOptions = {};
    if (search && sortBy === 'relevance') {
      sortOptions.score = { $meta: 'textScore' };
    } else if (sortBy === 'price') {
      sortOptions['packages.price'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'rating') {
      sortOptions['ratings.average'] = -1;
    } else if (sortBy === 'popular') {
      sortOptions.ordersCompleted = -1;
    } else {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let servicesQuery = Service.find(query)
      .populate('freelancer', 'firstName lastName username profilePicture ratings')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    if (search && sortBy === 'relevance') {
      servicesQuery = servicesQuery.select({ score: { $meta: 'textScore' } });
    }
    
    const services = await servicesQuery;
    const total = await Service.countDocuments(query);
    
    res.json({
      services,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/services/categories
// @desc    Get all service categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'graphics-design', name: 'Graphics & Design', icon: 'Palette', subcategories: ['Logo Design', 'Brand Identity', 'Web Design', 'UI/UX Design', 'Illustration', 'Print Design'] },
      { id: 'digital-marketing', name: 'Digital Marketing', icon: 'TrendingUp', subcategories: ['Social Media Marketing', 'SEO', 'Content Marketing', 'Email Marketing', 'PPC Advertising'] },
      { id: 'writing-translation', name: 'Writing & Translation', icon: 'FileText', subcategories: ['Article Writing', 'Copywriting', 'Translation', 'Proofreading', 'Creative Writing'] },
      { id: 'video-animation', name: 'Video & Animation', icon: 'Video', subcategories: ['Video Editing', 'Animation', 'Motion Graphics', 'Explainer Videos', 'Video Production'] },
      { id: 'music-audio', name: 'Music & Audio', icon: 'Music', subcategories: ['Voice Over', 'Music Production', 'Sound Design', 'Mixing & Mastering', 'Jingles'] },
      { id: 'programming-tech', name: 'Programming & Tech', icon: 'Code', subcategories: ['Web Development', 'Mobile Apps', 'WordPress', 'E-commerce', 'Game Development'] },
      { id: 'business', name: 'Business', icon: 'Briefcase', subcategories: ['Virtual Assistant', 'Data Entry', 'Market Research', 'Business Plans', 'Financial Consulting'] },
      { id: 'lifestyle', name: 'Lifestyle', icon: 'Heart', subcategories: ['Online Tutoring', 'Fitness Coaching', 'Life Coaching', 'Astrology', 'Gaming'] },
      { id: 'data', name: 'Data', icon: 'Database', subcategories: ['Data Analysis', 'Data Visualization', 'Machine Learning', 'AI Services', 'Data Science'] },
      { id: 'photography', name: 'Photography', icon: 'Camera', subcategories: ['Product Photography', 'Portrait Photography', 'Event Photography', 'Photo Editing', 'Real Estate Photography'] }
    ];
    
    // Get service count for each category
    const categoryCounts = await Service.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      serviceCount: categoryCounts.find(c => c._id === cat.id)?.count || 0
    }));
    
    res.json({ categories: categoriesWithCount });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/services/featured
// @desc    Get featured services
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const services = await Service.find({ 
      status: 'active',
      isFeatured: true 
    })
      .populate('freelancer', 'firstName lastName username profilePicture ratings')
      .limit(parseInt(limit));
    
    // If not enough featured services, add top-rated ones
    if (services.length < parseInt(limit)) {
      const additionalServices = await Service.find({
        status: 'active',
        isFeatured: false,
        _id: { $nin: services.map(s => s._id) }
      })
        .populate('freelancer', 'firstName lastName username profilePicture ratings')
        .sort({ 'ratings.average': -1, ordersCompleted: -1 })
        .limit(parseInt(limit) - services.length);
      
      services.push(...additionalServices);
    }
    
    res.json({ services });
  } catch (error) {
    console.error('Get featured services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/services/:id
// @desc    Get service by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('freelancer', 'firstName lastName username profilePicture bio skills languages ratings memberSince');
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Increment views
    await service.incrementViews();
    
    // Get reviews
    const reviews = await Review.find({ service: service._id, isVisible: true })
      .populate('reviewer', 'firstName lastName username profilePicture')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get more services from same freelancer
    const moreServices = await Service.find({
      freelancer: service.freelancer._id,
      _id: { $ne: service._id },
      status: 'active'
    })
      .select('title images packages ratings')
      .limit(4);
    
    res.json({
      service,
      reviews,
      moreServices
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/services
// @desc    Create a new service
// @access  Private (Freelancer only)
router.post('/', 
  authenticate, 
  upload.array('serviceImages', 5),
  handleUploadError,
  createServiceValidation,
  async (req, res) => {
    try {
      if (req.user.role !== 'freelancer' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only freelancers can create services' });
      }
      
      const serviceData = req.body;
      
      // Handle uploaded images
      if (req.files && req.files.length > 0) {
        serviceData.images = req.files.map(file => `/uploads/services/${file.filename}`);
      }
      
      // Parse packages if sent as string
      if (typeof serviceData.packages === 'string') {
        serviceData.packages = JSON.parse(serviceData.packages);
      }
      
      // Parse FAQ if sent as string
      if (serviceData.faq && typeof serviceData.faq === 'string') {
        serviceData.faq = JSON.parse(serviceData.faq);
      }
      
      // Parse tags if sent as string
      if (serviceData.tags && typeof serviceData.tags === 'string') {
        serviceData.tags = JSON.parse(serviceData.tags);
      }
      
      // Parse requirements if sent as string
      if (serviceData.requirements && typeof serviceData.requirements === 'string') {
        serviceData.requirements = JSON.parse(serviceData.requirements);
      }
      
      serviceData.freelancer = req.user._id;
      
      const service = new Service(serviceData);
      await service.save();
      
      res.status(201).json({
        message: 'Service created successfully',
        service
      });
    } catch (error) {
      console.error('Create service error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/services/:id
// @desc    Update a service
// @access  Private (Owner only)
router.put('/:id', 
  authenticate, 
  upload.array('serviceImages', 5),
  handleUploadError,
  async (req, res) => {
    try {
      const service = await Service.findById(req.params.id);
      
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      // Check ownership
      if (service.freelancer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this service' });
      }
      
      const updates = req.body;
      
      // Handle new images
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => `/uploads/services/${file.filename}`);
        if (updates.keepExistingImages !== 'false') {
          updates.images = [...service.images, ...newImages];
        } else {
          updates.images = newImages;
        }
      }
      
      // Parse JSON fields
      if (typeof updates.packages === 'string') {
        updates.packages = JSON.parse(updates.packages);
      }
      if (updates.faq && typeof updates.faq === 'string') {
        updates.faq = JSON.parse(updates.faq);
      }
      if (updates.tags && typeof updates.tags === 'string') {
        updates.tags = JSON.parse(updates.tags);
      }
      
      const updatedService = await Service.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      );
      
      res.json({
        message: 'Service updated successfully',
        service: updatedService
      });
    } catch (error) {
      console.error('Update service error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/services/:id
// @desc    Delete a service
// @access  Private (Owner only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check ownership
    if (service.freelancer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this service' });
    }
    
    // Check for active orders
    const { Order } = require('../models');
    const activeOrders = await Order.countDocuments({
      service: service._id,
      status: { $in: ['pending', 'active', 'delivered', 'revision'] }
    });
    
    if (activeOrders > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete service with active orders. Please complete or cancel all orders first.' 
      });
    }
    
    await Service.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/services/:id/status
// @desc    Update service status (active/paused)
// @access  Private (Owner only)
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'paused', 'draft'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check ownership
    if (service.freelancer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    service.status = status;
    await service.save();
    
    res.json({
      message: `Service status updated to ${status}`,
      service
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;