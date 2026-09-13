/* ---------- Sprout in 3D: a small living mascot (three.js) ---------- */
const THREE = await import((window.__resources && window.__resources.three) || new URL('vendor/three.module.js', document.baseURI).href);

const host = document.getElementById('sprout');
const canvas = document.getElementById('sproutCanvas');
const reduceM = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 0.8, 0.1, 60);
camera.position.set(0, 1.18, 5.1);
camera.lookAt(0, 1.02, 0);

scene.add(new THREE.HemisphereLight(0xfff0d6, 0x3a5a48, 1.05));
const key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(2.6, 4.2, 3.4); scene.add(key);
const fill = new THREE.DirectionalLight(0xcfe6ff, 0.3); fill.position.set(-3.2, 1.2, 2.4); scene.add(fill);
const rim  = new THREE.DirectionalLight(0xffd9a0, 0.75); rim.position.set(-1.4, 2.4, -3.2); scene.add(rim);

const M = (c, r=0.62, extra={}) => new THREE.MeshStandardMaterial(Object.assign({color:c, roughness:r, metalness:0}, extra));
const cream = M(0xf3e3c6, 0.6);
const skin  = M(0xfde6cd, 0.55);
const dark  = M(0x2a2a26, 0.38);
const white = M(0xffffff, 0.3);
const blush = M(0xf0a08c, 0.7, {transparent:true, opacity:0.55});
const stemM = M(0x6fa235, 0.6);
const leafA = M(0x8cc247, 0.55, {side:THREE.DoubleSide});
const leafB = M(0x6fae38, 0.55, {side:THREE.DoubleSide});

const SPH = new THREE.SphereGeometry(1, 40, 28);
const ball = (mat, sx, sy, sz, x, y, z) => {
  const m = new THREE.Mesh(SPH, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); return m;
};

const root = new THREE.Group(); scene.add(root);
const bob = new THREE.Group(); root.add(bob);

const body = ball(cream, 0.54, 0.6, 0.52, 0, 0.62, 0); bob.add(body);
bob.add(ball(cream, 0.17, 0.085, 0.23, -0.21, 0.07, 0.12));
bob.add(ball(cream, 0.17, 0.085, 0.23,  0.21, 0.07, 0.12));

/* arms: shoulder pivot, one segment + hand, so the wave reads clearly */
const ARM = new THREE.CapsuleGeometry(0.078, 0.26, 6, 14);
function makeArm(sign){
  const g = new THREE.Group(); g.position.set(sign*0.47, 0.92, 0.04);
  const upper = new THREE.Mesh(ARM, cream); upper.position.y = -0.2; g.add(upper);
  const wrist = new THREE.Group(); wrist.position.y = -0.38; g.add(wrist);
  wrist.add(ball(cream, 0.125, 0.135, 0.1, 0, -0.06, 0));
  g.userData.wrist = wrist;
  g.rotation.z = sign * 0.26;
  bob.add(g);
  return g;
}
const armL = makeArm(-1), armR = makeArm(1);

/* head */
const head = new THREE.Group(); head.position.set(0, 1.42, 0); bob.add(head);
head.add(ball(skin, 0.56, 0.54, 0.52, 0, 0, 0));
head.add(ball(blush, 0.09, 0.055, 0.03, -0.33, -0.1, 0.38));
head.add(ball(blush, 0.09, 0.055, 0.03,  0.33, -0.1, 0.38));

const eyeL = ball(dark, 0.065, 0.082, 0.045, -0.185, 0.03, 0.47);
const eyeR = ball(dark, 0.065, 0.082, 0.045,  0.185, 0.03, 0.47);
head.add(eyeL, eyeR);
head.add(ball(white, 0.02, 0.02, 0.012, -0.158, 0.065, 0.51));
head.add(ball(white, 0.02, 0.02, 0.012,  0.212, 0.065, 0.51));

const BROW = new THREE.BoxGeometry(0.14, 0.026, 0.02);
const browL = new THREE.Mesh(BROW, M(0xb89b6a, 0.7)); browL.position.set(-0.185, 0.19, 0.47);
const browR = browL.clone(); browR.position.x = 0.185;
head.add(browL, browR); browL.visible = browR.visible = false;

const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.021, 8, 22, Math.PI), dark);
smile.position.set(0, -0.07, 0.47); smile.rotation.z = Math.PI;
const line = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.028, 0.02), dark);
line.position.set(0, -0.13, 0.47); line.visible = false;
const oh = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.02, 8, 18), dark);
oh.position.set(0, -0.13, 0.47); oh.visible = false;
head.add(smile, line, oh);

/* the sprout on its head */
const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.26, 10), stemM);
stem.position.y = 0.64; head.add(stem);
const leafShape = new THREE.Shape();
leafShape.moveTo(0, 0);
leafShape.bezierCurveTo(0.13, 0.05, 0.21, 0.22, 0.05, 0.36);
leafShape.bezierCurveTo(-0.02, 0.2, -0.07, 0.09, 0, 0);
const LEAF = new THREE.ShapeGeometry(leafShape, 16);
const leaves = new THREE.Group(); leaves.position.y = 0.75; head.add(leaves);
const leafR = new THREE.Mesh(LEAF, leafA); leafR.rotation.set(-0.25, 0.35, -0.55); leaves.add(leafR);
const leafL = new THREE.Mesh(LEAF, leafB); leafL.scale.x = -1; leafL.rotation.set(-0.25, -0.35, 0.7); leaves.add(leafL);

/* ---------- state ---------- */
const MOOD3 = {
  happy:  {mouth:'smile', brows:false, eye:1,    smileW:1},
  wave:   {mouth:'smile', brows:false, eye:1,    smileW:1.05},
  calm:   {mouth:'smile', brows:false, eye:0.9,  smileW:0.8},
  proud:  {mouth:'smile', brows:true,  eye:0.95, smileW:1.2, browTilt:0.16, browY:0.2},
  curious:{mouth:'oh',    brows:true,  eye:1.2,  smileW:1, browTilt:0.05, browY:0.22},
  think:  {mouth:'line',  brows:true,  eye:0.95, smileW:1, browTilt:0.3,  browY:0.16}
};
let mood = MOOD3.happy;
let eyeTarget = 1, eyeNow = 1, blinkAt = 2 + Math.random()*3, blinkP = 0;
let waveAmt = 0, waveHold = 0, nextIdleWave = 5 + Math.random()*4;
let hopV = 0, hopY = 0, yaw = 0, yawTarget = 0;
/* expressions drift on their own schedule; mostly cheerful, with the odd
   curious or thoughtful beat, and a wave every so often */
const MOOD_CYCLE = ['happy','calm','proud','curious','happy','think','calm','wave'];
let moodStep = 0, nextMood = 5 + Math.random()*4;

function applyMood(name){
  mood = MOOD3[name] || MOOD3.happy;
  smile.visible = mood.mouth === 'smile';
  line.visible  = mood.mouth === 'line';
  oh.visible    = mood.mouth === 'oh';
  smile.scale.set(mood.smileW, mood.smileW * 0.9, 1);
  browL.visible = browR.visible = !!mood.brows;
  if(mood.brows){
    browL.position.y = browR.position.y = mood.browY;
    browL.rotation.z = -(mood.browTilt || 0);
    browR.rotation.z =  (mood.browTilt || 0);
  }
  eyeTarget = mood.eye;
}
applyMood('happy');

const clock = new THREE.Clock();
const W = 132, H = 165, running = true;   /* fixed once: resizing a GL buffer is expensive */
renderer.setSize(W, H, false);
camera.aspect = W / H;
camera.updateProjectionMatrix();

function face(side){ yawTarget = side === 'l' ? -0.2 : 0.2; }

let T = 0, lastBeat = 0;
/* some embedded/offscreen viewers throttle rAF to a standstill, so a timer
   watchdog keeps Sprout alive when frames stop arriving */
function beat(){
  lastBeat = performance.now();
  if(host.style.opacity === '0'){ clock.getDelta(); return; }
  tick(Math.min(clock.getDelta() || 0.016, 0.05));
}
function frame(){
  if(!running) return;
  requestAnimationFrame(frame);
  beat();
}
setInterval(() => { if(performance.now() - lastBeat > 90) beat(); }, 1000/30);
function tick(dt){
  T += dt; const t = T;

  /* float + lean */
  hopV -= 26 * dt; hopY += hopV * dt;
  if(hopY < 0){ hopY = 0; hopV = 0; }
  bob.position.y = Math.sin(t * 1.15) * 0.045 + hopY;
  root.rotation.z = Math.sin(t * 0.8) * 0.035;
  root.position.x = Math.sin(t * 0.53) * 0.05;

  /* breathing */
  const br = Math.sin(t * 1.9) * 0.02;
  body.scale.set(0.54 * (1 - br * 0.5), 0.6 * (1 + br), 0.52 * (1 - br * 0.5));

  /* head turns and nods, eyes follow the lean */
  yaw += (yawTarget - yaw) * Math.min(1, dt * 2.5);
  head.rotation.y = yaw + Math.sin(t * 0.63) * 0.14;
  head.rotation.x = Math.sin(t * 0.9) * 0.06 - hopY * 0.25;
  head.rotation.z = Math.sin(t * 0.47) * 0.05;

  /* leaves drift, each on its own clock */
  leaves.rotation.z = Math.sin(t * 1.25) * 0.13;
  leaves.rotation.x = Math.sin(t * 0.9) * 0.08;
  leafR.rotation.z = -0.55 + Math.sin(t * 1.7) * 0.13;
  leafL.rotation.z =  0.7  + Math.sin(t * 2.1 + 1.2) * 0.13;

  /* blink */
  blinkAt -= dt;
  if(blinkAt <= 0){ blinkP = 0.16; blinkAt = 2.6 + Math.random() * 4; }
  if(blinkP > 0){ blinkP -= dt; }
  eyeNow += (eyeTarget - eyeNow) * Math.min(1, dt * 8);
  const lid = blinkP > 0 ? 0.12 : 1;
  eyeL.scale.y = eyeR.scale.y = 0.082 * eyeNow * lid;

  /* expressions on their own timer, independent of the book */
  nextMood -= dt;
  if(nextMood <= 0){
    const name = MOOD_CYCLE[moodStep++ % MOOD_CYCLE.length];
    applyMood(name);
    if(name === 'wave') waveHold = 1.9;
    nextMood = 6 + Math.random()*5;
  }

  /* the hand: idle sway always, a real wave now and then */
  nextIdleWave -= dt;
  if(nextIdleWave <= 0 && waveHold <= 0){ waveHold = 1.5; nextIdleWave = 7 + Math.random() * 5; }
  if(waveHold > 0) waveHold -= dt;
  waveAmt += ((waveHold > 0 ? 1 : 0) - waveAmt) * Math.min(1, dt * 6);

  const swing = Math.sin(t * 1.4) * 0.09;
  const raise = 1.75 * waveAmt;
  armR.rotation.z = 0.26 + swing + raise;
  armR.rotation.x = -0.15 * waveAmt;
  armR.userData.wrist.rotation.z = Math.sin(t * 11) * 0.75 * waveAmt;
  armR.userData.wrist.rotation.x = Math.sin(t * 5.5) * 0.12;
  armL.rotation.z = -0.26 - Math.sin(t * 1.4 + 0.8) * 0.08;
  armL.userData.wrist.rotation.z = Math.sin(t * 4.6 + 1.5) * 0.1;

  renderer.render(scene, camera);
}

window.Sprout3D = {
  mood: applyMood,
  wave(){ waveHold = 1.9; nextIdleWave = 8 + Math.random() * 4; },
  hop(){ hopV = 3.0; },
  face,
  step(time){ if(time!=null) T = time; tick(0.016); }
};

face('r');
host.classList.add('is3d');
canvas.style.display = 'block';

renderer.render(scene, camera);
frame();

if(typeof window.moveSprout === 'function') window.moveSprout();
else if(typeof moveSprout === 'function') moveSprout();
