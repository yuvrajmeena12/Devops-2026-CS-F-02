const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, default: '', index: true },
    bio: { type: String, default: '', maxlength: 500 },
    about: { type: String, default: '', maxlength: 2000 },
    qualification: { type: String, default: '', maxlength: 200 },
    hobbies: { type: String, default: '', maxlength: 300 },
    awards: { type: String, default: '', maxlength: 500 },
    location: { type: String, default: '', maxlength: 120 },
    profilePicUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '', maxlength: 300 },
    instagramUrl: { type: String, default: '', maxlength: 300 },
    websiteUrl: { type: String, default: '', maxlength: 300 },
    
    // SkillSwap Verified Badge: Earned strictly through completed and rated interactions (threshold >= 5)
    isVerified: { type: Boolean, default: false, index: true },
    trustScore: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    completedSwapsCount: { type: Number, default: 0, index: true },
    
    // Account verification via OTP
    isEmailVerified: { type: Boolean, default: false },
    otp: { type: String, default: undefined },
    otpExpire: { type: Date, default: undefined },
    otpAttempts: { type: Number, default: 0 },
    otpCooldown: { type: Date, default: undefined },

    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    isBanned: { type: Boolean, default: false, index: true },

    // Password reset tokens
    resetPasswordToken: { type: String, default: undefined },
    resetPasswordExpire: { type: Date, default: undefined },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
