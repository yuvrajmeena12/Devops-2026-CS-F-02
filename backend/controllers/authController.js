const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sniff, saveUpload } = require('../utils/upload');
const { recomputeReputation } = require('../utils/reputation');

const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign(
    { id, tokenVersion },
    process.env.JWT_SECRET || 'skillswapsecret2026xyz123',
    { expiresIn: '30d' }
  );
};

const normalizeUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

// POST /api/auth/register (OTP EXCLUDED)
const register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, location, bio } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is mandatory' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is mandatory' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is mandatory' });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const cleanedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists' });
    }

    // Direct active account registration without OTP
    const user = await User.create({
      name: name.trim(),
      email: cleanedEmail,
      password,
      phone: phone ? phone.trim() : '',
      location: location ? location.trim() : '',
      bio: bio ? bio.trim() : '',
      isEmailVerified: true,
      emailVerified: true,
      tokenVersion: 0,
      failedLogins: 0,
    });

    const token = generateToken(user._id, user.tokenVersion);

    const safeUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      role: user.role,
      isVerified: user.isVerified,
      verified: user.isVerified,
      rating: user.rating,
      ratingAvg: user.ratingAvg,
      ratingCount: user.ratingCount,
      completedSwapsCount: user.completedSwapsCount,
      profilePicUrl: user.profilePicUrl,
    };

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: safeUser,
      ...safeUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login (With Brute-force exponential lockout & tokenVersion)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanedEmail });

    // Check account lockout
    if (user && user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil - new Date()) / (60 * 1000));
      return res.status(429).json({
        success: false,
        message: `Account is temporarily locked due to consecutive failed attempts. Please try again in ${waitMinutes} minute(s).`,
      });
    }

    if (!user || !(await user.matchPassword(password))) {
      if (user) {
        user.failedLogins = (user.failedLogins || 0) + 1;
        if (user.failedLogins >= 5) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
        }
        await user.save();
      }
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'This account has been suspended' });
    }

    // Reset login failures on success
    if (user.failedLogins > 0 || user.lockUntil) {
      user.failedLogins = 0;
      user.lockUntil = null;
      await user.save();
    }

    const token = generateToken(user._id, user.tokenVersion || 0);

    const safeUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      about: user.about,
      qualification: user.qualification,
      hobbies: user.hobbies,
      awards: user.awards,
      location: user.location,
      role: user.role,
      isVerified: user.isVerified,
      verified: user.isVerified,
      rating: user.rating,
      ratingAvg: user.ratingAvg,
      ratingCount: user.ratingCount,
      completedSwapsCount: user.completedSwapsCount,
      profilePicUrl: user.profilePicUrl,
    };

    res.json({
      success: true,
      token,
      user: safeUser,
      ...safeUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    user: req.user,
    ...req.user.toObject(),
  });
};

// PUT /api/auth/me & PUT /api/users/me
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      bio,
      about,
      qualification,
      hobbies,
      awards,
      location,
      linkedinUrl,
      instagramUrl,
      websiteUrl,
      profilePicUrl,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Explicit field allowlist only
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (about !== undefined) user.about = about.trim();
    if (qualification !== undefined) user.qualification = qualification.trim();
    if (hobbies !== undefined) user.hobbies = Array.isArray(hobbies) ? hobbies.join(', ') : hobbies;
    if (awards !== undefined) user.awards = Array.isArray(awards) ? awards.join(', ') : awards;
    if (location !== undefined) user.location = location.trim();
    if (profilePicUrl !== undefined) user.profilePicUrl = profilePicUrl;
    if (linkedinUrl !== undefined) user.linkedinUrl = normalizeUrl(linkedinUrl);
    if (instagramUrl !== undefined) user.instagramUrl = normalizeUrl(instagramUrl);
    if (websiteUrl !== undefined) user.websiteUrl = normalizeUrl(websiteUrl);

    await user.save();
    res.json({
      success: true,
      user,
      ...user.toObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/change-password (Authenticated with Session Revocation)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const matches = await user.matchPassword(currentPassword);
    if (!matches) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword; // Hashed by pre-save hook
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all prior issued tokens
    await user.save();

    const freshToken = generateToken(user._id, user.tokenVersion);
    res.json({
      success: true,
      message: 'Password changed successfully',
      token: freshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  res.json({ success: true, message: 'Signed out successfully' });
};

// POST /api/auth/forgot-password (Cryptographic Token without OTP)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email is registered, a password reset link has been dispatched.',
      });
    }

    // Generate random 32-byte hex token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0].trim() : 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password/${resetToken}`;

    res.json({
      success: true,
      message: 'If that email is registered, a password reset link has been dispatched.',
      devResetLink: resetLink,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/reset-password/:token (Redeem token without OTP)
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'This password reset link is invalid or has expired' });
    }

    user.password = password; // Pre-save hook hashes it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all prior sessions
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/user/:id & GET /api/users/:id (Public profile view)
const getUserPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -tokenVersion -failedLogins -lockUntil -resetPasswordToken -resetPasswordExpire'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }

    // Auto-recalculate reputation in background to ensure freshness
    recomputeReputation(user._id).catch(() => {});

    const profile = {
      _id: user._id,
      id: user._id,
      name: user.name,
      bio: user.bio,
      about: user.about,
      qualification: user.qualification,
      hobbies: user.hobbies,
      awards: user.awards,
      location: user.location,
      profilePicUrl: user.profilePicUrl,
      linkedinUrl: user.linkedinUrl,
      instagramUrl: user.instagramUrl,
      websiteUrl: user.websiteUrl,
      isVerified: user.isVerified,
      verified: user.isVerified,
      trustScore: user.trustScore || user.rating || 0,
      rating: user.rating || 0,
      ratingAvg: user.ratingAvg || user.rating || 0,
      ratingCount: user.ratingCount || 0,
      completedSwapsCount: user.completedSwapsCount || 0,
      completedSwaps: user.completedSwaps || user.completedSwapsCount || 0,
      createdAt: user.createdAt,
    };

    res.json({
      profile,
      ...profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/me/profile-picture (Avatar upload with magic-byte validation)
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    // Inspect genuine binary magic header bytes
    const detected = sniff(req.file.buffer);
    if (!detected || !['png', 'jpg', 'webp'].includes(detected.ext)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Allowed formats: PNG, JPG, or WEBP.',
      });
    }

    const base64 = req.file.buffer.toString('base64');
    const dataUri = `data:${detected.mime};base64,${base64}`;

    const user = await User.findById(req.user._id);
    user.profilePicUrl = dataUri;
    user.avatar = {
      file: `avatar_${user._id}.${detected.ext}`,
      mime: detected.mime,
    };
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      user,
      ...user.toObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/auth/me/profile-picture
const removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.profilePicUrl = '';
    user.avatar = { file: null, mime: null };
    await user.save();
    res.json({
      success: true,
      message: 'Profile picture removed successfully',
      user,
      ...user.toObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  getUserPublicProfile,
  uploadProfilePicture,
  removeProfilePicture,
};
