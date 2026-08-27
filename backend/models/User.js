const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    profilePicUrl: { type: String, default: '' },
    // Optional links shown on the public profile so a potential swap
    // partner can look someone up before agreeing to meet — genuinely
    // useful for trust, on top of the in-app rating system.
    linkedinUrl: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
    websiteUrl: { type: String, default: '' },
    trustScore: { type: Number, default: 0 },
    completedSwapsCount: { type: Number, default: 0 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBanned: { type: Boolean, default: false },
    // Password reset — we store a hashed version of the token (never the
    // raw token) so that even if the database were exposed, the tokens
    // themselves couldn't be used to reset anyone's password.
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
