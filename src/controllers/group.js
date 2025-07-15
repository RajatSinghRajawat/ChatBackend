const Group = require('../models/Group');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Create a group
exports.createGroup = [
  body('name').isLength({ min: 2 }).withMessage('Group name required'),
  body('members').isArray({ min: 2 }).withMessage('At least 2 members required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, members, avatar } = req.body;
    const createdBy = req.user._id;

    // Ensure creator is in the group
    if (!members.includes(String(createdBy))) members.push(String(createdBy));

    // Validate users exist
    const users = await User.find({ _id: { $in: members } });
    if (users.length !== members.length) return res.status(400).json({ error: 'Invalid members' });

    const group = new Group({ name, members, avatar, createdBy });
    await group.save();
    res.status(201).json(group);
  }
];

// Get groups for user
exports.getGroups = async (req, res) => {
  const userId = req.user._id;
  const groups = await Group.find({ members: userId }).populate('members', 'name email avatar');
  res.json(groups);
}; 