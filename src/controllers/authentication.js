const tryCatch = require('../middleware/tryCatchhandler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require("zod");
const { validationResult } = require('express-validator');

const saltRounds = 10;

const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

const register = tryCatch(async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ msg: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

const login = tryCatch(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({ token, user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

const logOut = tryCatch(async (req, res) => {
    const { email } = req.body
    const Cheackuser = await User.findOne({ email })
    if (!Cheackuser) {
        return res.json({ status: false, error: "Invalid Email" });
    }
    const user = await User.findOneAndUpdate(
        { email },
        { token: null }
    );
    if (!user) {
        return res.status(404).json({ status: false, error: "User not found" });
    }

    res.status(200).json({ status: true, message: "Logout successful" });

})

const updateUser = tryCatch(async (req, res) => {
  const updateFields = {};
  const allowedFields = [
    'name', 'surname', 'username', 'personalPhone', 'workPhone',
    'city', 'country', 'organization', 'bio'
  ];
  allowedFields.forEach(field => {
    if (req.body[field]) updateFields[field] = req.body[field];
  });

  // Handle avatar upload
  if (req.files && req.files.length > 0) {
    updateFields.avatar = `http://${req.get("host")}/Uploads/${req.files[0].filename}`;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ message: "User updated successfully", user });
});

const getProfile = tryCatch(async (req, res) => {
    // req.user should be set by authentication middleware
    if (!req.user) {
        return res.status(401).json({ msg: 'Unauthorized' });
    }
    const { _id, name, email, avatar } = req.user;
    res.status(200).json({ id: _id, name, email, avatar });
});

// Get all users for chat (excluding current user)
const getAllUsers = tryCatch(async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const users = await User.find({ _id: { $ne: currentUserId } })
            .select('name personalPhone username email avatar')
            .sort({ name: 1 });
        
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ msg: 'Server error while fetching users' });
    }
});

const getUserById = tryCatch(async (req, res) => {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password -otp -token -img -role -createdAt -__v');
    if (!user) {
        return res.status(404).json({ msg: 'User not found' });
    }
    res.status(200).json({ success: true, user });
});

module.exports = { register, login, logOut, updateUser, getProfile, getAllUsers, getUserById };
