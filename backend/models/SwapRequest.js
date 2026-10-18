const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    offeredSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default: null },
    requestedSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },

    message: { type: String, default: '', maxlength: 1000 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'rejected', 'scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },

    // Two-party completion consensus array
    completionConfirmedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    completedAt: { type: Date, default: null },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

swapRequestSchema.pre('save', function (next) {
  if (!this.requester && this.fromUser) this.requester = this.fromUser;
  if (!this.fromUser && this.requester) this.fromUser = this.requester;
  if (!this.provider && this.toUser) this.provider = this.toUser;
  if (!this.toUser && this.provider) this.toUser = this.provider;
  next();
});

// Indexes for collision prevention and query optimization
swapRequestSchema.index({ fromUser: 1, toUser: 1, status: 1 });
swapRequestSchema.index({ requester: 1, requestedSkill: 1, status: 1 });
swapRequestSchema.index({ requester: 1, updatedAt: -1 });
swapRequestSchema.index({ provider: 1, updatedAt: -1 });

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
