const mongoose = require('mongoose');

const GARMENT_TYPES = ['tee', 'tank', 'dress', 'swim', 'active', 'shorts', 'skirt'];
const TAG_OPTIONS = ['NEW', '급상승', '1위', '쿠폰', 'BEST'];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '상품명은 필수입니다.'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, '브랜드는 필수입니다.'],
      trim: true,
    },
    cat: {
      type: String,
      required: [true, '카테고리는 필수입니다.'],
      trim: true,
    },
    g: {
      type: String,
      required: [true, '상품 유형은 필수입니다.'],
      enum: {
        values: GARMENT_TYPES,
        message: '{VALUE} is not a valid garment type',
      },
    },
    price: {
      type: Number,
      required: [true, '판매가는 필수입니다.'],
      min: [0, '판매가는 0 이상이어야 합니다.'],
    },
    orig: {
      type: Number,
      min: [0, '정가는 0 이상이어야 합니다.'],
    },
    colors: {
      type: [String],
      default: ['coral'],
      validate: {
        validator: (value) => value.length >= 1 && value.length <= 4,
        message: '색상은 1~4개까지 등록할 수 있습니다.',
      },
    },
    tag: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    fabric: {
      type: String,
      trim: true,
      default: '',
    },
    fit: {
      type: String,
      trim: true,
      default: '',
    },
    images: {
      primary: { type: String, trim: true },
      walk: { type: String, trim: true },
      coordi: { type: String, trim: true },
      flat: { type: String, trim: true },
    },
    colorImages: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
    productCode: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
module.exports.GARMENT_TYPES = GARMENT_TYPES;
module.exports.TAG_OPTIONS = TAG_OPTIONS;
