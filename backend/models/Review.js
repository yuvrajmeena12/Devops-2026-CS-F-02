const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    swap: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', required: true, index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '', maxlength: 1000 },
    text: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true }
);

reviewSchema.pre('save', function (next) {
  if (this.comment && !this.text) this.text = this.comment;
  if (this.text && !this.comment) this.comment = this.text;
  next();
});

// Enforces strictly one review per participant per swap
reviewSchema.index({ swap: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
