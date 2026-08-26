// Character rendering: builds SVG markup for the salon's clients,
// their hairstyles, and their outfits. Pure functions, no DOM state.

export const SPECIES = [
  { id: 'girl', name: 'ילדה', emoji: '👧', skin: '#FFDDC2', skinShade: '#F5C6A5' },
  { id: 'cat', name: 'חתולה', emoji: '🐱', skin: '#F0A868', skinShade: '#E08F4C' },
  { id: 'dog', name: 'כלבלב', emoji: '🐶', skin: '#C68642', skinShade: '#A9692B' },
  { id: 'bunny', name: 'ארנבת', emoji: '🐰', skin: '#FBEFE4', skinShade: '#EAD9C8' },
];

export const HAIRSTYLES = [
  { id: 'pony', name: 'קוקו' },
  { id: 'pigtails', name: 'צמות' },
  { id: 'bob', name: 'בוב' },
  { id: 'curly', name: 'תלתלים' },
  { id: 'mohawk', name: 'מוהוק' },
  { id: 'bun', name: 'קונדס' },
];

export const OUTFITS = [
  { id: 'dress', name: 'שמלה' },
  { id: 'tshirt', name: 'חולצה וחצאית' },
  { id: 'overalls', name: 'סרבל' },
  { id: 'jumpsuit', name: 'אוברול' },
  { id: 'cape', name: 'גלימה' },
  { id: 'sweater', name: 'סוודר' },
];

export const PATTERNS = [
  { id: 'plain', name: 'חלק' },
  { id: 'stripes', name: 'פסים' },
  { id: 'dots', name: 'נקודות' },
  { id: 'stars', name: 'כוכבים' },
  { id: 'hearts', name: 'לבבות' },
  { id: 'zigzag', name: 'זיגזג' },
];

export const COLORS = [
  { hex: '#6B3F1D', name: 'חום' },
  { hex: '#2B2B2B', name: 'שחור' },
  { hex: '#F4C430', name: 'זהוב' },
  { hex: '#FF6FA5', name: 'ורוד' },
  { hex: '#8E5BE0', name: 'סגול' },
  { hex: '#3FA9F5', name: 'תכלת' },
  { hex: '#FF7A45', name: 'כתום' },
  { hex: '#38C172', name: 'ירוק' },
  { hex: '#FF4757', name: 'אדום' },
  { hex: '#FFFFFF', name: 'לבן' },
];

export function getSpecies(id) {
  return SPECIES.find((s) => s.id === id) || SPECIES[0];
}

function luminance(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function accentFor(hex) {
  return luminance(hex) > 0.6 ? '#5A4A57' : '#FFFFFF';
}

function lighten(hex, amt) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const mix = (v) => Math.round(v + (255 - v) * amt);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

const EYE_COLORS = {
  girl: '#8B5E3C',
  cat: '#4CAF6D',
  dog: '#3FA9F5',
  bunny: '#E0637D',
};

let patternCounter = 0;
function patternDef(patternId, color) {
  if (patternId === 'plain') return { fill: color, defs: '' };
  patternCounter += 1;
  const id = `pat${patternCounter}`;
  const accent = accentFor(color);
  let body = '';
  if (patternId === 'stripes') {
    body = `<rect width="16" height="16" fill="${color}"/><rect x="0" y="0" width="8" height="16" fill="${accent}" opacity="0.55"/>`;
    return { fill: `url(#${id})`, defs: `<pattern id="${id}" width="16" height="16" patternTransform="rotate(35)" patternUnits="userSpaceOnUse">${body}</pattern>` };
  }
  if (patternId === 'dots') {
    body = `<rect width="20" height="20" fill="${color}"/><circle cx="10" cy="10" r="3.4" fill="${accent}" opacity="0.7"/>`;
    return { fill: `url(#${id})`, defs: `<pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse">${body}</pattern>` };
  }
  if (patternId === 'stars') {
    body = `<rect width="26" height="26" fill="${color}"/><text x="13" y="19" font-size="14" text-anchor="middle" fill="${accent}" opacity="0.8">★</text>`;
    return { fill: `url(#${id})`, defs: `<pattern id="${id}" width="26" height="26" patternUnits="userSpaceOnUse">${body}</pattern>` };
  }
  if (patternId === 'hearts') {
    body = `<rect width="26" height="26" fill="${color}"/><text x="13" y="19" font-size="14" text-anchor="middle" fill="${accent}" opacity="0.8">♥</text>`;
    return { fill: `url(#${id})`, defs: `<pattern id="${id}" width="26" height="26" patternUnits="userSpaceOnUse">${body}</pattern>` };
  }
  if (patternId === 'zigzag') {
    body = `<rect width="20" height="12" fill="${color}"/><polyline points="0,10 5,2 10,10 15,2 20,10" fill="none" stroke="${accent}" stroke-width="2.2" opacity="0.8"/>`;
    return { fill: `url(#${id})`, defs: `<pattern id="${id}" width="20" height="12" patternUnits="userSpaceOnUse">${body}</pattern>` };
  }
  return { fill: color, defs: '' };
}

// ---- Hair (drawn centered on a head at hx,hy with radius hr) ----
// A soft light patch layered on top of the base silhouette, for that
// glossy cel-shaded look anime hair usually has.
function hairShine(hx, hy, hr, color) {
  const shine = lighten(color, 0.55);
  return `<ellipse cx="${hx - hr * 0.32}" cy="${hy - hr * 0.62}" rx="${hr * 0.32}" ry="${hr * 0.18}" fill="${shine}" opacity="0.65" transform="rotate(-24 ${hx - hr * 0.32} ${hy - hr * 0.62})"/>`;
}

function hairShape(style, color, hx, hy, hr) {
  return hairBase(style, color, hx, hy, hr) + hairShine(hx, hy, hr, color);
}

function hairBase(style, color, hx, hy, hr) {
  switch (style) {
    case 'pony':
      return `
        <path d="M ${hx - hr - 2} ${hy - 4} Q ${hx - hr - 14} ${hy - hr - 6} ${hx} ${hy - hr - 12} Q ${hx + hr + 14} ${hy - hr - 6} ${hx + hr + 2} ${hy - 4} Q ${hx + hr - 6} ${hy - hr + 6} ${hx} ${hy - hr + 2} Q ${hx - hr + 6} ${hy - hr + 6} ${hx - hr - 2} ${hy - 4} Z" fill="${color}"/>
        <path d="M ${hx + hr - 6} ${hy - hr + 10} Q ${hx + hr + 34} ${hy - hr + 20} ${hx + hr + 18} ${hy + hr + 20} Q ${hx + hr + 4} ${hy + hr + 6} ${hx + hr - 10} ${hy - 4} Z" fill="${color}"/>
      `;
    case 'pigtails':
      return `
        <path d="M ${hx - hr} ${hy - 6} Q ${hx - hr - 10} ${hy - hr - 10} ${hx} ${hy - hr - 14} Q ${hx + hr + 10} ${hy - hr - 10} ${hx + hr} ${hy - 6} Q ${hx} ${hy - hr + 8} ${hx - hr} ${hy - 6} Z" fill="${color}"/>
        <ellipse cx="${hx - hr - 6}" cy="${hy + 18}" rx="14" ry="30" fill="${color}"/>
        <ellipse cx="${hx + hr + 6}" cy="${hy + 18}" rx="14" ry="30" fill="${color}"/>
        <rect x="${hx - hr - 14}" y="${hy - 2}" width="16" height="8" rx="4" fill="${color}"/>
        <rect x="${hx + hr - 2}" y="${hy - 2}" width="16" height="8" rx="4" fill="${color}"/>
      `;
    case 'bob':
      return `
        <path d="M ${hx - hr - 4} ${hy + 10} Q ${hx - hr - 10} ${hy - hr - 6} ${hx} ${hy - hr - 12} Q ${hx + hr + 10} ${hy - hr - 6} ${hx + hr + 4} ${hy + 10} Q ${hx + hr - 4} ${hy + hr - 4} ${hx} ${hy + hr - 10} Q ${hx - hr + 4} ${hy + hr - 4} ${hx - hr - 4} ${hy + 10} Z" fill="${color}"/>
      `;
    case 'curly':
      return `
        <circle cx="${hx - hr - 2}" cy="${hy - 6}" r="15" fill="${color}"/>
        <circle cx="${hx - hr + 14}" cy="${hy - hr + 2}" r="16" fill="${color}"/>
        <circle cx="${hx}" cy="${hy - hr - 10}" r="17" fill="${color}"/>
        <circle cx="${hx + hr - 14}" cy="${hy - hr + 2}" r="16" fill="${color}"/>
        <circle cx="${hx + hr + 2}" cy="${hy - 6}" r="15" fill="${color}"/>
        <circle cx="${hx - hr + 2}" cy="${hy + 6}" r="13" fill="${color}"/>
        <circle cx="${hx + hr - 2}" cy="${hy + 6}" r="13" fill="${color}"/>
      `;
    case 'mohawk':
      return `
        <path d="M ${hx - 14} ${hy - hr + 14} Q ${hx - 10} ${hy - hr - 34} ${hx} ${hy - hr - 38} Q ${hx + 10} ${hy - hr - 34} ${hx + 14} ${hy - hr + 14} Q ${hx} ${hy - hr + 24} ${hx - 14} ${hy - hr + 14} Z" fill="${color}"/>
      `;
    case 'bun':
      return `
        <path d="M ${hx - hr - 2} ${hy - 2} Q ${hx - hr - 8} ${hy - hr - 4} ${hx} ${hy - hr - 6} Q ${hx + hr + 8} ${hy - hr - 4} ${hx + hr + 2} ${hy - 2} Q ${hx} ${hy - hr + 10} ${hx - hr - 2} ${hy - 2} Z" fill="${color}"/>
        <circle cx="${hx}" cy="${hy - hr - 18}" r="18" fill="${color}"/>
      `;
    default:
      return '';
  }
}

export function hairIcon(style, color) {
  return `<svg viewBox="0 0 120 120"><circle cx="60" cy="66" r="34" fill="#FFDDC2"/>${hairShape(style, color, 60, 66, 34)}</svg>`;
}

// ---- Outfits (drawn covering torso from shoulders to hem) ----
function outfitShape(style, fill) {
  switch (style) {
    case 'dress':
      return `<path d="M 108 172 Q 150 158 192 172 L 200 200 L 214 372 Q 150 392 86 372 L 100 200 Z" fill="${fill}"/>`;
    case 'tshirt':
      return `
        <path d="M 108 172 Q 150 160 192 172 L 206 200 L 188 214 L 178 196 L 178 268 L 122 268 L 122 196 L 112 214 L 94 200 Z" fill="${fill}"/>
        <path d="M 112 268 L 188 268 L 200 372 Q 150 388 100 372 Z" fill="${fill}" opacity="0.85"/>
      `;
    case 'overalls':
      return `
        <path d="M 118 176 L 128 176 L 128 190 L 172 190 L 172 176 L 182 176 L 182 200 L 210 372 Q 150 392 90 372 Z" fill="${fill}"/>
        <rect x="118" y="150" width="14" height="34" rx="5" fill="${fill}"/>
        <rect x="168" y="150" width="14" height="34" rx="5" fill="${fill}"/>
        <rect x="128" y="220" width="44" height="10" rx="3" fill="#00000022"/>
      `;
    case 'jumpsuit':
      return `<path d="M 106 172 Q 150 158 194 172 L 206 210 L 190 372 L 158 372 L 152 260 L 146 372 L 112 372 L 96 210 Z" fill="${fill}"/>`;
    case 'cape':
      return `
        <path d="M 118 176 Q 150 190 182 176 L 190 220 L 150 236 L 110 220 Z" fill="${fill}"/>
        <path d="M 108 182 Q 150 200 192 182 L 232 340 Q 150 320 68 340 Z" fill="${fill}" opacity="0.9"/>
      `;
    case 'sweater':
      return `
        <path d="M 106 172 Q 150 158 194 172 L 210 208 L 192 224 L 180 202 L 180 300 L 120 300 L 120 202 L 108 224 L 90 208 Z" fill="${fill}"/>
        <rect x="118" y="182" width="64" height="10" fill="#00000018"/>
      `;
    default:
      return '';
  }
}

export function outfitIcon(style, color, pattern) {
  const { fill, defs } = patternDef(pattern, color);
  return `<svg viewBox="0 0 300 420"><defs>${defs}</defs>${outfitShape(style, fill)}</svg>`;
}

export function patternSwatch(pattern, color) {
  const { fill, defs } = patternDef(pattern, color);
  return `<svg viewBox="0 0 40 40"><defs>${defs}</defs><rect x="1" y="1" width="38" height="38" rx="10" fill="${fill}"/></svg>`;
}

// ---- Species-specific extras: ears, tail, snout ----
function speciesExtras(speciesId, skin, shade) {
  const parts = { earsBack: '', earsFront: '', tail: '', snout: '', whiskers: '' };
  if (speciesId === 'cat') {
    parts.earsBack = `
      <path d="M 100 96 L 88 40 L 132 78 Z" fill="${skin}"/>
      <path d="M 200 96 L 212 40 L 168 78 Z" fill="${skin}"/>
      <path d="M 103 90 L 96 56 L 122 78 Z" fill="#FFC9D6"/>
      <path d="M 197 90 L 204 56 L 178 78 Z" fill="#FFC9D6"/>
    `;
    parts.snout = `<ellipse cx="150" cy="150" rx="7" ry="5" fill="#B5495B"/>`;
    parts.whiskers = `
      <path d="M 120 148 L 90 142 M 120 154 L 90 156 M 180 148 L 210 142 M 180 154 L 210 156" stroke="#88604A" stroke-width="2" stroke-linecap="round"/>
    `;
    parts.tail = `<path d="M 210 340 Q 260 330 258 280 Q 256 250 232 250" fill="none" stroke="${skin}" stroke-width="20" stroke-linecap="round"/>`;
  } else if (speciesId === 'dog') {
    parts.earsBack = `
      <ellipse cx="94" cy="120" rx="22" ry="40" fill="${shade}" transform="rotate(-15 94 120)"/>
      <ellipse cx="206" cy="120" rx="22" ry="40" fill="${shade}" transform="rotate(15 206 120)"/>
    `;
    parts.snout = `
      <ellipse cx="150" cy="150" rx="26" ry="18" fill="#F3D9B1"/>
      <ellipse cx="150" cy="146" rx="9" ry="6" fill="#3A2E39"/>
    `;
    parts.tail = `<path d="M 214 336 Q 250 310 236 270" fill="none" stroke="${skin}" stroke-width="18" stroke-linecap="round"/>`;
  } else if (speciesId === 'bunny') {
    parts.earsBack = `
      <ellipse cx="122" cy="46" rx="17" ry="56" fill="${skin}" transform="rotate(-8 122 46)"/>
      <ellipse cx="178" cy="46" rx="17" ry="56" fill="${skin}" transform="rotate(8 178 46)"/>
      <ellipse cx="122" cy="50" rx="9" ry="42" fill="#FFC9D6" transform="rotate(-8 122 50)"/>
      <ellipse cx="178" cy="50" rx="9" ry="42" fill="#FFC9D6" transform="rotate(8 178 50)"/>
    `;
    parts.snout = `<path d="M 145 152 L 155 152 L 150 160 Z" fill="#FFB6C1"/>`;
    parts.tail = `<circle cx="222" cy="350" r="16" fill="${skin}"/>`;
  }
  return parts;
}

// Big glossy anime-style eyes: white base, coloured iris, dark pupil,
// two highlight sparkles, a bold top-lid line and a thin eyebrow.
function animeEye(cx, cy, irisColor, mirrored) {
  const flick = mirrored ? -1 : 1;
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="13" ry="15" fill="#FFFFFF" stroke="#3A2E39" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy + 2.5}" r="9.5" fill="${irisColor}"/>
    <circle cx="${cx}" cy="${cy + 2.5}" r="4.4" fill="#2B2B2B"/>
    <circle cx="${cx - 3.2}" cy="${cy - 1}" r="3" fill="#FFFFFF"/>
    <circle cx="${cx + 2.4}" cy="${cy + 5.5}" r="1.4" fill="#FFFFFF" opacity="0.9"/>
    <path d="M ${cx - 13} ${cy - 2} Q ${cx} ${cy - 19} ${cx + 13} ${cy - 2}" stroke="#3A2E39" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M ${cx - 11 * flick} ${cy - 23} Q ${cx} ${cy - 28} ${cx + 11 * flick} ${cy - 21}" stroke="#3A2E39" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  `;
}

function faceFeatures(speciesId) {
  const iris = EYE_COLORS[speciesId] || EYE_COLORS.girl;
  return `
    ${animeEye(128, 131, iris, true)}
    ${animeEye(172, 131, iris, false)}
    <path d="M 138 160 Q 150 168 162 160" stroke="#B5495B" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <circle cx="102" cy="150" r="10" fill="#FF9FB8" opacity="0.55"/>
    <circle cx="198" cy="150" r="10" fill="#FF9FB8" opacity="0.55"/>
  `;
}

/**
 * Build the full character SVG.
 * config: { species, hair: {style, color}, outfit: {style, color, pattern} }
 * overlay: optional extra SVG markup drawn on top (for mini-game hotspots)
 */
export function buildCharacterSVG(config, overlayMarkup = '') {
  const sp = getSpecies(config.species);
  const extras = speciesExtras(sp.id, sp.skin, sp.skinShade);
  const hair = config.hair && config.hair.style ? hairShape(config.hair.style, config.hair.color, HEAD_CX, HEAD_CY, HEAD_R) : '';
  let outfitMarkup = '';
  let defs = '';
  if (config.outfit && config.outfit.style) {
    const { fill, defs: d } = patternDef(config.outfit.pattern || 'plain', config.outfit.color);
    outfitMarkup = outfitShape(config.outfit.style, fill);
    defs = d;
  }

  return `
  <svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
    <defs>${defs}</defs>
    ${extras.tail}
    <!-- legs -->
    <rect x="118" y="352" width="22" height="46" rx="10" fill="${sp.skin}"/>
    <rect x="160" y="352" width="22" height="46" rx="10" fill="${sp.skin}"/>
    <!-- arms -->
    <ellipse cx="82" cy="240" rx="17" ry="46" fill="${sp.skin}" transform="rotate(12 82 240)"/>
    <ellipse cx="218" cy="240" rx="17" ry="46" fill="${sp.skin}" transform="rotate(-12 218 240)"/>
    <!-- torso base -->
    <path d="M 108 176 Q 150 160 192 176 L 206 370 Q 150 390 94 370 Z" fill="${sp.skin}"/>
    ${outfitMarkup}
    <!-- ears behind head -->
    ${extras.earsBack}
    <!-- head -->
    <circle cx="${HEAD_CX}" cy="${HEAD_CY}" r="${HEAD_R}" fill="${sp.skin}"/>
    ${extras.snout}
    ${faceFeatures(sp.id)}
    ${extras.whiskers || ''}
    <!-- hair -->
    ${hair}
    ${overlayMarkup}
  </svg>`;
}

// Messy stray hairs, rooted at the scalp along the top arc of the head
// (not floating in a ring disconnected from it), poking outward like
// little flyaway cowlicks that stick up before the haircut.
const HEAD_CX = 150;
const HEAD_CY = 130;
const HEAD_R = 58;

export function randomStrands(count = 8) {
  const strands = [];
  const startDeg = -160;
  const endDeg = -20;
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const spread = (endDeg - startDeg) / count;
    const deg = startDeg + t * (endDeg - startDeg) + (Math.random() - 0.5) * spread * 0.7;
    const angle = (deg * Math.PI) / 180;
    const baseR = HEAD_R * (0.8 + Math.random() * 0.14);
    const bx = HEAD_CX + Math.cos(angle) * baseR;
    const by = HEAD_CY + Math.sin(angle) * baseR * 0.92;
    const curl = Math.random() < 0.5 ? -1 : 1;
    strands.push({ id: `s${i}`, bx, by, angleDeg: deg, curl });
  }
  return strands;
}

export function strandsOverlay(strands) {
  return strands
    .map((s) => {
      const rad = (s.angleDeg * Math.PI) / 180;
      const len = 26 + Math.random() * 6;
      const tipX = s.bx + Math.cos(rad) * len;
      const tipY = s.by + Math.sin(rad) * len;
      const perpX = -Math.sin(rad) * 12 * s.curl;
      const perpY = Math.cos(rad) * 12 * s.curl;
      const ctrlX = (s.bx + tipX) / 2 + perpX;
      const ctrlY = (s.by + tipY) / 2 + perpY;
      return `
      <g data-role="strand" data-id="${s.id}">
        <path d="M ${s.bx} ${s.by} Q ${ctrlX} ${ctrlY} ${tipX} ${tipY}" fill="none" stroke="#6B3F1D" stroke-width="7" stroke-linecap="round"/>
        <circle cx="${tipX}" cy="${tipY}" r="16" fill="transparent"/>
      </g>`;
    })
    .join('');
}

const SEW_PATH_POINTS = [
  [116, 178], [184, 178], [204, 230], [204, 300],
  [188, 372], [150, 390], [112, 372], [96, 300],
];

export function sewDots() {
  return SEW_PATH_POINTS.map(([x, y], i) => ({ id: i + 1, x, y }));
}

export function sewOverlay(dots, connectedOrder) {
  let lines = '';
  for (let i = 1; i < connectedOrder.length; i += 1) {
    const a = dots.find((d) => d.id === connectedOrder[i - 1]);
    const b = dots.find((d) => d.id === connectedOrder[i]);
    if (a && b) {
      lines += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#E24A6B" stroke-width="3" stroke-dasharray="6 5" stroke-linecap="round"/>`;
    }
  }
  const dotsMarkup = dots
    .map((d) => {
      const done = connectedOrder.includes(d.id);
      return `
      <g data-role="sewdot" data-id="${d.id}" transform="translate(${d.x} ${d.y})">
        <circle r="13" fill="transparent"/>
        <circle r="9" fill="${done ? '#38C172' : '#FFFFFF'}" stroke="#E24A6B" stroke-width="2.5"/>
        <text y="4" text-anchor="middle" font-size="10" font-weight="700" fill="${done ? '#fff' : '#E24A6B'}">${d.id}</text>
      </g>`;
    })
    .join('');
  return lines + dotsMarkup;
}
