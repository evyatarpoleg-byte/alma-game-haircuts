// Shared character metadata plus small flat SVG preview icons used on
// the style-picker cards. The actual on-stage character is real 3D
// (see character3d.js) - these icons stay flat/cheap on purpose so the
// picker grids don't need a WebGL context per card.

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
  { id: 'floral', name: 'פרחוני' },
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

export const EYE_COLORS = {
  girl: '#8B5E3C',
  cat: '#4CAF6D',
  dog: '#3FA9F5',
  bunny: '#E0637D',
};

export function getSpecies(id) {
  return SPECIES.find((s) => s.id === id) || SPECIES[0];
}

export function luminance(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function accentFor(hex) {
  return luminance(hex) > 0.6 ? '#5A4A57' : '#FFFFFF';
}

export function lighten(hex, amt) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const mix = (v) => Math.round(v + (255 - v) * amt);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export function darken(hex, amt) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const mix = (v) => Math.round(v * (1 - amt));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

let patternCounter = 0;
function patternDef(patternId, color) {
  if (patternId === 'plain' || patternId === 'floral') return { fill: color, defs: '' };
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

// ---- Hair icon (small flat preview, head at hx,hy with radius hr) ----
function hairIconShape(style, color, hx, hy, hr) {
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
  return `<svg viewBox="0 0 120 120"><circle cx="60" cy="66" r="34" fill="#FFDDC2"/>${hairIconShape(style, color, 60, 66, 34)}</svg>`;
}

// ---- Outfit icon (small flat preview, covers torso from shoulders to hem) ----
function outfitIconShape(style, fill) {
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
  return `<svg viewBox="0 0 300 420"><defs>${defs}</defs>${outfitIconShape(style, fill)}</svg>`;
}

export function patternSwatch(pattern, color) {
  if (pattern === 'floral') {
    return `<svg viewBox="0 0 40 40">
      <rect x="1" y="1" width="38" height="38" rx="10" fill="${color}"/>
      <circle cx="14" cy="14" r="3.4" fill="#fff"/>
      <circle cx="27" cy="24" r="3" fill="#fff"/>
      <circle cx="18" cy="30" r="2.6" fill="#fff"/>
    </svg>`;
  }
  const { fill, defs } = patternDef(pattern, color);
  return `<svg viewBox="0 0 40 40"><defs>${defs}</defs><rect x="1" y="1" width="38" height="38" rx="10" fill="${fill}"/></svg>`;
}
