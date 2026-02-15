const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const { requireAuth, hashToken } = require('../middleware/auth');

const router = express.Router();

const SESSION_HOURS = 24 * 7;

const hashPassword = (rawPassword) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(String(rawPassword), salt, 100000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (stored, provided) => {
  if (!stored || !provided) return false;
  const parts = String(stored).split(':');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const test = crypto
    .pbkdf2Sync(String(provided), salt, 100000, 64, 'sha512')
    .toString('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
  } catch (err) {
    return false;
  }
};

const issueSession = async (user) => {
  const token = crypto.randomBytes(32).toString('hex');
  user.authTokenHash = hashToken(token);
  user.authTokenExpiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await user.save();
  return token;
};

const cleanUser = (user) => ({
  id: String(user._id),
  email: user.email
});

router.post('/auth/register', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const user = new User({
      email,
      passwordHash: hashPassword(password)
    });
    const token = await issueSession(user);

    return res.status(201).json({
      success: true,
      token,
      user: cleanUser(user)
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const user = await User.findOne({ email });

    if (!user || !verifyPassword(user.passwordHash, password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = await issueSession(user);
    return res.json({
      success: true,
      token,
      user: cleanUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/auth/me', requireAuth, async (req, res) => {
  return res.json({ success: true, user: cleanUser(req.user) });
});

router.post('/auth/logout', requireAuth, async (req, res) => {
  req.user.authTokenHash = null;
  req.user.authTokenExpiresAt = null;
  await req.user.save();
  return res.json({ success: true });
});

module.exports = router;
