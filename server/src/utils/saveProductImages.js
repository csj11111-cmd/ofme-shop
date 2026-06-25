const fs = require('fs');
const path = require('path');

const UPLOAD_ROOT = path.join(__dirname, '../../uploads/products');

const IMAGE_FIELDS = ['primary', 'walk', 'coordi', 'flat'];

const getExtension = (dataUrl) => {
  const match = dataUrl.match(/^data:image\/(\w+);base64,/);

  if (!match) {
    return 'png';
  }

  return match[1] === 'jpeg' ? 'jpg' : match[1];
};

const saveDataUrl = (dataUrl, filePath) => {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return null;
  }

  // Cloudinary 등 외부 URL은 그대로 저장
  if (/^https?:\/\//i.test(dataUrl)) {
    return dataUrl;
  }

  if (!dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  const extension = getExtension(dataUrl);
  const base64 = dataUrl.split(',')[1];
  const finalPath = `${filePath}.${extension}`;

  fs.mkdirSync(path.dirname(finalPath), { recursive: true });
  fs.writeFileSync(finalPath, Buffer.from(base64, 'base64'));

  return finalPath;
};

const toPublicPath = (absolutePath) => {
  if (!absolutePath) {
    return null;
  }

  const normalized = absolutePath.replace(/\\/g, '/');
  const uploadsIndex = normalized.indexOf('/uploads/');

  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex);
  }

  return null;
};

const saveProductImages = (productCode, images = {}) => {
  if (!images || typeof images !== 'object') {
    return {};
  }

  const productDir = path.join(UPLOAD_ROOT, productCode);
  const saved = {};

  IMAGE_FIELDS.forEach((field) => {
    const value = images[field];

    if (!value) {
      return;
    }

    if (typeof value === 'string' && !value.startsWith('data:image/')) {
      saved[field] = value;
      return;
    }

    const absolutePath = saveDataUrl(value, path.join(productDir, field));
    saved[field] = toPublicPath(absolutePath);
  });

  return saved;
};

const deleteProductImages = (images = {}) => {
  IMAGE_FIELDS.forEach((field) => {
    const publicPath = images[field];

    if (!publicPath || !publicPath.startsWith('/uploads/')) {
      return;
    }

    const absolutePath = path.join(__dirname, '../..', publicPath.replace(/^\//, ''));

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  });
};

module.exports = {
  IMAGE_FIELDS,
  saveProductImages,
  deleteProductImages,
};
