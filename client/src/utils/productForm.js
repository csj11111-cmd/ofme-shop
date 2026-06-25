import {
  DESCRIPTIONS,
  FABRIC,
  FIT,
} from '@/data/ofMeCatalog'

export const TAG_OPTIONS = ['NEW', '급상승', '1위', '쿠폰', 'BEST']

export const GARMENT_OPTIONS = [
  { value: 'tee', label: '반팔티' },
  { value: 'tank', label: '나시' },
  { value: 'dress', label: '원피스' },
  { value: 'swim', label: '수영복' },
  { value: 'active', label: '운동복' },
  { value: 'shorts', label: '반바지' },
  { value: 'skirt', label: '스커트' },
]

export const GARMENT_TO_CAT = {
  tee: '반팔티',
  tank: '나시',
  dress: '원피스',
  swim: '수영복',
  active: '운동복',
  shorts: '반바지',
  skirt: '스커트',
}

export const IMAGE_FIELDS = [
  { key: 'primary', label: 'MODEL', hint: '메인 상품 컷 (카드·상세 기본)' },
  { key: 'walk', label: 'WALK', hint: '호버/워킹 컷 (카드 마우스오버)' },
  { key: 'coordi', label: 'STYLING', hint: '코디/스타일링 컷 (상세 썸네일)' },
  { key: 'flat', label: 'PRODUCT', hint: '플랫/Product 컷 (상세 썸네일)' },
]

export function createInitialForm() {
  return {
    name: '',
    brand: '',
    cat: '반팔티',
    g: 'tee',
    price: '',
    orig: '',
    colors: ['coral'],
    tag: '',
    description: DESCRIPTIONS.tee,
    fabric: FABRIC.tee,
    fit: FIT.tee,
    isActive: true,
    images: {
      primary: '',
      walk: '',
      coordi: '',
      flat: '',
    },
  }
}

export function applyGarmentType(form, garmentType) {
  return {
    ...form,
    g: garmentType,
    cat: GARMENT_TO_CAT[garmentType] || form.cat,
    description: DESCRIPTIONS[garmentType] || form.description,
    fabric: FABRIC[garmentType] || form.fabric,
    fit: FIT[garmentType] || form.fit,
  }
}

export function productToForm(product) {
  return {
    name: product.name || '',
    brand: product.brand || '',
    cat: product.cat || '반팔티',
    g: product.g || 'tee',
    price: String(product.price ?? ''),
    orig: product.orig ? String(product.orig) : '',
    colors: product.colors?.length ? [...product.colors] : ['coral'],
    tag: product.tag || '',
    description: product.description || DESCRIPTIONS[product.g] || '',
    fabric: product.fabric || FABRIC[product.g] || '',
    fit: product.fit || FIT[product.g] || '',
    isActive: product.isActive !== false,
    images: {
      primary: product.images?.primary || '',
      walk: product.images?.walk || '',
      coordi: product.images?.coordi || '',
      flat: product.images?.flat || '',
    },
  }
}

export function formToPayload(form) {
  const images = {}

  IMAGE_FIELDS.forEach(({ key }) => {
    if (form.images[key]) {
      images[key] = form.images[key]
    }
  })

  return {
    name: form.name.trim(),
    brand: form.brand.trim(),
    cat: form.cat,
    g: form.g,
    price: Number(form.price),
    orig: form.orig ? Number(form.orig) : undefined,
    colors: form.colors,
    tag: form.tag || undefined,
    description: form.description.trim(),
    fabric: form.fabric.trim(),
    fit: form.fit.trim(),
    isActive: form.isActive,
    images,
  }
}

export function buildPreviewProduct(form, editingProduct) {
  return {
    id: editingProduct?.id || 'preview',
    productCode: editingProduct?.productCode || 'PREVIEW',
    name: form.name || '상품명 미입력',
    brand: form.brand || '브랜드',
    cat: form.cat,
    g: form.g,
    price: Number(form.price) || 0,
    orig: form.orig ? Number(form.orig) : null,
    colors: form.colors,
    tag: form.tag || null,
    description: form.description,
    fabric: form.fabric,
    fit: form.fit,
    images: form.images,
    isRegistered: true,
  }
}
