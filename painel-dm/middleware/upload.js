const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const PORTAL_DIR = path.resolve(__dirname, '..', '..');
const UPLOAD_ROOT = path.join(PORTAL_DIR, 'img', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const d = new Date();
    const dir = path.join(UPLOAD_ROOT, String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const hash = crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname || '.bin').toLowerCase().slice(0, 8);
    cb(null, `${Date.now()}-${hash}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(jpe?g|png|webp|svg\+xml|gif)/i.test(file.mimetype);
    cb(ok ? null : new Error('Tipo de arquivo não suportado'), ok);
  },
});

/** Resolve a URL pública a partir do caminho local salvo */
function urlPublica(absoluto) {
  const rel = path.relative(PORTAL_DIR, absoluto).split(path.sep).join('/');
  return '/' + rel;
}

module.exports = { upload, urlPublica };
