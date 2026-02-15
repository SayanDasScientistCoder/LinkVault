const fs = require('fs/promises');
const path = require('path');
const Content = require('../models/Content');

const DEFAULT_INTERVAL_MS = 60 * 1000;

const toStoredFilePath = (uploadsDir, fileUrl) => {
  const relativePath = String(fileUrl || '').replace(/^\/+/, '');
  return path.join(uploadsDir, path.basename(relativePath));
};

const removeExpiredContent = async ({ uploadsDir }) => {
  const now = new Date();
  const expiredDocs = await Content.collection
    .find(
      { expiresAt: { $lte: now } },
      { projection: { _id: 1, type: 1, fileUrl: 1 } }
    )
    .toArray();

  if (expiredDocs.length === 0) {
    return { deletedDocs: 0, deletedFiles: 0 };
  }

  let deletedFiles = 0;

  for (const doc of expiredDocs) {
    if (doc.type !== 'file' || !doc.fileUrl) continue;
    const filePath = toStoredFilePath(uploadsDir, doc.fileUrl);
    try {
      await fs.unlink(filePath);
      deletedFiles += 1;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to delete expired file:', filePath, error.message);
      }
    }
  }

  const ids = expiredDocs.map((doc) => doc._id);
  const result = await Content.collection.deleteMany({ _id: { $in: ids } });

  return {
    deletedDocs: result.deletedCount || 0,
    deletedFiles,
  };
};

const startExpiredContentCleanup = ({
  uploadsDir,
  intervalMs = DEFAULT_INTERVAL_MS,
}) => {
  let isRunning = false;

  const runOnce = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const { deletedDocs, deletedFiles } = await removeExpiredContent({ uploadsDir });
      if (deletedDocs > 0 || deletedFiles > 0) {
        console.log(
          `[cleanup] Removed ${deletedDocs} expired records and ${deletedFiles} expired files`
        );
      }
    } catch (error) {
      console.error('[cleanup] Expired content cleanup failed:', error.message);
    } finally {
      isRunning = false;
    }
  };

  runOnce();
  const timer = setInterval(runOnce, intervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  return () => clearInterval(timer);
};

module.exports = {
  startExpiredContentCleanup,
  removeExpiredContent,
};

