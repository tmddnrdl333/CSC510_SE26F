const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { hashPassword, verifyPassword, signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['customer', 'restaurant', 'delivery']),
  body('profile').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, profile } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user
    const user = await User.create({
      email,
      password: await hashPassword(password),
      role,
      profile
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      token: signToken(user)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!(await verifyPassword(user, password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token: signToken(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Current user from the session token (M1)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile by email and password (simple lookup)
router.post('/profile', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    
    if (!(await verifyPassword(user, password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile by email and password
router.put('/profile', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }),
  body('profile').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, profile } = req.body;
    const user = await User.findByEmail(email);
    
    if (!(await verifyPassword(user, password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const updatedUser = await user.update({ profile });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
