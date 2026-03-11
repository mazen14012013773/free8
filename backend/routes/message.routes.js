const express = require('express');
const { Message, Conversation, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { sendMessageValidation } = require('../middleware/validation');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true
    })
      .populate('participants', 'firstName lastName username profilePicture isActive')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Format conversations to show other participant
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== req.user._id.toString()
      );
      
      return {
        id: conv._id,
        otherParticipant: otherParticipant || conv.participants[0],
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount?.get(req.user._id.toString()) || 0,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt
      };
    });
    
    const total = await Conversation.countDocuments({
      participants: req.user._id,
      isActive: true
    });
    
    res.json({
      conversations: formattedConversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/conversations/:conversationId
// @desc    Get conversation details
// @access  Private
router.get('/conversations/:conversationId', authenticate, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate('participants', 'firstName lastName username profilePicture');
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is participant
    if (!conversation.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/conversations
// @desc    Start a new conversation
// @access  Private
router.post('/conversations', authenticate, async (req, res) => {
  try {
    const { recipientId } = req.body;
    
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }
    
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Cannot message yourself
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' });
    }
    
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
      type: 'direct'
    });
    
    if (conversation) {
      await conversation.populate('participants', 'firstName lastName username profilePicture');
      return res.json({
        message: 'Conversation already exists',
        conversation
      });
    }
    
    // Create new conversation
    conversation = new Conversation({
      participants: [req.user._id, recipientId],
      type: 'direct'
    });
    
    await conversation.save();
    await conversation.populate('participants', 'firstName lastName username profilePicture');
    
    res.status(201).json({
      message: 'Conversation started',
      conversation
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/conversations/:conversationId/messages
// @desc    Get messages in a conversation
// @access  Private
router.get('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is participant
    if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const messages = await Message.find({
      conversation: req.params.conversationId,
      isDeleted: false
    })
      .populate('sender', 'firstName lastName username profilePicture')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Mark messages as read
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        recipient: req.user._id,
        isRead: false
      },
      { isRead: true, readAt: new Date() }
    );
    
    // Clear unread count for this user
    await conversation.clearUnread(req.user._id);
    
    const total = await Message.countDocuments({
      conversation: req.params.conversationId,
      isDeleted: false
    });
    
    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', 
  authenticate, 
  upload.array('attachments', 5),
  handleUploadError,
  sendMessageValidation,
  async (req, res) => {
    try {
      const { recipientId, content, conversationId, replyTo } = req.body;
      
      // Check if recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
      
      // Cannot message yourself
      if (recipientId === req.user._id.toString()) {
        return res.status(400).json({ message: 'Cannot send message to yourself' });
      }
      
      let conversation;
      
      if (conversationId) {
        // Use existing conversation
        conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: 'Conversation not found' });
        }
        
        if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
          return res.status(403).json({ message: 'Not authorized' });
        }
      } else {
        // Find or create conversation
        conversation = await Conversation.findOne({
          participants: { $all: [req.user._id, recipientId] },
          type: 'direct'
        });
        
        if (!conversation) {
          conversation = new Conversation({
            participants: [req.user._id, recipientId],
            type: 'direct'
          });
          await conversation.save();
        }
      }
      
      // Handle attachments
      const attachments = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          let type = 'document';
          if (file.mimetype.startsWith('image/')) type = 'image';
          else if (file.mimetype.startsWith('video/')) type = 'video';
          else if (file.mimetype.startsWith('audio/')) type = 'audio';
          
          attachments.push({
            filename: file.originalname,
            url: `/uploads/attachments/${file.filename}`,
            type,
            size: file.size
          });
        });
      }
      
      // Create message
      const message = new Message({
        conversation: conversation._id,
        sender: req.user._id,
        recipient: recipientId,
        content: content || '',
        attachments,
        replyTo: replyTo || null
      });
      
      await message.save();
      
      // Update conversation
      conversation.lastMessage = message._id;
      await conversation.incrementUnread(recipientId);
      await conversation.save();
      
      await message.populate('sender', 'firstName lastName username profilePicture');
      
      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${recipientId}`).emit('new_message', {
          message: {
            id: message._id,
            conversation: conversation._id,
            sender: message.sender,
            content: message.content,
            attachments: message.attachments,
            createdAt: message.createdAt
          }
        });
        
        io.to(`conversation_${conversation._id}`).emit('message_sent', {
          message
        });
      }
      
      res.status(201).json({
        message: 'Message sent successfully',
        messageData: message
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await message.markAsRead();
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message (soft delete)
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get unread message count
// @access  Private
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      isRead: false,
      isDeleted: false
    });
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/:id/reaction
// @desc    Add reaction to message
// @access  Private
router.post('/:id/reaction', authenticate, async (req, res) => {
  try {
    const { emoji } = req.body;
    
    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }
    
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is part of the conversation
    const conversation = await Conversation.findById(message.conversation);
    if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await message.addReaction(req.user._id, emoji);
    
    res.json({
      message: 'Reaction added',
      reactions: message.reactions
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/:id/reaction
// @desc    Remove reaction from message
// @access  Private
router.delete('/:id/reaction', authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    await message.removeReaction(req.user._id);
    
    res.json({
      message: 'Reaction removed',
      reactions: message.reactions
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;