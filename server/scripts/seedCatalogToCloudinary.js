const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const clientEnvPath = path.join(__dirname, '../../client/.env');
if (fs.existsSync(clientEnvPath)) {
  dotenv.config({ path: clientEnvPath });
}

const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const User = require('../src/models/User');
const {
  RAW_PRODUCTS,
  DESCRIPTIONS,
  FABRIC,
  FIT,
  getProductCodeFromId,
  IMAGE_TYPES,
} = require('./catalogProducts');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const FOLDER = process.env.CLOUDINARY_FOLDER || process.env.VITE_CLOUDINARY_FOLDER || 'ofme-products';
const MODELS_DIR = path.join(__dirname, '../../client/public/models');
const SELLER_EMAIL = process.env.SEED_SELLER_EMAIL || 'seller@kakao.com';
const UPLOAD_DELAY_MS = Number(process.env.SEED_UPLOAD_DELAY_MS || 300);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getImagePath = (productId, suffix) => path.join(MODELS_DIR, `p${productId}${suffix}.png`);

async function uploadToCloudinary(filePath, publicId) {
  const buffer = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/png' }), path.basename(filePath));
  form.append('upload_preset', UPLOAD_PRESET);
  form.append('folder', FOLDER);
  form.append('public_id', publicId);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || `Cloudinary upload failed (${response.status})`);
  }

  return payload.secure_url;
}

async function uploadProductImages(productId) {
  const code = getProductCodeFromId(productId);
  const images = {};

  for (const { field, suffix } of IMAGE_TYPES) {
    const filePath = getImagePath(productId, suffix);

    if (!fs.existsSync(filePath)) {
      console.warn(`  [skip] ${path.basename(filePath)} not found`);
      continue;
    }

    const publicId = `${code.toLowerCase()}-${field}`;
    process.stdout.write(`  uploading ${path.basename(filePath)} ... `);

    try {
      images[field] = await uploadToCloudinary(filePath, publicId);
      console.log('ok');
    } catch (error) {
      console.log('failed');
      throw error;
    }

    await sleep(UPLOAD_DELAY_MS);
  }

  return images;
}

async function uploadColorImages(productId, colors) {
  const code = getProductCodeFromId(productId);
  const primaryColor = colors[0];
  const colorImages = {};

  for (const color of colors) {
    if (color === primaryColor) {
      continue;
    }

    const filePath = getImagePath(productId, `_${color}`);

    if (!fs.existsSync(filePath)) {
      console.warn(`  [skip] ${path.basename(filePath)} not found`);
      continue;
    }

    const publicId = `${code.toLowerCase()}-${color}`;
    process.stdout.write(`  uploading ${path.basename(filePath)} ... `);

    try {
      colorImages[color] = await uploadToCloudinary(filePath, publicId);
      console.log('ok');
    } catch (error) {
      console.log('failed');
      throw error;
    }

    await sleep(UPLOAD_DELAY_MS);
  }

  return colorImages;
}

const getColorImageCount = (value) => {
  if (!value) {
    return 0;
  }

  if (value instanceof Map) {
    return value.size;
  }

  return Object.keys(value).length;
};

async function seedCatalog() {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary env vars missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET)');
  }

  if (!fs.existsSync(MODELS_DIR)) {
    throw new Error(`Models directory not found: ${MODELS_DIR}`);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const seller = await User.findOne({ email: SELLER_EMAIL });

  if (!seller) {
    throw new Error(`Seller user not found: ${SELLER_EMAIL}`);
  }

  console.log(`Cloudinary: ${CLOUD_NAME}/${FOLDER}`);
  console.log(`Seller: ${seller.email} (${seller._id})`);
  console.log(`Products: ${RAW_PRODUCTS.length}\n`);

  let created = 0;
  let skipped = 0;

  for (const item of RAW_PRODUCTS) {
    const productCode = getProductCodeFromId(item.id);
    const existing = await Product.findOne({ productCode });
    const hasPrimary = Boolean(existing?.images?.primary?.startsWith('https://'));
    const hasColorImages = getColorImageCount(existing?.colorImages) > 0;

    if (hasPrimary && hasColorImages) {
      console.log(`[skip] ${productCode} ${item.name} (already seeded)`);
      skipped += 1;
      continue;
    }

    console.log(`[${productCode}] ${item.name}`);

    const images = hasPrimary
      ? {
          primary: existing.images.primary,
          walk: existing.images.walk,
          coordi: existing.images.coordi,
          flat: existing.images.flat,
        }
      : await uploadProductImages(item.id);

    if (!images.primary) {
      throw new Error(`${productCode}: primary image upload failed`);
    }

    const colorImages = hasColorImages
      ? (existing.colorImages instanceof Map
          ? Object.fromEntries(existing.colorImages)
          : existing.colorImages)
      : await uploadColorImages(item.id, item.colors);

    const payload = {
      productCode,
      name: item.name,
      brand: item.brand,
      cat: item.cat,
      g: item.g,
      price: item.price,
      orig: item.orig,
      colors: item.colors,
      tag: item.tag,
      description: DESCRIPTIONS[item.g] || '',
      fabric: FABRIC[item.g] || '',
      fit: FIT[item.g] || '',
      images,
      colorImages,
      seller: seller._id,
      isActive: true,
    };

    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      console.log(`  updated in DB\n`);
    } else {
      await Product.create(payload);
      console.log(`  saved to DB\n`);
    }

    created += 1;
  }

  const total = await Product.countDocuments();
  console.log(`Done. Seeded/updated: ${created}, skipped: ${skipped}, total in DB: ${total}`);
}

seedCatalog()
  .catch((error) => {
    console.error('\nSeed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
