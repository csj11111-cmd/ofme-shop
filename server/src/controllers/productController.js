const Product = require('../models/Product');
const formatProduct = require('../utils/formatProduct');
const { saveProductImages, deleteProductImages } = require('../utils/saveProductImages');
const { parseProductInput, handleProductError } = require('../utils/normalizeProductInput');

const createProductCode = async () => {
  const date = new Date();
  const prefix = `PRD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const count = await Product.countDocuments({
    productCode: { $regex: `^${prefix}-` },
  });

  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('seller', 'name email userType')
      .sort({ createdAt: -1 });

    return res.json({
      count: products.length,
      products: products.map(formatProduct),
    });
  } catch {
    return res.status(500).json({ message: '상품 목록을 불러오지 못했습니다.' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email userType');

    if (!product || !product.isActive) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    return res.json({ product: formatProduct(product) });
  } catch {
    return res.status(500).json({ message: '상품 정보를 불러오지 못했습니다.' });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const filter = req.user.userType === 'admin' ? {} : { seller: req.user.id };

    const products = await Product.find(filter)
      .populate('seller', 'name email userType')
      .sort({ createdAt: -1 });

    return res.json({
      count: products.length,
      products: products.map(formatProduct),
    });
  } catch {
    return res.status(500).json({ message: '내 상품 목록을 불러오지 못했습니다.' });
  }
};

/**
 * POST /api/products
 * seller/admin 토큰 필요
 */
const createProduct = async (req, res) => {
  try {
    const { data, errors } = parseProductInput(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(' ') });
    }

    const productCode = await createProductCode();
    const savedImages = saveProductImages(productCode, data.images);

    const product = await Product.create({
      productCode,
      name: data.name,
      brand: data.brand,
      cat: data.cat,
      g: data.g,
      price: data.price,
      orig: data.orig,
      colors: data.colors,
      tag: data.tag,
      description: data.description,
      fabric: data.fabric,
      fit: data.fit,
      images: savedImages,
      isActive: data.isActive !== false,
      seller: req.user.id,
    });

    await product.populate('seller', 'name email userType');

    return res.status(201).json({
      message: '상품이 등록되었습니다.',
      product: formatProduct(product),
    });
  } catch (error) {
    return handleProductError(error, res, '상품 등록에 실패했습니다.');
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    const isOwner = product.seller.toString() === req.user.id;
    const isAdmin = req.user.userType === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: '수정 권한이 없습니다.' });
    }

    const { data, errors } = parseProductInput(req.body, { isUpdate: true });

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(' ') });
    }

    Object.entries(data).forEach(([field, value]) => {
      if (field === 'images') {
        return;
      }

      product[field] = value;
    });

    if (data.images !== undefined) {
      const savedImages = saveProductImages(product.productCode, data.images);
      const currentImages = product.images?.toObject?.() ?? product.images ?? {};

      product.images = { ...currentImages, ...savedImages };
      product.markModified('images');
    }

    await product.save();
    await product.populate('seller', 'name email userType');

    return res.json({
      message: '상품이 수정되었습니다.',
      product: formatProduct(product),
    });
  } catch (error) {
    return handleProductError(error, res, '상품 수정에 실패했습니다.');
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    const isOwner = product.seller.toString() === req.user.id;
    const isAdmin = req.user.userType === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }

    deleteProductImages(product.images);
    await product.deleteOne();

    return res.json({ message: '상품이 삭제되었습니다.' });
  } catch {
    return res.status(500).json({ message: '상품 삭제에 실패했습니다.' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
