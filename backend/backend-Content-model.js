// backend/models/Content.js
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
  // For text uploads
  content: {
    type: String,
    required: function() {
      return this.type === 'text';
    }
  },
  // For file uploads
  fileUrl: {
    type: String,
    required: function() {
      return this.type === 'file';
    }
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  // Expiry management
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true // Index for efficient cleanup queries
  },
  // Optional fields for bonus features
  viewCount: {
    type: Number,
    default: 0
  },
  maxViews: {
    type: Number,
    default: null // null means unlimited
  },
  password: {
    type: String,
    default: null
  },
  oneTimeView: {
    type: Boolean,
    default: false
  }
});

// Add a method to check if content is expired
contentSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Add a method to check if content can be viewed
contentSchema.methods.canView = function() {
  if (this.isExpired()) {
    return false;
  }
  if (this.maxViews && this.viewCount >= this.maxViews) {
    return false;
  }
  return true;
};

// Middleware to auto-delete expired content on query
contentSchema.pre(/^find/, function(next) {
  // Only return non-expired content
  this.where({ expiresAt: { $gt: new Date() } });
  next();
});

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
