const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    swapRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', required: true },
    scheduledDateTime: { type: Date, required: true },
    mode: { type: String, enum: ['online', 'in-person'], required: true },
    meetingLink: { type: String, default: '' },
    address: { type: String, default: '' },
    confirmedByFrom: { type: Boolean, default: false },
    confirmedByTo: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['proposed', 'scheduled', 'completed', 'cancelled'],
      default: 'proposed',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
