const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

// Detect the genuine binary format via leading signature magic bytes.
// Client MIME types and filename extensions are untrusted.
function sniff(buf) {
  if (!buf || buf.length < 4) return null;
  // PDF: %PDF- (0x25 0x50 0x44 0x46 0x2d)
  if (buf.length >= 5 && buf.slice(0, 5).toString('latin1') === '%PDF-') {
    return { ext: 'pdf', mime: 'application/pdf' };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf.length >= 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: 'png', mime: 'image/png' };
  }
  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  // WEBP: RIFF .... WEBP
  if (
    buf.length >= 12 &&
    buf.slice(0, 4).toString('latin1') === 'RIFF' &&
    buf.slice(8, 12).toString('latin1') === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

const storage = multer.memoryStorage();
const uploader = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

function ensureDir(sub) {
  const dir = path.join(UPLOAD_ROOT, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function saveUpload(file, sub, allowedExts = ['pdf', 'png', 'jpg', 'webp']) {
  if (!file || !file.buffer) {
    throw new Error('No file data provided');
  }
  const detected = sniff(file.buffer);
  if (!detected || !allowedExts.includes(detected.ext)) {
    throw new Error(`Invalid file signature. Permitted types: ${allowedExts.join(', ').toUpperCase()}`);
  }

  const randomName = `${crypto.randomBytes(16).toString('hex')}.${detected.ext}`;
  const targetDir = ensureDir(sub);
  const targetPath = path.join(targetDir, randomName);
  await fs.promises.writeFile(targetPath, file.buffer);

  return {
    filename: randomName,
    mimeType: detected.mime,
    size: file.size || file.buffer.length,
    originalName: safeOriginalName(file.originalname),
  };
}

function resolveUpload(sub, filename) {
  if (typeof filename !== 'string' || !/^[a-f0-9]{32}\.(pdf|png|jpg|webp)$/i.test(filename)) {
    return null;
  }
  const resolved = path.join(UPLOAD_ROOT, sub, filename);
  if (!fs.existsSync(resolved)) return null;
  return resolved;
}

async function removeUpload(sub, filename) {
  const filePath = resolveUpload(sub, filename);
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch (_) {
    // Ignore if already deleted
  }
}

function safeOriginalName(rawName) {
  const base = path.basename(String(rawName || 'file')).replace(/[^\w.\- ]/g, '_');
  return base.slice(0, 80) || 'file';
}

function generateSafeFilename(ext) {
  return `${crypto.randomBytes(16).toString('hex')}.${ext}`;
}

module.exports = {
  sniff,
  detectFileType: sniff,
  uploader,
  saveUpload,
  resolveUpload,
  removeUpload,
  safeOriginalName,
  generateSafeFilename,
  UPLOAD_ROOT,
};
