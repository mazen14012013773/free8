const express = require('express');
const { User, Service, Order, Review, Report, Message } = require('../models');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorizeAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // User statistics
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const activeUsers = await User.countDocuments({ isActive: true });
    
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    // Service statistics
    const totalServices = await Service.countDocuments();
    const activeServices = await Service.countDocuments({ status: 'active' });
    const newServicesThisMonth = await Service.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    const servicesByCategory = await Service.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    // Order statistics
    const totalOrders = await Order.countDocuments();
    const ordersThisMonth = await Order.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['pending', 'active'] }
    });
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed', paymentStatus: 'released' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    
    const revenueThisMonth = await Order.aggregate([
      { 
        $match: { 
          status: 'completed', 
          paymentStatus: 'released',
          completedAt: { $gte: thirtyDaysAgo }
        } 
      },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    
    // Review statistics
    const totalReviews = await Review.countDocuments();
    const averageRating = await Review.aggregate([
      { $match: { isVisible: true } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);
    
    // Report statistics
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const underReviewReports = await Report.countDocuments({ status: 'under_review' });
    
    // Recent activity
    const recentUsers = await User.find()
      .select('firstName lastName username email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentOrders = await Order.find()
      .populate('service', 'title')
      .populate('client', 'firstName lastName username')
      .populate('freelancer', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentReports = await Report.find({ status: 'pending' })
      .populate('reporter', 'firstName lastName username')
      .populate('reported', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        active: activeUsers,
        byRole: usersByRole
      },
      services: {
        total: totalServices,
        active: activeServices,
        newThisMonth: newServicesThisMonth,
        byCategory: servicesByCategory
      },
      orders: {
        total: totalOrders,
        thisMonth: ordersThisMonth,
        completed: completedOrders,
        pending: pendingOrders
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        thisMonth: revenueThisMonth[0]?.total || 0,
        platformFees: (totalRevenue[0]?.total || 0) * 0.2
      },
      reviews: {
        total: totalReviews,
        averageRating: Math.round((averageRating[0]?.avg || 0) * 10) / 10
      },
      reports: {
        pending: pendingReports,
        underReview: underReviewReports
      },
      recentActivity: {
        users: recentUsers,
        orders: recentOrders,
        reports: recentReports
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      search, 
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Activate/deactivate user
// @access  Admin
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Change user role
// @access  Admin
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['client', 'freelancer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: `User role updated to ${role}`,
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/services
// @desc    Get all services with filters
// @access  Admin
router.get('/services', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      search,
      sortBy = 'createdAt'
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = -1;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const services = await Service.find(query)
      .populate('freelancer', 'firstName lastName username email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
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

// @route   PUT /api/admin/services/:id/status
// @desc    Update service status
// @access  Admin
router.put('/services/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'paused', 'suspended', 'draft'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json({
      message: `Service status updated to ${status}`,
      service
    });
  } catch (error) {
    console.error('Update service status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders with filters
// @access  Admin
router.get('/orders', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .populate('service', 'title')
      .populate('client', 'firstName lastName username email')
      .populate('freelancer', 'firstName lastName username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/reports
// @desc    Get all reports with filters
// @access  Admin
router.get('/reports', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      type
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reports = await Report.find(query)
      .populate('reporter', 'firstName lastName username')
      .populate('reported', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Report.countDocuments(query);
    
    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/reports/:id/assign
// @desc    Assign report to admin
// @access  Admin
router.put('/reports/:id/assign', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    await report.assign(req.user._id);
    
    res.json({
      message: 'Report assigned successfully',
      report
    });
  } catch (error) {
    console.error('Assign report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/reports/:id/resolve
// @desc    Resolve a report
// @access  Admin
router.put('/reports/:id/resolve', async (req, res) => {
  try {
    const { action, notes } = req.body;
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    await report.resolve(action, notes, req.user._id);
    
    // Take action based on resolution
    if (action === 'suspension' || action === 'ban') {
      await User.findByIdAndUpdate(report.reported, {
        isActive: false
      });
    }
    
    if (action === 'content_removed' && report.type === 'service') {
      await Service.findByIdAndUpdate(report.target, {
        status: 'suspended'
      });
    }
    
    res.json({
      message: 'Report resolved successfully',
      report
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/reports/:id/dismiss
// @desc    Dismiss a report
// @access  Admin
router.put('/reports/:id/dismiss', async (req, res) => {
  try {
    const { notes } = req.body;
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    await report.dismiss(notes, req.user._id);
    
    res.json({
      message: 'Report dismissed',
      report
    });
  } catch (error) {
    console.error('Dismiss report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Admin
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    
    // User growth over time
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Order statistics over time
    const orderStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Top categories
    const topCategories = await Service.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Top freelancers by earnings
    const topFreelancers = await Order.aggregate([
      { $match: { status: 'completed', paymentStatus: 'released' } },
      {
        $group: {
          _id: '$freelancer',
          totalEarnings: { $sum: '$freelancerEarnings' },
          completedOrders: { $sum: 1 }
        }
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'freelancer'
        }
      },
      { $unwind: '$freelancer' },
      {
        $project: {
          'freelancer.password': 0
        }
      }
    ]);
    
    res.json({
      userGrowth,
      orderStats,
      topCategories,
      topFreelancers
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;