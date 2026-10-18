const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    type: {
      type: String,
      enum: [
        'swap_request',
        'swap_accepted',
        'swap_rejected',
        'swap_cancelled',
        'message',
        'session_scheduled',
        'session_cancelled',
        'swap_completed',
        'review_received',
        'badge_earned',
        // Legacy compatibility aliases
        'new_request',
        'request_accepted',
        'request_declined',
        'new_message',
        'new_review',
        'verified_badge',
      ],
      required: true,
    },
    message: { type: String, required: true, maxlength: 500 },
    link: { type: String, default: '/' },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    dedupeKey: { type: String, default: null },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.pre('save', function (next) {
  if (!this.recipient && this.user) this.recipient = this.user;
  if (!this.user && this.recipient) this.user = this.recipient;
  if (this.isRead && !this.readAt) this.readAt = new Date();
  if (this.readAt && !this.isRead) this.isRead = true;
  next();
});

// Partial unique index for event deduplication
notificationSchema.index(
  { user: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

// Automatic 90-day document expiration TTL
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Notification', notificationSchema);
