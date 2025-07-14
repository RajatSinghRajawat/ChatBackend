const express = require('express');
const { register, login, logOut, updateUser, getProfile, getAllUsers, getUserById, searchUsers } = require('../controllers/authentication');
const upload = require('../../multer');
const verifyUser = require('../middleware/userAuthenticate');
const router = express.Router();
const { body } = require('express-validator');

// Register
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], register);

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], register);

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], login);

router.post("/logout", logOut)
router.patch("/update/:id", verifyUser, upload.any(), updateUser);

// Get current user profile
router.get('/profile', verifyUser, getProfile);

// Get all users for chat
router.get('/users', verifyUser, getAllUsers);

router.get('/user/:id', verifyUser, getUserById);
router.get('/search', verifyUser, searchUsers);

module.exports = router;