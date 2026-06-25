const { DESCRIPTIONS, FABRIC, FIT } = require('../src/constants/productDefaults');

const RAW_PRODUCTS = [
  { id: 25, cat: '원피스', g: 'dress', brand: 'plage', name: '새틴 카울넥 슬립 미니 원피스', price: 42900, colors: ['lemon', 'black', 'pink'], tag: 'NEW' },
  { id: 26, cat: '나시', g: 'tank', brand: 'OHLALA', name: '레이스 트림 캐미솔 탑', price: 19900, colors: ['white', 'black', 'pink'], tag: 'NEW' },
  { id: 27, cat: '스커트', g: 'skirt', brand: 'cintage', name: '새틴 바이어스 슬립 미디 스커트', price: 32900, colors: ['sand', 'black', 'sky'], tag: '급상승' },
  { id: 28, cat: '원피스', g: 'dress', brand: 'Bonjour', name: '레이스 슬립 롱 원피스', price: 48900, colors: ['black', 'ivory', 'coral'], tag: 'NEW' },
  { id: 29, cat: '반바지', g: 'shorts', brand: 'lazy daze', name: '배럴 커브드 데님 반바지', price: 35900, colors: ['denim', 'black', 'sky'], tag: '1위' },
  { id: 30, cat: '스커트', g: 'skirt', brand: 'soda pop', name: '디스트로이드 데님 미니 스커트', price: 29900, colors: ['sky', 'denim', 'white'], tag: 'NEW' },
  { id: 31, cat: '반팔티', g: 'tee', brand: 'mellow', name: '비비드 크롭 베이비 티', price: 15900, colors: ['red', 'black', 'white'], tag: '급상승' },
  { id: 32, cat: '반팔티', g: 'tee', brand: 'soda pop', name: '코발트 슬림 크롭 탑', price: 16900, colors: ['cobalt', 'black', 'white'], tag: 'NEW' },
  { id: 33, cat: '반팔티', g: 'tee', brand: 'cintage', name: '스트라이프 크롭 니트 탑', price: 23900, colors: ['sky', 'coral', 'black'], tag: 'NEW' },
  { id: 34, cat: '나시', g: 'tank', brand: 'OHLALA', name: '리본 셔링 뷔스티에 탑', price: 21900, colors: ['pink', 'white', 'black'], tag: '급상승' },
  { id: 35, cat: '반팔티', g: 'tee', brand: 'moonrise', name: '시어 메쉬 레이어드 탑', price: 18900, colors: ['black', 'white'], tag: 'NEW' },
  { id: 36, cat: '원피스', g: 'dress', brand: 'OHLALA', name: '발레코어 플로럴 미니 원피스', price: 36900, colors: ['pink', 'sky', 'lemon'], tag: '1위' },
  { id: 1, cat: '반팔티', g: 'tee', brand: 'mellow', name: '코튼 베이직 크롭 반팔 티', price: 16900, orig: 23000, colors: ['white', 'coral', 'sky', 'black'], tag: '급상승' },
  { id: 2, cat: '반팔티', g: 'tee', brand: 'soda pop', name: '오버핏 레터링 반팔 티셔츠', price: 19900, colors: ['white', 'lemon', 'mint'] },
  { id: 3, cat: '반팔티', g: 'tee', brand: 'DAILY UP', name: '슬림 라운드넥 반팔 티', price: 14900, orig: 19000, colors: ['black', 'white', 'pink'], tag: '쿠폰' },
  { id: 4, cat: '반팔티', g: 'tee', brand: 'cintage', name: '스트라이프 보트넥 반팔', price: 22900, colors: ['sky', 'coral', 'ivory'] },
  { id: 5, cat: '반팔티', g: 'tee', brand: 'moonrise', name: '워싱 머슬핏 반팔 티', price: 18900, colors: ['olive', 'sand', 'black'], tag: '급상승' },
  { id: 6, cat: '나시', g: 'tank', brand: 'Salt&Sea', name: '린넨 슬리브리스 탑', price: 24900, colors: ['ivory', 'lemon', 'mint'], tag: '1위' },
  { id: 7, cat: '나시', g: 'tank', brand: 'OHLALA', name: '셔링 뷔스티에 나시', price: 21900, orig: 27000, colors: ['white', 'pink', 'lilac'], tag: '쿠폰' },
  { id: 8, cat: '나시', g: 'tank', brand: 'mellow', name: '베이직 골지 나시', price: 9900, colors: ['white', 'black', 'coral'] },
  { id: 9, cat: '원피스', g: 'dress', brand: 'OHLALA', name: '플라워 셔링 미니 원피스', price: 39900, orig: 52000, colors: ['pink', 'sky', 'white'], tag: '1위' },
  { id: 10, cat: '원피스', g: 'dress', brand: 'Bonjour', name: '린넨 뷔스티에 롱 원피스', price: 46900, colors: ['ivory', 'sand', 'olive'] },
  { id: 11, cat: '원피스', g: 'dress', brand: 'plage', name: '플리츠 슬립 원피스', price: 33900, orig: 42000, colors: ['coral', 'lilac', 'navy'], tag: '쿠폰' },
  { id: 12, cat: '원피스', g: 'dress', brand: 'moonrise', name: '스트라이프 셔츠 원피스', price: 35900, colors: ['sky', 'white', 'lemon'] },
  { id: 13, cat: '원피스', g: 'dress', brand: 'cintage', name: '라운드넥 셔링 미니 원피스', price: 28900, colors: ['black', 'pink', 'mint'], tag: '급상승' },
  { id: 14, cat: '수영복', g: 'swim', brand: 'plage', name: '트로피컬 트라이앵글 비키니', price: 34900, colors: ['coral', 'aqua', 'black'], tag: '1위' },
  { id: 15, cat: '수영복', g: 'swim', brand: 'Salt&Sea', name: '하이웨스트 비키니 세트', price: 38900, orig: 46000, colors: ['navy', 'lilac', 'white'], tag: '쿠폰' },
  { id: 16, cat: '수영복', g: 'swim', brand: 'plage', name: '원숄더 모노키니', price: 41900, colors: ['black', 'coral', 'mint'] },
  { id: 17, cat: '운동복', g: 'active', brand: 'Active U', name: '쿨링 크롭 요가 세트', price: 42000, colors: ['mint', 'lilac', 'black'], tag: '급상승' },
  { id: 18, cat: '운동복', g: 'active', brand: 'Active U', name: '시밍 래쉬가드 세트', price: 39900, orig: 49000, colors: ['navy', 'coral', 'aqua'], tag: '쿠폰' },
  { id: 19, cat: '운동복', g: 'active', brand: 'moonrise', name: '에어로 러닝 탱크+쇼츠', price: 31900, colors: ['black', 'lemon', 'sky'] },
  { id: 20, cat: '반바지', g: 'shorts', brand: 'lazy daze', name: '와이드 데님 반바지', price: 27900, orig: 33000, colors: ['denim', 'white', 'black'], tag: '급상승' },
  { id: 21, cat: '반바지', g: 'shorts', brand: 'DAILY UP', name: '코튼 밴딩 숏팬츠', price: 17900, colors: ['ivory', 'coral', 'olive'] },
  { id: 22, cat: '반바지', g: 'shorts', brand: 'soda pop', name: '카고 버뮤다 쇼츠', price: 24900, colors: ['sand', 'black', 'mint'] },
  { id: 23, cat: '스커트', g: 'skirt', brand: 'cintage', name: '플리츠 미니 스커트', price: 22900, orig: 28000, colors: ['black', 'pink', 'sky'], tag: '1위' },
  { id: 24, cat: '스커트', g: 'skirt', brand: 'Bonjour', name: '린넨 랩 미디 스커트', price: 29900, colors: ['ivory', 'olive', 'coral'] },
];

const getProductCodeFromId = (id) => `P-${String(id).padStart(3, '0')}`;

const IMAGE_TYPES = [
  { field: 'primary', suffix: '' },
  { field: 'walk', suffix: '_w' },
  { field: 'coordi', suffix: '_coordi' },
  { field: 'flat', suffix: '_flat' },
];

module.exports = {
  RAW_PRODUCTS,
  DESCRIPTIONS,
  FABRIC,
  FIT,
  getProductCodeFromId,
  IMAGE_TYPES,
};
