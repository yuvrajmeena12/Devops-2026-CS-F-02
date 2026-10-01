const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    offeredSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    requestedSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    message: { type: String, default: '', maxlength: 1000 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'rejected', 'scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

swapRequestSchema.index({ fromUser: 1, toUser: 1, status: 1 });

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
