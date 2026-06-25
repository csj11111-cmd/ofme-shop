const { GARMENT_TYPES, TAG_OPTIONS } = require('../models/Product');
const { DESCRIPTIONS, FABRIC, FIT } = require('../constants/productDefaults');

const parseNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return { value: undefined };
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    return { error: `${fieldName}는 0 이상의 숫자여야 합니다.` };
  }

  return { value: parsed };
};

const normalizeTag = (tag) => {
  if (!tag) {
    return undefined;
  }

  const trimmed = String(tag).trim();

  if (!TAG_OPTIONS.includes(trimmed)) {
    return undefined;
  }

  return trimmed;
};

const normalizeColors = (colors) => {
  if (!Array.isArray(colors) || colors.length === 0) {
    return ['coral'];
  }

  const unique = [...new Set(colors.map((color) => String(color).trim()).filter(Boolean))];

  if (unique.length === 0) {
    return ['coral'];
  }

  return unique.slice(0, 4);
};

const normalizeImagesInput = (images) => {
  if (!images || typeof images !== 'object') {
    return {};
  }

  const normalized = {};
  const fields = ['primary', 'walk', 'coordi', 'flat'];

  fields.forEach((field) => {
    const value = images[field];

    if (typeof value === 'string' && value.trim()) {
      normalized[field] = value.trim();
    }
  });

  return normalized;
};

const applyProductDefaults = ({ g, description, fabric, fit }) => ({
  description: description?.trim() || DESCRIPTIONS[g] || '',
  fabric: fabric?.trim() || FABRIC[g] || '',
  fit: fit?.trim() || FIT[g] || '',
});

const parseProductInput = (body, { isUpdate = false } = {}) => {
  const errors = [];

  const name = body.name?.trim();
  const brand = body.brand?.trim();
  const cat = body.cat?.trim();
  const g = body.g?.trim();

  if (!isUpdate || body.name !== undefined) {
    if (!name) errors.push('상품명은 필수입니다.');
  }

  if (!isUpdate || body.brand !== undefined) {
    if (!brand) errors.push('브랜드는 필수입니다.');
  }

  if (!isUpdate || body.cat !== undefined) {
    if (!cat) errors.push('카테고리는 필수입니다.');
  }

  if (!isUpdate || body.g !== undefined) {
    if (!g) errors.push('상품 유형은 필수입니다.');
    else if (!GARMENT_TYPES.includes(g)) errors.push('유효하지 않은 상품 유형입니다.');
  }

  const priceResult = parseNumber(body.price, '판매가');
  if (priceResult.error) errors.push(priceResult.error);
  else if (!isUpdate && priceResult.value === undefined) errors.push('판매가는 필수입니다.');

  const origResult = parseNumber(body.orig, '정가');
  if (origResult.error) errors.push(origResult.error);

  if (errors.length > 0) {
    return { errors };
  }

  const garmentType = g || body.g;
  const defaults = applyProductDefaults({
    g: garmentType,
    description: body.description,
    fabric: body.fabric,
    fit: body.fit,
  });

  const data = {};

  if (name) data.name = name;
  if (brand) data.brand = brand;
  if (cat) data.cat = cat;
  if (g) data.g = g;
  if (priceResult.value !== undefined) data.price = priceResult.value;
  if (origResult.value !== undefined) data.orig = origResult.value;
  if (!isUpdate || body.colors !== undefined) {
    data.colors = normalizeColors(body.colors);
  }
  if (body.tag !== undefined) data.tag = normalizeTag(body.tag);
  if (body.description !== undefined || !isUpdate) data.description = defaults.description;
  if (body.fabric !== undefined || !isUpdate) data.fabric = defaults.fabric;
  if (body.fit !== undefined || !isUpdate) data.fit = defaults.fit;
  if (body.isActive !== undefined) data.isActive = body.isActive !== false;
  if (body.images !== undefined) data.images = normalizeImagesInput(body.images);

  return { data, errors: [] };
};

const handleProductError = (error, res, fallbackMessage) => {
  if (error.code === 11000) {
    return res.status(409).json({ message: '상품 코드가 중복되었습니다. 다시 시도해 주세요.' });
  }

  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((err) => err.message)
      .join(', ');

    return res.status(400).json({ message });
  }

  return res.status(500).json({ message: fallbackMessage });
};

module.exports = {
  parseProductInput,
  applyProductDefaults,
  normalizeImagesInput,
  handleProductError,
};
