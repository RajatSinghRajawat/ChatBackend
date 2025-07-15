const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');
const { validationResult } = require('express-validator');

// Get users for sidebar (excluding self)
exports.getUserSidebarmessage = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select('-password');
    res.status(200).json(filteredUsers);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get messages between two users
exports.getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userToChatId },
        { sender: userToChatId, receiver: myId },
      ],
    }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send a message (with validation)
exports.sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { content } = req.body;
    const { id: receiver } = req.params;
    const sender = req.user._id;
    let type = 'text';
    let fileUrls = [];
    let msgContent = content || '';
    if (req.files && req.files.length > 0) {
      fileUrls = req.files.map(file => `http://${req.get("host")}/Uploads/${file.filename}`);
      const exts = req.files.map(file => file.originalname.split('.').pop().toLowerCase());
      const allImages = exts.every(ext => ["jpg","jpeg","png","gif","avif"].includes(ext));
      const allVideos = exts.every(ext => ["mp4"].includes(ext));
      if (allImages) type = 'image';
      else if (allVideos) type = 'video';
      else type = 'mixed';
      msgContent = '';
    }
    if (!msgContent && fileUrls.length === 0) {
      return res.status(400).json({ msg: 'Message content or image/video is required' });
    }
    const newMessage = new Message({
      sender,
      receiver,
      content: msgContent,
      type,
      fileUrls,
    });
    await newMessage.save();
    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('new_message', {
        message: newMessage,
        senderId: sender,
        receiverId: receiver
      });
    }
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send group message
exports.sendGroupMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const { groupId } = req.params;
    const sender = req.user._id;
    let type = 'text';
    let fileUrls = [];
    let msgContent = content || '';

    // Validate group
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.map(String).includes(String(sender))) return res.status(403).json({ error: 'Not a group member' });

    // Handle files (if any)
    if (req.files && req.files.length > 0) {
      fileUrls = req.files.map(file => `http://${req.get("host")}/Uploads/${file.filename}`);
      const exts = req.files.map(file => file.originalname.split('.').pop().toLowerCase());
      const allImages = exts.every(ext => ["jpg","jpeg","png","gif","avif"].includes(ext));
      const allVideos = exts.every(ext => ["mp4"].includes(ext));
      if (allImages) type = 'image';
      else if (allVideos) type = 'video';
      else type = 'mixed';
      msgContent = '';
    }
    if (!msgContent && fileUrls.length === 0) {
      return res.status(400).json({ msg: 'Message content or image/video is required' });
    }

    const newMessage = new Message({
      sender,
      group: groupId,
      content: msgContent,
      type,
      fileUrls,
    });
    await newMessage.save();

    // Emit socket event for group
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupId}`).emit('new_group_message', {
        message: newMessage,
        groupId,
        senderId: sender
      });
    }
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get group messages
exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.map(String).includes(String(userId))) return res.status(403).json({ error: 'Not a group member' });

    const messages = await Message.find({ group: groupId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get unread message counts for each user
exports.getUnreadCounts = async (req, res) => {
  try {
    const myId = req.user._id;
    // Aggregate unread messages grouped by sender
    const counts = await Message.aggregate([
      { $match: { receiver: myId, read: false } },
      { $group: { _id: "$sender", count: { $sum: 1 } } }
    ]);
    // Format: [{ userId, count }]
    res.json(counts.map(c => ({ userId: c._id, count: c.count })));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark messages as read when user opens chat
exports.markMessagesAsRead = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: senderId } = req.params;
    await Message.updateMany(
      { sender: senderId, receiver: myId, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }
    await message.deleteOne();
    // Optionally emit socket event here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Edit a message
exports.editMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }
    message.content = content;
    await message.save();
    // Optionally emit socket event here
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
