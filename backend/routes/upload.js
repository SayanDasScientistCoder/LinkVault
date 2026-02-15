const express = require('express');
const router = express.Router();
const multer = require('multer');
const { nanoid } = require('nanoid');
const Content = require('../models/Content');
const path = require('path');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_FILE_MIME_TYPES = new Set([
  'text/plain',
  'text/csv',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint'
]);
const ALLOWED_FILE_EXTENSIONS = new Set([
  '.txt',
  '.csv',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.zip',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx'
]);

const parseAllowedEmails = (rawValue) => {
  if (rawValue === undefined || rawValue === null) return [];
  const asString = String(rawValue).trim();
  if (!asString) return [];
  return Array.from(
    new Set(
      asString
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter((email) => EMAIL_REGEX.test(email))
    )
  );
};

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
  ,
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const mimeType = String(file.mimetype || '').toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.has(extension) || !ALLOWED_FILE_MIME_TYPES.has(mimeType)) {
      const error = new Error(
        'Invalid file type. Allowed: txt, csv, pdf, png, jpg, jpeg, webp, gif, zip, doc, docx, xls, xlsx, ppt, pptx'
      );
      error.statusCode = 400;
      return cb(error);
    }
    return cb(null, true);
  }
});

router.post('/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, async (uploadError) => {
    if (uploadError) {
      if (uploadError instanceof multer.MulterError && uploadError.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Max size is 50 MB.' });
      }
      return res
        .status(uploadError.statusCode || 400)
        .json({ error: uploadError.message || 'Invalid upload request' });
    }

    try {
      const { type, content, expiryMinutes, password, oneTimeView, maxViews, allowedUsers } = req.body;

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

      const allowedUserEmails = parseAllowedEmails(allowedUsers);
      if (allowedUserEmails.length > 0) {
        contentData.allowedUserEmails = allowedUserEmails;
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

      return res.status(201).json({
        success: true,
        shareUrl,
        deleteUrl,
        deleteToken,
        uniqueId,
        expiresAt,
        type,
        accessRestricted: allowedUserEmails.length > 0,
        allowedUserCount: allowedUserEmails.length
      });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ 
        error: 'Upload failed',
        message: error.message 
      });
    }
  });
});

module.exports = router;
