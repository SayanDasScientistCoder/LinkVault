const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const path = require('path');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');

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

const getDeleteTokenFromRequest = (req) => {
  const headerToken = req.headers['x-delete-token'];
  if (headerToken) return String(headerToken);
  if (req.query && req.query.deleteToken) return String(req.query.deleteToken);
  return '';
};

const verifyDeleteToken = (content, provided) => {
  if (!content.deleteToken) return false;
  if (!provided) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(String(content.deleteToken)),
      Buffer.from(String(provided))
    );
  } catch (err) {
    return false;
  }
};

const canManageAsOwner = (content, user) => {
  if (!content.ownerId) return true;
  return String(content.ownerId) === String(user._id);
};

const canAccessContent = (content, user) => {
  if (canManageAsOwner(content, user)) return true;
  const allowed = Array.isArray(content.allowedUserEmails)
    ? content.allowedUserEmails.map((email) => String(email).toLowerCase())
    : [];
  if (allowed.length === 0) return true;
  return allowed.includes(String(user.email || '').toLowerCase());
};

router.get('/content/mine', requireAuth, async (req, res) => {
  try {
    const items = await Content.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    const rawFrontendUrl = process.env.FRONTEND_URL;
    const frontendBase = rawFrontendUrl
      ? rawFrontendUrl.replace(/\/+$/, '')
      : `${req.protocol}://${req.get('host')}`;

    const links = items.map((item) => ({
      uniqueId: item.uniqueId,
      type: item.type,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      viewCount: item.viewCount,
      maxViews: item.maxViews,
      oneTimeView: item.oneTimeView,
      hasPassword: Boolean(item.password),
      accessRestricted: Array.isArray(item.allowedUserEmails) && item.allowedUserEmails.length > 0,
      allowedUserCount: Array.isArray(item.allowedUserEmails) ? item.allowedUserEmails.length : 0,
      shareUrl: `${frontendBase}/view/${item.uniqueId}`,
      deleteUrl: `${frontendBase}/delete/${item.uniqueId}/${encodeURIComponent(item.deleteToken || '')}`,
      deleteToken: item.deleteToken
    }));

    return res.json({ success: true, links });
  } catch (error) {
    console.error('List links error:', error);
    return res.status(500).json({ error: 'Failed to load your links' });
  }
});

router.get('/delete/:uniqueId/:deleteToken', async (req, res) => {
  const { uniqueId, deleteToken } = req.params;
  const rawFrontendUrl = process.env.FRONTEND_URL;
  const frontendBase = rawFrontendUrl
    ? rawFrontendUrl.replace(/\/+$/, '')
    : `${req.protocol}://${req.get('host')}`;
  return res.redirect(`${frontendBase}/delete/${encodeURIComponent(uniqueId)}/${encodeURIComponent(deleteToken)}`);
});

router.get('/delete-preview/:uniqueId/:deleteToken', requireAuth, async (req, res) => {
  try {
    const { uniqueId, deleteToken } = req.params;
    const content = await Content.findOne({ uniqueId });

    if (!content) {
      return res.status(404).json({ error: 'Content not found or expired' });
    }

    if (content.isExpired()) {
      await Content.deleteOne({ uniqueId });
      return res.status(410).json({ error: 'Content has expired' });
    }

    if (!verifyDeleteToken(content, deleteToken)) {
      return res.status(403).json({ error: 'Invalid delete token' });
    }

    if (!canManageAsOwner(content, req.user)) {
      return res.status(403).json({ error: 'Only the owner account can manage this vault' });
    }

    if (content.type === 'text') {
      return res.json({
        success: true,
        type: 'text',
        content: content.content,
        expiresAt: content.expiresAt,
        fileName: null,
        fileSize: null,
        mimeType: null
      });
    }

    return res.json({
      success: true,
      type: 'file',
      content: null,
      expiresAt: content.expiresAt,
      fileName: content.fileName,
      fileSize: content.fileSize,
      mimeType: content.mimeType
    });
  } catch (error) {
    console.error('Delete preview error:', error);
    return res.status(500).json({ error: 'Failed to load delete preview' });
  }
});

router.get('/content/:uniqueId', requireAuth, async (req, res) => {
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

    if (!canAccessContent(content, req.user)) {
      return res.status(403).json({ error: 'Access denied for this account' });
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

router.get('/download/:uniqueId', requireAuth, async (req, res) => {
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

    if (!canAccessContent(content, req.user)) {
      return res.status(403).json({ error: 'Access denied for this account' });
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

router.get('/delete-download/:uniqueId/:deleteToken', requireAuth, async (req, res) => {
  try {
    const { uniqueId, deleteToken } = req.params;
    const content = await Content.findOne({ uniqueId });

    if (!content || content.type !== 'file') {
      return res.status(404).json({ error: 'File not found' });
    }

    if (content.isExpired()) {
      await Content.deleteOne({ uniqueId });
      return res.status(410).json({ error: 'File has expired' });
    }

    if (!verifyDeleteToken(content, deleteToken)) {
      return res.status(403).json({ error: 'Invalid delete token' });
    }

    if (!canManageAsOwner(content, req.user)) {
      return res.status(403).json({ error: 'Only the owner account can manage this vault' });
    }

    const filePath = path.join(__dirname, '..', content.fileUrl);
    return res.download(filePath, content.fileName);
  } catch (error) {
    console.error('Delete download error:', error);
    return res.status(500).json({ error: 'Download failed' });
  }
});

router.delete('/content/:uniqueId', requireAuth, async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const content = await Content.findOne({ uniqueId });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const providedToken = getDeleteTokenFromRequest(req);
    if (!verifyDeleteToken(content, providedToken)) {
      return res.status(403).json({ error: 'Invalid or missing delete token' });
    }

    if (!canManageAsOwner(content, req.user)) {
      return res.status(403).json({ error: 'Only the owner account can manage this vault' });
    }

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
