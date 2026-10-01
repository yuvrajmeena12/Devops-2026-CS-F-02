const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: String,
      enum: ['Tech', 'Music', 'Language', 'Fitness', 'Art', 'Cooking', 'Academic', 'Other'],
      default: 'Other',
      index: true,
    },
    description: { type: String, default: '', maxlength: 2000 },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], default: 'Beginner' },
    type: { type: String, enum: ['teach', 'want'], required: true, index: true },
    mode: { type: String, enum: ['online', 'in-person', 'both'], default: 'both' },
    
    // Proof / Certificate for individual skill (supporting documentation).
    certificateFile: { type: String, default: '' },
    certificateFileName: { type: String, default: '', maxlength: 255 },
    certificateFileType: { type: String, default: '', maxlength: 100 },
    hasProof: { type: Boolean, default: false, index: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for efficient browsing and search queries
skillSchema.index({ type: 1, category: 1, createdAt: -1 });
skillSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Skill', skillSchema);
