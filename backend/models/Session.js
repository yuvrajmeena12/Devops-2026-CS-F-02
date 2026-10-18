const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    swapRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', required: true, index: true },
    swap: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', index: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    scheduledDateTime: { type: Date, required: true, index: true },
    scheduledAt: { type: Date, index: true },
    durationMinutes: { type: Number, default: 60, min: 15, max: 480 },

    mode: { type: String, enum: ['online', 'in-person'], default: 'online' },
    meetingLink: { type: String, default: '', maxlength: 300 },
    address: { type: String, default: '', maxlength: 300 },
    details: { type: String, default: '', maxlength: 500 },

    confirmedByFrom: { type: Boolean, default: true },
    confirmedByTo: { type: Boolean, default: true },

    status: {
      type: String,
      enum: ['proposed', 'scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

sessionSchema.pre('save', function (next) {
  if (!this.swap && this.swapRequest) this.swap = this.swapRequest;
  if (!this.swapRequest && this.swap) this.swapRequest = this.swap;

  if (this.scheduledDateTime && !this.scheduledAt) this.scheduledAt = this.scheduledDateTime;
  if (this.scheduledAt && !this.scheduledDateTime) this.scheduledDateTime = this.scheduledAt;

  next();
});

sessionSchema.index({ participants: 1, scheduledAt: 1 });
sessionSchema.index({ swap: 1, status: 1 });

module.exports = mongoose.model('Session', sessionSchema);
