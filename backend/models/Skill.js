const mongoose = require('mongoose');
const { CATEGORIES, LEVELS } = require('../utils/constants');

const skillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    name: { type: String, trim: true, maxlength: 120 },
    nameLower: { type: String, index: true },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'Other',
      index: true,
    },
    description: { type: String, default: '', maxlength: 2000 },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert', 'Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'intermediate',
    },
    type: { type: String, enum: ['teach', 'want', 'learn'], required: true, index: true },
    mode: { type: String, enum: ['online', 'in-person', 'both'], default: 'both' },

    // Proof / Certificate supporting documentation for teaching skills
    certificateFile: { type: String, default: '' },
    certificateFileName: { type: String, default: '', maxlength: 255 },
    certificateFileType: { type: String, default: '', maxlength: 100 },
    proof: {
      file: { type: String, default: null },
      mime: { type: String, default: null },
      originalName: { type: String, default: null },
      size: { type: Number, default: 0 },
      uploadedAt: { type: Date, default: null },
    },
    hasProof: { type: Boolean, default: false, index: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

skillSchema.pre('save', function (next) {
  if (this.title && !this.name) this.name = this.title;
  if (this.name && !this.title) this.title = this.name;
  if (!this.owner && this.user) this.owner = this.user;
  if (!this.user && this.owner) this.user = this.owner;

  const rawName = this.title || this.name || '';
  this.nameLower = rawName.toLowerCase().trim();

  // Normalize level
  if (this.level) {
    this.level = this.level.toLowerCase();
  }

  // Normalize type
  if (this.type === 'want') this.type = 'learn';

  if (this.certificateFile && !this.proof.file) {
    this.proof.file = this.certificateFileName || 'certificate';
    this.hasProof = true;
  }
  next();
});

// Indexes for search, discovery, and duplicate prevention
skillSchema.index({ user: 1, nameLower: 1, type: 1 });
skillSchema.index({ type: 1, category: 1, createdAt: -1 });
skillSchema.index({ type: 1, nameLower: 1 });
skillSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Skill', skillSchema);
