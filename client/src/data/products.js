export const CATEGORIES = {
  all: '전체',
  outer: '아우터',
  top: '상의',
  bottom: '하의',
  acc: '액세서리',
}

const PALETTE = {
  outer: ['#3a4756', '#6b7785'],
  top: ['#c9b8a5', '#e7ddcf'],
  bottom: ['#4a4e5a', '#777c88'],
  acc: ['#b08968', '#d6b893'],
}

export function createProductImage(cat, label) {
  const [colorA, colorB] = PALETTE[cat] || ['#ccc', '#eee']
  const safeId = label.replace(/\W/g, '')

  return `<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="g${safeId}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${colorA}"/><stop offset="1" stop-color="${colorB}"/></linearGradient></defs>
    <rect width="300" height="400" fill="url(#g${safeId})"/>
    <text x="150" y="205" fill="rgba(255,255,255,.85)" font-size="20" font-weight="700"
      text-anchor="middle" font-family="Helvetica">${label}</text></svg>`
}

const rawProducts = [
  {
    id: 1,
    cat: 'outer',
    brand: 'MUSE STUDIO',
    name: '오버사이즈 울 코트',
    price: 189000,
    was: 249000,
    tag: 'BEST',
    desc: '부드러운 울 혼방 소재로 가볍게 떨어지는 오버사이즈 핏의 싱글 코트입니다. 데일리부터 세미 포멀까지 폭넓게 연출할 수 있습니다.',
  },
  {
    id: 2,
    cat: 'outer',
    brand: 'MUSE STUDIO',
    name: '크롭 무스탕 자켓',
    price: 215000,
    was: null,
    tag: 'NEW',
    desc: '포근한 인조 무스탕 안감과 짧은 기장으로 다리 라인을 길어 보이게 하는 크롭 자켓.',
  },
  {
    id: 3,
    cat: 'top',
    brand: 'BASIC LAB',
    name: '코튼 오버핏 셔츠',
    price: 48000,
    was: 59000,
    tag: null,
    desc: '사계절 입기 좋은 100% 코튼 셔츠. 적당한 두께감과 여유로운 핏으로 이너 활용도가 높습니다.',
  },
  {
    id: 4,
    cat: 'top',
    brand: 'BASIC LAB',
    name: '램스울 라운드 니트',
    price: 69000,
    was: null,
    tag: 'BEST',
    desc: '보풀이 적은 램스울 혼방 니트. 톤다운된 컬러로 어디에나 매치하기 좋습니다.',
  },
  {
    id: 5,
    cat: 'bottom',
    brand: 'MUSE STUDIO',
    name: '와이드 슬랙스',
    price: 62000,
    was: 79000,
    tag: null,
    desc: '구김이 적은 소재의 와이드 핏 슬랙스. 깔끔한 핀턱 디테일로 단정한 무드를 완성합니다.',
  },
  {
    id: 6,
    cat: 'bottom',
    brand: 'DENIM CO.',
    name: '스트레이트 데님 팬츠',
    price: 74000,
    was: null,
    tag: 'NEW',
    desc: '적당한 두께의 비탄력 데님. 곧게 떨어지는 스트레이트 핏으로 빈티지한 무드를 연출합니다.',
  },
  {
    id: 7,
    cat: 'acc',
    brand: 'EVERYDAY',
    name: '레더 크로스백',
    price: 89000,
    was: 119000,
    tag: 'SALE',
    desc: '데일리로 메기 좋은 미니멀 크로스백. 스트랩 길이 조절이 가능해 다양하게 활용됩니다.',
  },
  {
    id: 8,
    cat: 'acc',
    brand: 'EVERYDAY',
    name: '캐시미어 머플러',
    price: 39000,
    was: null,
    tag: null,
    desc: '부드러운 촉감의 캐시미어 혼방 머플러. 넉넉한 폭으로 보온성이 뛰어납니다.',
  },
  {
    id: 9,
    cat: 'top',
    brand: 'MUSE STUDIO',
    name: '스트라이프 긴팔 티셔츠',
    price: 34000,
    was: 42000,
    tag: null,
    desc: '클래식한 보더 스트라이프 패턴의 긴팔 티셔츠. 데일리 코디의 기본 아이템.',
  },
  {
    id: 10,
    cat: 'outer',
    brand: 'BASIC LAB',
    name: '베이직 트렌치 코트',
    price: 159000,
    was: null,
    tag: 'NEW',
    desc: '시즌리스로 활용 가능한 트렌치 코트. 벨트로 실루엣을 자유롭게 조절할 수 있습니다.',
  },
  {
    id: 11,
    cat: 'bottom',
    brand: 'BASIC LAB',
    name: '코튼 조거 팬츠',
    price: 45000,
    was: 55000,
    tag: null,
    desc: '편안한 착용감의 코튼 조거 팬츠. 밑단 리브 마감으로 깔끔한 핏을 유지합니다.',
  },
  {
    id: 12,
    cat: 'acc',
    brand: 'EVERYDAY',
    name: '볼캡',
    price: 29000,
    was: null,
    tag: 'BEST',
    desc: '어떤 룩에도 어울리는 베이직 볼캡. 사이즈 조절 스트랩으로 누구나 편하게 착용 가능.',
  },
]

export const PRODUCTS = rawProducts.map((product) => ({
  ...product,
  svg: createProductImage(product.cat, product.brand),
}))

export function getProductById(id) {
  return PRODUCTS.find((product) => product.id === Number(id))
}

export function formatPrice(value) {
  return `${value.toLocaleString('ko-KR')}원`
}

export function getDiscountRate(price, was) {
  if (!was) return 0
  return Math.round((1 - price / was) * 100)
}
