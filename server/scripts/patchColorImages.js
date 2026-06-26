const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const mongoose = require('mongoose');
const Product = require('../src/models/Product');

const IMAGE_BASE =
  process.env.SEED_IMAGE_BASE?.replace(/\/$/, '') || 'https://ofme-shop.vercel.app';

function getMongoUri() {
  const fromEnv = process.env.MONGODB_URI?.trim();

  if (fromEnv && !fromEnv.includes('localhost')) {
    return fromEnv;
  }

  const envText = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');

  for (const line of envText.split(/\r?\n/)) {
    if (!line.startsWith('MONGODB_URI=')) {
      continue;
    }

    const uri = line.slice('MONGODB_URI='.length).trim();

    if (uri && !uri.includes('localhost')) {
      return uri;
    }
  }

  return '';
}

function getCatalogId(product) {
  const primary = product?.images?.primary;

  if (!primary) {
    return null;
  }

  const match = String(primary).match(/\/models\/p(\d+)\.png/i);
  return match ? Number(match[1]) : null;
}

async function patchColorImages() {
  const uri = getMongoUri();

  if (!uri) {
    throw new Error('Atlas MONGODB_URI not found in server/.env');
  }

  await mongoose.connect(uri);

  const products = await Product.find();
  let updated = 0;

  for (const product of products) {
    const catalogId = getCatalogId(product);

    if (!catalogId) {
      continue;
    }

    const primaryColor = product.colors?.[0];
    const colorImages = {};

    product.colors.forEach((color) => {
      if (color !== primaryColor) {
        colorImages[color] = `${IMAGE_BASE}/models/p${catalogId}_${color}.png`;
      }
    });

    product.colorImages = colorImages;
    product.markModified('colorImages');
    await product.save();
    updated += 1;
  }

  console.log(`Patched colorImages for ${updated} products`);
  await mongoose.disconnect();
}

patchColorImages().catch((error) => {
  console.error('Patch failed:', error.message);
  process.exitCode = 1;
});
