const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const path = require('path');
const crypto = require('crypto');

const getPasswordFromRequest = (req) => {
  const headerPassword = req.headers['x-vault-password'];
  if (headerPassword) return String(headerPassword);
  if (req.query && req.query.password) return String(req.query.password);
  return '';
};

const verifyPassword = (content, provided) => {
  if (!content.password) return true;
  if (!provided) return false;

  const stored = String(content.password);
  const parts = stored.split(':');
  if (parts.length !== 2) {
    return stored === provided;
  }

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

const requirePasswordIfNeeded = (content, req, res) => {
  if (!content.password) return true;
  const provided = getPasswordFromRequest(req);
  if (!provided) {
    res.status(401).json({ error: 'Password required', requiresPassword: true });
    return false;
  }
  if (!verifyPassword(content, provided)) {
    res.status(401).json({ error: 'Incorrect password', requiresPassword: true });
    return false;
  }
  return true;
};

router.get('/content/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const content = await Content.findOne({ uniqueId });

    if (!content) {
      return res.status(404).json({ error: 'Content not found or expired' });
    }

    if (content.isExpired()) {
      await Content.deleteOne({ uniqueId });
      return res.status(410).json({ error: 'Content has expired' });
    }

    if (!content.canView()) {
      return res.status(403).json({ error: 'Content no longer accessible' });
    }

    if (!requirePasswordIfNeeded(content, req, res)) {
      return;
    }

    content.viewCount += 1;

    if (content.oneTimeView) {
      await Content.deleteOne({ uniqueId });
    } else {
      await content.save();
    }

    if (content.type === 'text') {
      res.json({
        success: true,
        type: 'text',
        content: content.content,
        expiresAt: content.expiresAt,
        viewCount: content.viewCount,
        maxViews: content.maxViews,
        oneTimeView: content.oneTimeView,
        requiresPassword: Boolean(content.password)
      });
    } else {
      res.json({
        success: true,
        type: 'file',
        fileName: content.fileName,
        fileSize: content.fileSize,
        mimeType: content.mimeType,
        downloadUrl: content.fileUrl,
        expiresAt: content.expiresAt,
        viewCount: content.viewCount,
        maxViews: content.maxViews,
        oneTimeView: content.oneTimeView,
        requiresPassword: Boolean(content.password)
      });
    }

  } catch (error) {
    console.error('Retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve content' });
  }
});

router.get('/download/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const content = await Content.findOne({ uniqueId });

    if (!content || content.type !== 'file') {
      return res.status(404).json({ error: 'File not found' });
    }

    if (content.isExpired()) {
      await Content.deleteOne({ uniqueId });
      return res.status(410).json({ error: 'File has expired' });
    }

    if (!requirePasswordIfNeeded(content, req, res)) {
      return;
    }

    const filePath = path.join(__dirname, '..', content.fileUrl);
    res.download(filePath, content.fileName);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

router.delete('/content/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const result = await Content.deleteOne({ uniqueId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({ success: true, message: 'Content deleted' });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
