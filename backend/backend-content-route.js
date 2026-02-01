// backend/routes/content.js
const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const path = require('path');

// GET /api/content/:uniqueId - Retrieve content by unique ID
router.get('/content/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;

    // Find content
    const content = await Content.findOne({ uniqueId });

    if (!content) {
      return res.status(404).json({ 
        error: 'Content not found or expired' 
      });
    }

    // Check if content is expired
    if (content.isExpired()) {
      // Delete expired content
      await Content.deleteOne({ uniqueId });
      return res.status(410).json({ 
        error: 'Content has expired' 
      });
    }

    // Check if content can be viewed (max views, one-time view, etc.)
    if (!content.canView()) {
      return res.status(403).json({ 
        error: 'Content is no longer accessible' 
      });
    }

    // Increment view count
    content.viewCount += 1;

    // If one-time view, delete after this view
    if (content.oneTimeView) {
      await Content.deleteOne({ uniqueId });
    } else {
      await content.save();
    }

    // Return content based on type
    if (content.type === 'text') {
      res.json({
        success: true,
        type: 'text',
        content: content.content,
        expiresAt: content.expiresAt,
        viewCount: content.viewCount
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
        viewCount: content.viewCount
      });
    }

  } catch (error) {
    console.error('Retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve content',
      message: error.message 
    });
  }
});

// GET /api/download/:uniqueId - Download file
router.get('/download/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;

    const content = await Content.findOne({ uniqueId });

    if (!content || content.type !== 'file') {
      return res.status(404).json({ 
        error: 'File not found or expired' 
      });
    }

    if (content.isExpired()) {
      await Content.deleteOne({ uniqueId });
      return res.status(410).json({ 
        error: 'File has expired' 
      });
    }

    // Send file
    const filePath = path.join(__dirname, '..', content.fileUrl);
    res.download(filePath, content.fileName);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      error: 'Download failed',
      message: error.message 
    });
  }
});

// DELETE /api/content/:uniqueId - Manual delete (optional)
router.delete('/content/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;

    const result = await Content.deleteOne({ uniqueId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        error: 'Content not found' 
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      error: 'Delete failed',
      message: error.message 
    });
  }
});

module.exports = router;
