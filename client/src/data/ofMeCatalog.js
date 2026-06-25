export const SHOP_NAME = 'Of Me'

export function formatPrice(value) {
  return Math.max(0, Math.round(value)).toLocaleString('ko-KR')
}

export function getDiscountRate(price, orig) {
  if (!orig) return 0
  return Math.round((1 - price / orig) * 100)
}

export function getTagBg(tag) {
  if (tag === '1위') return '#33333a'
  if (tag === '쿠폰') return '#5fd0ad'
  if (tag === 'NEW') return '#2a4bd0'
  return '#ff6f61'
}

export function filterAndSortProducts(products, category, sort) {
  let list = category === '전체' ? products : products.filter((product) => product.cat === category)

  if (sort === '낮은가격순') {
    list = [...list].sort((a, b) => a.price - b.price)
  } else if (sort === '최신순') {
    list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return list
}

export const CATEGORIES = ['전체', '반팔티', '나시', '원피스', '수영복', '운동복', '반바지', '스커트']

export const SORT_OPTIONS = ['인기순', '최신순', '낮은가격순']

export const PALETTE = {
  white: '#f1ede4',
  ivory: '#e9ddc6',
  coral: '#ff7a6b',
  mint: '#5fd0ad',
  sky: '#74b6f2',
  lemon: '#ffd95e',
  lilac: '#c4a6f0',
  pink: '#ff9ec1',
  black: '#33333a',
  navy: '#34416b',
  sand: '#dcc196',
  aqua: '#46c6d4',
  olive: '#9aa15f',
  denim: '#8aa6c8',
  red: '#e23b2e',
  cobalt: '#2a4bd0',
}

export const COLOR_NAMES = {
  white: '화이트',
  ivory: '아이보리',
  coral: '코랄',
  mint: '민트',
  sky: '스카이블루',
  lemon: '레몬',
  lilac: '라일락',
  pink: '핑크',
  black: '블랙',
  navy: '네이비',
  sand: '샴페인',
  aqua: '아쿠아',
  olive: '올리브',
  denim: '데님',
  red: '레드',
  cobalt: '코발트블루',
}

export const DESCRIPTIONS = {
  tee: '데일리로 입기 좋은 코튼 소재의 베이직 반팔이에요. 적당한 두께감으로 비침 없이 활용도가 높고, 어떤 하의에도 잘 어울립니다.',
  tank: '시원한 슬리브리스 디자인으로 한여름 데일리룩에 딱이에요. 단독으로도, 셔츠 안에 레이어드로도 좋아요.',
  dress: '한 장으로 코디가 완성되는 여름 원피스. 셔링과 플레어 실루엣으로 체형 커버까지 잡았어요.',
  swim: '트렌디한 디자인의 여름 필수 수영복. 신축성 좋은 원단으로 활동성과 핏을 모두 챙겼어요. 물놀이는 물론 비치웨어로도 완벽.',
  active: '땀을 빠르게 배출하는 쿨링 기능성 원단. 요가·러닝·홈트까지 데일리 운동복으로 활용도 만점이에요.',
  shorts: '어디에나 매치하기 좋은 여름 반바지. 편안한 핏과 깔끔한 실루엣으로 매일 손이 가는 아이템.',
  skirt: '페미닌한 무드의 여름 스커트. 자연스러운 플리츠/랩 디테일로 스타일링이 쉬워요.',
}

export const FABRIC = {
  tee: '코튼 95%, 스판덱스 5%',
  tank: '레이온 60%, 린넨 40%',
  dress: '폴리에스터 100%',
  swim: '나일론 82%, 스판덱스 18%',
  active: '폴리에스터 88%, 스판덱스 12%',
  shorts: '코튼 100%',
  skirt: '폴리에스터 95%, 스판덱스 5%',
}

export const FIT = {
  tee: '슬림 레귤러',
  tank: '레귤러',
  dress: '플레어',
  swim: '밴드 핏',
  active: '컴프레션',
  shorts: '와이드',
  skirt: 'A라인',
}

export const SIZE_CLASS = {
  tee: 'top',
  tank: 'top',
  dress: 'dress',
  swim: 'swim',
  active: 'active',
  shorts: 'bottom',
  skirt: 'bottom',
}

export const SIZE_CHARTS = {
  top: {
    cols: ['어깨', '가슴단면', '총장', '소매'],
    rows: { S: [37, 46, 58, 18], M: [39, 49, 61, 20], L: [41, 52, 64, 22] },
  },
  dress: {
    cols: ['어깨', '가슴단면', '총장', '허리단면'],
    rows: { S: [35, 44, 84, 33], M: [37, 47, 88, 36], L: [39, 50, 92, 39] },
  },
  swim: {
    cols: ['가슴', '허리', '힙'],
    rows: { S: [80, 62, 86], M: [85, 67, 91], L: [90, 72, 96] },
  },
  active: {
    cols: ['가슴단면', '허리', '상의총장', '하의총장'],
    rows: { S: [40, 28, 38, 88], M: [42, 30, 40, 91], L: [44, 32, 42, 94] },
  },
  bottom: {
    cols: ['허리단면', '힙단면', '총장', '밑단'],
    rows: { S: [33, 46, 38, 52], M: [35, 48, 40, 54], L: [37, 50, 42, 56] },
  },
}

