const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['text', 'file'],
    required: true
  },
  content: {
    type: String,
    required: function() {
      return this.type === 'text';
    }
  },
  fileUrl: {
    type: String,
    required: function() {
      return this.type === 'file';
    }
  },
  fileName: String,
  fileSize: Number,
  mimeType: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  maxViews: {
    type: Number,
    default: null
  },
  password: {
    type: String,
    default: null
  },
  oneTimeView: {
    type: Boolean,
    default: false
  },
  deleteToken: {
    type: String,
    default: null
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  }
});

contentSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

contentSchema.methods.canView = function() {
  if (this.isExpired()) return false;
  if (this.maxViews && this.viewCount >= this.maxViews) return false;
  return true;
};

contentSchema.pre(/^find/, function(next) {
  this.where({ expiresAt: { $gt: new Date() } });
  next();
});

module.exports = mongoose.model('Content', contentSchema);
