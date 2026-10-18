const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, default: '', trim: true, maxlength: 20 },
    bio: { type: String, default: '', maxlength: 500 },
    about: { type: String, default: '', maxlength: 2000 },
    qualification: { type: String, default: '', maxlength: 200 },
    hobbies: { type: String, default: '', maxlength: 300 },
    awards: { type: String, default: '', maxlength: 500 },
    location: { type: String, default: '', maxlength: 120 },
    profilePicUrl: { type: String, default: '' },
    avatar: {
      file: { type: String, default: null },
      mime: { type: String, default: null },
    },
    linkedinUrl: { type: String, default: '', maxlength: 300 },
    instagramUrl: { type: String, default: '', maxlength: 300 },
    websiteUrl: { type: String, default: '', maxlength: 300 },

    // SkillSwap Verified Badge: Earned strictly through completed and rated exchanges (threshold >= 5, rating >= 3.5)
    isVerified: { type: Boolean, default: false, index: true },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    trustScore: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    completedSwapsCount: { type: Number, default: 0, index: true },
    completedSwaps: { type: Number, default: 0 },

    // Non-OTP Authentication & Session Security
    tokenVersion: { type: Number, default: 0 },
    failedLogins: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    isEmailVerified: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: true },

    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    isBanned: { type: Boolean, default: false, index: true },

    // Cryptographic Token Password Recovery (Non-OTP)
    resetPasswordToken: { type: String, default: undefined },
    resetPasswordExpire: { type: Date, default: undefined },
  },
  { timestamps: true }
);

// Synchronize aliases on save
userSchema.pre('save', async function (next) {
  if (this.isModified('isVerified')) this.verified = this.isVerified;
  if (this.isModified('verified')) this.isVerified = this.verified;
  if (this.isModified('rating')) this.ratingAvg = this.rating;
  if (this.isModified('ratingAvg')) this.rating = this.ratingAvg;
  if (this.isModified('completedSwapsCount')) this.completedSwaps = this.completedSwapsCount;
  if (this.isModified('completedSwaps')) this.completedSwapsCount = this.completedSwaps;

  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
