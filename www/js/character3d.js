// Real 3D character construction (Three.js). Built from simple primitive
// geometry (spheres/cylinders/cones/tubes) with soft PBR-ish shading, so
// it stays lightweight enough for any Android phone while looking like a
// rounded, natural collectible figure rather than a flat drawing.
import * as THREE from './vendor/three.module.min.js';
import { getSpecies, EYE_COLORS, accentFor } from './characters.js?v=7';

// ---- shared body proportions (natural-ish child, head ~31% of height) ----
const FOOT_H = 0.12;
const LEG_SPAN = 1.05;
const TORSO_SPAN = 0.72;
const NECK_H = 0.13;
const HEAD_R = 0.46;
const ARM_SPAN = 0.66;

const hipY = FOOT_H + LEG_SPAN;
const shoulderY = hipY + TORSO_SPAN;
const neckTopY = shoulderY + NECK_H;
const headY = neckTopY + HEAD_R;

export const RIG = { FOOT_H, LEG_SPAN, TORSO_SPAN, NECK_H, HEAD_R, ARM_SPAN, hipY, shoulderY, neckTopY, headY };

const SKIN_OVERRIDES = { girl: { skin: '#f3c9a6', dark: '#e0ab80' } };
function skinTones(sp) {
  const o = SKIN_OVERRIDES[sp.id];
  return o ? [o.skin, o.dark] : [sp.skin, sp.skinShade];
}

function std(hex, roughness = 0.65, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color: hex, roughness, metalness });
}

function hexToRgb(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lightenHex(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const m = (v) => Math.round(v + (255 - v) * amt);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
function darkenHex(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const m = (v) => Math.round(v * (1 - amt));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

// ============================================================
// Face texture (canvas), applied to a flat plate proud of the head sphere
// ============================================================
function drawEye(ctx, cx, cy, irisHex, mirrored) {
  const flick = mirrored ? -1 : 1;
  const scl = ctx.createRadialGradient(cx, cy - 6, 4, cx, cy, 58);
  scl.addColorStop(0, '#ffffff');
  scl.addColorStop(1, '#f2e9ea');
  ctx.fillStyle = scl;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 52, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  const ir = ctx.createRadialGradient(cx, cy + 10, 4, cx, cy + 10, 38);
  ir.addColorStop(0, lightenHex(irisHex, 0.35));
  ir.addColorStop(0.55, irisHex);
  ir.addColorStop(1, darkenHex(irisHex, 0.35));
  ctx.fillStyle = ir;
  ctx.beginPath();
  ctx.arc(cx, cy + 10, 37, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1c1620';
  ctx.beginPath();
  ctx.arc(cx, cy + 10, 16.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.ellipse(cx - 13, cy - 4, 11, 14, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.arc(cx + 11, cy + 24, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const lid = ctx.createLinearGradient(cx, cy - 55, cx, cy - 5);
  lid.addColorStop(0, 'rgba(60,40,45,0.0)');
  lid.addColorStop(1, 'rgba(60,40,45,0.28)');
  ctx.fillStyle = lid;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, 52, 40, 0, Math.PI, 0);
  ctx.fill();

  ctx.strokeStyle = '#2b1f22';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 50, cy - 4);
  ctx.quadraticCurveTo(cx, cy - 58, cx + 50, cy - 6);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(70,45,35,0.85)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(cx - 44 * flick, cy - 78);
  ctx.quadraticCurveTo(cx, cy - 98, cx + 44 * flick, cy - 86);
  ctx.stroke();
}

function buildFaceTexture(irisHex, opts = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = 640;
  const ctx = c.getContext('2d');
  drawEye(ctx, 238, 335, irisHex, true);
  drawEye(ctx, 402, 335, irisHex, false);

  if (opts.mouth !== false) {
    ctx.strokeStyle = '#c56a7c';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(280, 448);
    ctx.quadraticCurveTo(320, 468, 360, 448);
    ctx.stroke();
  }

  if (opts.whiskers) {
    ctx.strokeStyle = 'rgba(90,70,60,0.55)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 3; i++) {
        const y = 400 + i * 16;
        ctx.beginPath();
        ctx.moveTo(320 + side * 90, y);
        ctx.lineTo(320 + side * 220, y - 10 + i * 10);
        ctx.stroke();
      }
    });
  }

  const blushGrad = (cx, cy) => {
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 38);
    g.addColorStop(0, 'rgba(255,150,150,0.42)');
    g.addColorStop(1, 'rgba(255,150,150,0)');
    return g;
  };
  ctx.fillStyle = blushGrad(150, 420);
  ctx.beginPath(); ctx.arc(150, 420, 38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = blushGrad(490, 420);
  ctx.beginPath(); ctx.arc(490, 420, 38, 0, Math.PI * 2); ctx.fill();

  return new THREE.CanvasTexture(c);
}

// ============================================================
// Fabric textures (canvas, tiled) for outfits
// ============================================================
function daisy(ctx, cx, cy, s) {
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * s * 0.55, cy + Math.sin(a) * s * 0.55, s * 0.42, s * 0.22, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f4c430';
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

function buildFabricTexture(patternId, baseHex) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  const accent = accentFor(baseHex);

  if (patternId === 'stripes') {
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 22;
    for (let i = -256; i < 512; i += 44) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 256, 256);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (patternId === 'dots') {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.7;
    for (let y = 20; y < 256; y += 46) {
      for (let x = 20; x < 256; x += 46) {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  } else if (patternId === 'stars' || patternId === 'hearts') {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.8;
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const glyph = patternId === 'stars' ? '★' : '♥';
    for (let y = 26; y < 256; y += 52) {
      for (let x = 26; x < 256; x += 52) {
        ctx.fillText(glyph, x, y);
      }
    }
    ctx.globalAlpha = 1;
  } else if (patternId === 'zigzag') {
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 5;
    for (let y = 10; y < 256; y += 34) {
      ctx.beginPath();
      for (let x = 0; x <= 256; x += 20) {
        ctx.lineTo(x, y + (Math.floor(x / 20) % 2 === 0 ? -8 : 8));
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (patternId === 'floral') {
    daisy(ctx, 60, 60, 26);
    daisy(ctx, 190, 100, 22);
    daisy(ctx, 120, 190, 24);
    daisy(ctx, 220, 220, 20);
    daisy(ctx, 20, 210, 18);
    ctx.strokeStyle = 'rgba(90,140,90,0.5)';
    ctx.lineWidth = 2;
    [[60, 86, 60, 140], [190, 122, 190, 170], [120, 214, 120, 256]].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function fabricMaterial(baseHex, pattern, repeatX = 2, repeatY = 1.4) {
  if (!pattern || pattern === 'plain') return std(baseHex, 0.8, 0);
  const tex = buildFabricTexture(pattern, baseHex);
  tex.repeat.set(repeatX, repeatY);
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0 });
}

// ============================================================
// Body + species extras
// ============================================================
function buildFoot(group, x, footColor) {
  const sole = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.045, 0.32), std(0xffffff, 0.5));
  sole.position.set(x, 0.0225, 0.03);
  group.add(sole);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.13, 0.30), std(0xffffff, 0.45));
  upper.position.set(x, 0.045 + 0.065, 0.03);
  group.add(upper);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.192, 0.045, 0.31), std(footColor, 0.4));
  stripe.position.set(x, 0.11, 0.03);
  group.add(stripe);
}

function buildTailCurve(group, points, radius, material) {
  const curve = new THREE.CatmullRomCurve3(points);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 8, false), material);
  group.add(tube);
  return tube;
}

function addSpeciesExtras(group, sp, skin, skinDark) {
  if (sp.id === 'cat') {
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 4), std(skin));
      ear.position.set(side * 0.28, headY + HEAD_R * 0.82, -0.02);
      ear.rotation.z = side * -0.15;
      ear.rotation.y = Math.PI / 4;
      group.add(ear);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 4), std('#ffc9d6'));
      inner.position.set(side * 0.27, headY + HEAD_R * 0.76, 0.03);
      inner.rotation.copy(ear.rotation);
      group.add(inner);
    });
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 3; i++) {
        const y = headY - 0.02 + i * 0.05;
        const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.34, 4), std('#7a5a4a'));
        whisker.position.set(side * (HEAD_R * 0.9), y, HEAD_R * 0.55);
        whisker.rotation.z = Math.PI / 2;
        whisker.rotation.y = side * -0.25 + (i - 1) * 0.06;
        group.add(whisker);
      }
    });
    buildTailCurve(group, [
      new THREE.Vector3(0.18, hipY - 0.3, -0.32),
      new THREE.Vector3(0.32, hipY - 0.05, -0.42),
      new THREE.Vector3(0.36, hipY + 0.4, -0.4),
      new THREE.Vector3(0.24, hipY + 0.7, -0.3),
    ], 0.06, std(skin));
  } else if (sp.id === 'dog') {
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 14), std(skinDark));
      ear.scale.set(0.55, 1.15, 0.35);
      ear.position.set(side * HEAD_R * 0.92, headY + HEAD_R * 0.1, -0.02);
      ear.rotation.z = side * 0.35;
      group.add(ear);
    });
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 16), std('#f3d9b1'));
    snout.scale.set(1, 0.75, 0.85);
    snout.position.set(0, headY - HEAD_R * 0.28, HEAD_R * 0.96);
    group.add(snout);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), std('#3a2e39', 0.3));
    nose.position.set(0, headY - HEAD_R * 0.24, HEAD_R * 0.96 + 0.17);
    group.add(nose);
    buildTailCurve(group, [
      new THREE.Vector3(0, hipY - 0.2, -0.3),
      new THREE.Vector3(0.05, hipY + 0.15, -0.44),
      new THREE.Vector3(-0.05, hipY + 0.45, -0.4),
      new THREE.Vector3(0.1, hipY + 0.62, -0.2),
    ], 0.065, std(skin));
  } else if (sp.id === 'bunny') {
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 16), std(skin));
      ear.scale.set(1, 3.4, 0.5);
      ear.position.set(side * 0.16, headY + HEAD_R * 1.55, -0.05);
      ear.rotation.z = side * -0.1;
      group.add(ear);
      const inner = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 14), std('#ffc9d6'));
      inner.scale.set(1, 3.1, 0.4);
      inner.position.set(side * 0.16, headY + HEAD_R * 1.53, 0.02);
      inner.rotation.z = side * -0.1;
      group.add(inner);
    });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.05, 8), std('#ffb6c1'));
    nose.position.set(0, headY - HEAD_R * 0.18, HEAD_R * 1.0);
    nose.rotation.x = Math.PI / 2;
    group.add(nose);
    [-1, 1].forEach((side) => {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.02), std('#ffffff', 0.3));
      tooth.position.set(side * 0.025, headY - HEAD_R * 0.42, HEAD_R * 0.92);
      group.add(tooth);
    });
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), std(skin));
    tail.position.set(0, hipY + 0.15, -0.34);
    group.add(tail);
  }
}

// ============================================================
// Hairstyles
// ============================================================
function buildHair(group, style, colorHex) {
  const mat = () => std(colorHex, 0.5, 0.05);
  const meshes = [];
  const add = (m) => { group.add(m); meshes.push(m); return m; };

  if (style === 'pony') {
    add(new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 1.03, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.44), mat()))
      .position.set(0, headY, 0);
    [-1, 1].forEach((side) => {
      const lock = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.62, 12, 1, true), mat());
      lock.position.set(side * HEAD_R * 0.86, headY - 0.22, HEAD_R * 0.18);
      lock.rotation.z = side * 0.28;
      lock.rotation.x = 0.18;
      add(lock);
    });
    const tieY = headY + HEAD_R * 0.12, tieZ = -HEAD_R * 1.0;
    add(new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.05, 8, 16), std('#e0637d', 0.4)))
      .position.set(0, tieY, tieZ);
    meshes[meshes.length - 1].rotation.x = Math.PI / 2 - 0.1;
    const curve = [
      new THREE.Vector3(0, tieY - 0.02, tieZ - 0.02),
      new THREE.Vector3(0.04, tieY - 0.28, tieZ - 0.16),
      new THREE.Vector3(-0.02, tieY - 0.55, tieZ - 0.12),
      new THREE.Vector3(0.05, tieY - 0.8, tieZ + 0.02),
    ];
    add(buildTailCurve(group, curve, 0.135, mat()));
  } else if (style === 'pigtails') {
    add(new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 1.03, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.3), mat()))
      .position.set(0, headY, 0);
    [-1, 1].forEach((side) => {
      const tieY = headY + HEAD_R * 0.15, tieX = side * HEAD_R * 0.95, tieZ = 0;
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.04, 8, 16), std('#e0637d', 0.4));
      tie.position.set(tieX, tieY, tieZ);
      tie.rotation.y = Math.PI / 2;
      add(tie);
      const curve = [
        new THREE.Vector3(tieX, tieY, tieZ),
        new THREE.Vector3(tieX + side * 0.1, tieY - 0.25, tieZ + 0.05),
        new THREE.Vector3(tieX + side * 0.02, tieY - 0.5, tieZ - 0.05),
        new THREE.Vector3(tieX + side * 0.1, tieY - 0.72, tieZ),
      ];
      add(buildTailCurve(group, curve, 0.115, mat()));
    });
  } else if (style === 'bob') {
    // Crown: full coverage, but only down to a height safely above the
    // eyes. Below that, a back+sides "curtain" continues down to the
    // jaw while leaving an open wedge at the front for the face - a
    // single full-circle sphere segment down to jaw height would bury
    // the face texture under hair.
    add(new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.3), mat()))
      .position.set(0, headY, 0);
    add(new THREE.Mesh(
      new THREE.SphereGeometry(HEAD_R * 1.05, 24, 16, Math.PI * (160 / 180), Math.PI * (220 / 180), Math.PI * 0.26, Math.PI * 0.36),
      mat()
    )).position.set(0, headY, 0);
  } else if (style === 'curly') {
    add(new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 1.0, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.4), mat()))
      .position.set(0, headY, 0);
    const bumpCount = 9;
    for (let i = 0; i < bumpCount; i++) {
      const phi = (i / bumpCount) * Math.PI * 2;
      const theta = Math.PI * (0.16 + (i % 2) * 0.1);
      const r = HEAD_R * 1.02;
      const bx = r * Math.sin(theta) * Math.cos(phi);
      const by = headY + r * Math.cos(theta);
      const bz = r * Math.sin(theta) * Math.sin(phi);
      const bump = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 12), mat());
      bump.position.set(bx, by, bz);
      add(bump);
    }
  } else if (style === 'mohawk') {
    // A row of spikes along the sagittal midline, from just above the
    // forehead, over the crown, down to the nape - each oriented to
    // stick straight out of the scalp at its own point, tallest at the
    // top of the head and tapering toward the front/back ends.
    const stripCount = 7;
    const center = new THREE.Vector3(0, headY, 0);
    for (let i = 0; i < stripCount; i++) {
      const t = i / (stripCount - 1);
      const angle = ((25 + t * 130) * Math.PI) / 180; // 0deg=front equator, 90deg=crown, 180deg=back equator
      const dir = new THREE.Vector3(0, Math.sin(angle), Math.cos(angle));
      const base = center.clone().addScaledVector(dir, HEAD_R * 1.0);
      const h = 0.14 + 0.24 * Math.sin(t * Math.PI);
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.085, h, 8), mat());
      spike.position.copy(base.addScaledVector(dir, h / 2));
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      add(spike);
    }
  } else if (style === 'bun') {
    add(new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 1.03, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.4), mat()))
      .position.set(0, headY, 0);
    const bunY = headY + HEAD_R * 0.95, bunZ = -HEAD_R * 0.3;
    add(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 8, 16), std('#e0637d', 0.4)))
      .position.set(0, bunY - 0.14, bunZ);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 18), mat()))
      .position.set(0, bunY, bunZ);
  }

  return meshes;
}

// ============================================================
// Outfits
// ============================================================
function buildDress(group, armParts, colorHex, pattern) {
  const overlap = 0.05;
  const bodiceBottom = hipY - overlap;
  const bodiceMat = fabricMaterial(colorHex, pattern, 2, 1.4);
  const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.34, shoulderY - bodiceBottom, 24, 1, true), bodiceMat);
  bodice.position.set(0, (shoulderY + bodiceBottom) / 2, 0);
  group.add(bodice);

  const skirtMat = fabricMaterial(colorHex, pattern, 3, 1.6);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.78, 0.5, 28, 1, true), skirtMat);
  skirt.position.set(0, hipY - 0.25, 0);
  group.add(skirt);
  const skirtCap = new THREE.Mesh(new THREE.CircleGeometry(0.78, 28), fabricMaterial(colorHex, pattern, 2, 2));
  skirtCap.rotation.x = Math.PI / 2;
  skirtCap.position.set(0, hipY - 0.5, 0);
  group.add(skirtCap);

  armParts.forEach((a) => {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.14, 14), bodiceMat);
    sleeve.position.set(a.x, a.topY - 0.05, 0);
    group.add(sleeve);
  });
}

function buildShirt(group, armParts, colorHex, pattern, { long = false, hem = hipY - 0.08 } = {}) {
  const mat = fabricMaterial(colorHex, pattern, 2, 1.2);
  const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.335, shoulderY - hem, 24, 1, true), mat);
  shirt.position.set(0, (shoulderY + hem) / 2, 0);
  group.add(shirt);
  armParts.forEach((a) => {
    const len = long ? a.topY - (a.topY - ARM_SPAN + 0.1) : 0.16;
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.13, long ? 0.1 : 0.13, len, 14), mat);
    sleeve.position.set(a.x, long ? a.topY - len / 2 - 0.02 : a.topY - 0.05, 0);
    group.add(sleeve);
  });
  return hem;
}

function buildPants(group, { topY = hipY - 0.02, bottomY = 0.16, colorHex, pattern } = {}) {
  const mat = fabricMaterial(colorHex, pattern, 1.4, 1.4);
  [-0.15, 0.15].forEach((x) => {
    const pant = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.145, topY - bottomY, 18), mat);
    pant.position.set(x, (topY + bottomY) / 2, 0);
    group.add(pant);
  });
}

function buildBelt(group, y, colorHex = '#3a2e39') {
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 24), std(colorHex, 0.4));
  belt.rotation.x = Math.PI / 2;
  belt.position.set(0, y, 0);
  group.add(belt);
}

// A snug sleeveless layer covering the torso - used as the base under
// outfits (cape, overalls) whose own pieces don't fully wrap the torso
// on their own, so the bare body never shows through.
function buildTank(group, colorHex, pattern, hem = hipY - 0.05) {
  const mat = fabricMaterial(colorHex, pattern, 2, 1.2);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.32, shoulderY - hem, 22, 1, true), mat);
  tank.position.set(0, (shoulderY + hem) / 2, 0);
  group.add(tank);
  return hem;
}

function buildOutfit(group, armParts, style, colorHex, pattern) {
  if (style === 'dress') {
    buildDress(group, armParts, colorHex, pattern);
  } else if (style === 'tshirt') {
    // A short, boxy tee (little taper) meeting a separately-flared skirt
    // at a visible waistband ring, so the two-piece look reads clearly
    // different from the one-piece dress's smooth, seamless taper.
    const hem = hipY + 0.05;
    const mat = fabricMaterial(colorHex, pattern, 2, 1);
    const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.30, shoulderY - hem, 22, 1, true), mat);
    shirt.position.set(0, (shoulderY + hem) / 2, 0);
    group.add(shirt);
    armParts.forEach((a) => {
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 14), mat);
      sleeve.position.set(a.x, a.topY - 0.05, 0);
      group.add(sleeve);
    });
    buildBelt(group, hem, darkenHex(colorHex, 0.25));

    const skirtMat = fabricMaterial(darkenHex(colorHex, 0.12), pattern, 3, 1.4);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.75, 0.5, 26, 1, true), skirtMat);
    skirt.position.set(0, hem - 0.25, 0);
    group.add(skirt);
    const skirtCap = new THREE.Mesh(new THREE.CircleGeometry(0.75, 26), skirtMat);
    skirtCap.rotation.x = Math.PI / 2;
    skirtCap.position.set(0, hem - 0.5, 0);
    group.add(skirtCap);
  } else if (style === 'overalls') {
    // A plain undershirt first, so the torso/shoulders are never bare -
    // the overalls (pants + bib + straps) then layer on top of it.
    buildTank(group, '#fff6ea', 'plain', hipY - 0.05);
    buildPants(group, { colorHex, pattern, topY: hipY + 0.4, bottomY: 0.16 });
    const bibMat = fabricMaterial(colorHex, pattern, 1, 1);
    const bib = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.08), bibMat);
    bib.position.set(0, hipY + 0.21, 0.29);
    group.add(bib);
    [-1, 1].forEach((side) => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.08, shoulderY - (hipY + 0.42), 0.05), bibMat);
      strap.position.set(side * 0.13, (shoulderY + hipY + 0.42) / 2, 0.26);
      group.add(strap);
    });
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), std('#f4c430', 0.3, 0.6));
    button.position.set(0, hipY + 0.42, 0.33);
    group.add(button);
  } else if (style === 'jumpsuit') {
    const hem = buildShirt(group, armParts, colorHex, pattern, { hem: hipY - 0.02 });
    buildPants(group, { colorHex, pattern, topY: hem + 0.03, bottomY: 0.16 });
  } else if (style === 'cape') {
    // A snug top (matching the cape's colour, like a hero costume) so
    // the torso is fully covered, with shorts below and the cape
    // draped over the shoulders and down the back.
    buildTank(group, colorHex, pattern, hipY - 0.05);
    buildPants(group, { colorHex, pattern, topY: hipY + 0.02, bottomY: hipY - 0.35 });
    buildBelt(group, hipY + 0.02, darkenHex(colorHex, 0.2));
    const capeMat = fabricMaterial(colorHex, pattern, 2, 2);
    const cape = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.62, 0.85, 20, 1, true, Math.PI * 0.62, Math.PI * 0.76),
      capeMat
    );
    cape.position.set(0, shoulderY - 0.42, 0);
    group.add(cape);
    const claspL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), std('#f4c430', 0.3, 0.6));
    claspL.position.set(-0.1, shoulderY - 0.02, -0.22);
    group.add(claspL);
    const claspR = claspL.clone();
    claspR.position.x = 0.1;
    group.add(claspR);
  } else if (style === 'sweater') {
    const hem = buildShirt(group, armParts, colorHex, pattern, { long: true, hem: hipY - 0.05 });
    const ribMat = std(darkenHex(colorHex, 0.18), 0.85);
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.025, 8, 24), ribMat);
    rib.rotation.x = Math.PI / 2;
    rib.position.set(0, hem, 0);
    group.add(rib);
    buildPants(group, { colorHex: darkenHex(colorHex, 0.35), pattern: 'plain', topY: hipY - 0.02, bottomY: 0.16 });
  }
}

// ============================================================
// Public API
// ============================================================
export function buildCharacter(config) {
  const sp = getSpecies(config.species);
  const [skin, skinDark] = skinTones(sp);
  const group = new THREE.Group();

  const legGeo = new THREE.CylinderGeometry(0.15, 0.12, LEG_SPAN, 20);
  const legMat = std(skin);
  [-0.15, 0.15].forEach((x) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, (FOOT_H + hipY) / 2, 0);
    group.add(leg);
    buildFoot(group, x, '#ff9fc0');
  });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.255, TORSO_SPAN, 20), std(skin));
  torso.position.set(0, (hipY + shoulderY) / 2, 0);
  group.add(torso);

  const armGeo = new THREE.CapsuleGeometry(0.082, ARM_SPAN - 0.164, 4, 10);
  const armTopY = shoulderY - 0.06;
  const armParts = [-0.40, 0.40].map((x) => {
    const arm = new THREE.Mesh(armGeo, std(skin));
    arm.position.set(x, armTopY - ARM_SPAN / 2, 0);
    arm.rotation.z = x < 0 ? 0.09 : -0.09;
    group.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.088, 14, 14), std(skin));
    hand.position.set(x + (x < 0 ? -0.03 : 0.03), armTopY - ARM_SPAN + 0.02, 0);
    group.add(hand);
    return { mesh: arm, hand, x, topY: armTopY };
  });

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.135, NECK_H, 16), std(skinDark));
  neck.position.set(0, (shoulderY + neckTopY) / 2, 0);
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 36, 36), std(skin));
  head.position.set(0, headY, 0);
  head.scale.set(0.98, 1.0, 0.99);
  group.add(head);

  addSpeciesExtras(group, sp, skin, skinDark);

  const facePlate = new THREE.Mesh(
    new THREE.CircleGeometry(HEAD_R * 0.82, 48),
    new THREE.MeshBasicMaterial({
      map: buildFaceTexture(EYE_COLORS[sp.id] || EYE_COLORS.girl, {
        mouth: sp.id !== 'dog',
        whiskers: sp.id === 'cat',
      }),
      transparent: true,
    })
  );
  facePlate.position.set(0, headY, HEAD_R * 1.02);
  group.add(facePlate);

  let hairMeshes = [];
  if (config.hair && config.hair.style) {
    hairMeshes = buildHair(group, config.hair.style, config.hair.color);
  }

  torso.visible = !(config.outfit && config.outfit.style);
  if (config.outfit && config.outfit.style) {
    buildOutfit(group, armParts, config.outfit.style, config.outfit.color, config.outfit.pattern || 'plain');
  }

  return { group, torso, armParts, head, hairMeshes };
}

// ============================================================
// Mini-game hit targets
// ============================================================
export function buildStrandTargets(charGroup, count = 8) {
  const targets = [];
  const center = new THREE.Vector3(0, headY, 0);
  for (let i = 0; i < count; i += 1) {
    const phi = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const theta = Math.PI * (0.08 + Math.random() * 0.5);
    const dir = new THREE.Vector3(
      Math.sin(theta) * Math.cos(phi),
      Math.cos(theta),
      Math.sin(theta) * Math.sin(phi)
    );
    const surface = center.clone().addScaledVector(dir, HEAD_R * 0.95);
    const tipLen = 0.2;
    const mid = surface.clone().addScaledVector(dir, tipLen / 2);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.045, tipLen, 8), std('#6b3f1d', 0.6));
    cone.position.copy(mid);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    charGroup.add(cone);

    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.02, depthWrite: false })
    );
    hit.position.copy(mid);
    charGroup.add(hit);
    hit.userData = { role: 'strand', id: `s${i}`, visual: cone, axisPoint: center.clone() };
    targets.push(hit);
  }
  return targets;
}

export function removeStrandTarget(charGroup, hitMesh) {
  if (hitMesh.userData.visual) charGroup.remove(hitMesh.userData.visual);
  charGroup.remove(hitMesh);
}

function numberSpriteTexture(n, color) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(32, 32, 27, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), 32, 35);
  return new THREE.CanvasTexture(c);
}

export function buildSewDotTargets(charGroup, count = 8) {
  const targets = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    const phi = t * Math.PI * 2 * 1.4 + 0.4;
    const y = hipY + 0.08 + t * (shoulderY - hipY - 0.2);
    const r = 0.30;
    const pos = new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r);

    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), std('#ffffff', 0.4));
    dot.position.copy(pos);
    charGroup.add(dot);

    const spritePending = new THREE.Sprite(new THREE.SpriteMaterial({ map: numberSpriteTexture(i + 1, '#E24A6B') }));
    const spriteDone = new THREE.Sprite(new THREE.SpriteMaterial({ map: numberSpriteTexture(i + 1, '#2E9B57') }));
    spritePending.scale.set(0.2, 0.2, 1);
    spriteDone.scale.set(0.2, 0.2, 1);
    spriteDone.visible = false;
    const outDir = pos.clone().setY(0).normalize();
    const labelPos = pos.clone().addScaledVector(outDir, 0.14);
    spritePending.position.copy(labelPos);
    spriteDone.position.copy(labelPos);
    charGroup.add(spritePending);
    charGroup.add(spriteDone);

    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.02, depthWrite: false })
    );
    hit.position.copy(pos);
    charGroup.add(hit);
    hit.userData = { role: 'sewdot', id: i + 1, dot, spritePending, spriteDone, pos, axisPoint: new THREE.Vector3(0, y, 0) };
    targets.push(hit);
  }
  return targets;
}

export function markSewDotDone(hitMesh) {
  hitMesh.userData.dot.material.color.set('#38c172');
  hitMesh.userData.spritePending.visible = false;
  hitMesh.userData.spriteDone.visible = true;
}

let sewLine = null;
export function updateSewLine(scene, sewTargets, connectedOrder) {
  if (sewLine) {
    scene.remove(sewLine);
    sewLine.geometry.dispose();
    sewLine = null;
  }
  if (connectedOrder.length < 2) return;
  const pts = connectedOrder
    .map((id) => sewTargets.find((t) => t.userData.id === id))
    .filter(Boolean)
    .map((t) => t.userData.pos);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  sewLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#e24a6b', linewidth: 2 }));
  scene.add(sewLine);
}

export function clearSewLine(scene) {
  if (sewLine) {
    scene.remove(sewLine);
    sewLine.geometry.dispose();
    sewLine = null;
  }
}

export function disposeCharacter(group) {
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    }
  });
}
