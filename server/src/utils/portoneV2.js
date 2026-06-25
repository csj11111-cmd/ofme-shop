const { PaymentClient } = require('@portone/server-sdk');

let client = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getV2Secret() {
  return process.env.PORTONE_V2_API_SECRET?.trim() || '';
}

function isV2Configured() {
  return Boolean(getV2Secret());
}

function getPortoneV2Client() {
  const secret = getV2Secret();

  if (!secret) {
    throw new Error(
      '포트원 V2 API Secret이 설정되지 않았습니다. 관리자 콘솔 > 결제연동 > V2 API에서 Secret을 발급받아 server/.env의 PORTONE_V2_API_SECRET에 추가해 주세요.'
    );
  }

  if (!client) {
    client = PaymentClient({
      secret,
      storeId: process.env.PORTONE_V2_STORE_ID?.trim() || undefined,
    });
  }

  return client;
}

function isPaymentNotFoundError(error) {
  return error?.data?.type === 'PAYMENT_NOT_FOUND';
}

function isPaymentAlreadyCancelledError(error) {
  return error?.data?.type === 'PAYMENT_ALREADY_CANCELLED';
}

function isUnauthorizedError(error) {
  return error?.data?.type === 'UNAUTHORIZED';
}

function mapPortoneError(error, fallbackMessage) {
  if (isUnauthorizedError(error)) {
    return new Error(
      '포트원 V2 API Secret이 올바르지 않습니다. server/.env의 PORTONE_V2_API_SECRET 값을 확인해 주세요.'
    );
  }

  if (isPaymentNotFoundError(error)) {
    return new Error('결제 정보를 찾을 수 없습니다.');
  }

  return new Error(error?.message || fallbackMessage);
}

async function fetchV2Payment(paymentId) {
  const portone = getPortoneV2Client();
  const storeId = process.env.PORTONE_V2_STORE_ID?.trim() || undefined;
  const maxAttempts = 6;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await portone.getPayment({ paymentId, storeId });
    } catch (error) {
      if (isPaymentNotFoundError(error) && attempt < maxAttempts - 1) {
        await sleep(500 * (attempt + 1));
        continue;
      }

      throw mapPortoneError(error, '결제 정보를 조회하지 못했습니다.');
    }
  }

  throw new Error('결제 정보를 찾을 수 없습니다.');
}

function normalizeV2Payment(payment, expectedAmount) {
  if (payment.status !== 'PAID') {
    throw new Error('결제가 완료되지 않았습니다.');
  }

  const paidAmount = payment.amount?.paid ?? payment.amount?.total;

  if (Number(paidAmount) !== Number(expectedAmount)) {
    throw new Error('결제 금액이 주문 금액과 일치하지 않습니다.');
  }

  const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date();

  return {
    imp_uid: payment.transactionId || payment.id,
    merchant_uid: payment.id,
    paid_at: Math.floor(paidAt.getTime() / 1000),
    amount: paidAmount,
    status: 'paid',
  };
}

async function verifyV2Payment(paymentId, expectedAmount) {
  const payment = await fetchV2Payment(paymentId);
  return normalizeV2Payment(payment, expectedAmount);
}

async function cancelV2Payment(paymentId, { reason, amount }) {
  const portone = getPortoneV2Client();
  const storeId = process.env.PORTONE_V2_STORE_ID?.trim() || undefined;

  try {
    await portone.cancelPayment({
      paymentId,
      storeId,
      reason,
      amount,
      requester: 'Customer',
    });
  } catch (error) {
    if (isPaymentAlreadyCancelledError(error)) {
      return;
    }

    throw mapPortoneError(error, '결제 취소에 실패했습니다.');
  }
}

async function listRecentPaidPayments({ customerEmail, days = 14 } = {}) {
  const portone = getPortoneV2Client();
  const storeId = process.env.PORTONE_V2_STORE_ID?.trim() || undefined;
  const until = new Date();
  const from = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);

  const filter = {
    storeId,
    status: ['PAID'],
    from: from.toISOString(),
    until: until.toISOString(),
    sortBy: 'REQUESTED_AT',
    sortOrder: 'DESC',
  };

  if (customerEmail) {
    filter.textSearch = [{ field: 'CUSTOMER_EMAIL', value: customerEmail }];
  }

  const response = await portone.getPayments({
    page: { number: 0, size: 100 },
    filter,
  });

  return response.items || [];
}

function getPaymentAmount(payment) {
  return payment?.amount?.paid ?? payment?.amount?.total ?? 0;
}

module.exports = {
  cancelV2Payment,
  fetchV2Payment,
  getPaymentAmount,
  isV2Configured,
  listRecentPaidPayments,
  verifyV2Payment,
};
