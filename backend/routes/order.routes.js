const express = require('express');
const { Order, Service, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { createOrderValidation } = require('../middleware/validation');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/orders
// @desc    Get user's orders (as client or freelancer)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, role, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    // Filter by role (client or freelancer)
    if (role === 'freelancer') {
      query.freelancer = req.user._id;
    } else if (role === 'client') {
      query.client = req.user._id;
    } else {
      // Get all orders where user is either client or freelancer
      query.$or = [
        { client: req.user._id },
        { freelancer: req.user._id }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .populate('service', 'title images category')
      .populate('client', 'firstName lastName username profilePicture')
      .populate('freelancer', 'firstName lastName username profilePicture')
      .populate('review', 'rating review')
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

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('service', 'title description images category packages freelancer')
      .populate('client', 'firstName lastName username profilePicture')
      .populate('freelancer', 'firstName lastName username profilePicture')
      .populate('review');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is involved in this order
    if (order.client._id.toString() !== req.user._id.toString() && 
        order.freelancer._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    
    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private (Client only)
router.post('/', authenticate, createOrderValidation, async (req, res) => {
  try {
    if (req.user.role !== 'client' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only clients can place orders' });
    }
    
    const { serviceId, packageName, requirements } = req.body;
    
    // Find service
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    if (service.status !== 'active') {
      return res.status(400).json({ message: 'This service is not currently available' });
    }
    
    // Cannot order own service
    if (service.freelancer.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot order your own service' });
    }
    
    // Find selected package
    const selectedPackage = service.packages.find(p => p.name === packageName);
    if (!selectedPackage) {
      return res.status(400).json({ message: 'Invalid package selected' });
    }
    
    // Calculate delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + selectedPackage.deliveryTime);
    
    // Create order
    const order = new Order({
      service: serviceId,
      package: {
        name: selectedPackage.name,
        title: selectedPackage.title,
        price: selectedPackage.price,
        deliveryTime: selectedPackage.deliveryTime,
        revisions: selectedPackage.revisions,
        features: selectedPackage.features
      },
      client: req.user._id,
      freelancer: service.freelancer,
      requirements,
      price: selectedPackage.price,
      deliveryDate,
      revisionsLeft: selectedPackage.revisions
    });
    
    await order.save();
    
    await order.populate('service', 'title images');
    await order.populate('client', 'firstName lastName username profilePicture');
    await order.populate('freelancer', 'firstName lastName username profilePicture');
    
    // Create or get conversation for this order
    const { Conversation } = require('../models');
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, service.freelancer] },
      type: 'direct'
    });
    
    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, service.freelancer],
        type: 'direct'
      });
      await conversation.save();
    }
    
    // Notify freelancer via socket (if implemented)
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${service.freelancer}`).emit('new_order', {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          service: order.service,
          client: order.client,
          price: order.price
        }
      });
    }
    
    res.status(201).json({
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/accept
// @desc    Accept an order (Freelancer)
// @access  Private (Freelancer only)
router.put('/:id/accept', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ message: `Order cannot be accepted. Current status: ${order.status}` });
    }
    
    await order.accept();
    
    // Notify client
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.client}`).emit('order_accepted', {
        orderId: order._id,
        orderNumber: order.orderNumber
      });
    }
    
    res.json({
      message: 'Order accepted successfully',
      order
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/deliver
// @desc    Deliver an order (Freelancer)
// @access  Private (Freelancer only)
router.put('/:id/deliver', 
  authenticate, 
  upload.array('deliverables', 10),
  handleUploadError,
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      if (order.freelancer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      if (order.status !== 'active' && order.status !== 'revision') {
        return res.status(400).json({ message: `Order cannot be delivered. Current status: ${order.status}` });
      }
      
      const { deliveryNotes } = req.body;
      
      // Handle uploaded files
      const deliveredFiles = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          deliveredFiles.push({
            filename: file.originalname,
            url: `/uploads/deliverables/${file.filename}`,
            uploadedAt: new Date()
          });
        });
      }
      
      await order.deliver(deliveryNotes, deliveredFiles);
      
      // Notify client
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${order.client}`).emit('order_delivered', {
          orderId: order._id,
          orderNumber: order.orderNumber
        });
      }
      
      res.json({
        message: 'Order delivered successfully',
        order
      });
    } catch (error) {
      console.error('Deliver order error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/orders/:id/revision
// @desc    Request revision (Client)
// @access  Private (Client only)
router.put('/:id/revision', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only request revision for delivered orders' });
    }
    
    if (order.revisionsLeft <= 0) {
      return res.status(400).json({ message: 'No revisions left for this order' });
    }
    
    const { reason } = req.body;
    
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ message: 'Please provide a detailed reason for the revision (min 10 characters)' });
    }
    
    await order.requestRevision(reason);
    
    // Notify freelancer
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.freelancer}`).emit('revision_requested', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        reason
      });
    }
    
    res.json({
      message: 'Revision requested successfully',
      order
    });
  } catch (error) {
    console.error('Request revision error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/complete
// @desc    Complete an order (Client)
// @access  Private (Client only)
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only complete delivered orders' });
    }
    
    await order.complete();
    
    // Notify freelancer
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.freelancer}`).emit('order_completed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        earnings: order.freelancerEarnings
      });
    }
    
    res.json({
      message: 'Order completed successfully',
      order
    });
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order
// @access  Private
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Only client, freelancer, or admin can cancel
    if (order.client.toString() !== req.user._id.toString() && 
        order.freelancer.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Can only cancel pending or active orders
    if (!['pending', 'active'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` });
    }
    
    const { reason } = req.body;
    
    order.status = 'cancelled';
    order.paymentStatus = 'refunded';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    order.cancelledBy = req.user._id;
    
    await order.save();
    
    // Notify other party
    const io = req.app.get('io');
    const notifyUserId = order.client.toString() === req.user._id.toString() 
      ? order.freelancer 
      : order.client;
    
    if (io) {
      io.to(`user_${notifyUserId}`).emit('order_cancelled', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        reason
      });
    }
    
    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders/:id/message
// @desc    Send message in order
// @access  Private
router.post('/:id/message', authenticate, upload.array('attachments', 5), handleUploadError, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.client.toString() !== req.user._id.toString() && 
        order.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { message } = req.body;
    
    if (!message && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Message or attachment required' });
    }
    
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          filename: file.originalname,
          url: `/uploads/attachments/${file.filename}`
        });
      });
    }
    
    order.messages.push({
      sender: req.user._id,
      message: message || '',
      attachments,
      sentAt: new Date()
    });
    
    await order.save();
    
    // Notify other party
    const io = req.app.get('io');
    const notifyUserId = order.client.toString() === req.user._id.toString() 
      ? order.freelancer 
      : order.client;
    
    if (io) {
      io.to(`user_${notifyUserId}`).emit('order_message', {
        orderId: order._id,
        message: {
          sender: req.user._id,
          message: message || '',
          attachments,
          sentAt: new Date()
        }
      });
    }
    
    res.json({
      message: 'Message sent successfully',
      orderMessage: order.messages[order.messages.length - 1]
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;