const formatOrderItem = (item) => ({
  productId: item.productId,
  productCode: item.productCode || null,
  name: item.name,
  brand: item.brand,
  image: item.image || null,
  color: item.color,
  size: item.size,
  unitPrice: item.unitPrice ?? item.price ?? 0,
  price: item.unitPrice ?? item.price ?? 0,
  qty: item.qty,
  lineDiscount: item.lineDiscount ?? 0,
  lineTotal: item.lineTotal ?? (item.unitPrice ?? item.price ?? 0) * item.qty,
});

const formatOrder = (order) => {
  const customerName = order.customer?.name || order.customerName || '';
  const customerEmail = order.customer?.email || order.customerEmail || '';

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    userId: order.user?._id?.toString() || order.user?.toString(),
    customer: order.customer
      ? {
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone || '',
        }
      : {
          name: customerName,
          email: customerEmail,
          phone: '',
        },
    customerName,
    customerEmail,
    shipping: order.shipping
      ? {
          recipientName: order.shipping.recipientName,
          phone: order.shipping.phone || '',
          postcode: order.shipping.postcode,
          baseAddress: order.shipping.baseAddress,
          detailAddress: order.shipping.detailAddress || '',
          deliveryMemo: order.shipping.deliveryMemo || '',
        }
      : null,
    items: (order.items || []).map(formatOrderItem),
    itemCount: (order.items || []).reduce((sum, item) => sum + item.qty, 0),
    goodsAmount: order.goodsAmount,
    discountAmount: order.discountAmount ?? 0,
    couponCode: order.couponCode || null,
    couponDiscount: order.couponDiscount ?? 0,
    pointsUsed: order.pointsUsed ?? 0,
    shippingFee: order.shippingFee ?? 0,
    totalAmount: order.totalAmount,
    payment: order.payment
      ? {
          method: order.payment.method,
          status: order.payment.status,
          paidAt: order.payment.paidAt || null,
          transactionId: order.payment.transactionId || null,
          merchantUid: order.payment.merchantUid || null,
        }
      : null,
    status: order.status,
    statusHistory: order.statusHistory || [],
    cancelledAt: order.cancelledAt || null,
    cancelReason: order.cancelReason || null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

module.exports = formatOrder;
