const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationKey: { type: String, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    swapRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', default: undefined, index: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default: undefined },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    content: { type: String, trim: true, maxlength: 2000 },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

messageSchema.statics.keyFor = function (a, b) {
  return [String(a), String(b)].sort().join(':');
};

messageSchema.pre('save', function (next) {
  if (!this.conversationKey && this.sender && this.recipient) {
    this.conversationKey = [String(this.sender), String(this.recipient)].sort().join(':');
  }
  if (this.text && !this.content) this.content = this.text;
  if (this.content && !this.text) this.text = this.content;
  if (this.read && !this.readAt) this.readAt = new Date();
  if (this.readAt && !this.read) this.read = true;
  next();
});

messageSchema.index({ conversationKey: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, read: 1 });
messageSchema.index({ recipient: 1, readAt: 1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
