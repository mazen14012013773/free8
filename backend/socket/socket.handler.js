const jwt = require('jsonwebtoken');
const { User, Message, Conversation } = require('../models');

// Store connected users
const connectedUsers = new Map();

const socketHandler = (io) => {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }
      
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Store connected user
    connectedUsers.set(socket.userId, socket.id);
    
    // Join user's personal room
    socket.join(`user_${socket.userId}`);
    
    // Update user's online status
    User.findByIdAndUpdate(socket.userId, { lastActive: new Date() }).exec();
    
    // Join conversation rooms
    socket.on('join_conversation', async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }
        
        // Check if user is participant
        if (!conversation.participants.some(p => p.toString() === socket.userId)) {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
          return;
        }
        
        socket.join(`conversation_${conversationId}`);
        socket.emit('joined_conversation', { conversationId });
        
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
      } catch (error) {
        console.error('Join conversation error:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });
    
    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      socket.emit('left_conversation', { conversationId });
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });
    
    // Handle typing status
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping
      });
    });
    
    // Handle message read status
    socket.on('mark_read', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        
        if (message && message.recipient.toString() === socket.userId) {
          await message.markAsRead();
          
          // Notify sender that message was read
          io.to(`user_${message.sender}`).emit('message_read', {
            messageId,
            readAt: message.readAt
          });
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });
    
    // Handle direct message
    socket.on('send_message', async (data, callback) => {
      try {
        const { recipientId, content, conversationId, attachments = [] } = data;
        
        // Validate recipient
        const recipient = await User.findById(recipientId);
        if (!recipient) {
          if (callback) callback({ error: 'Recipient not found' });
          return;
        }
        
        let conversation;
        
        if (conversationId) {
          conversation = await Conversation.findById(conversationId);
        } else {
          conversation = await Conversation.findOne({
            participants: { $all: [socket.userId, recipientId] },
            type: 'direct'
          });
        }
        
        if (!conversation) {
          conversation = new Conversation({
            participants: [socket.userId, recipientId],
            type: 'direct'
          });
        }
        
        // Create message
        const message = new Message({
          conversation: conversation._id,
          sender: socket.userId,
          recipient: recipientId,
          content,
          attachments
        });
        
        await message.save();
        
        // Update conversation
        conversation.lastMessage = message._id;
        await conversation.incrementUnread(recipientId);
        await conversation.save();
        
        await message.populate('sender', 'firstName lastName username profilePicture');
        
        // Emit to recipient
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
        
        // Emit to conversation room
        io.to(`conversation_${conversation._id}`).emit('message_sent', {
          message
        });
        
        if (callback) callback({ success: true, message });
      } catch (error) {
        console.error('Send message error:', error);
        if (callback) callback({ error: 'Failed to send message' });
      }
    });
    
    // Handle user status request
    socket.on('check_status', async (userId, callback) => {
      const isOnline = connectedUsers.has(userId);
      
      if (!isOnline) {
        // Get last active from database
        const user = await User.findById(userId).select('lastActive');
        if (callback) callback({
          online: false,
          lastActive: user?.lastActive
        });
      } else {
        if (callback) callback({ online: true });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      connectedUsers.delete(socket.userId);
      
      // Update last active
      User.findByIdAndUpdate(socket.userId, { lastActive: new Date() }).exec();
    });
  });
  
  // Make connected users available globally
  global.connectedUsers = connectedUsers;
  global.io = io;
};

module.exports = socketHandler;