const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const register = async (req, res) => {
  try {
    const { name, email, password, location, bio } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, location, bio });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      if (user.isBanned) return res.status(403).json({ message: 'This account has been banned' });
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => res.json(req.user);

// Adds "https://" automatically if someone types a link without a protocol
// (e.g. "linkedin.com/in/x" -> "https://linkedin.com/in/x") — small thing,
// but avoids broken links from a common, easy-to-make mistake.
const normalizeUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio, location, profilePicUrl, linkedinUrl, instagramUrl, websiteUrl } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (profilePicUrl !== undefined) user.profilePicUrl = profilePicUrl;
    if (linkedinUrl !== undefined) user.linkedinUrl = normalizeUrl(linkedinUrl);
    if (instagramUrl !== undefined) user.instagramUrl = normalizeUrl(instagramUrl);
    if (websiteUrl !== undefined) user.websiteUrl = normalizeUrl(websiteUrl);
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/me/profile-picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const base64 = req.file.buffer.toString('base64');
    const user = await User.findById(req.user._id);
    // Stored as a base64 data URI directly in MongoDB — same reasoning as
    // certificate files: Render's free-tier disk is wiped on every
    // restart/redeploy, so anything saved there would silently disappear.
    user.profilePicUrl = `data:${req.file.mimetype};base64,${base64}`;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/auth/me/profile-picture
const removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.profilePicUrl = '';
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond the same way whether or not the email exists —
    // this avoids letting someone probe which emails are registered.
    const genericMessage = { message: 'If that email is registered, a reset link has been created.' };

    if (!user) return res.json(genericMessage);

    // Generate a random raw token, but only store its hash in the DB.
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password/${rawToken}`;

    const emailSent = await sendEmail({
      to: user.email,
      subject: 'Reset your SkillSwap password',
      html: `<p>Hi ${user.name},</p><p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
    });

    // If no email service is configured (EMAIL_USER/EMAIL_PASS unset), we
    // return the link directly so the feature still works end-to-end
    // during development/evaluation without needing SMTP setup.
    if (!emailSent) {
      return res.json({ ...genericMessage, devResetLink: resetLink });
    }

    res.json(genericMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    user.password = password; // pre-save hook hashes this automatically
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile, getUserPublicProfile, forgotPassword, resetPassword, uploadProfilePicture, removeProfilePicture };
