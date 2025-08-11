const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');

// Configure nodemailer for sending reset password emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Middleware to validate admin existence
const checkAdminExists = async (req, res, next) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Error checking admin existence:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to verify JWT and admin role
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    // Check if the user is an admin
    Admin.findById(user.userId)
      .then((admin) => {
        if (!admin) {
          return res.status(403).json({ message: 'Admin access required' });
        }
        req.user = user;
        next();
      })
      .catch((error) => {
        console.error('Error verifying admin:', error);
        res.status(500).json({ message: 'Server error' });
      });
  });
};

// Admin Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ token, userId: admin._id, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const resetToken = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    const resetLink = `${process.env.FRONTEND_URL}/admin/reset-password/${resetToken}`;
    await transporter.sendMail({
      to: email,
      subject: 'Admin Password Reset',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your admin password. This link expires in 15 minutes.</p>`,
    });

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Create Account
router.post('/create-account', async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({
      email,
      password: hashedPassword,
    });

    await admin.save();

    const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({
      token,
      userId: admin._id,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /users - Fetch all users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find().select('email password resetPasswordToken resetPasswordExpires createdAt');
    res.status(200).json(users.map(user => ({
      id: user._id,
      email: user.email,
      password: user.password,
      resetPassword: user.resetPasswordToken, // Map to frontend field name
      resetPasswordExpires: user.resetPasswordExpires,
      createdAt: user.createdAt,
    })));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// GET /user/:id - Fetch a single user
router.get('/user/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('email password resetPasswordToken resetPasswordExpires createdAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      id: user._id,
      email: user.email,
      password: user.password,
      resetPassword: user.resetPasswordToken, // Map to frontend field name
      resetPasswordExpires: user.resetPasswordExpires,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

// DELETE /user/:id - Delete a user
router.delete('/user/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// PUT /user/:id - Update a user
router.put('/user/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { email, password, resetPassword, resetPasswordExpires } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    user.email = email;
    if (password) {
      user.password = password; // Will be hashed by pre-save hook
    }
    if (resetPassword !== undefined) {
      user.resetPasswordToken = resetPassword || null;
    }
    if (resetPasswordExpires !== undefined) {
      user.resetPasswordExpires = resetPasswordExpires ? new Date(resetPasswordExpires) : null;
    }

    await user.save();

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Server error while updating user' });
    }
  }
});

module.exports = router;