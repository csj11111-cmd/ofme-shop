import { PALETTE } from '@/data/ofMeCatalog'

const modelCache = {}
const flatCache = {}

export function hex(color) {
  return PALETTE[color] || color
}

export function hexAlpha(color, alpha) {
  const value = hex(color).replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function bgFor(product) {
  const [first, second = first] = product.colors
  return `linear-gradient(155deg, ${hexAlpha(first, 0.2)}, ${hexAlpha(second, 0.1)} 60%, #ffffff)`
}

export function createModelIllustration(garment, color, pose, seed = 0) {
  const key = `${garment}|${color}|${pose}|${seed}`
  if (modelCache[key]) return modelCache[key]

  const skins = ['#f7ceb0', '#f0bf98', '#e7b489']
  const hairs = ['#2a201b', '#43291c', '#1d1815', '#6b4427']
  const skin = skins[seed % 3]
  const hair = hairs[seed % 4]
  const garmentColor = hex(color)
  const nTop = '#ece6db'
  const nBot = '#c2cedd'
  const isWalk = pose === 'walk'
  const lLeg = isWalk ? -7 : -2
  const rLeg = isWalk ? 11 : 3
  const lArm = isWalk ? 17 : 8
  const rArm = isWalk ? -13 : -7
  const legFill = garment === 'active' ? garmentColor : skin
  const leg = (x, px, deg, fill) =>
    `<rect x="${x}" y="246" width="18" height="150" rx="9" fill="${fill}" transform="rotate(${deg} ${px} 250)"/>`
  const shoe = (x, px, deg, fill) =>
    `<ellipse cx="${x}" cy="392" rx="13" ry="7" fill="${fill}" transform="rotate(${deg} ${px} 250)"/>`
  const arm = (x, px, deg, fill) =>
    `<rect x="${x}" y="110" width="15" height="108" rx="7.5" fill="${fill}" transform="rotate(${deg} ${px} 116)"/>`
  const hairLen = seed % 2 ? 176 : 124
  const hairBack = `<path d="M78 70 Q78 18 120 18 Q162 18 162 70 L162 ${hairLen} Q120 ${hairLen + 12} 78 ${hairLen} Z" fill="${hair}"/>`
  const torso = `<rect x="90" y="102" width="60" height="152" rx="26" fill="${skin}"/>`
  const neck = `<rect x="111" y="86" width="18" height="22" rx="6" fill="${skin}"/>`
  const head = `<circle cx="120" cy="62" r="30" fill="${skin}"/>`
  const hairFront = `<path d="M88 60 Q92 28 120 28 Q148 28 152 60 Q140 46 120 46 Q100 46 88 60 Z" fill="${hair}"/>`
  const face = `<circle cx="110" cy="63" r="2.6" fill="#3a2a22"/><circle cx="130" cy="63" r="2.6" fill="#3a2a22"/><ellipse cx="104" cy="72" rx="5" ry="3" fill="#ff9a8a" opacity=".5"/><ellipse cx="136" cy="72" rx="5" ry="3" fill="#ff9a8a" opacity=".5"/><path d="M114 75 Q120 80 126 75" stroke="#c4685a" stroke-width="2" fill="none" stroke-linecap="round"/>`
  const capSleeve = (fill) =>
    `<rect x="71" y="105" width="27" height="42" rx="14" fill="${fill}" transform="rotate(${lArm} 85.5 116)"/><rect x="142" y="105" width="27" height="42" rx="14" fill="${fill}" transform="rotate(${rArm} 154.5 116)"/>`

  const neutralShorts = `<rect x="92" y="242" width="56" height="46" rx="14" fill="${nBot}"/><line x1="120" y1="248" x2="120" y2="286" stroke="${hexAlpha('navy', 0.18)}" stroke-width="2"/>`

  let bottom = ''
  let top = ''

  if (garment === 'tee') {
    bottom = neutralShorts
    top = `<rect x="84" y="104" width="72" height="106" rx="22" fill="${garmentColor}"/>${capSleeve(garmentColor)}`
  } else if (garment === 'tank') {
    bottom = neutralShorts
    top = `<rect x="98" y="98" width="9" height="26" rx="4" fill="${garmentColor}"/><rect x="133" y="98" width="9" height="26" rx="4" fill="${garmentColor}"/><rect x="88" y="118" width="64" height="92" rx="18" fill="${garmentColor}"/>`
  } else if (garment === 'dress') {
    top = `<path d="M84 104 H156 L172 256 Q120 274 68 256 Z" fill="${garmentColor}"/>${capSleeve(garmentColor)}`
  } else if (garment === 'swim') {
    bottom = `<path d="M96 238 H144 L138 268 Q120 276 102 268 Z" fill="${garmentColor}"/>`
    top = `<path d="M86 116 Q120 110 154 116 L150 140 Q120 132 90 140 Z" fill="${garmentColor}"/>`
  } else if (garment === 'active') {
    bottom = `<rect x="98" y="240" width="44" height="14" rx="6" fill="${hexAlpha(color, 0.55)}"/>`
    top = `<rect x="88" y="112" width="64" height="46" rx="18" fill="${garmentColor}"/>`
  } else if (garment === 'shorts') {
    top = `<rect x="84" y="104" width="72" height="106" rx="22" fill="${nTop}"/>${capSleeve(nTop)}`
    bottom = `<rect x="92" y="240" width="56" height="50" rx="14" fill="${garmentColor}"/><line x1="120" y1="246" x2="120" y2="288" stroke="rgba(0,0,0,.12)" stroke-width="2"/>`
  } else if (garment === 'skirt') {
    top = `<rect x="88" y="104" width="64" height="98" rx="20" fill="${nTop}"/>${capSleeve(nTop)}`
    bottom = `<path d="M90 236 H150 L168 300 Q120 316 72 300 Z" fill="${garmentColor}"/>`
  }

  const svg = `<svg viewBox="0 0 240 420" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">${hairBack}${leg(99, 108, lLeg, legFill)}${leg(123, 132, rLeg, legFill)}${shoe(106, 108, lLeg, '#f4f1ea')}${shoe(134, 132, rLeg, '#f4f1ea')}${torso}${arm(78, 85.5, lArm, skin)}${arm(147, 154.5, rArm, skin)}${bottom}${top}${neck}${head}${hairFront}${face}</svg>`

  modelCache[key] = svg
  return svg
}

export function createFlatIllustration(garment, color) {
  const key = `${garment}|${color}`
  if (flatCache[key]) return flatCache[key]

  const garmentColor = hex(color)
  let shape = ''

  if (garment === 'tee') {
    shape = `<path d="M60 52 L82 40 Q100 54 118 40 L140 52 L158 74 L138 92 L130 82 L130 156 Q100 164 70 156 L70 82 L62 92 L42 74 Z" fill="${garmentColor}"/>`
  } else if (garment === 'tank') {
    shape = `<path d="M74 46 Q80 70 78 154 Q100 162 122 154 Q120 70 126 46 Q112 58 100 58 Q88 58 74 46 Z" fill="${garmentColor}"/>`
  } else if (garment === 'dress') {
    shape = `<path d="M70 48 L84 40 Q100 52 116 40 L130 48 L120 80 L142 164 Q100 176 58 164 L80 80 Z" fill="${garmentColor}"/>`
  } else if (garment === 'swim') {
    shape = `<path d="M58 72 Q100 60 142 72 Q132 96 100 90 Q68 96 58 72 Z" fill="${garmentColor}"/><path d="M74 118 H126 L116 152 Q100 160 84 152 Z" fill="${garmentColor}"/>`
  } else if (garment === 'active') {
    shape = `<path d="M64 66 Q100 56 136 66 L130 100 Q100 92 70 100 Z" fill="${garmentColor}"/><path d="M76 110 H124 L120 168 H104 L100 124 L96 168 H80 Z" fill="${garmentColor}"/>`
  } else if (garment === 'shorts') {
    shape = `<path d="M62 60 H138 L134 102 L128 150 H104 L100 104 L96 150 H72 L66 102 Z" fill="${garmentColor}"/>`
  } else if (garment === 'skirt') {
    shape = `<path d="M72 58 H128 L152 152 Q100 166 48 152 Z" fill="${garmentColor}"/><rect x="72" y="54" width="56" height="10" rx="3" fill="${hexAlpha(color, 0.7)}"/>`
  }

  const svg = `<svg viewBox="0 0 200 200" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${shape}</svg>`
  flatCache[key] = svg
  return svg
}

export function recommendSize(height, weight) {
  const h = parseFloat(height)
  const w = parseFloat(weight)

  if (!h || !w || h < 120 || h > 200 || w < 25 || w > 150) {
    return { show: false }
  }

  let base = w
  if (h >= 168) base -= 3
  if (h < 156) base += 2

  let size
  let lo
  let hi

  if (base <= 51) {
    size = 'S'
    lo = 38
    hi = 52
  } else if (base <= 63) {
    size = 'M'
    lo = 51
    hi = 64
  } else {
    size = 'L'
    lo = 63
    hi = 80
  }

  let local = (base - lo) / (hi - lo)
  local = Math.max(0.04, Math.min(0.96, local))
  const idxOffset = size === 'S' ? 0 : size === 'M' ? 1 : 2
  const fitPct = Math.round(((idxOffset + local) / 3) * 100)
  const fitLabel = local < 0.35 ? '타이트하게 맞아요' : local < 0.7 ? '정사이즈예요' : '여유있게 맞아요'

  return {
    show: true,
    size,
    fitPct: Math.max(4, Math.min(96, fitPct)),
    fitLabel,
  }
}