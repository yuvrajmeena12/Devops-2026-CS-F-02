const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { generateOTP, sendOtpEmail } = require('../utils/otpHelper');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '30d' });

const normalizeUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, location, bio } = req.body;

    // 1. Mandatory Field Validations
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full name is mandatory' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is mandatory' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Mobile number is mandatory for account security and verification' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is mandatory' });
    }
    if (!confirmPassword) {
      return res.status(400).json({ message: 'Please confirm your password' });
    }

    // 2. Format Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Mobile number validation: accept 10-15 digits (e.g. +91 9876543210 or 9876543210)
    const cleanedPhone = phone.trim().replace(/[\s-]/g, '');
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      return res.status(400).json({ message: 'Please provide a valid 10 to 15 digit mobile number' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // 3. Duplicate Account Prevention
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { phone: cleanedPhone }],
    });

    if (existingUser && existingUser.isEmailVerified) {
      if (existingUser.email === email.toLowerCase().trim()) {
        return res.status(400).json({ message: 'An account with this email address already exists' });
      }
      if (existingUser.phone === cleanedPhone) {
        return res.status(400).json({ message: 'An account with this mobile number already exists' });
      }
    }

    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const otpCooldown = new Date(Date.now() + 60 * 1000); // 1 minute cooldown

    let user;
    if (existingUser && !existingUser.isEmailVerified) {
      existingUser.name = name.trim();
      existingUser.email = email.toLowerCase().trim();
      existingUser.password = password;
      existingUser.phone = cleanedPhone;
      existingUser.location = location ? location.trim() : existingUser.location;
      existingUser.bio = bio ? bio.trim() : existingUser.bio;
      existingUser.otp = otp;
      existingUser.otpExpire = otpExpire;
      existingUser.otpAttempts = 0;
      existingUser.otpCooldown = otpCooldown;
      user = await existingUser.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        phone: cleanedPhone,
        location: location ? location.trim() : '',
        bio: bio ? bio.trim() : '',
        otp,
        otpExpire,
        otpAttempts: 0,
        otpCooldown,
        isEmailVerified: false,
      });
    }

    const emailSent = await sendOtpEmail(user.email, otp, 'Account Registration & Mobile Verification');

    res.status(201).json({
      message: 'Verification OTP sent successfully',
      email: user.email,
      phone: user.phone,
      requiresOtp: true,
      devOtp: !emailSent ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.otp || !user.otpExpire) {
      return res.status(400).json({ message: 'No active OTP request found. Please request a new OTP.' });
    }

    if (new Date() > user.otpExpire) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({ message: 'Too many failed attempts. Please request a new OTP.' });
    }

    if (user.otp !== otp.trim()) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    // OTP verified successfully
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    user.otpAttempts = 0;
    user.otpCooldown = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      role: user.role,
      profilePicUrl: user.profilePicUrl,
      token: generateToken(user._id),
      message: 'Account verified successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/resend-otp
const resendOtp = async (req, res) => {
  try {
    const { email, purpose = 'Verification' } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otpCooldown && new Date() < user.otpCooldown) {
      const remainingSec = Math.ceil((user.otpCooldown - new Date()) / 1000);
      return res.status(429).json({ message: `Please wait ${remainingSec}s before requesting another code.` });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpCooldown = new Date(Date.now() + 60 * 1000);
    await user.save();

    const emailSent = await sendOtpEmail(user.email, otp, purpose);

    res.json({
      message: 'A new OTP has been sent',
      devOtp: !emailSent ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && (await user.matchPassword(password))) {
      if (user.isBanned) return res.status(403).json({ message: 'This account has been suspended' });
      
      // If user registered before email verification was enforced or has verified
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        role: user.role,
        profilePicUrl: user.profilePicUrl,
        token: generateToken(user._id),
      });
    }

    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/send-login-otp
const sendLoginOtp = async (req, res) => {
  try {
    const { identifier } = req.body; // email or phone
    if (!identifier) return res.status(400).json({ message: 'Email or phone number is required' });

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: 'No registered user found with that email/phone' });
    }

    if (user.isBanned) return res.status(403).json({ message: 'This account has been suspended' });

    if (user.otpCooldown && new Date() < user.otpCooldown) {
      const remainingSec = Math.ceil((user.otpCooldown - new Date()) / 1000);
      return res.status(429).json({ message: `Please wait ${remainingSec}s before requesting another code.` });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpCooldown = new Date(Date.now() + 60 * 1000);
    await user.save();

    const emailSent = await sendOtpEmail(user.email, otp, 'Login Authentication');

    res.json({
      message: `OTP sent to ${user.email}`,
      email: user.email,
      devOtp: !emailSent ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/verify-login-otp
const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.otp || !user.otpExpire) {
      return res.status(400).json({ message: 'No active OTP login session. Please request a new OTP.' });
    }

    if (new Date() > user.otpExpire) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
    }

    if (user.otp !== otp.trim()) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    user.otp = undefined;
    user.otpExpire = undefined;
    user.otpAttempts = 0;
    user.otpCooldown = undefined;
    user.isEmailVerified = true;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      role: user.role,
      profilePicUrl: user.profilePicUrl,
      token: generateToken(user._id),
      message: 'Logged in successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/forgot-password-otp
const forgotPasswordOtp = async (req, res) => {
  try {
    const { identifier } = req.body; // email or phone
    if (!identifier) return res.status(400).json({ message: 'Email or phone number is required' });

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    });

    if (!user) {
      return res.json({ message: 'If an account exists, a verification code has been generated.' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpCooldown = new Date(Date.now() + 60 * 1000);
    await user.save();

    const emailSent = await sendOtpEmail(user.email, otp, 'Password Reset');

    res.json({
      message: 'Password reset OTP has been sent',
      email: user.email,
      devOtp: !emailSent ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/reset-password-otp
const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.otp || !user.otpExpire || new Date() > user.otpExpire) {
      return res.status(400).json({ message: 'OTP is invalid or expired. Please request a new one.' });
    }

    if (user.otp !== otp.trim()) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    user.password = password; // pre-save hook hashes this
    user.otp = undefined;
    user.otpExpire = undefined;
    user.otpAttempts = 0;
    user.otpCooldown = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => res.json(req.user);

// PUT /api/auth/me
const updateProfile = async (req, res) => {
  try {
    const { name, bio, about, qualification, hobbies, awards, phone, location, profilePicUrl, linkedinUrl, instagramUrl, websiteUrl } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (about !== undefined) user.about = about;
    if (qualification !== undefined) user.qualification = qualification;
    if (hobbies !== undefined) user.hobbies = hobbies;
    if (awards !== undefined) user.awards = awards;
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

// GET /api/auth/user/:id (public profile)
const getUserPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -otp -otpExpire -otpCooldown -resetPasswordToken -resetPasswordExpire'
    );
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

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  sendLoginOtp,
  verifyLoginOtp,
  forgotPasswordOtp,
  resetPasswordWithOtp,
  getMe,
  updateProfile,
  getUserPublicProfile,
  uploadProfilePicture,
  removeProfilePicture,
};
