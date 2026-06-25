const { isV2Configured, verifyV2Payment } = require('./portoneV2');

const PORTONE_API_URL = 'https://api.iamport.kr';

const getAccessToken = async () => {
  const impKey = process.env.PORTONE_API_KEY;
  const impSecret = process.env.PORTONE_API_SECRET;

  if (!impKey || !impSecret) {
    throw new Error(
      '포트원 API 키가 설정되지 않았습니다. server/.env에 PORTONE_API_KEY, PORTONE_API_SECRET을 추가해 주세요.'
    );
  }

  const response = await fetch(`${PORTONE_API_URL}/users/getToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imp_key: impKey,
      imp_secret: impSecret,
    }),
  });

  const payload = await response.json();

  if (payload.code !== 0) {
    throw new Error(payload.message || '포트원 인증에 실패했습니다.');
  }

  return payload.response.access_token;
};

const fetchV1Payment = async (url, accessToken) => {
  const response = await fetch(url, {
    headers: { Authorization: accessToken },
  });
  const payload = await response.json();

  if (payload.code !== 0) {
    return null;
  }

  return payload.response;
};

const verifyV1Payment = async (impUid, { merchantUid, expectedAmount }) => {
  const accessToken = await getAccessToken();

  let payment = null;

  if (impUid) {
    payment = await fetchV1Payment(`${PORTONE_API_URL}/payments/${impUid}`, accessToken);
  }

  if (!payment && merchantUid) {
    payment = await fetchV1Payment(`${PORTONE_API_URL}/payments/find/${merchantUid}`, accessToken);
  }

  if (!payment) {
    throw new Error('결제 정보를 찾을 수 없습니다.');
  }

  if (payment.status !== 'paid') {
    throw new Error('결제가 완료되지 않았습니다.');
  }

  if (merchantUid && payment.merchant_uid !== merchantUid) {
    throw new Error('주문번호가 일치하지 않습니다.');
  }

  if (Number(payment.amount) !== Number(expectedAmount)) {
    throw new Error('결제 금액이 주문 금액과 일치하지 않습니다.');
  }

  return payment;
};

const verifyPortonePayment = async (impUid, { merchantUid, expectedAmount }) => {
  const paymentId = merchantUid || impUid;

  if (!paymentId) {
    throw new Error('결제 정보가 필요합니다.');
  }

  if (isV2Configured()) {
    return verifyV2Payment(paymentId, expectedAmount);
  }

  try {
    return await verifyV1Payment(impUid, { merchantUid, expectedAmount });
  } catch (error) {
    if (error.message === '결제 정보를 찾을 수 없습니다.') {
      throw new Error(
        '결제 정보를 찾을 수 없습니다. V2 결제를 사용 중이라면 server/.env에 PORTONE_V2_API_SECRET을 설정한 뒤 서버를 재시작해 주세요.'
      );
    }

    throw error;
  }
};

module.exports = verifyPortonePayment;
