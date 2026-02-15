const mongoose = require('mongoose');

// Database schema definition for application users.
// Stores account credentials plus hashed session token metadata.
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    authTokenHash: {
      type: String,
      default: null
    },
    authTokenExpiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
