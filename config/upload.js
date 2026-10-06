const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const uploadDirectory = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(allowed ? null : new Error('只支持 JPG、PNG 或 WebP 图片'), allowed);
  }
});
module.exports = upload;
