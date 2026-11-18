import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const $ = id => document.getElementById(id);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ============================================================ renderer / escena
const view = $('view');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
const DPR = Math.min(window.devicePixelRatio || 1, 1.75);
renderer.setPixelRatio(DPR);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
view.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#101318');
scene.fog = new THREE.Fog('#101318', 140, 320);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 800);
camera.position.set(0, 62, 70);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.maxPolarAngle = Math.PI * 0.47;
controls.minDistance = 4;
controls.maxDistance = 180;
controls.target.set(0, 0, 3);

scene.add(new THREE.HemisphereLight('#dfe7ff', '#2a2420', 0.55));
const key = new THREE.DirectionalLight('#fff3e0', 1.7);
key.position.set(-28, 60, 34);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -58, right: 45, top: 36, bottom: -32, near: 10, far: 170 });
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.03;
scene.add(key);
const rim = new THREE.DirectionalLight('#9ec5ff', 0.7);
rim.position.set(40, 25, -40);
scene.add(rim);

const desk = new THREE.Mesh(new THREE.CircleGeometry(160, 64), new THREE.MeshStandardMaterial({ color: '#2a2b2f', roughness: 0.9, metalness: 0 }));
desk.rotation.x = -Math.PI / 2;
desk.position.y = -0.92;
desk.receiveShadow = true;
scene.add(desk);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.32, 1.45);
composer.addPass(bloom);
composer.addPass(new OutputPass());
let useBloom = true;

// ============================================================ geometría de la protoboard
const ROWZ = { tp: -8.5, tn: -7.5, a: -5.25, b: -4.25, c: -3.25, d: -2.25, e: -1.25, f: 1.25, g: 2.25, h: 3.25, i: 4.25, j: 5.25, bn: 7.5, bp: 8.5 };
const RAILN = { tp: 'riel + de arriba', tn: 'riel − de arriba', bn: 'riel − de abajo', bp: 'riel + de abajo' };
const ROWS = 'abcdefghij'.split('');
const cx = c => c - 30.5;
const parse = s => { const m = /^(tp|tn|bn|bp|[a-j])(\d+)$/.exec(s); return { r: m[1], c: +m[2] }; };
const hole = s => { const { r, c } = parse(s); return V(cx(c), 0, ROWZ[r]); };
const hname = s => { const { r, c } = parse(s); return RAILN[r] ? `${RAILN[r]} (col ${c})` : s; };
const half = r => 'abcde'.includes(r) ? 'T' : 'B';
const BW = 66, BD = 19.5;

const NET = {};
const NETINFO = {
  VCC: '+4,5 V (rieles rojos)', GND: 'GND, el − (rieles azules)',
  OSC1: 'Cristal ↔ pata 16 del PIC (OSC1) ↔ condensador 22 pF', OSC2: 'Cristal ↔ pata 15 del PIC (OSC2) ↔ condensador 22 pF',
  MCLR: 'Pata 4 del PIC (MCLR) → 10 kΩ → +',
  RA0: 'Switch 1 → pata 17 del PIC (RA0), con 10 kΩ a GND',
  RA1: 'Switch 2 → pata 18 del PIC (RA1), con 10 kΩ a GND',
  RA2: 'Switch 3 → pata 1 del PIC (RA2), con 10 kΩ a GND'
};
for (let k = 1; k <= 6; k++) {
  NETINFO['RB' + (k - 1)] = `Pata ${5 + k} del PIC (RB${k - 1}) → pata ${k} del ULN. Canal P${k}`;
  NETINFO['OUT' + k] = `Salida ${k}C del ULN (pata ${19 - k}) → resistencia 33 Ω de P${k}`;
  NETINFO['P' + k] = `Cable P${k} → patas cortas del grupo P${k} del cubo`;
}
const PICP = { 1: ['RA2', 'RA2'], 2: ['RA3', 'FREE'], 3: ['RA4', 'FREE'], 4: ['RA5/MCLR', 'MCLR'], 5: ['VSS (−)', 'GND'], 6: ['RB0', 'RB0'], 7: ['RB1', 'RB1'], 8: ['RB2', 'RB2'], 9: ['RB3', 'RB3'], 10: ['RB4', 'RB4'], 11: ['RB5', 'RB5'], 12: ['RB6', 'FREE'], 13: ['RB7', 'FREE'], 14: ['VDD (+)', 'VCC'], 15: ['OSC2', 'OSC2'], 16: ['OSC1', 'OSC1'], 17: ['RA0', 'RA0'], 18: ['RA1', 'RA1'] };
const ULNP = {};
for (let n = 1; n <= 8; n++) ULNP[n] = [n + 'B', n <= 6 ? 'RB' + (n - 1) : 'GND'];
ULNP[9] = ['GND', 'GND']; ULNP[10] = ['COM', 'VCC'];
for (let n = 11; n <= 18; n++) { const k = 19 - n; ULNP[n] = [k + 'C', k <= 6 ? 'OUT' + k : 'FREE']; }
const pinPos = (c0, n) => n <= 9 ? { r: 'f', c: c0 + n - 1 } : { r: 'e', c: c0 + (18 - n) };
for (const [c0, P, name] of [[10, PICP, 'PIC16F628A'], [30, ULNP, 'ULN2803']]) for (const n in P) {
  const p = pinPos(c0, +n); const net = P[n][1] === 'FREE' ? `FREE_${name}_${n}` : P[n][1];
  NET[half(p.r) + p.c] = net; NETINFO[`FREE_${name}_${n}`] = `Pata ${n} del ${name} (${P[n][0]}): libre, no se conecta`;
}
NET.T4 = 'RA0'; NET.T5 = 'RA1'; NET.T6 = 'RA2'; NET.B4 = NET.B5 = NET.B6 = 'VCC';
NET.T7 = NET.B7 = 'DIP4'; NET.T8 = NET.B8 = 'DIP5'; NETINFO.DIP4 = 'Switch 4 del DIP: sin cables, el programa no lo usa'; NETINFO.DIP5 = 'Switch 5 del DIP: sin cables, el programa no lo usa';
for (let k = 1; k <= 6; k++) { NET['T' + (47 - k)] = 'OUT' + k; NET['B' + (47 - k)] = 'P' + k; }
const holeNet = (r, c) => (r === 'tp' || r === 'bp') ? 'VCC' : (r === 'tn' || r === 'bn') ? 'GND' : NET[half(r) + c] || null;

// ============================================================ materiales y texturas
const COL = { red: '#e0302d', blk: '#2a2c30', ra0: '#29c5e6', ra1: '#17b394', ra2: '#b7cb2a', P: { 1: '#ff7a26', 2: '#ffc61a', 3: '#2fcf72', 4: '#2f8fff', 5: '#a866ff', 6: '#ff4f9a' } };
const metal = () => new THREE.MeshStandardMaterial({ color: '#d3d6db', metalness: 1, roughness: 0.28 });
const plastic = (c, r = 0.5) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 });
const maxAniso = renderer.capabilities.getMaxAnisotropy();
function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t;
}
const shadowAll = o => o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });

// ============================================================ protoboard
function boardTexture() {
  const S = 44, W = Math.round(BW * S), H = Math.round(BD * S);
  return canvasTex(W, H, (g) => {
    const X = x => (x + BW / 2) * S, Z = z => (z + BD / 2) * S;
    g.fillStyle = '#efe8d9'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#e1d8c4'; g.fillRect(0, Z(-0.6), W, 1.2 * S);
    g.lineCap = 'round';
    const line = (z, c) => { g.strokeStyle = c; g.lineWidth = 0.1 * S; g.beginPath(); g.moveTo(X(cx(1) - 0.6), Z(z)); g.lineTo(X(cx(60) + 0.6), Z(z)); g.stroke(); };
    line(-9.15, COL.red); line(-6.85, '#1e63c6'); line(6.85, '#1e63c6'); line(9.15, COL.red);
    for (const r of Object.keys(ROWZ)) for (let c = 1; c <= 60; c++) {
      const x = X(cx(c)), z = Z(ROWZ[r]), s = 0.44 * S;
      g.fillStyle = '#4a453d'; g.fillRect(x - s / 2, z - s / 2, s, s);
      g.fillStyle = '#211e1a'; g.fillRect(x - s / 2 + 2, z - s / 2 + 2, s - 4, s - 4);
    }
    g.fillStyle = '#857c6b'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `600 ${0.62 * S}px Arial`;
    for (const c of [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]) { g.fillText(c, X(cx(c)), Z(-6.2)); g.fillText(c, X(cx(c)), Z(6.2)); }
    g.font = `600 ${0.66 * S}px Arial`;
    for (const r of ROWS) { g.fillText(r, X(cx(1) - 1.35), Z(ROWZ[r])); g.fillText(r, X(cx(60) + 1.35), Z(ROWZ[r])); }
    g.font = `800 ${0.95 * S}px Arial`;
    for (const [r, l, c] of [['tp', '+', COL.red], ['tn', '−', '#1e63c6'], ['bn', '−', '#1e63c6'], ['bp', '+', COL.red]]) {
      g.fillStyle = c; g.fillText(l, X(cx(1) - 1.45), Z(ROWZ[r])); g.fillText(l, X(cx(60) + 1.45), Z(ROWZ[r]));
    }
  });
}
const board = new THREE.Mesh(new RoundedBoxGeometry(BW, 0.9, BD, 3, 0.25), plastic('#e6dece', 0.7));
board.position.y = -0.45; board.receiveShadow = true; board.castShadow = true;
scene.add(board);
const boardTopMesh = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.3, BD - 0.3), new THREE.MeshStandardMaterial({ map: boardTexture(), roughness: 0.75 }));
boardTopMesh.rotation.x = -Math.PI / 2; boardTopMesh.position.y = 0.002; boardTopMesh.receiveShadow = true;
boardTopMesh.userData.board = true;
scene.add(boardTopMesh);
{
  const uv = boardTopMesh.geometry.attributes.uv; const sx = (BW - 0.3) / BW, sz = (BD - 0.3) / BD;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + (uv.getX(i) - 0.5) * sx, 0.5 + (uv.getY(i) - 0.5) * sz);
}

// ============================================================ piezas
const EL = [];
function addEl(step, obj, o) {
  obj.traverse(m => { m.userData.el = EL.length; });
  shadowAll(obj);
  scene.add(obj);
  const e = Object.assign({ step, obj, nets: [], labels: [], tip: '' }, o);
  e.mats = [];
  obj.traverse(m => {
    if (!m.isMesh || !m.material || m.userData.noGlow) return;
    (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => { if (x.emissive && !e.mats.includes(x)) { e.mats.push(x); x.userData.e0 = x.emissive.clone(); x.userData.ei0 = x.emissiveIntensity; } });
  });
  EL.push(e); return e;
}
function tube(points, r, mat, seg) {
  const curve = (points instanceof THREE.Curve) ? points : new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, seg || Math.max(20, Math.round(curve.getLength() * 5)), r, 10, false), mat);
}
// ---- cable de puente
function wire(a, b, color, opt = {}) {
  const g = new THREE.Group();
  const A = typeof a === 'string' ? hole(a) : a.clone(), B = typeof b === 'string' ? hole(b) : b.clone();
  let curve;
  if (opt.pts) curve = new THREE.CatmullRomCurve3([A.clone().setY(A.y + 0.35), A.clone().setY(A.y + 0.9), ...opt.pts, B.clone().setY(B.y + 0.9), B.clone().setY(B.y + 0.35)], false, 'centripetal', 0.5);
  else {
    const d = A.distanceTo(B), Hh = opt.h ?? Math.max(1.0, 0.6 + 0.2 * d);
    curve = new THREE.CubicBezierCurve3(A.clone().setY(0.35), A.clone().setY(Hh), B.clone().setY(Hh), B.clone().setY(0.35));
  }
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0, transparent: !!opt.ghost, opacity: opt.ghost ? 0.4 : 1 });
  g.add(tube(curve, 0.17, mat));
  const sleeveMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.6), roughness: 0.5, transparent: !!opt.ghost, opacity: opt.ghost ? 0.4 : 1 });
  for (const P of [A, typeof b === 'string' ? B : null]) {
    if (!P) continue;
    const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.45, 14), sleeveMat); sl.position.copy(P).setY(P.y + 0.42); g.add(sl);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.55, 8), metal()); pin.position.copy(P).setY(P.y - 0.02); pin.userData.noGlow = true; g.add(pin);
  }
  g.userData.curve = curve;
  return g;
}
// ---- resistencia
function bandTex(bands) {
  return canvasTex(16, 256, (g, w, h) => {
    g.fillStyle = '#d9bd84'; g.fillRect(0, 0, w, h);
    const pos = [0.22, 0.36, 0.5, 0.76];
    bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, (1 - pos[i]) * h - 12, w, 24); });
  });
}
const BANDS = { '10k': ['#7b4a2a', '#111', '#f57c00', '#c9a227'], '33': ['#f57c00', '#f57c00', '#111', '#c9a227'] };
function resistor(a, b, val, opt = {}) {
  const g = new THREE.Group(); const A = hole(a), B = hole(b);
  const dir = B.clone().sub(A); const d = dir.length(); dir.normalize();
  const L = Math.min(2.3, Math.max(1.15, d - 0.75)), el = opt.elev ?? (d < 2.6 ? 1.05 : 0.8);
  const mid = A.clone().add(B).multiplyScalar(0.5).setY(el);
  const body = new THREE.Group();
  body.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, L * 0.7, 18), new THREE.MeshStandardMaterial({ map: bandTex(BANDS[val]), roughness: 0.5 })));
  const capM = new THREE.MeshStandardMaterial({ color: '#d9bd84', roughness: 0.5 });
  for (const s of [-1, 1]) { const cp = new THREE.Mesh(new THREE.SphereGeometry(0.31, 18, 12), capM); cp.scale.set(1, 0.75, 1); cp.position.y = s * L * 0.36; body.add(cp); }
  body.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
  body.position.copy(mid);
  g.add(body);
  const legM = metal();
  const e1 = mid.clone().addScaledVector(dir, -L * 0.5), e2 = mid.clone().addScaledVector(dir, L * 0.5);
  g.add(tube([A.clone().setY(-0.25), A.clone().setY(0.25), A.clone().setY(el - 0.25).addScaledVector(dir, 0.12), e1], 0.045, legM, 24));
  g.add(tube([B.clone().setY(-0.25), B.clone().setY(0.25), B.clone().setY(el - 0.25).addScaledVector(dir, -0.12), e2], 0.045, legM, 24));
  return g;
}
// ---- condensador cerámico
function ceramic(a, b, color = '#e39a2d') {
  const g = new THREE.Group(); const A = hole(a), B = hole(b);
  const dir = B.clone().sub(A).setY(0).normalize(); const mid = A.clone().add(B).multiplyScalar(0.5);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.2, 28), new THREE.MeshStandardMaterial({ color, roughness: 0.45 }));
  const axis = new THREE.Vector3().crossVectors(dir, V(0, 1, 0)).normalize();
  disc.quaternion.setFromUnitVectors(V(0, 1, 0), axis);
  disc.position.copy(mid).setY(1.35);
  g.add(disc);
  const legM = metal();
  g.add(tube([A.clone().setY(-0.25), A.clone().setY(0.3), mid.clone().addScaledVector(dir, -0.2).setY(0.95)], 0.04, legM, 16));
  g.add(tube([B.clone().setY(-0.25), B.clone().setY(0.3), mid.clone().addScaledVector(dir, 0.2).setY(0.95)], 0.04, legM, 16));
  return g;
}
// ---- electrolítico
function electro(a, b) {
  const g = new THREE.Group(); const A = hole(a), B = hole(b); const mid = A.clone().add(B).multiplyScalar(0.5);
  const tex = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#1f3a7a'; c.fillRect(0, 0, w, h); c.fillStyle = '#c9d6ee'; c.fillRect(w * 0.62, 0, w * 0.16, h); c.fillStyle = '#1f3a7a'; c.font = 'bold 36px Arial'; c.textAlign = 'center'; c.fillText('−', w * 0.7, h * 0.62); c.fillStyle = '#fff'; c.font = 'bold 22px Arial'; c.fillText('100µF', w * 0.3, h * 0.6); });
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.7, 32), [new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 }), new THREE.MeshStandardMaterial({ color: '#b8bec8', metalness: 0.8, roughness: 0.3 }), plastic('#111')]);
  can.position.copy(mid).setY(1.35); can.rotation.y = -Math.PI * 0.7; g.add(can);
  const legM = metal();
  g.add(tube([A.clone().setY(-0.25), A.clone().setY(0.5)], 0.045, legM, 4));
  g.add(tube([B.clone().setY(-0.25), B.clone().setY(0.5)], 0.045, legM, 4));
  return g;
}
// ---- cristal
function crystal(a, b) {
  const g = new THREE.Group(); const A = hole(a), B = hole(b); const mid = A.clone().add(B).multiplyScalar(0.5);
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.0, 0.45, 3, 0.2), new THREE.MeshStandardMaterial({ color: '#cfd3d8', metalness: 1, roughness: 0.22 }));
  body.position.copy(mid).setY(1.05); g.add(body);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(240, 100, (c, w, h) => { c.fillStyle = '#cfd3d8'; c.fillRect(0, 0, w, h); c.fillStyle = '#333'; c.font = 'bold 44px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('4.000', w / 2, h / 2); }) }));
  lbl.position.copy(mid).setY(1.05).add(V(0, 0, 0.231)); lbl.userData.noGlow = true; g.add(lbl);
  const legM = metal();
  for (const P of [A, B]) g.add(tube([P.clone().setY(-0.25), P.clone().setY(0.6)], 0.04, legM, 4));
  return g;
}
// ---- circuito integrado DIP-18
function chip(c0, name, sub) {
  const g = new THREE.Group(); const x0 = cx(c0), xm = x0 + 4;
  const body = new THREE.Mesh(new RoundedBoxGeometry(9.5, 0.75, 2.05, 3, 0.09), new THREE.MeshStandardMaterial({ color: '#1d1f23', roughness: 0.55 }));
  body.position.set(xm, 0.68, 0); g.add(body);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(9.3, 1.9), new THREE.MeshStandardMaterial({ map: canvasTex(1024, 210, (c, w, h) => {
    c.fillStyle = '#1d1f23'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#08090a'; c.beginPath(); c.arc(0, h / 2, 34, -Math.PI / 2, Math.PI / 2); c.fill();
    c.fillStyle = '#6b6e74'; c.beginPath(); c.arc(42, h - 40, 13, 0, 7); c.fill();
    c.fillStyle = '#ececec'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 74px Arial'; c.fillText(name, w / 2 + 20, h / 2 - 12);
    c.fillStyle = '#9a9ca0'; c.font = '30px Arial'; c.fillText(sub, w / 2 + 20, h / 2 + 50);
    c.font = 'bold 24px Arial'; c.fillStyle = '#8c8f94';
    for (let i = 0; i < 9; i++) { const x = (i + 0.5) / 9.3 * w + w * 0.008; c.fillText(String(18 - i), x, 20); c.fillText(String(i + 1), x, h - 14); }
  }), roughness: 0.6 }));
  top.rotation.x = -Math.PI / 2; top.position.set(xm, 1.056, 0); g.add(top);
  const legM = metal();
  const hz = new THREE.BoxGeometry(0.32, 0.07, 0.36), vt = new THREE.BoxGeometry(0.2, 0.85, 0.07);
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) {
    const x = x0 + i; const h1 = new THREE.Mesh(hz, legM); h1.position.set(x, 0.5, s * 1.1); g.add(h1);
    const v1 = new THREE.Mesh(vt, legM); v1.position.set(x, 0.1, s * 1.25); g.add(v1);
  }
  return g;
}
// ---- DIP switch de 3
const levers = [];
function dipSwitch() {
  const g = new THREE.Group(); const xm = cx(6);
  const body = new THREE.Mesh(new RoundedBoxGeometry(5.3, 0.7, 2.15, 3, 0.08), plastic('#c62828', 0.45)); body.position.set(xm, 0.62, 0); g.add(body);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.05), new THREE.MeshStandardMaterial({ map: canvasTex(520, 205, (c, w, h) => { c.fillStyle = '#c62828'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'bold 26px Arial'; c.textAlign = 'left'; c.fillText('ON', 10, 28); c.textAlign = 'center'; c.font = 'bold 24px Arial'; [0, 1, 2, 3, 4].forEach(i => { c.fillStyle = i < 3 ? '#fff' : '#f2a8a8'; c.fillText(String(i + 1), (i + 0.5) / 5.2 * w + 5, h - 10); }); }), roughness: 0.5 }));
  top.rotation.x = -Math.PI / 2; top.position.set(xm, 0.975, 0); top.userData.noGlow = true; g.add(top);
  for (let i = 0; i < 5; i++) {
    const x = cx(4 + i);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 1.3), plastic('#f3e5e3')); slot.position.set(x, 0.99, 0); slot.userData.noGlow = true; g.add(slot);
    const lv = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.34, 0.55, 2, 0.06), plastic('#f7f7f7', 0.35)); lv.position.set(x, 1.15, 0.32); lv.userData.sw = i; lv.userData.noGlow = true; g.add(lv); levers.push(lv);
  }
  const legM = metal(); const vt = new THREE.BoxGeometry(0.2, 0.75, 0.07);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const v1 = new THREE.Mesh(vt, legM); v1.position.set(cx(4 + i), 0.12, s * 1.25); g.add(v1); }
  return g;
}
// ---- fuente
const SUP = { x: -44, z: -3 };
function supply() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(10, 5.2, 7, 4, 0.5), plastic('#2a2e35', 0.6)); body.position.set(SUP.x, 1.7, SUP.z); g.add(body);
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 2.2), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveIntensity: 0.9, emissiveMap: canvasTex(512, 180, (c, w, h) => { c.fillStyle = '#06210d'; c.fillRect(0, 0, w, h); c.fillStyle = '#5dff86'; c.font = 'bold 120px Consolas, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('4.50V', w / 2, h / 2 + 6); }) }));
  lcd.position.set(SUP.x - 0.6, 2.6, SUP.z + 3.51); lcd.userData.noGlow = true; g.add(lcd);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.2), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(512, 76, (c, w, h) => { c.fillStyle = '#cfd3da'; c.font = 'bold 44px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FUENTE 4,5 V', w / 2, h / 2); }) }));
  lbl.position.set(SUP.x, 0.45, SUP.z + 3.51); lbl.userData.noGlow = true; g.add(lbl);
  const post = (z, col) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.9, 20), plastic(col, 0.35)); p.position.set(SUP.x + 3.4, 4.7, z); g.add(p); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 10), metal()); t.position.set(SUP.x + 3.4, 5.3, z); g.add(t); };
  post(SUP.z - 1.6, COL.red); post(SUP.z + 1.2, '#111');
  return g;
}
// ---- cubo de LEDs
const CUBE = { x: 13, z: 21, s: 7, y0: 2.2 };
const ledMats = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
const GROUPS = [
  { p: 1, face: 'top', side: -1, leds: ['D1', 'D2', 'D3', 'D13', 'D14', 'D15'] },
  { p: 2, face: 'top', side: 1, leds: ['D5', 'D6', 'D8', 'D9', 'D10', 'D11'] },
  { p: 3, face: 'bottom', side: -1, leds: ['D37', 'D38', 'D40', 'D41', 'D42', 'D44'] },
  { p: 4, face: 'bottom', side: 1, leds: ['D33', 'D34', 'D36', 'D45', 'D46', 'D47'] },
  { p: 5, face: 'left', leds: ['D17', 'D18', 'D29', 'D30'] },
  { p: 6, face: 'right', leds: ['D4', 'D7', 'D21', 'D22'], green: ['D4', 'D7'] }
];
const groupCenters = {};
function ledModel(color) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.55), emissive: color, emissiveIntensity: 0, roughness: 0.15, transparent: true, opacity: 0.94 });
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.42, 18), m); c.position.y = 0.21; g.add(c);
  const d = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), m); d.position.y = 0.42; g.add(d);
  const r = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 18), m); r.position.y = 0.04; g.add(r);
  g.userData.mat = m; return g;
}
function ledCube() {
  const g = new THREE.Group(); const { x, z, s, y0 } = CUBE; const yc = y0 + s / 2;
  const base = new THREE.Mesh(new RoundedBoxGeometry(s + 2.4, 0.9, s + 2.4, 3, 0.3), plastic('#23272e', 0.6)); base.position.set(x, -0.47, z); g.add(base);
  const postM = plastic('#3a3f48', 0.4);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, y0 + 0.1, 10), postM); p.position.set(x + dx * (s / 2 - 0.3), (y0 - 0.1) / 2 - 0.02, z + dz * (s / 2 - 0.3)); g.add(p); }
  const acr = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshStandardMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0, depthWrite: false }));
  acr.position.set(x, yc, z); acr.userData.noGlow = true; g.add(acr);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s, s, s)), new THREE.LineBasicMaterial({ color: '#9fb7d3', transparent: true, opacity: 0.55 }));
  edges.position.copy(acr.position); g.add(edges);
  for (const G of GROUPS) {
    const pts = [];
    if (G.face === 'top' || G.face === 'bottom') {
      const y = G.face === 'top' ? y0 + s : y0, up = G.face === 'top' ? 1 : -1;
      for (let i = 0; i < 6; i++) { const col = i % 3, row = Math.floor(i / 3); pts.push({ p: V(x + G.side * (0.9 + col * 0.95), y, z - 1.2 + row * 2.4), n: V(0, up, 0) }); }
    } else {
      const xx = G.face === 'left' ? x - s / 2 : x + s / 2, nx = G.face === 'left' ? -1 : 1;
      for (let i = 0; i < 4; i++) { const col = i % 2, row = Math.floor(i / 2); pts.push({ p: V(xx, yc + 1.2 - row * 2.4, z - 1.2 + col * 2.4), n: V(nx, 0, 0) }); }
    }
    const cen = V(0, 0, 0);
    G.leds.forEach((d, i) => {
      const green = (G.green || []).includes(d);
      const L = ledModel(green ? '#38ff7c' : '#ffd23a');
      L.position.copy(pts[i].p); L.quaternion.setFromUnitVectors(V(0, 1, 0), pts[i].n);
      const info = { d, p: G.p }; L.traverse(m => { m.userData.led = info; });
      g.add(L); ledMats[G.p].push(L.userData.mat); cen.add(pts[i].p);
    });
    cen.multiplyScalar(1 / G.leds.length);
    const off = G.face === 'top' ? V(0, 1.1, 0) : G.face === 'bottom' ? V(0, -0.9, 0) : V(G.face === 'left' ? -1.1 : 1.1, 0, 0);
    groupCenters[G.p] = cen.add(off);
  }
  const con = new THREE.Mesh(new RoundedBoxGeometry(5.6, 0.7, 1.1, 2, 0.15), plastic('#15171b', 0.5)); con.position.set(x, 0.15, z - s / 2 - 1.2); g.add(con);
  return g;
}
const cubeEntry = k => V(CUBE.x - 2.4 + (6 - k) * 0.8, 0.5, CUBE.z - CUBE.s / 2 - 1.2);

// ============================================================ montaje (mismas posiciones que la guía 2D)
const shortN = s => { if (typeof s !== 'string') return 'cubo'; const { r } = parse(s); return r === 'tp' || r === 'bp' ? 'riel +' : r === 'tn' || r === 'bn' ? 'riel −' : s; };
const W = (step, a, b, color, opt, tip, nets, labs) => { const g = wire(a, b, color, opt); const mid = g.userData.curve.getPoint(0.5).add(V(0, 0.35, 0));
  const labels = labs === undefined ? [{ p: mid, t: `${shortN(a)} → ${shortN(b)}` }] : labs.map(l => typeof l === 'string' ? { p: mid, t: l } : l);
  return addEl(step, g, { tip, nets, labels }); };
// 1
const sP = V(SUP.x + 3.4, 5.2, SUP.z - 1.6), sN = V(SUP.x + 3.4, 5.2, SUP.z + 1.2);
addEl(1, supply(), { tip: '<b>Fuente de 4,5 V</b><br>+ al riel rojo, − al riel azul.', nets: ['VCC', 'GND'] });
W(1, sP, 'tp2', COL.red, { pts: [V(SUP.x + 6, 6.2, SUP.z - 3.5), V(cx(2) - 3, 2.6, ROWZ.tp)] }, 'Cable rojo: + de la fuente → riel + de arriba', ['VCC'], ['fuente + → tp2']);
W(1, sN, 'tn3', COL.blk, { pts: [V(SUP.x + 6.5, 5.6, SUP.z - 1.5), V(cx(3) - 3, 2.2, ROWZ.tn)] }, 'Cable negro: − de la fuente → riel − de arriba', ['GND'], ['fuente − → tn3']);
W(1, 'tp60', 'bp60', COL.red, { pts: [V(33.2, 1.3, -8.5), V(33.6, 1.3, 0), V(33.2, 1.3, 8.5)] }, 'Puente rojo: riel + de arriba → riel + de abajo', ['VCC'], ['puente + (tp60 → bp60)']);
W(1, 'tn59', 'bn59', COL.blk, { pts: [V(32.0, 0.8, -7.5), V(32.3, 0.8, 0), V(32.0, 0.8, 7.5)] }, 'Puente negro: riel − de arriba → riel − de abajo', ['GND'], ['puente − (tn59 → bn59)']);
for (const [a, b, c, n] of [['tp28', 'tp35', COL.red, 'VCC'], ['tn28', 'tn35', COL.blk, 'GND'], ['bn28', 'bn35', COL.blk, 'GND'], ['bp28', 'bp35', COL.red, 'VCC']])
  W(1, a, b, c, { ghost: true, h: 1.6 }, '<b>Solo si los rieles están cortados a la mitad</b> (la línea roja/azul se interrumpe): este puente une las dos mitades.', [n], []);
// 2
addEl(2, electro('tp52', 'tn53'), { tip: '<b>Condensador 100 µF</b><br>Pata larga (+) al riel rojo; la franja (−) al azul.', nets: ['VCC', 'GND'], labels: [{ at: 'tp52', t: '+ pata larga' }, { at: 'tn53', t: '− franja' }] });
// 3
addEl(3, chip(10, 'PIC16F628A', 'muesca a la izquierda'), { tip: '<b>PIC16F628A</b><br>Muesca a la IZQUIERDA. Pata 1 en f10.', nets: Object.values(PICP).map(p => p[1]), labels: [{ at: 'f10', t: 'pata 1 · f10' }, { at: 'e10', t: 'pata 18 · e10' }, { at: 'f18', t: 'pata 9 · f18' }, { at: 'e18', t: 'pata 10 · e18' }], chip: { c0: 10, P: PICP, name: 'PIC16F628A' } });
// 4
W(4, 'a14', 'tp14', COL.red, { h: 1.5 }, 'Pata 14 (VDD) → riel + de arriba', ['VCC'], ['a14 (pata 14) → riel +']);
W(4, 'j14', 'bn14', COL.blk, { h: 1.0 }, 'Pata 5 (VSS) → riel − de abajo', ['GND'], ['j14 (pata 5) → riel −']);
addEl(4, ceramic('tp16', 'tn17'), { tip: '<b>Condensador 100 nF</b> (código 104) entre + y −, junto al PIC. Sin polaridad.', nets: ['VCC', 'GND'], labels: [{ at: 'tp16', t: '100 nF (104)' }] });
// 5
addEl(5, resistor('j13', 'bp13', '10k', { elev: 1.25 }), { tip: '<b>Resistencia 10 kΩ</b> (café-negro-naranja)<br>Pata 4 (MCLR) → +.', nets: ['MCLR', 'VCC'], labels: [{ at: 'j13', t: 'j13 · pata 4' }, { at: 'bp13', t: 'riel +' }] });
// 6
addEl(6, crystal('c12', 'c13'), { tip: '<b>Cristal de 4 MHz</b> en las patas 16 y 15. Sin polaridad.', nets: ['OSC1', 'OSC2'], labels: [{ at: 'c12', t: 'c12' }, { at: 'c13', t: 'c13' }] });
addEl(6, ceramic('a12', 'tn12'), { tip: '<b>22 pF</b>: pata 16 → GND', nets: ['OSC1', 'GND'], labels: [{ at: 'a12', t: '22 pF · a12' }] });
addEl(6, ceramic('a13', 'tn13'), { tip: '<b>22 pF</b>: pata 15 → GND', nets: ['OSC2', 'GND'], labels: [{ at: 'a13', t: '22 pF · a13' }] });
// 7
addEl(7, chip(30, 'ULN2803', 'muesca a la izquierda'), { tip: '<b>ULN2803</b><br>Muesca a la IZQUIERDA. Pata 1 en f30.', nets: Object.values(ULNP).map(p => p[1]), labels: [{ at: 'f30', t: 'pata 1 · f30' }, { at: 'e30', t: 'pata 18 · e30' }, { at: 'f38', t: 'pata 9 · f38' }, { at: 'e38', t: 'pata 10 · e38' }], chip: { c0: 30, P: ULNP, name: 'ULN2803' } });
// 8
W(8, 'j38', 'bn38', COL.blk, { h: 1.0 }, 'Pata 9 del ULN (GND) → riel −. Imprescindible.', ['GND'], ['j38 (pata 9) → riel −']);
W(8, 'a38', 'tp38', COL.red, { h: 1.5 }, 'Pata 10 del ULN (COM) → riel +', ['VCC'], ['a38 (pata 10) → riel +']);
W(8, 'j36', 'bn36', COL.blk, { h: 1.0 }, 'Pata 7 del ULN (sin usar) → GND', ['GND'], ['j36 → riel −']);
W(8, 'j37', 'bn37', COL.blk, { h: 1.0 }, 'Pata 8 del ULN (sin usar) → GND', ['GND'], ['j37 → riel −']);
// 9
[['g15', 'g30'], ['h16', 'h31'], ['i17', 'i32'], ['j18', 'j33']].forEach(([a, b], i) => W(9, a, b, COL.P[i + 1], { h: 3.6 }, `<b>RB${i}</b>: pata ${6 + i} del PIC → pata ${i + 1} del ULN`, ['RB' + i]));
W(9, 'c18', 'h34', COL.P[5], { h: 6.2 }, '<b>RB4</b>: pata 10 del PIC (fila de arriba) → pata 5 del ULN', ['RB4']);
W(9, 'd17', 'i35', COL.P[6], { h: 7.2 }, '<b>RB5</b>: pata 11 del PIC (fila de arriba) → pata 6 del ULN', ['RB5']);
// 10
addEl(10, dipSwitch(), { tip: '<b>DIP switch de 5</b>, cruzando el canal en las columnas 4 a 8. Solo se usan el 1, 2 y 3; el 4 y el 5 se quedan sin cables. Toquen una palanca para moverla.', nets: ['RA0', 'RA1', 'RA2', 'VCC'], dip: true, labels: [{ at: 'e4', t: 'switch 1 · col 4' }, { at: 'e6', t: 'switch 3 · col 6' }, { at: 'e8', t: '4 y 5: sin cables' }] });
// 11
[4, 5, 6].forEach(c => W(11, 'j' + c, 'bp' + c, COL.red, { h: 1.3 }, `Lado de abajo del switch ${c - 3} → riel +`, ['VCC'], undefined));
// 12
[4, 5, 6].forEach((c, i) => addEl(12, resistor('a' + c, 'tn' + c, '10k'), { tip: `<b>10 kΩ a GND</b> del switch ${i + 1}. Sin ella el PIC no lee bien el switch.`, nets: ['RA' + i, 'GND'], labels: [{ at: 'a' + c, t: 'a' + c }] }));
// 13
W(13, 'b4', 'b11', COL.ra0, { h: 2.6 }, 'Switch 1 → pata 17 (RA0)', ['RA0'], ['b4 → b11 (pata 17)']);
W(13, 'c5', 'c10', COL.ra1, { h: 1.9 }, 'Switch 2 → pata 18 (RA1)', ['RA1'], ['c5 → c10 (pata 18)']);
W(13, 'd6', 'g10', COL.ra2, { h: 3.4 }, 'Switch 3 → pata 1 (RA2), en la fila de ABAJO', ['RA2'], ['d6 → g10 (pata 1)']);
// 14
for (let k = 0; k < 6; k++) W(14, 'a' + (30 + k), 'a' + (46 - k), COL.P[k + 1], { h: 2.6 + (5 - k) * 0.75 }, `Salida ${k + 1}C del ULN (pata ${18 - k}) → columna ${46 - k} (P${k + 1})`, ['OUT' + (k + 1)], [`a${30 + k} → a${46 - k} · P${k + 1}`]);
// 15
for (let k = 1; k <= 6; k++) { const c = 47 - k; addEl(15, resistor('d' + c, 'g' + c, '33', { elev: 0.75 }), { tip: `<b>Resistencia 33 Ω</b> (naranja-naranja-negro) del canal P${k}, cruzando el canal`, nets: ['OUT' + k, 'P' + k], labels: k === 1 || k === 6 ? [{ at: 'd' + c, t: `d${c}→g${c} · P${k}` }] : [] }); }
// 16
addEl(16, ledCube(), { tip: '<b>El cubo</b>: ARRIBA (P1, P2), ABAJO (P3, P4) y LATERALES (P5, P6).', nets: ['VCC', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'], isCube: true });
for (let k = 1; k <= 6; k++) { const c = 47 - k, x = cx(c); W(16, 'j' + c, cubeEntry(k), COL.P[k], { pts: [V(x, 1.5, 7.2), V(x + 0.2, 0.9, 10.6), V(cubeEntry(k).x, 0.2, 13.5)] }, `Cable <b>P${k}</b> → patas cortas del grupo P${k}`, ['P' + k], [`j${c} → P${k}`]); }
W(16, 'bp50', cubeEntry(0), COL.red, { pts: [V(cx(50), 1.3, 9.6), V(cx(50) - 0.5, 0.6, 12.2), V(cubeEntry(0).x, 0.2, 13.8)] }, '<b>+ común</b> → patas largas de TODOS los LEDs', ['VCC'], ['bp50 → + común']);

// ============================================================ pasos
const STEPS = [
  ['Fuente y rieles', 'Cable <b>rojo</b> del + de la fuente al riel rojo de arriba y cable <b>negro</b> del − al riel azul de arriba. En el extremo derecho, unan los rieles de arriba con los de abajo: rojo con rojo, azul con azul.<br><br>Los cables <b>transparentes</b> solo hacen falta si la línea roja o azul de su protoboard se corta a la mitad (rieles partidos).'],
  ['Condensador de 100 µF', 'En los rieles de arriba, columnas 52–53: <b>pata larga al riel rojo</b> y pata corta (la de la franja) al azul.'],
  ['PIC16F628A', 'Cruzando el canal central, con la <b>muesca a la izquierda</b>. Pata 1 en <code>f10</code>, pata 9 en <code>f18</code>, pata 10 en <code>e18</code> y pata 18 en <code>e10</code>.'],
  ['Alimentación del PIC', 'Cable rojo de <code>a14</code> (pata 14) al riel + de arriba. Cable negro de <code>j14</code> (pata 5) al riel − de abajo. Condensador <b>100 nF (104)</b> entre los rieles + y − de arriba, junto al PIC.'],
  ['MCLR (pata 4)', 'Resistencia de <b>10 kΩ</b> (café-negro-naranja) de <code>j13</code> al riel + de abajo. Si la pata 4 queda al aire, el PIC se reinicia solo.'],
  ['Cristal de 4 MHz', 'Cristal en <code>c12</code> y <code>c13</code> (patas 16 y 15). Un condensador de <b>22 pF</b> de <code>a12</code> al riel − y otro de <code>a13</code> al riel −. Sin cristal el PIC no arranca.'],
  ['ULN2803', 'Cruzando el canal, con la <b>muesca a la izquierda</b>. Pata 1 en <code>f30</code>, pata 9 en <code>f38</code>, pata 10 en <code>e38</code> y pata 18 en <code>e30</code>.'],
  ['Alimentación del ULN', '<b>Pata 9 (GND)</b>: <code>j38</code> al riel −; sin esto nunca prende nada. <b>Pata 10 (COM)</b>: <code>a38</code> al riel +. Patas 7 y 8 (<code>j36</code>, <code>j37</code>) al riel −.'],
  ['Del PIC al ULN (6 cables)', '<code>g15→g30</code> (RB0), <code>h16→h31</code> (RB1), <code>i17→i32</code> (RB2), <code>j18→j33</code> (RB3).<br>RB4 y RB5 salen de la fila de <b>arriba</b> del PIC: <code>c18→h34</code> y <code>d17→i35</code>.'],
  ['DIP switch de 5', 'Cruzando el canal en las columnas <b>4 a 8</b>, con el switch 1 a la izquierda y el lado «ON» hacia arriba. El programa solo lee los switches <b>1, 2 y 3</b> (columnas 4, 5 y 6). El <b>4 y el 5</b> (columnas 7 y 8) se quedan <b>sin ningún cable</b>; déjenlos en OFF.'],
  ['DIP: lado de abajo al +', 'Tres cables rojos de <code>j4</code>, <code>j5</code> y <code>j6</code> al riel + de abajo.'],
  ['Resistencias de 10 kΩ a GND', 'De <code>a4</code>, <code>a5</code> y <code>a6</code> al riel − de arriba. <b>Muy importantes</b>: sin ellas el PIC lee mal los switches y se queda en «todo encendido».'],
  ['Del DIP al PIC', 'Switch 1: <code>b4→b11</code> (pata 17, RA0). Switch 2: <code>c5→c10</code> (pata 18, RA1). Switch 3: <code>d6→g10</code> (pata 1, RA2, en la fila de abajo).'],
  ['Salidas del ULN', 'Seis cables de la fila de arriba del ULN a la zona de resistencias: <code>a30→a46</code> (P1), <code>a31→a45</code> (P2), <code>a32→a44</code> (P3), <code>a33→a43</code> (P4), <code>a34→a42</code> (P5) y <code>a35→a41</code> (P6).'],
  ['Resistencias de 33 Ω', 'Seis resistencias (naranja-naranja-negro), cada una cruzando el canal: <code>d41→g41</code> … <code>d46→g46</code>. Si usan la red RN1 de 16 patas, cada par enfrentado (1–16, 2–15…) es una resistencia.'],
  ['Cables al cubo', 'Cable rojo del riel + de abajo (<code>bp50</code>) al <b>+ común</b> del cubo. Desde la fila j: <code>j46</code> = P1, <code>j45</code> = P2, <code>j44</code> = P3, <code>j43</code> = P4, <code>j42</code> = P5 y <code>j41</code> = P6.'],
  ['El cubo', 'En cada grupo, <b>todas las patas largas al + común</b> y <b>todas las patas cortas juntas a su cable P</b>. Miren cómo se encienden los grupos uno por uno. Si un LED no prende y los demás de su grupo sí, ese LED está al revés.'],
  ['El programa', 'En <b>CUBO.c</b> cambien<br><code>#pragma config BOREN = ON</code><br>por<br><code>#pragma config BOREN = OFF</code><br>Compilen y graben otra vez el PIC. Con 4,5 V, la protección de bajo voltaje puede reiniciar el PIC cada vez que se prenden todos los LEDs, y entonces nunca llega a la secuencia.<br><br>Listo: pasen a <b>Probar</b> para ver qué debe hacer cada posición del DIP.']
];
const FOCUS = {
  17: () => new THREE.Box3().setFromCenterAndSize(V(CUBE.x, CUBE.y0 + 3.5, CUBE.z), V(12, 10, 12)),
  18: () => new THREE.Box3().setFromCenterAndSize(V(cx(14), 0.5, -1), V(14, 2, 12))
};

// ============================================================ estado de la vista
let mode = 'M', cur = 1, showAll = false, stepStart = 0;
const anim = [];
const elsOf = step => EL.filter(e => e.step === step);
function boxOf(list) {
  const b = new THREE.Box3();
  list.forEach(e => { const y = e.obj.position.y, v = e.obj.visible; e.obj.position.y = 0; e.obj.visible = true; e.obj.updateMatrixWorld(true); b.expandByObject(e.obj); e.obj.position.y = y; e.obj.visible = v; e.obj.updateMatrixWorld(true); });
  return b;
}
let camAnim = null;
function frame(box, instant) {
  const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  s.x = Math.max(s.x, 12); s.z = Math.max(s.z, 9);
  const aspect = camera.aspect, vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
  const dir = aspect < 1 ? V(0, 1.35, 0.75).normalize() : V(0, 1.2, 0.85).normalize();
  const w = Math.max(s.x, 3), dpt = Math.max(s.z, 3), hgt = Math.max(s.y, 1);
  const needH = (w / 2) / Math.tan(hf / 2), needV = (Math.max(dpt * 0.8, hgt) / 2) / Math.tan(vf / 2);
  const dist = Math.min(170, Math.max(9, Math.max(needH, needV) * 1.12 + hgt));
  const to = c.clone().addScaledVector(dir, dist);
  if (instant) { camera.position.copy(to); controls.target.copy(c); controls.update(); camAnim = null; return; }
  camAnim = { t0: performance.now(), d: 1100, p0: camera.position.clone(), p1: to, q0: controls.target.clone(), q1: c };
}
function overview() { const b = new THREE.Box3(); EL.forEach(e => { if (e.obj.visible) b.expandByObject(e.obj); }); b.expandByObject(board); return b; }
function applyVisibility() {
  const all = showAll || mode === 'P';
  EL.forEach(e => {
    const vis = all || e.step <= cur;
    if (vis && !e.obj.visible && !all && e.step === cur) { e.obj.position.y = 7; anim.push({ e, t0: performance.now() + 90 * anim.length }); }
    e.obj.visible = vis;
    if (all || e.step < cur) { e.obj.position.y = 0; }
  });
  if (all) anim.length = 0;
}
function render() {
  applyVisibility();
  $('sn').textContent = showAll ? 'Montaje completo' : `Paso ${cur} de ${STEPS.length}`;
  $('st').textContent = showAll ? 'Así queda todo' : STEPS[cur - 1][0];
  $('sx').innerHTML = showAll ? 'Giren la vista con el dedo y toquen cualquier pieza o hueco para ver a qué va conectado. En «Probar» pueden mover el DIP y ver el cubo funcionando.' : STEPS[cur - 1][1];
  $('prev').disabled = !showAll && cur === 1;
  $('next').textContent = !showAll && cur === STEPS.length ? 'Ver todo ▶' : (showAll ? 'Empezar ▶' : 'Siguiente ▶');
  $('all').classList.toggle('on', showAll);
  [...$('dots').children].forEach((d, i) => { d.className = showAll ? 'done' : i + 1 === cur ? 'cur' : i + 1 < cur ? 'done' : ''; });
  stepStart = performance.now();
  if (mode === 'P') frame(new THREE.Box3().setFromCenterAndSize(V(-4, 1, 10), V(50, 8, 32)));
  else if (showAll) frame(overview());
  else frame(FOCUS[cur] ? FOCUS[cur]() : (cur === 1 ? overview() : boxOf(elsOf(cur))));
  buildLabels();
  $('sheet').scrollTop = 0;
}
$('dots').innerHTML = STEPS.map((_, i) => `<i data-s="${i + 1}" title="Paso ${i + 1}"></i>`).join('');
$('dots').addEventListener('click', ev => { const s = ev.target.dataset.s; if (s) goto(+s); });
function goto(s) { showAll = false; if (s < cur) EL.forEach(e => { if (e.step > s) e.obj.visible = false; }); cur = s; render(); }
$('prev').onclick = () => { if (showAll) { showAll = false; EL.forEach(e => { e.obj.visible = e.step <= cur; }); render(); } else if (cur > 1) goto(cur - 1); };
$('next').onclick = () => { if (showAll) { showAll = false; EL.forEach(e => { e.obj.visible = e.step < 1; }); cur = 1; render(); } else if (cur < STEPS.length) goto(cur + 1); else { showAll = true; render(); } };
$('all').onclick = () => { showAll = !showAll; if (!showAll) EL.forEach(e => { e.obj.visible = e.step < cur; }); render(); };
$('recenter').onclick = () => render();
$('tabM').onclick = () => { if (mode === 'M') return; mode = 'M'; $('tabM').classList.add('on'); $('tabP').classList.remove('on'); $('pM').hidden = false; $('pP').hidden = true; EL.forEach(e => { e.obj.visible = showAll || e.step <= cur; e.obj.position.y = 0; }); render(); };
$('tabP').onclick = () => { if (mode === 'P') return; mode = 'P'; $('tabP').classList.add('on'); $('tabM').classList.remove('on'); $('pM').hidden = true; $('pP').hidden = false; render(); };

// ============================================================ etiquetas flotantes
const labelsEl = $('labels');
let LABS = [];
function buildLabels() {
  labelsEl.innerHTML = ''; LABS = [];
  if (mode === 'P') { [0, 1, 2].forEach(i => { const d = addLab(V(cx(4 + i), 1.7, 0), `switch ${i + 1}`, '#ffffff'); d.style.pointerEvents = 'auto'; d.style.cursor = 'pointer'; d.onclick = () => { toggleSw(i); swToast(i); }; }); addLab(V(cx(7.5), 1.7, 0), '4 y 5: no se usan', '#9aa1ab'); for (let k = 1; k <= 6; k++) addLab(groupCenters[k], `P${k}`, COL.P[k]); return; }
  if (showAll) return;
  if (cur === 17) { for (let k = 1; k <= 6; k++) addLab(groupCenters[k], `P${k}`, COL.P[k]); return; }
  const seen = new Set();
  elsOf(cur).forEach(e => e.labels.forEach(l => { const key = (l.at || '') + (l.t || ''); if (seen.has(key)) return; seen.add(key); const p = l.p ? l.p.clone() : hole(l.at).setY(0.6); addLab(p, l.t || hname(l.at), '#ffb547'); }));
}
function addLab(p, text, color) { const d = document.createElement('div'); d.className = 'lab'; d.style.setProperty('--c', color); d.textContent = text; labelsEl.appendChild(d); LABS.push({ p, d }); return d; }
const tmpV = new THREE.Vector3();
function placeLabels() {
  const w = view.clientWidth, h = view.clientHeight; const placed = [];
  for (const L of LABS) {
    tmpV.copy(L.p).project(camera);
    const vis = tmpV.z < 1 && tmpV.x > -1.05 && tmpV.x < 1.05 && tmpV.y > -1.05 && tmpV.y < 1.05;
    L.d.style.display = vis ? 'block' : 'none';
    if (!vis) continue;
    const x = (tmpV.x * 0.5 + 0.5) * w, y0 = (-tmpV.y * 0.5 + 0.5) * h;
    const lw = L.w || (L.w = L.d.offsetWidth || L.d.textContent.length * 7 + 18), lh = 24;
    let y = y0, tries = 0;
    const hit = yy => placed.some(r => Math.abs(r.x - x) < (r.w + lw) / 2 + 3 && Math.abs(r.y - yy) < lh);
    while (hit(y) && tries++ < 12) y -= lh * 0.55;
    placed.push({ x, y, w: lw });
    L.d.style.setProperty('--l', (8 + (y0 - y)) + 'px');
    L.d.style.transform = `translate(${x}px, ${y}px) translate(-50%,-100%)`;
  }
}

// ============================================================ tocar piezas / huecos
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (moved > 8) return;
  const r = renderer.domElement.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const objs = EL.filter(x => x.obj.visible).map(x => x.obj); objs.push(boardTopMesh);
  const hit = ray.intersectObjects(objs, true).find(h => h.object.visible !== false && !(h.object.material && h.object.material.opacity < 0.2));
  if (!hit) { toast(''); return; }
  const o = hit.object;
  if (o.userData.sw !== undefined) { toggleSw(o.userData.sw); swToast(o.userData.sw); return; }
  if (o.userData.led) { const L = o.userData.led; toast(`<b>${L.d}</b> · grupo P${L.p}<br>Pata larga al + común; pata corta al cable P${L.p}.`); return; }
  if (o.userData.board) {
    const p = hit.point; const c = Math.round(p.x + 30.5); let best = null, bd = 9;
    for (const r in ROWZ) { const dd = Math.abs(ROWZ[r] - p.z); if (dd < bd) { bd = dd; best = r; } }
    if (c < 1 || c > 60 || bd > 0.6) { toast(''); return; }
    const n = holeNet(best, c); const name = RAILN[best] ? `${RAILN[best]}, columna ${c}` : `Hueco ${best}${c}`;
    toast(`<b>${name}</b><br>${n ? (NETINFO[n] || n) : 'Libre: aquí no va nada.'}`); return;
  }
  const el = EL[o.userData.el]; if (!el) return;
  if (el.dip) { const i = Math.max(0, Math.min(4, Math.round(hit.point.x - cx(4)))); toggleSw(i); swToast(i); return; }
  if (el.chip) {
    let best = 1, bd = 1e9; const hp = hit.point.clone().setY(0);
    for (let n = 1; n <= 18; n++) { const pp = pinPos(el.chip.c0, n); const dd = V(cx(pp.c), 0, ROWZ[pp.r]).distanceToSquared(hp); if (dd < bd) { bd = dd; best = n; } }
    const info = el.chip.P[best]; const pp = pinPos(el.chip.c0, best);
    toast(`<b>${el.chip.name} · pata ${best} (${info[0]})</b> en ${pp.r}${pp.c}<br>${NETINFO[info[1] === 'FREE' ? `FREE_${el.chip.name}_${best}` : info[1]] || ''}`); return;
  }
  toast(`<span style="color:#9aa1ab">Paso ${el.step}</span> · ${el.tip}`);
});
let toastT = 0;
function toast(html) { const t = $('toast'); if (!html) { t.style.display = 'none'; return; } t.innerHTML = html; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => { t.style.display = 'none'; }, 5200); $('hint').style.opacity = 0; }

// ============================================================ simulación de CUBO.c
const sim = { sw: [false, false, false, false, false], portb: 0, reset: 0, resets: 0, boren: true, vn: 4.5, drop: 0.3, bor: 4.0, v: 4.5, inten: [0, 0, 0, 0, 0, 0] };
let modo = 0;
const leer = () => (sim.sw[0] ? 1 : 0) | (sim.sw[1] ? 2 : 0) | (sim.sw[2] ? 4 : 0);
function* esperar(ms) { while (ms >= 10) { yield; if (leer() !== modo) return 1; ms -= 10; } return 0; }
function* mostrar(p, ms) { sim.portb = p & 0x3F; return yield* esperar(ms); }
function* parpadear(m) { if (yield* mostrar(0x3F, 500)) return; yield* mostrar(0x3F & ~m, 500); }
function* recorrido() { for (let i = 0; i < 6; i++) { if (yield* mostrar(1 << i, 500)) return; } }
function* fw() {
  sim.portb = 0;
  while (true) {
    modo = leer();
    switch (modo) {
      case 0: yield* mostrar(0x3F, 100); break; case 1: yield* parpadear(0x0C); break; case 2: yield* parpadear(0x30); break; case 3: yield* parpadear(0x3C); break;
      case 4: yield* parpadear(0x03); break; case 5: yield* parpadear(0x0F); break; case 6: yield* parpadear(0x33); break; default: yield* recorrido();
    }
  }
}
let gen; const startFw = () => { gen = fw(); gen.next(); }; startFw();
const pop = b => { let n = 0; for (let i = 0; i < 6; i++) if (b >> i & 1) n++; return n; };
function tick() {
  if (sim.reset > 0) { sim.reset -= 10; sim.portb = 0; if (sim.reset <= 0) startFw(); } else gen.next();
  sim.v = sim.vn - sim.drop * pop(sim.portb) / 6;
  if (sim.reset <= 0 && sim.boren && sim.v < sim.bor) { sim.reset = 80; sim.resets++; }
  const a = 1 - Math.exp(-10 / 45);
  for (let i = 0; i < 6; i++) { const t = (sim.portb >> i & 1) ? 1 : 0; sim.inten[i] += (t - sim.inten[i]) * a; }
}
const MODES = ['todo encendido fijo', 'parpadea ABAJO (P3, P4)', 'parpadean los LATERALES (P5, P6)', 'parpadean ABAJO y LATERALES', 'parpadea ARRIBA (P1, P2)', 'parpadean ARRIBA y ABAJO', 'parpadean ARRIBA y LATERALES', 'recorrido: un grupo cada vez'];
function toggleSw(i) { sim.sw[i] = !sim.sw[i]; updSw(); }
function swToast(i) { toast(i < 3 ? `<b>Switch ${i + 1}</b>: ${sim.sw[i] ? 'ON' : 'OFF'} → ${MODES[leer()]}` : `<b>Switch ${i + 1}</b>: no tiene cables y el programa no lo lee. Déjenlo en OFF.`); }
function updSw() {
  for (let i = 0; i < 3; i++) { const b = $('sw' + i); b.textContent = `${i + 1} · ${sim.sw[i] ? 'ON' : 'OFF'}`; b.classList.toggle('on', sim.sw[i]); }
  $('modo').innerHTML = `Switches ${sim.sw.slice(0, 3).map(s => s ? 'ON' : 'off').join(' · ')} → <b>${MODES[leer()]}</b>`;
}
for (let i = 0; i < 3; i++) $('sw' + i).onclick = () => toggleSw(i);
function updCtl() { sim.vn = +$('vn').value; sim.drop = +$('drop').value; sim.boren = $('boren').checked; sim.bor = +$('bor').value; $('dropv').textContent = `${sim.drop.toFixed(2).replace('.', ',')} V → quedan ${(sim.vn - sim.drop).toFixed(2).replace('.', ',')} V`; }
['vn', 'drop', 'boren', 'bor'].forEach(id => $(id).addEventListener('input', updCtl));
updCtl(); updSw();

// ============================================================ tamaño y bucle
function resize() {
  const w = Math.max(1, view.clientWidth), h = Math.max(1, view.clientHeight);
  renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w * DPR * 0.5, h * DPR * 0.5);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
let resizeT = 0;
new ResizeObserver(() => { resize(); clearTimeout(resizeT); resizeT = setTimeout(() => render(), 250); }).observe(view);
resize();

const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
let last = performance.now(), acc = 0, fpsT = 0, fpsN = 0, lastReset = -1e9, lastResets = 0, slow = 0;
function loop(now) {
  const dt = Math.min(now - last, 250); last = now;
  acc += dt; while (acc >= 10) { tick(); acc -= 10; }
  if (sim.resets !== lastResets) { lastResets = sim.resets; lastReset = now; }
  if (camAnim) { const t = Math.min(1, (now - camAnim.t0) / camAnim.d), k = ease(t); camera.position.lerpVectors(camAnim.p0, camAnim.p1, k); controls.target.lerpVectors(camAnim.q0, camAnim.q1, k); if (t >= 1) camAnim = null; }
  controls.update();
  for (let i = anim.length - 1; i >= 0; i--) { const a = anim[i]; const t = Math.min(1, Math.max(0, (now - a.t0) / 650)); a.e.obj.position.y = 7 * (1 - easeOutBack(t)); if (t >= 1) { a.e.obj.position.y = 0; anim.splice(i, 1); } }
  const pulse = 0.5 + 0.5 * Math.sin((now - stepStart) / 260);
  const glowOn = mode === 'M' && !showAll && (now - stepStart) < 7000;
  EL.forEach(e => {
    const on = glowOn && e.step === cur && !e.isCube;
    e.mats.forEach(m => { if (on) { m.emissive.setRGB(1, 0.78, 0.45); m.emissiveIntensity = 0.04 + 0.14 * pulse; } else { m.emissive.copy(m.userData.e0); m.emissiveIntensity = m.userData.ei0; } });
  });
  levers.forEach((lv, i) => { const z = sim.sw[i] ? -0.32 : 0.32; lv.position.z += (z - lv.position.z) * 0.25; });
  const demo17 = mode === 'M' && !showAll && cur === 17;
  for (let k = 1; k <= 6; k++) {
    let I = sim.inten[k - 1];
    if (mode === 'M' && !showAll) I = demo17 ? (Math.floor((now - stepStart) / 700) % 7 === k ? 1 : 0.06) : 0.05;
    ledMats[k].forEach(m => { m.emissiveIntensity = I * 5; });
  }
  if (mode === 'P') {
    let bits = ''; for (let i = 5; i >= 0; i--) bits += `<span class="${sim.portb >> i & 1 ? 'h' : ''}">RB${i}</span>`;
    const resetting = now - lastReset < 400, vAll = sim.vn - sim.drop;
    $('read').innerHTML = `<div class="bits">${bits}</div>Voltaje en el PIC: <b>${sim.v.toFixed(2).replace('.', ',')} V</b> · reinicios: <b>${sim.resets}</b><br>` +
      (resetting ? `<span class="warn">⚠ El PIC se reinicia: al prender todo baja de ${String(sim.bor).replace('.', ',')} V y la protección BOR lo resetea. Nunca llega a la secuencia.</span>` :
        (sim.boren && vAll < 4.35 ? `<span class="warn">Zona de riesgo: con todo encendido quedan ${vAll.toFixed(2).replace('.', ',')} V.</span>` : `<span class="ok">Funcionando normal.</span>`));
  }
  if (useBloom) composer.render(); else renderer.render(scene, camera);
  placeLabels();
  fpsN++; fpsT += dt;
  if (fpsT > 2500) { const fps = fpsN * 1000 / fpsT; if (fps < 26 && ++slow >= 2) { if (useBloom) useBloom = false; else renderer.shadowMap.enabled = false; slow = 0; } fpsT = 0; fpsN = 0; }
  requestAnimationFrame(loop);
}
EL.forEach(e => { e.obj.visible = e.step <= 1; });
render();
frame(overview(), true);
requestAnimationFrame(loop);
setTimeout(() => { $('loading').style.opacity = 0; setTimeout(() => $('loading').remove(), 600); }, 400);
setTimeout(() => { $('hint').style.opacity = 0; }, 9000);
window.__app = { EL, goto, frame, overview, get cur() { return cur; }, toggleSw, sim, screen: (x, y, z) => { const r = renderer.domElement.getBoundingClientRect(); const v = V(x, y, z).project(camera); return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height }; }, hole: s => { const h = hole(s); return [h.x, h.y, h.z]; } };
