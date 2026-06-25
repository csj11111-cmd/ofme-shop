const Order = require('../models/Order');
const User = require('../models/User');
const { ORDER_STATUSES } = require('../models/Order');
const formatOrder = require('../utils/formatOrder');
const { buildOrderPayload } = require('../utils/buildOrderPayload');
const verifyPortonePayment = require('../utils/verifyPortonePayment');
const {
  cancelV2Payment,
  fetchV2Payment,
  getPaymentAmount,
  isV2Configured,
  listRecentPaidPayments,
} = require('../utils/portoneV2');

const CANCELLABLE_STATUSES = ['pending', 'paid', 'preparing'];

const createOrderNumber = async () => {
  const date = new Date();
  const prefix = `OFM${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const count = await Order.countDocuments({
    createdAt: {
      $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
    },
  });

  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

const createOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: '회원 정보를 찾을 수 없습니다.' });
    }

    const { impUid, merchantUid } = req.body;

    if (!impUid || !merchantUid) {
      return res.status(400).json({ message: '결제 정보가 필요합니다. 카드 결제를 완료해 주세요.' });
    }

    const { data, errors } = await buildOrderPayload({
      user,
      items: req.body.items,
      shippingAddressId: req.body.shippingAddressId,
      deliveryMemo: req.body.deliveryMemo,
      phone: req.body.phone,
      couponType: req.body.couponType,
      couponCode: req.body.couponCode,
      pointsUsed: req.body.pointsUsed,
      paymentMethod: 'card',
    });

    if (errors?.length) {
      return res.status(400).json({ message: errors.join(' ') });
    }

    const existingOrder = await Order.findOne({ 'payment.merchantUid': merchantUid });

    if (existingOrder) {
      return res.status(200).json({
        message: '이미 처리된 주문입니다.',
        order: formatOrder(existingOrder),
      });
    }

    let verifiedPayment;

    try {
      verifiedPayment = await verifyPortonePayment(impUid, {
        merchantUid,
        expectedAmount: data.totalAmount,
      });
    } catch (verificationError) {
      return res.status(400).json({ message: verificationError.message });
    }

    data.payment = {
      method: 'card',
      status: 'paid',
      paidAt: verifiedPayment.paid_at ? new Date(verifiedPayment.paid_at * 1000) : new Date(),
      transactionId: verifiedPayment.imp_uid || impUid,
      merchantUid: verifiedPayment.merchant_uid,
    };

    const orderNumber = await createOrderNumber();

    const order = await Order.create({
      orderNumber,
      user: user._id,
      ...data,
    });

    return res.status(201).json({
      message: '주문이 완료되었습니다.',
      order: formatOrder(order),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: '주문 번호 생성에 실패했습니다. 다시 시도해 주세요.' });
    }

    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');

      return res.status(400).json({ message });
    }

    return res.status(500).json({ message: '주문 처리에 실패했습니다.' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });

    return res.json({
      count: orders.length,
      orders: orders.map(formatOrder),
    });
  } catch {
    return res.status(500).json({ message: '주문 목록을 불러오지 못했습니다.' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    const isOwner = order.user.toString() === req.user.id;
    const isAdmin = req.user.userType === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: '주문 조회 권한이 없습니다.' });
    }

    return res.json({ order: formatOrder(order) });
  } catch {
    return res.status(500).json({ message: '주문 정보를 불러오지 못했습니다.' });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email userType')
      .sort({ createdAt: -1 });

    return res.json({
      count: orders.length,
      orders: orders.map(formatOrder),
    });
  } catch {
    return res.status(500).json({ message: '주문 목록을 불러오지 못했습니다.' });
  }
};

const paymentBelongsToUser = (payment, user) => {
  const paymentEmail = payment.customer?.email?.trim().toLowerCase();
  const userEmail = user.email?.trim().toLowerCase();

  if (paymentEmail && userEmail && paymentEmail === userEmail) {
    return true;
  }

  const paymentPhone = payment.customer?.phoneNumber?.replace(/\D/g, '');
  const userPhone = user.phone?.replace(/\D/g, '');

  return Boolean(paymentPhone && userPhone && paymentPhone === userPhone);
};

const getOrphanPayments = async (req, res) => {
  try {
    if (!isV2Configured()) {
      return res.json({ count: 0, payments: [] });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: '회원 정보를 찾을 수 없습니다.' });
    }

    const paidPayments = await listRecentPaidPayments({ customerEmail: user.email });
    const merchantUids = paidPayments
      .filter((payment) => payment.status === 'PAID' && payment.id?.startsWith('OFM-'))
      .map((payment) => payment.id);

    if (merchantUids.length === 0) {
      return res.json({ count: 0, payments: [] });
    }

    const existingOrders = await Order.find({
      'payment.merchantUid': { $in: merchantUids },
    }).select('payment.merchantUid');

    const existingSet = new Set(existingOrders.map((order) => order.payment.merchantUid));

    const orphans = paidPayments
      .filter(
        (payment) =>
          payment.status === 'PAID' &&
          payment.id?.startsWith('OFM-') &&
          !existingSet.has(payment.id) &&
          paymentBelongsToUser(payment, user)
      )
      .map((payment) => ({
        paymentId: payment.id,
        transactionId: payment.transactionId,
        orderName: payment.orderName,
        amount: getPaymentAmount(payment),
        paidAt: payment.paidAt,
      }));

    return res.json({
      count: orphans.length,
      payments: orphans,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || '미처리 결제 내역을 불러오지 못했습니다.',
    });
  }
};

const refundOrphanPayment = async (req, res) => {
  try {
    const { merchantUid, cancelReason } = req.body;

    if (!merchantUid) {
      return res.status(400).json({ message: '결제 ID가 필요합니다.' });
    }

    if (!isV2Configured()) {
      return res.status(503).json({ message: '결제 환불 설정이 완료되지 않았습니다.' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: '회원 정보를 찾을 수 없습니다.' });
    }

    const existingOrder = await Order.findOne({ 'payment.merchantUid': merchantUid });

    if (existingOrder) {
      return res.status(400).json({
        message: '이미 주문으로 등록된 결제입니다. 주문 내역에서 취소해 주세요.',
        orderId: existingOrder._id.toString(),
      });
    }

    const payment = await fetchV2Payment(merchantUid);

    if (payment.status !== 'PAID') {
      return res.status(400).json({ message: '환불할 수 있는 결제 상태가 아닙니다.' });
    }

    if (!paymentBelongsToUser(payment, user)) {
      return res.status(403).json({ message: '본인 결제만 환불할 수 있습니다.' });
    }

    const amount = getPaymentAmount(payment);

    await cancelV2Payment(merchantUid, {
      reason: String(cancelReason || '고객 요청 - 주문 미생성').trim(),
      amount,
    });

    return res.json({
      message: '결제가 환불되었습니다.',
      paymentId: merchantUid,
      amount,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || '결제 환불에 실패했습니다.',
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '주문 취소 권한이 없습니다.' });
    }

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return res.status(400).json({ message: '취소할 수 없는 주문 상태입니다.' });
    }

    const paymentId = order.payment?.merchantUid;
    const shouldRefund =
      order.payment?.status === 'paid' && paymentId && isV2Configured();

    if (shouldRefund) {
      try {
        await cancelV2Payment(paymentId, {
          reason: String(req.body.cancelReason || '고객 요청').trim(),
          amount: order.totalAmount,
        });
      } catch (refundError) {
        return res.status(400).json({
          message: refundError.message || '결제 취소(환불)에 실패했습니다.',
        });
      }
    }

    const now = new Date();
    order.status = 'cancelled';
    order.cancelledAt = now;
    order.cancelReason = String(req.body.cancelReason || '고객 요청').trim();
    order.statusHistory.push({
      status: 'cancelled',
      changedAt: now,
      note: order.cancelReason,
    });

    if (order.payment) {
      order.payment.status = 'refunded';
    }

    await order.save();

    return res.json({
      message: '주문이 취소되었습니다.',
      order: formatOrder(order),
    });
  } catch {
    return res.status(500).json({ message: '주문 취소에 실패했습니다.' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, cancelReason } = req.body;

    if (!status || !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${ORDER_STATUSES.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    order.status = status;
    const note = status === 'cancelled'
      ? String(cancelReason || '관리자 취소').trim()
      : '관리자 상태 변경';

    order.statusHistory.push({
      status,
      changedAt: new Date(),
      note,
    });

    if (status === 'cancelled' && !order.cancelledAt) {
      order.cancelledAt = new Date();
      order.cancelReason = note;
      if (order.payment?.status === 'paid') {
        order.payment.status = 'refunded';
      }
    }

    await order.save();

    return res.json({
      message: '주문 상태가 변경되었습니다.',
      order: formatOrder(order),
    });
  } catch {
    return res.status(500).json({ message: '주문 상태 변경에 실패했습니다.' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrders,
  getOrphanPayments,
  refundOrphanPayment,
  cancelOrder,
  updateOrderStatus,
};
