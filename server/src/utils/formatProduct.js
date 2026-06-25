const formatProduct = (product) => ({
  id: product._id.toString(),
  productCode: product.productCode || product._id.toString(),
  name: product.name,
  brand: product.brand,
  cat: product.cat,
  g: product.g,
  price: product.price,
  orig: product.orig ?? null,
  colors: product.colors,
  tag: product.tag ?? null,
  description: product.description,
  fabric: product.fabric || '',
  fit: product.fit || '',
  images: {
    primary: product.images?.primary || null,
    walk: product.images?.walk || null,
    coordi: product.images?.coordi || null,
    flat: product.images?.flat || null,
  },
  colorImages: product.colorImages instanceof Map
    ? Object.fromEntries(product.colorImages)
    : product.colorImages || {},
  sellerId: product.seller?._id?.toString() || product.seller?.toString(),
  sellerName: product.seller?.name ?? null,
  isActive: product.isActive,
  isRegistered: true,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

module.exports = formatProduct;
