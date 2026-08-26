import {
  SPECIES, HAIRSTYLES, OUTFITS, PATTERNS, COLORS,
  buildCharacterSVG, hairIcon, outfitIcon, patternSwatch,
  randomStrands, strandsOverlay, sewDots, sewOverlay,
} from './characters.js?v=4';
import { playSnip, playStitch, playWrong, playSuccess, playClick, playStar, playSave } from './audio.js?v=4';
import { loadGallery, saveEntry, deleteEntry } from './storage.js?v=4';

const STEP_SCREENS = ['trim', 'hairstyle', 'sew', 'outfitstyle'];

const state = {
  screen: 'home',
  gallery: loadGallery(),
  species: null,
  hair: { style: null, color: COLORS[0].hex },
  outfit: { style: null, color: COLORS[3].hex, pattern: 'plain' },
  strands: [],
  sewOrder: [],
  sewPoints: [],
  hairRating: 0,
  outfitRating: 0,
  saved: false,
};

const app = document.getElementById('app');
const confettiRoot = document.getElementById('confetti-root');
const toastRoot = document.getElementById('toast-root');

function resetForNewClient() {
  state.species = null;
  state.hair = { style: null, color: COLORS[0].hex };
  state.outfit = { style: null, color: COLORS[3].hex, pattern: 'plain' };
  state.strands = [];
  state.sewOrder = [];
  state.sewPoints = [];
  state.hairRating = 0;
  state.outfitRating = 0;
  state.saved = false;
}

function goto(screen) {
  if (screen === 'sew' && state.sewPoints.length === 0) {
    state.sewPoints = sewDots();
  }
  const enteringRating = screen === 'rating' && state.screen !== 'rating';
  state.screen = screen;
  render();
  if (enteringRating) spawnConfetti();
}

function currentConfig() {
  return { species: state.species, hair: state.hair, outfit: state.outfit };
}

function topBar(title, backTo) {
  return `
    <div class="topbar">
      ${backTo ? `<button class="icon-btn" data-action="nav" data-target="${backTo}" aria-label="חזרה">→</button>` : '<div style="width:44px"></div>'}
      <h1>${title}</h1>
      <div style="width:44px"></div>
    </div>`;
}

function stepDots(activeIndex) {
  return `<div class="progress-dots">${STEP_SCREENS.map((_, i) => `<span class="${i < activeIndex ? 'done' : ''}"></span>`).join('')}</div>`;
}

function screenHome() {
  return `
    <div class="screen" style="justify-content:center; flex:1;">
      <div class="title-hero">
        <div class="logo">✂️💇</div>
        <h1>המספרה של עלמה וענבל</h1>
        <p>תספורות, בגדים ותפירה לילדה ולחיות מחמד</p>
      </div>
      <button class="big-btn" data-action="nav" data-target="choose">בואי נתחיל! 🌟</button>
      <button class="big-btn secondary" data-action="nav" data-target="gallery">הגלריה שלי (${state.gallery.length})</button>
    </div>`;
}

function screenChoose() {
  const cards = SPECIES.map(
    (s) => `
    <button class="style-card" style="min-height:96px" data-action="pick-species" data-id="${s.id}">
      <span style="font-size:2.4rem">${s.emoji}</span>
      <span>${s.name}</span>
    </button>`
  ).join('');
  return `
    ${topBar('מי הלקוחה הבאה?', 'home')}
    <div class="screen">
      <p class="hint">בחרי מי מגיעה היום למספרה</p>
      <div class="card-grid">${cards}</div>
    </div>`;
}

function screenTrim() {
  const allGone = state.strands.length === 0;
  const svg = buildCharacterSVG({ species: state.species, hair: null, outfit: null }, strandsOverlay(state.strands));
  return `
    ${topBar('שיער פרוע!', 'choose')}
    <div class="screen">
      ${stepDots(0)}
      <p class="hint">${allGone ? 'מעולה! השיער מוכן לעיצוב ✨' : 'לחצי על כל שערה פרועה כדי לגזור אותה'}</p>
      <div class="stage-wrap">${svg}</div>
      <p class="hint">${allGone ? '' : `נגזרו ${8 - state.strands.length}/8`}</p>
      ${allGone ? '<button class="big-btn" data-action="nav" data-target="hairstyle">בחירת תספורת ✂️</button>' : ''}
    </div>`;
}

function screenHairstyle() {
  const cards = HAIRSTYLES.map(
    (h) => `
    <button class="style-card ${state.hair.style === h.id ? 'selected' : ''}" data-action="pick-hair" data-id="${h.id}">
      ${hairIcon(h.id, state.hair.color)}
      <span>${h.name}</span>
    </button>`
  ).join('');
  const colors = COLORS.map(
    (c) => `<button class="swatch ${state.hair.color === c.hex ? 'selected' : ''} ${c.hex === '#FFFFFF' ? 'white-swatch' : ''}" style="background:${c.hex}" data-action="pick-hair-color" data-id="${c.hex}" aria-label="${c.name}"></button>`
  ).join('');
  const svg = buildCharacterSVG({ species: state.species, hair: state.hair, outfit: null });
  return `
    ${topBar('בחרי תספורת', 'trim')}
    <div class="screen">
      ${stepDots(1)}
      <div class="stage-wrap">${svg}</div>
      <span class="section-label">סגנון</span>
      <div class="card-grid">${cards}</div>
      <span class="section-label">צבע שיער</span>
      <div class="swatch-row">${colors}</div>
      <button class="big-btn" data-action="nav" data-target="sew" ${state.hair.style ? '' : 'disabled'}>אישור תספורת ✅</button>
    </div>`;
}

function screenSew() {
  const done = state.sewOrder.length > 0 && state.sewOrder.length === state.sewPoints.length;
  const svg = buildCharacterSVG(
    { species: state.species, hair: state.hair, outfit: null },
    sewOverlay(state.sewPoints, state.sewOrder)
  );
  return `
    ${topBar('נתפור בגד!', 'hairstyle')}
    <div class="screen">
      ${stepDots(2)}
      <p class="hint">${done ? 'תפרת מעולה! 🧵' : 'לחצי על הנקודות לפי הסדר: 1, 2, 3...'}</p>
      <div class="stage-wrap">${svg}</div>
      ${done ? '<button class="big-btn" data-action="nav" data-target="outfitstyle">בחירת בגד 👗</button>' : ''}
    </div>`;
}

function screenOutfitStyle() {
  const cards = OUTFITS.map(
    (o) => `
    <button class="style-card ${state.outfit.style === o.id ? 'selected' : ''}" data-action="pick-outfit" data-id="${o.id}">
      ${outfitIcon(o.id, state.outfit.color, state.outfit.pattern)}
      <span>${o.name}</span>
    </button>`
  ).join('');
  const colors = COLORS.map(
    (c) => `<button class="swatch ${state.outfit.color === c.hex ? 'selected' : ''} ${c.hex === '#FFFFFF' ? 'white-swatch' : ''}" style="background:${c.hex}" data-action="pick-outfit-color" data-id="${c.hex}" aria-label="${c.name}"></button>`
  ).join('');
  const patterns = PATTERNS.map(
    (p) => `
    <button class="style-card" style="min-height:64px; ${state.outfit.pattern === p.id ? 'border-color:var(--pink)' : ''}" data-action="pick-pattern" data-id="${p.id}">
      <span style="width:34px;height:34px;display:block">${patternSwatch(p.id, state.outfit.color)}</span>
      <span>${p.name}</span>
    </button>`
  ).join('');
  const svg = buildCharacterSVG({ species: state.species, hair: state.hair, outfit: state.outfit });
  return `
    ${topBar('בחרי בגד', 'sew')}
    <div class="screen">
      ${stepDots(3)}
      <div class="stage-wrap">${svg}</div>
      <span class="section-label">דגם</span>
      <div class="card-grid">${cards}</div>
      <span class="section-label">צבע בד</span>
      <div class="swatch-row">${colors}</div>
      <span class="section-label">הדפס</span>
      <div class="card-grid">${patterns}</div>
      <button class="big-btn" data-action="nav" data-target="rating" ${state.outfit.style ? '' : 'disabled'}>לתצוגה הסופית 🎀</button>
    </div>`;
}

function starsRow(target, value, readonly) {
  const stars = [1, 2, 3, 4, 5]
    .map(
      (n) => `<button ${readonly ? 'tabindex="-1"' : `data-action="rate" data-target="${target}" data-value="${n}"`} class="${n <= value ? 'filled' : ''}">★</button>`
    )
    .join('');
  return `<div class="stars-row ${readonly ? 'readonly' : ''}">${stars}</div>`;
}

function screenRating() {
  const svg = buildCharacterSVG(currentConfig());
  const canSave = state.hairRating > 0 && state.outfitRating > 0;
  return `
    ${topBar('איזה יופי!', 'outfitstyle')}
    <div class="screen">
      <div class="stage-wrap">${svg}</div>
      <div class="rating-block">
        <h3>כמה אהבת את התספורת? ✂️</h3>
        ${starsRow('hair', state.hairRating, false)}
      </div>
      <div class="rating-block">
        <h3>כמה אהבת את הבגדים? 👗</h3>
        ${starsRow('outfit', state.outfitRating, false)}
      </div>
      ${
        state.saved
          ? `<div class="footer-actions">
               <button class="big-btn purple" data-action="new-client">לקוחה הבאה 🔁</button>
               <button class="big-btn secondary" data-action="nav" data-target="gallery">לגלריה 📚</button>
             </div>`
          : `<button class="big-btn" data-action="save-entry" ${canSave ? '' : 'disabled'}>שמירה בגלריה 💾</button>`
      }
    </div>`;
}

function screenGallery() {
  if (state.gallery.length === 0) {
    return `
      ${topBar('הגלריה שלי', 'home')}
      <div class="screen"><p class="empty-state">עדיין אין תספורות שמורות!<br/>בואי ניצור אחת ✂️</p>
      <button class="big-btn" data-action="nav" data-target="choose">התחלה 🌟</button></div>`;
  }
  const cards = state.gallery
    .map(
      (e) => `
    <div class="gallery-card">
      <button class="del" data-action="delete-entry" data-id="${e.id}" aria-label="מחיקה">🗑️</button>
      ${buildCharacterSVG(e)}
      <div class="mini-stars">✂️ ${starsRow('', e.hairRating, true)}</div>
      <div class="mini-stars">👗 ${starsRow('', e.outfitRating, true)}</div>
    </div>`
    )
    .join('');
  return `
    ${topBar('הגלריה שלי', 'home')}
    <div class="screen"><div class="gallery-grid">${cards}</div></div>`;
}

function render() {
  let html = '';
  switch (state.screen) {
    case 'home': html = screenHome(); break;
    case 'choose': html = screenChoose(); break;
    case 'trim': html = screenTrim(); break;
    case 'hairstyle': html = screenHairstyle(); break;
    case 'sew': html = screenSew(); break;
    case 'outfitstyle': html = screenOutfitStyle(); break;
    case 'rating': html = screenRating(); break;
    case 'gallery': html = screenGallery(); break;
    default: html = screenHome();
  }
  app.innerHTML = html;
}

function spawnConfetti() {
  const pieces = ['🎉', '✨', '💇', '👗', '🌟', '🧵'];
  for (let i = 0; i < 24; i += 1) {
    const el = document.createElement('span');
    el.className = 'confetti-piece';
    el.textContent = pieces[Math.floor(Math.random() * pieces.length)];
    el.style.left = `${Math.random() * 100}%`;
    el.style.animationDuration = `${2 + Math.random() * 1.5}s`;
    el.style.animationDelay = `${Math.random() * 0.4}s`;
    confettiRoot.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

function showToast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  toastRoot.innerHTML = '';
  toastRoot.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

app.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action], [data-role]');
  if (!target) return;

  const roleEl = e.target.closest('[data-role]');
  if (roleEl) {
    const role = roleEl.dataset.role;
    const id = roleEl.dataset.id;
    if (role === 'strand') {
      state.strands = state.strands.filter((s) => s.id !== id);
      playSnip();
      if (state.strands.length === 0) {
        playSuccess();
        setTimeout(() => { if (state.screen === 'trim') goto('hairstyle'); }, 900);
      }
      render();
    } else if (role === 'sewdot') {
      const n = Number(id);
      const expected = state.sewOrder.length + 1;
      if (n === expected) {
        state.sewOrder.push(n);
        playStitch();
        if (state.sewOrder.length === state.sewPoints.length) {
          playSuccess();
          setTimeout(() => { if (state.screen === 'sew') goto('outfitstyle'); }, 900);
        }
      } else {
        playWrong();
      }
      render();
    }
    return;
  }

  const action = target.dataset.action;
  if (action === 'nav') {
    playClick();
    goto(target.dataset.target);
  } else if (action === 'pick-species') {
    playClick();
    state.species = target.dataset.id;
    state.strands = randomStrands(8);
    goto('trim');
  } else if (action === 'pick-hair') {
    playClick();
    state.hair.style = target.dataset.id;
    render();
  } else if (action === 'pick-hair-color') {
    playClick();
    state.hair.color = target.dataset.id;
    render();
  } else if (action === 'pick-outfit') {
    playClick();
    state.outfit.style = target.dataset.id;
    render();
  } else if (action === 'pick-outfit-color') {
    playClick();
    state.outfit.color = target.dataset.id;
    render();
  } else if (action === 'pick-pattern') {
    playClick();
    state.outfit.pattern = target.dataset.id;
    render();
  } else if (action === 'rate') {
    playStar();
    const val = Number(target.dataset.value);
    if (target.dataset.target === 'hair') state.hairRating = val;
    else state.outfitRating = val;
    render();
  } else if (action === 'save-entry') {
    playSave();
    const entry = {
      id: `look-${Date.now()}`,
      date: new Date().toISOString(),
      species: state.species,
      hair: { ...state.hair },
      outfit: { ...state.outfit },
      hairRating: state.hairRating,
      outfitRating: state.outfitRating,
    };
    state.gallery = saveEntry(entry);
    state.saved = true;
    showToast('נשמר בגלריה! 💾');
    render();
  } else if (action === 'new-client') {
    playClick();
    resetForNewClient();
    goto('choose');
  } else if (action === 'delete-entry') {
    if (window.confirm('למחוק את התספורת הזו?')) {
      state.gallery = deleteEntry(target.dataset.id);
      render();
    }
  }
});

render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
