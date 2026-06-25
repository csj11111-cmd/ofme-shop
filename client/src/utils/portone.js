import PortOne from '@portone/browser-sdk/v2'

const PORTONE_SCRIPT_URL = 'https://cdn.iamport.kr/v1/iamport.js'
const STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID || 'imp71057543'
const V2_STORE_ID = import.meta.env.VITE_PORTONE_V2_STORE_ID?.trim() || ''
const CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY?.trim() || ''
const PG = import.meta.env.VITE_PORTONE_PG?.trim() || ''

let loadPromise = null
let initialized = false
let paymentInFlight = false

export function getPortOneConfigError() {
  if (CHANNEL_KEY && !V2_STORE_ID) {
    return 'client/.env에 VITE_PORTONE_V2_STORE_ID(store-xxx)를 추가한 뒤 개발 서버를 재시작해 주세요.'
  }

  if (CHANNEL_KEY || PG) {
    return null
  }

  return (
    '실결제 설정이 필요합니다. client/.env에 VITE_PORTONE_CHANNEL_KEY를 추가한 뒤 개발 서버를 재시작해 주세요.'
  )
}

function waitForImpOnScript(script) {
  return new Promise((resolve, reject) => {
    if (window.IMP) {
      resolve(window.IMP)
      return
    }

    const handleLoad = () => {
      if (window.IMP) {
        resolve(window.IMP)
        return
      }

      reject(new Error('결제 모듈 초기화에 실패했습니다.'))
    }

    const handleError = () => {
      reject(new Error('결제 모듈을 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.'))
    }

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })

    if (script.dataset.loaded === 'true') {
      handleLoad()
    }
  })
}

export function loadPortOneScript() {
  if (window.IMP) {
    return Promise.resolve(window.IMP)
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="cdn.iamport.kr/v1/iamport.js"]')

    if (existingScript) {
      waitForImpOnScript(existingScript).then(resolve).catch((error) => {
        loadPromise = null
        reject(error)
      })
      return
    }

    const script = document.createElement('script')
    script.src = PORTONE_SCRIPT_URL
    script.async = true
    script.onload = () => {
      script.dataset.loaded = 'true'

      if (window.IMP) {
        resolve(window.IMP)
        return
      }

      loadPromise = null
      reject(new Error('결제 모듈 초기화에 실패했습니다.'))
    }
    script.onerror = () => {
      loadPromise = null
      script.remove()
      reject(new Error('결제 모듈을 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.'))
    }

    document.head.appendChild(script)
  })

  return loadPromise
}

export async function initPortOne() {
  const configError = getPortOneConfigError()

  if (configError) {
    throw new Error(configError)
  }

  if (CHANNEL_KEY) {
    return true
  }

  await loadPortOneScript()

  if (!initialized) {
    window.IMP.init(STORE_ID)
    initialized = true
  }

  return true
}

export function createMerchantUid() {
  return `OFM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

async function requestWithV2({
  amount,
  merchantUid,
  name,
  buyerEmail,
  buyerName,
  buyerTel,
}) {
  const response = await PortOne.requestPayment({
    storeId: V2_STORE_ID,
    channelKey: CHANNEL_KEY,
    paymentId: merchantUid,
    orderName: name,
    totalAmount: Number(amount),
    currency: 'KRW',
    payMethod: 'CARD',
    customer: {
      fullName: buyerName,
      phoneNumber: buyerTel,
      email: buyerEmail,
    },
  })

  if (!response) {
    throw new Error('결제 응답이 없습니다.')
  }

  if (response.code) {
    const message = response.message || response.pgMessage || '결제에 실패했습니다.'
    const code = String(response.code)

    if (
      code.toLowerCase().includes('cancel') ||
      message.includes('취소') ||
      message.toLowerCase().includes('cancel')
    ) {
      throw new Error('PAY_CANCEL')
    }

    throw new Error(message)
  }

  return {
    imp_uid: response.txId || response.paymentId || merchantUid,
    merchant_uid: merchantUid,
  }
}

function requestWithV1({
  amount,
  merchantUid,
  name,
  buyerEmail,
  buyerName,
  buyerTel,
}) {
  const params = {
    pay_method: 'card',
    merchant_uid: merchantUid,
    name,
    amount: Number(amount),
    buyer_email: buyerEmail,
    buyer_name: buyerName,
    buyer_tel: buyerTel,
    pg: PG,
  }

  return new Promise((resolve, reject) => {
    window.IMP.request_pay(params, (response) => {
      if (response.success) {
        resolve(response)
        return
      }

      reject(new Error(response.error_msg || '결제에 실패했습니다.'))
    })
  })
}

export async function requestPortOnePayment({
  amount,
  merchantUid,
  name,
  buyerEmail,
  buyerName,
  buyerTel,
}) {
  if (paymentInFlight) {
    throw new Error('결제가 이미 진행 중입니다.')
  }

  paymentInFlight = true

  try {
    await initPortOne()

    const paymentInput = {
      amount,
      merchantUid,
      name,
      buyerEmail,
      buyerName,
      buyerTel,
    }

    if (CHANNEL_KEY) {
      return await requestWithV2(paymentInput)
    }

    await loadPortOneScript()

    if (!initialized) {
      window.IMP.init(STORE_ID)
      initialized = true
    }

    return await requestWithV1(paymentInput)
  } finally {
    paymentInFlight = false
  }
}
