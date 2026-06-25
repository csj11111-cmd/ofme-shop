const Product = require('../models/Product');

const MAX_POINTS = 3200;
const FREE_SHIPPING_THRESHOLD = 50000;
const DEFAULT_SHIPPING_FEE = 3000;

const getColorImage = (product, color) => {
  if (!color || color === product.colors?.[0]) {
    return product.images?.primary || null;
  }

  if (product.colorImages instanceof Map) {
    return product.colorImages.get(color) || product.images?.primary || null;
  }

  if (product.colorImages && typeof product.colorImages === 'object') {
    return product.colorImages[color] || product.images?.primary || null;
  }

  return product.images?.primary || null;
};

const buildOrderItem = (product, { color, size, qty }) => {
  const unitPrice = product.price;
  const lineDiscount = product.orig ? Math.max(0, product.orig - product.price) * qty : 0;
  const lineTotal = unitPrice * qty;

  return {
    product: product._id,
    productId: product._id.toString(),
    productCode: product.productCode || null,
    name: product.name,
    brand: product.brand,
    image: getColorImage(product, color),
    color,
    size,
    unitPrice,
    qty,
    lineDiscount,
    lineTotal,
  };
};

const resolveShippingAddress = (user, shippingAddressId) => {
  const addresses = user.addresses || [];
  const address = addresses.find((item) => item._id.toString() === String(shippingAddressId));

  if (!address) {
    return { error: '배송지를 찾을 수 없습니다.' };
  }

  if (!address.postcode || !address.baseAddress) {
    return { error: '배송지 정보가 올바르지 않습니다.' };
  }

  return { address };
};

const calculateCouponDiscount = (couponType, goodsAmount) => {
  const type = Number(couponType) || 0;

  if (type === 1) {
    return Math.min(5000, goodsAmount);
  }

  if (type === 2) {
    return Math.round(goodsAmount * 0.1);
  }

  return 0;
};

const calculateShippingFee = (goodsAmount, couponType) => {
  const type = Number(couponType) || 0;

  if (goodsAmount >= FREE_SHIPPING_THRESHOLD || goodsAmount === 0 || type === 3) {
    return 0;
  }

  return DEFAULT_SHIPPING_FEE;
};

const buildOrderPayload = async ({
  user,
  items,
  shippingAddressId,
  deliveryMemo = '',
  phone = '',
  couponType = 0,
  couponCode,
  pointsUsed = 0,
  paymentMethod = 'demo',
}) => {
  const errors = [];

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('주문 상품이 필요합니다.');
  }

  if (!shippingAddressId) {
    errors.push('배송지를 선택해 주세요.');
  }

  if (errors.length > 0) {
    return { errors };
  }

  const { address, error: addressError } = resolveShippingAddress(user, shippingAddressId);

  if (addressError) {
    return { errors: [addressError] };
  }

  const productIds = [...new Set(items.map((item) => String(item.productId)))];
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const orderItems = [];

  for (const item of items) {
    const product = productMap.get(String(item.productId));

    if (!product) {
      errors.push('판매 중이 아닌 상품이 포함되어 있습니다.');
      continue;
    }

    if (!item.color || !item.size) {
      errors.push('색상과 사이즈를 선택해 주세요.');
      continue;
    }

    if (!product.colors.includes(item.color)) {
      errors.push(`${product.name}의 색상 옵션이 올바르지 않습니다.`);
      continue;
    }

    const qty = Number(item.qty);

    if (!Number.isInteger(qty) || qty < 1) {
      errors.push(`${product.name}의 수량이 올바르지 않습니다.`);
      continue;
    }

    orderItems.push(buildOrderItem(product, {
      color: item.color,
      size: item.size,
      qty,
    }));
  }

  if (errors.length > 0) {
    return { errors };
  }

  const goodsAmount = orderItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const discountAmount = orderItems.reduce((sum, item) => sum + item.lineDiscount, 0);
  const couponDiscount = calculateCouponDiscount(couponType, goodsAmount);
  const normalizedPoints = Math.min(
    Math.max(0, Number(pointsUsed) || 0),
    MAX_POINTS,
    Math.max(0, goodsAmount - couponDiscount)
  );
  const shippingFee = calculateShippingFee(goodsAmount, couponType);
  const totalAmount = Math.max(0, goodsAmount - couponDiscount - normalizedPoints + shippingFee);
  const now = new Date();

  return {
    data: {
      customer: {
        name: user.name,
        email: user.email,
        phone: String(phone || '').trim(),
      },
      shipping: {
        recipientName: user.name,
        phone: String(phone || '').trim(),
        postcode: address.postcode,
        baseAddress: address.baseAddress,
        detailAddress: address.detailAddress || '',
        deliveryMemo: String(deliveryMemo || '').trim(),
      },
      items: orderItems,
      goodsAmount,
      discountAmount,
      couponCode: couponCode ? String(couponCode).trim() : undefined,
      couponDiscount,
      pointsUsed: normalizedPoints,
      shippingFee,
      totalAmount,
      payment: {
        method: paymentMethod,
        status: 'paid',
        paidAt: now,
      },
      status: 'paid',
      statusHistory: [
        {
          status: 'paid',
          changedAt: now,
          note: '주문 접수',
        },
      ],
    },
  };
};

module.exports = {
  buildOrderPayload,
  calculateCouponDiscount,
  calculateShippingFee,
};
