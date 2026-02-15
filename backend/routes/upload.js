const express = require('express');
const router = express.Router();
const multer = require('multer');
const { nanoid } = require('nanoid');
const Content = require('../models/Content');
const path = require('path');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');

const hashPassword = (rawPassword) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(String(rawPassword), salt, 100000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + nanoid(10);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  }
});

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { type, content, expiryMinutes, password, oneTimeView, maxViews } = req.body;

    if (!type || (type !== 'text' && type !== 'file')) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    if (type === 'text' && !content) {
      return res.status(400).json({ error: 'Content required for text' });
    }

    if (type === 'file' && !req.file) {
      return res.status(400).json({ error: 'File required' });
    }

    const uniqueId = nanoid(10);
    const deleteToken = nanoid(24);
    const expiryTime = parseInt(expiryMinutes) || 10;
    const expiresAt = new Date(Date.now() + expiryTime * 60 * 1000);

    const contentData = {
      uniqueId,
      type,
      expiresAt,
      deleteToken,
      ownerId: req.user._id
    };

    if (password && String(password).trim()) {
      contentData.password = hashPassword(password);
    }

    if (oneTimeView === 'true' || oneTimeView === true) {
      contentData.oneTimeView = true;
    }

    if (maxViews !== undefined && maxViews !== null && String(maxViews).trim()) {
      const parsedMaxViews = parseInt(maxViews, 10);
      if (!Number.isNaN(parsedMaxViews) && parsedMaxViews > 0) {
        contentData.maxViews = parsedMaxViews;
      }
    }

    if (type === 'text') {
      contentData.content = content;
    } else {
      contentData.fileUrl = `/uploads/${req.file.filename}`;
      contentData.fileName = req.file.originalname;
      contentData.fileSize = req.file.size;
      contentData.mimeType = req.file.mimetype;
    }

    const newContent = new Content(contentData);
    await newContent.save();

    const rawFrontendUrl = process.env.FRONTEND_URL;
    const frontendBase = rawFrontendUrl
      ? rawFrontendUrl.replace(/\/+$/, '')
      : `${req.protocol}://${req.get('host')}`;
    const shareUrl = `${frontendBase}/view/${uniqueId}`;
    const deleteUrl = `${frontendBase}/delete/${uniqueId}/${encodeURIComponent(deleteToken)}`;

    res.status(201).json({
      success: true,
      shareUrl,
      deleteUrl,
      deleteToken,
      uniqueId,
      expiresAt,
      type
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
});

module.exports = router;
