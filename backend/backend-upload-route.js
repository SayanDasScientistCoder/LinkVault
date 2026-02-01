// backend/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { nanoid } = require('nanoid');
const Content = require('../models/Content');
const path = require('path');

// Configure multer for file uploads
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
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Add file type validation here if needed
    // For now, accept all file types
    cb(null, true);
  }
});

// POST /api/upload - Handle text or file upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { type, content, expiryMinutes } = req.body;

    // Validate input
    if (!type || (type !== 'text' && type !== 'file')) {
      return res.status(400).json({ error: 'Invalid type. Must be "text" or "file"' });
    }

    if (type === 'text' && !content) {
      return res.status(400).json({ error: 'Content is required for text uploads' });
    }

    if (type === 'file' && !req.file) {
      return res.status(400).json({ error: 'File is required for file uploads' });
    }

    // Generate unique ID
    const uniqueId = nanoid(10);

    // Calculate expiry time (default 10 minutes)
    const expiryTime = parseInt(expiryMinutes) || 10;
    const expiresAt = new Date(Date.now() + expiryTime * 60 * 1000);

    // Create content object
    const contentData = {
      uniqueId,
      type,
      expiresAt
    };

    if (type === 'text') {
      contentData.content = content;
    } else {
      contentData.fileUrl = `/uploads/${req.file.filename}`;
      contentData.fileName = req.file.originalname;
      contentData.fileSize = req.file.size;
      contentData.mimeType = req.file.mimetype;
    }

    // Save to database
    const newContent = new Content(contentData);
    await newContent.save();

    // Return share URL
    const shareUrl = `${req.protocol}://${req.get('host')}/view/${uniqueId}`;

    res.status(201).json({
      success: true,
      shareUrl,
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
