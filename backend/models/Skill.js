const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Tech', 'Music', 'Language', 'Fitness', 'Art', 'Cooking', 'Academic', 'Other'],
      default: 'Other',
    },
    description: { type: String, default: '' },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], default: 'Beginner' },
    type: { type: String, enum: ['teach', 'want'], required: true },
    mode: { type: String, enum: ['online', 'in-person', 'both'], default: 'both' },
    // Certificate verification — the actual uploaded file, stored as a
    // base64 data string directly in MongoDB. We do this (rather than
    // saving to the server's disk) because Render's free tier has an
    // ephemeral filesystem — any file saved to disk is wiped on every
    // restart/redeploy. Storing it in Atlas keeps it permanent for free.
    certificateFile: { type: String, default: '' }, // base64 data URI
    certificateFileName: { type: String, default: '' },
    certificateFileType: { type: String, default: '' }, // e.g. 'application/pdf', 'image/png'
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);
