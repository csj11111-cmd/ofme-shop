/**
 * 배포(Cloudtype) DB에 테스트 계정 + 카탈로그 상품을 넣습니다.
 * Usage: node scripts/bootstrapProduction.js
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

function getMongoUri() {
  const fromEnv = process.env.MONGODB_URI?.trim();

  if (fromEnv && !fromEnv.includes('localhost')) {
    return fromEnv;
  }

  try {
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
  } catch {
    // ignore
  }

  return '';
}

const {
  RAW_PRODUCTS,
  DESCRIPTIONS,
  FABRIC,
  FIT,
} = require('./catalogProducts');

const API_BASE =
  process.env.PRODUCTION_API_BASE?.replace(/\/$/, '') ||
  'https://port-0-ofme-shop-mqgtnyzc60fc7446.sel3.cloudtype.app/api';

const IMAGE_BASE =
  process.env.SEED_IMAGE_BASE?.replace(/\/$/, '') || 'https://ofme-shop.vercel.app';

const DEFAULT_PASSWORD = process.env.BOOTSTRAP_PASSWORD || 'Ofme1234!';

const USERS = [
  { email: 'seller@kakao.com', name: '판매자', userType: 'seller' },
  { email: 'customer@kakao.com', name: '고객', userType: 'customer' },
  { email: 'admin@kakao.com', name: '관리자', userType: 'customer' },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function imageUrl(productId, suffix = '') {
  return `${IMAGE_BASE}/models/p${productId}${suffix}.png`;
}

function buildProductPayload(item) {
  const images = {
    primary: imageUrl(item.id),
    walk: imageUrl(item.id, '_w'),
    coordi: imageUrl(item.id, '_coordi'),
    flat: imageUrl(item.id, '_flat'),
  };

  const colorImages = {};
  const primaryColor = item.colors[0];

  item.colors.forEach((color) => {
    if (color !== primaryColor) {
      colorImages[color] = imageUrl(item.id, `_${color}`);
    }
  });

  return {
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
    isActive: true,
  };
}

async function registerUser(user) {
  try {
    await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        password: DEFAULT_PASSWORD,
        userType: user.userType,
        privacyAgreed: true,
        addresses: [],
      }),
    });
    console.log(`[user] created ${user.email} (${user.userType})`);
  } catch (error) {
    if (error.status === 409) {
      console.log(`[user] skip ${user.email} (already exists)`);
      return;
    }

    throw error;
  }
}

async function loginSeller() {
  const data = await request('/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'seller@kakao.com',
      password: DEFAULT_PASSWORD,
    }),
  });

  return data.token;
}

async function seedProducts(token) {
  const existing = await request('/products');
  const existingCount = existing.count || 0;

  if (existingCount >= RAW_PRODUCTS.length) {
    console.log(`[seed] skip products (already ${existingCount} in DB)`);
    return;
  }

  console.log(`[seed] creating ${RAW_PRODUCTS.length} products...`);

  let created = 0;

  for (const item of RAW_PRODUCTS) {
    try {
      await request('/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildProductPayload(item)),
      });
      created += 1;
      console.log(`[seed] ${item.name}`);
      await sleep(150);
    } catch (error) {
      console.error(`[seed] failed ${item.name}: ${error.message}`);
    }
  }

  const final = await request('/products');
  console.log(`[seed] done. created=${created}, total=${final.count}`);
}

async function promoteAdminUser() {
  const uri = getMongoUri();

  if (!uri) {
    console.log('[admin] skip (Atlas MONGODB_URI not found in server/.env)');
    return;
  }

  const mongoose = require('mongoose');
  const User = require('../src/models/User');

  await mongoose.connect(uri);

  const user = await User.findOne({ email: 'admin@kakao.com' });

  if (!user) {
    console.log('[admin] admin@kakao.com not found — register via site first or set MONGODB_URI');
    await mongoose.disconnect();
    return;
  }

  if (user.userType !== 'admin') {
    user.userType = 'admin';
    await user.save();
    console.log('[admin] promoted admin@kakao.com to admin');
  } else {
    console.log('[admin] admin@kakao.com already admin');
  }

  await mongoose.disconnect();
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Images: ${IMAGE_BASE}\n`);

  for (const user of USERS) {
    await registerUser(user);
  }

  await promoteAdminUser();

  const token = await loginSeller();
  await seedProducts(token);

  console.log('\n--- Login accounts (password: ' + DEFAULT_PASSWORD + ') ---');
  console.log('seller@kakao.com   (판매자)');
  console.log('customer@kakao.com (고객)');
  console.log('admin@kakao.com    (관리자 — MONGODB_URI 설정 시 admin 권한 부여)');
}

main().catch((error) => {
  console.error('\nBootstrap failed:', error.message);
  process.exitCode = 1;
});
