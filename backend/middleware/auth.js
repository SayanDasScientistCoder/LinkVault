const crypto = require('crypto');
const User = require('../models/User');

const hashToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

const extractBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header) return '';
  const [scheme, token] = String(header).split(' ');
  if (scheme !== 'Bearer' || !token) return '';
  return token;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        authRequired: true
      });
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({ authTokenHash: tokenHash });
    if (!user || !user.authTokenExpiresAt || user.authTokenExpiresAt <= new Date()) {
      return res.status(401).json({
        error: 'Session expired. Please login again.',
        authRequired: true
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication check failed' });
  }
};

module.exports = {
  requireAuth,
  hashToken
};
