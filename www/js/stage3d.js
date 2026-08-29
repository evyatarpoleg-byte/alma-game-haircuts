// A single persistent WebGL stage (renderer + scene + camera + canvas).
// game.js re-renders its HTML chrome on every state change, but this
// canvas element is created once and moved into whichever screen's
// "stage-slot" placeholder is currently in the DOM, so the WebGL
// context and the character's rotation/animation survive screen swaps.
import * as THREE from './vendor/three.module.min.js';
import {
  buildCharacter, disposeCharacter,
  buildStrandTargets, removeStrandTarget,
  buildSewDotTargets, markSewDotDone, updateSewLine, clearSewLine,
} from './character3d.js?v=8';

const canvas = document.createElement('canvas');
canvas.id = 'stage3d';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.display = 'block';
canvas.style.touchAction = 'none';
canvas.style.cursor = 'grab';

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
camera.position.set(0, 1.55, 8.6);
camera.lookAt(0, 1.55, 0);

scene.add(new THREE.HemisphereLight(0xfff3ea, 0xe7c9d6, 0.55));
scene.add(new THREE.AmbientLight(0xfff1e8, 0.35));
const key = new THREE.DirectionalLight(0xfff6ee, 1.35);
key.position.set(2.4, 3.6, 3.0);
scene.add(key);
const fillLight = new THREE.DirectionalLight(0xd8ecff, 0.45);
fillLight.position.set(-2.8, 1.4, -1.6);
scene.add(fillLight);

const shadowTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const cx = c.getContext('2d');
  const g = cx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, 'rgba(58,46,57,0.32)');
  g.addColorStop(1, 'rgba(58,46,57,0)');
  cx.fillStyle = g;
  cx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();
const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.0, 40),
  new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = 0.002;
scene.add(shadow);

let currentGroup = null;
let strandTargets = [];
let sewTargets = [];
let sewConnectedOrder = [];
let onHit = null;
let autoRotate = true;

export function getCanvas() {
  return canvas;
}

// The gentle idle spin is a nice showcase effect on the style-picker
// screens, but during the trim/sew mini-games it makes targets drift
// out from under a child's finger between seeing and tapping them.
// Mini-games should hold still by default and only turn via a drag.
export function setAutoRotate(enabled) {
  autoRotate = enabled;
}

export function setHitHandler(fn) {
  onHit = fn;
}

function clearMiniGameTargets() {
  strandTargets = [];
  sewTargets = [];
  sewConnectedOrder = [];
  clearSewLine(scene);
}

export function setCharacter(config) {
  if (currentGroup) {
    disposeCharacter(currentGroup);
    scene.remove(currentGroup);
    currentGroup = null;
  }
  clearMiniGameTargets();
  autoRotate = true;
  const built = buildCharacter(config);
  currentGroup = built.group;
  scene.add(currentGroup);
  return built;
}

export function addStrandTargets(count = 8) {
  if (!currentGroup) return [];
  strandTargets = buildStrandTargets(currentGroup, count);
  return strandTargets;
}

export function removeStrand(id) {
  const idx = strandTargets.findIndex((t) => t.userData.id === id);
  if (idx === -1 || !currentGroup) return;
  removeStrandTarget(currentGroup, strandTargets[idx]);
  strandTargets.splice(idx, 1);
}

export function addSewTargets(count = 8) {
  if (!currentGroup) return [];
  sewTargets = buildSewDotTargets(currentGroup, count);
  sewConnectedOrder = [];
  return sewTargets;
}

export function connectSewDot(id) {
  sewConnectedOrder.push(id);
  const t = sewTargets.find((x) => x.userData.id === id);
  if (t) markSewDotDone(t);
  updateSewLine(scene, sewTargets, sewConnectedOrder);
}

export function captureSnapshot() {
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
}

// Call after moving the canvas to a new spot in the DOM (game.js does
// this on every screen render). Some browsers need an explicit resize +
// render right after a canvas is re-parented before they resume
// compositing it, rather than waiting for the next animation frame.
export function refresh() {
  sizeRenderer();
  renderer.render(scene, camera);
}

function sizeRenderer() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

if ('ResizeObserver' in window) {
  new ResizeObserver(sizeRenderer).observe(canvas);
}
window.addEventListener('resize', sizeRenderer);

// ---- interaction: drag to rotate, tap to hit a mini-game target ----
const raycaster = new THREE.Raycaster();
const pointerVec = new THREE.Vector2();
let dragging = false;
let lastX = 0;
let startX = 0;
let startY = 0;

// A target on the far side of the head/torso still sits somewhere along
// the camera ray (raycasting doesn't know the body in front of it is
// opaque), so without this check a tap could "reach through" the model
// and hit a target the player can't actually see. Comparing the target's
// outward direction from its surface's rotation axis against the
// direction to the camera tells us whether it's currently facing us.
function isFacingCamera(hitMesh) {
  const axis = hitMesh.userData.axisPoint;
  if (!axis) return true;
  const worldPos = hitMesh.getWorldPosition(new THREE.Vector3());
  const outward = worldPos.clone().sub(axis);
  if (outward.lengthSq() < 1e-6) return true;
  outward.normalize();
  const toCamera = camera.position.clone().sub(axis).normalize();
  return outward.dot(toCamera) > -0.05;
}

function handleTap(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointerVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerVec, camera);
  const all = strandTargets.concat(sewTargets);
  const hits = raycaster.intersectObjects(all, false);
  const hit = hits.find((h) => isFacingCamera(h.object));
  if (hit && onHit) onHit(hit.object.userData);
}

canvas.addEventListener('pointerdown', (e) => {
  dragging = true;
  lastX = e.clientX;
  startX = e.clientX;
  startY = e.clientY;
  canvas.style.cursor = 'grabbing';
  canvas.setPointerCapture(e.pointerId);
});
window.addEventListener('pointermove', (e) => {
  if (!dragging || !currentGroup) return;
  const dx = e.clientX - lastX;
  lastX = e.clientX;
  currentGroup.rotation.y += dx * 0.012;
});
window.addEventListener('pointerup', (e) => {
  if (!dragging) return;
  dragging = false;
  canvas.style.cursor = 'grab';
  const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
  if (dist < 8) handleTap(e.clientX, e.clientY);
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  if (!dragging && autoRotate && currentGroup) currentGroup.rotation.y += dt * 0.32;
  renderer.render(scene, camera);
}
animate();
