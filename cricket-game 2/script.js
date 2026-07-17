/* ==========================================================
   Tap-to-Hit Cricket — canvas mini game
   - Bowler runs up, delivers ball toward batsman
   - Player swings (space / click / button) at the right
     moment for runs; bad timing = miss or wicket
   - Tracks runs, wickets, overs (6 balls/over)
   ========================================================== */

const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// ---- DOM refs ----
const runsEl = document.getElementById('runs');
const wicketsEl = document.getElementById('wickets');
const oversEl = document.getElementById('overs');
const lastballEl = document.getElementById('lastball');
const bannerEl = document.getElementById('banner');
const startBtn = document.getElementById('startBtn');
const hitBtn = document.getElementById('hitBtn');

// ---- Game state ----
const MAX_WICKETS = 3;
const MAX_OVERS = 5;

let runs = 0;
let wickets = 0;
let balls = 0; // legal balls bowled this innings
let state = 'idle'; // idle | run-up | delivering | result | gameover

// Pitch geometry
const bowlerX = 120, bowlerY = 250;
const batsmanX = 660, batsmanY = 250;
const stumpsX = 705, stumpsY = 250;

let ball = null;       // {x,y,progress,speed,resolved}
let runnerOffset = 0;  // bowler run-up animation
let bannerTimeout = null;
let particles = [];    // simple text/sparkle popups

function setBanner(text, color = '#b3141a') {
  bannerEl.textContent = text;
  bannerEl.style.color = color;
  clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => { bannerEl.textContent = ''; }, 1600);
}

function updateScoreboard() {
  runsEl.textContent = runs;
  wicketsEl.textContent = wickets;
  const completedOvers = Math.floor(balls / 6);
  const ballsThisOver = balls % 6;
  oversEl.textContent = `${completedOvers}.${ballsThisOver}`;
}

// ---------- Drawing ----------

// Pre-built static backdrop (sky, stands, crowd dots) — drawn once to an
// offscreen canvas so we don't regenerate the crowd noise every frame.
const bgCanvas = document.createElement('canvas');
bgCanvas.width = W;
bgCanvas.height = H;
const bgCtx = bgCanvas.getContext('2d');
buildBackground();

function buildBackground() {
  // Sky
  const sky = bgCtx.createLinearGradient(0, 0, 0, 150);
  sky.addColorStop(0, '#bfe3f7');
  sky.addColorStop(1, '#e7f5e2');
  bgCtx.fillStyle = sky;
  bgCtx.fillRect(0, 0, W, 150);

  // Soft sun glow
  const sun = bgCtx.createRadialGradient(680, 40, 5, 680, 40, 70);
  sun.addColorStop(0, 'rgba(255,250,220,0.9)');
  sun.addColorStop(1, 'rgba(255,250,220,0)');
  bgCtx.fillStyle = sun;
  bgCtx.fillRect(600, -30, 160, 160);

  // Stadium stand band
  const stand = bgCtx.createLinearGradient(0, 60, 0, 130);
  stand.addColorStop(0, '#5b4a63');
  stand.addColorStop(1, '#3d3350');
  bgCtx.fillStyle = stand;
  bgCtx.fillRect(0, 60, W, 70);

  // Crowd speckles
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * W;
    const y = 64 + Math.random() * 60;
    const shade = 150 + Math.random() * 100;
    const hueShift = Math.random();
    bgCtx.fillStyle = hueShift < 0.33
      ? `rgb(${shade},${shade * 0.7},${shade * 0.5})`
      : hueShift < 0.66
        ? `rgb(${shade * 0.6},${shade * 0.7},${shade})`
        : `rgb(${shade},${shade * 0.85},${shade * 0.8})`;
    bgCtx.fillRect(x, y, 2, 3);
  }

  // Advertising board strip
  bgCtx.fillStyle = '#1c7a3e';
  bgCtx.fillRect(0, 128, W, 14);
  bgCtx.fillStyle = 'rgba(255,255,255,0.85)';
  bgCtx.font = 'bold 11px Segoe UI, Arial';
  const adText = '  CRICKET LEAGUE  •  SIX HIT ZONE  •  PLAY IT FORWARD  •  ';
  bgCtx.fillText(adText.repeat(4), 0, 138);

  // Outfield grass with mowing stripes
  const outfield = bgCtx.createLinearGradient(0, 142, 0, H);
  outfield.addColorStop(0, '#7fc668');
  outfield.addColorStop(1, '#5aa04c');
  bgCtx.fillStyle = outfield;
  bgCtx.fillRect(0, 142, W, H - 142);

  const stripeWidth = 40;
  for (let i = 0, sx = -100; sx < W + 200; sx += stripeWidth, i++) {
    bgCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
    bgCtx.save();
    bgCtx.beginPath();
    bgCtx.moveTo(sx, 142);
    bgCtx.lineTo(sx + 60, H);
    bgCtx.lineTo(sx + 60 + stripeWidth, H);
    bgCtx.lineTo(sx + stripeWidth, 142);
    bgCtx.closePath();
    bgCtx.fill();
    bgCtx.restore();
  }

  // Boundary rope (ellipse arc suggestion near edges)
  bgCtx.strokeStyle = 'rgba(255,255,255,0.5)';
  bgCtx.lineWidth = 3;
  bgCtx.beginPath();
  bgCtx.ellipse(W / 2, H + 60, W / 2 - 10, 140, 0, Math.PI, 2 * Math.PI);
  bgCtx.stroke();
}

function drawField() {
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(bgCanvas, 0, 0);

  // Pitch (with subtle worn patches + wood-toned gradient)
  const pitchGrad = ctx.createLinearGradient(0, bowlerY - 22, 0, bowlerY + 22);
  pitchGrad.addColorStop(0, '#e6d5a3');
  pitchGrad.addColorStop(0.5, '#d9c48a');
  pitchGrad.addColorStop(1, '#c9b273');
  ctx.fillStyle = pitchGrad;
  ctx.fillRect(bowlerX - 40, bowlerY - 24, (stumpsX - bowlerX) + 80, 48);

  // Worn footmark patches
  ctx.fillStyle = 'rgba(120,95,55,0.25)';
  ctx.beginPath();
  ctx.ellipse(stumpsX - 55, bowlerY + 10, 14, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(bowlerX + 40, bowlerY - 8, 12, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Crease lines
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bowlerX + 10, bowlerY - 22);
  ctx.lineTo(bowlerX + 10, bowlerY + 22);
  ctx.moveTo(stumpsX - 40, bowlerY - 22);
  ctx.lineTo(stumpsX - 40, bowlerY + 22);
  ctx.stroke();

  drawShadow(bowlerX - 15, bowlerY + 20, 16, 5);
  drawStumps(bowlerX - 15, bowlerY, 0.6);
  drawStumps(stumpsX, stumpsY, 1);
  drawBowler();
  drawBatsman();

  if (ball) drawBall();

  drawParticles();
}

function drawShadow(x, y, rx, ry) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,30,10,0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStumps(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const woodGrad = ctx.createLinearGradient(-9, -36, 9, 0);
  woodGrad.addColorStop(0, '#8a6537');
  woodGrad.addColorStop(0.5, '#e8c98a');
  woodGrad.addColorStop(1, '#8a6537');

  for (let i = -8; i <= 8; i += 8) {
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.moveTo(i - 2.2, 0);
    ctx.quadraticCurveTo(i - 2.6, -18, i - 1.8, -34);
    ctx.lineTo(i + 1.8, -34);
    ctx.quadraticCurveTo(i + 2.6, -18, i + 2.2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,60,25,0.6)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  // bails
  ctx.fillStyle = '#caa15c';
  ctx.fillRect(-9.5, -37, 8.5, 3.2);
  ctx.fillRect(0.8, -37, 8.5, 3.2);
  ctx.strokeStyle = 'rgba(90,60,25,0.6)';
  ctx.strokeRect(-9.5, -37, 8.5, 3.2);
  ctx.strokeRect(0.8, -37, 8.5, 3.2);

  ctx.restore();
}

// ---- Shared limb/body helpers for a more realistic player figure ----
function limb(x1, y1, x2, y2, width, colorA, colorB) {
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, colorA);
  grad.addColorStop(1, colorB || colorA);
  ctx.strokeStyle = grad;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function torso(topX, topY, botX, botY, width, shirtColor, shadeColor) {
  const grad = ctx.createLinearGradient(-width, 0, width, 0);
  grad.addColorStop(0, shadeColor);
  grad.addColorStop(0.5, shirtColor);
  grad.addColorStop(1, shadeColor);
  ctx.strokeStyle = grad;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(topX, topY);
  ctx.lineTo(botX, botY);
  ctx.stroke();
}

function head(x, y, r, skinTone, capColor) {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
  grad.addColorStop(0, '#f2caa0');
  grad.addColorStop(1, skinTone);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // cap
  ctx.fillStyle = capColor;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.15, r * 1.02, Math.PI, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + r * 0.9, y - r * 0.15, r * 0.55, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBowler() {
  const runUp = state === 'run-up' ? runnerOffset : 0;
  const x = bowlerX - 90 + runUp;
  const y = bowlerY;
  const shirt = '#2b5fd6', shirtShade = '#173a8f';
  const trouser = '#f4f4f4', trouserShade = '#c7c7c7';

  drawShadow(x, y + 20, 14, 5);

  ctx.save();
  ctx.translate(x, y);

  const bobbing = state === 'run-up' ? Math.sin(runnerOffset * 0.5) * 2 : 0;
  ctx.translate(0, bobbing);

  const legSwing = state === 'run-up' ? Math.sin(runnerOffset * 0.4) * 13 : 0;
  // back leg (drawn first, slightly darker/behind)
  limb(0, 8, 7 - legSwing, 32, 6.5, trouserShade, trouserShade);
  // front leg
  limb(0, 8, -7 + legSwing, 32, 7, trouser, trouserShade);

  // torso (slight lean forward during run-up)
  const lean = state === 'run-up' ? 4 : 0;
  torso(lean, -16, 0, 9, 13, shirt, shirtShade);

  // back arm
  const armUp = state === 'delivering' ? -34 : -4;
  limb(0, -9, -13, 4, 5, shirtShade, shirtShade);
  // bowling arm (front)
  limb(1, -10, 16, armUp, 5.5, shirt, shirtShade);

  // head + cap
  head(0, -22, 6.5, '#d99a5b', '#173a8f');

  ctx.restore();
}

let batSwingAnim = 0;

function drawBatsman() {
  const shirt = '#d64545', shirtShade = '#8f1c1c';
  const trouser = '#fbfbfb', trouserShade = '#cfcfcf';

  drawShadow(batsmanX, batsmanY + 20, 15, 5);

  ctx.save();
  ctx.translate(batsmanX, batsmanY);

  // stance legs (slightly bent, front foot forward)
  limb(0, 8, 9, 33, 7, trouserShade, trouserShade);
  limb(0, 8, -8, 33, 7.5, trouser, trouserShade);

  // pads (light padding on front leg)
  ctx.fillStyle = '#f5f0dd';
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.roundRect(-11.5, 12, 7, 20, 3);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(5, 12, 7, 20, 3);
  ctx.fill();
  ctx.stroke();

  // torso
  torso(0, -16, 0, 9, 13, shirt, shirtShade);

  // non-bat arm (tucked)
  limb(0, -9, -13, 3, 5, shirtShade, shirtShade);

  // bat arm + bat, swings from ready stance to follow-through
  const swingAngle = -0.25 + batSwingAnim * -1.55;
  ctx.save();
  ctx.translate(-4, -8);
  ctx.rotate(swingAngle);

  // arm
  limb(0, 0, 0, 16, 5.5, shirt, shirtShade);

  // bat handle
  ctx.strokeStyle = '#5c4322';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.lineTo(0, 24);
  ctx.stroke();

  // bat blade with wood-grain gradient
  const bladeGrad = ctx.createLinearGradient(-5, 24, 5, 24);
  bladeGrad.addColorStop(0, '#c8975a');
  bladeGrad.addColorStop(0.5, '#eccb92');
  bladeGrad.addColorStop(1, '#c8975a');
  ctx.fillStyle = bladeGrad;
  ctx.strokeStyle = '#8a6535';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-4.5, 24, 9, 22, 2.5);
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  // helmet-style head
  ctx.save();
  head(0, -22, 6.8, '#d99a5b', shirtShade);
  // helmet grille hint
  ctx.strokeStyle = 'rgba(30,30,30,0.5)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-3, -20);
  ctx.lineTo(3, -18);
  ctx.moveTo(-3, -17);
  ctx.lineTo(3, -15);
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  if (batSwingAnim > 0) {
    batSwingAnim -= 0.06;
    if (batSwingAnim < 0) batSwingAnim = 0;
  }
}

function drawBall() {
  // Ground shadow that shrinks/moves as the ball rises and falls
  const heightAboveGround = Math.max(0, (bowlerY - 6) - ball.y + 14);
  const shadowScale = Math.max(0.35, 1 - heightAboveGround / 90);
  drawShadow(ball.x, bowlerY + 22, 7 * shadowScale, 2.5 * shadowScale);

  const r = 6.5;
  const grad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, r);
  grad.addColorStop(0, '#e2604a');
  grad.addColorStop(0.6, '#c0392b');
  grad.addColorStop(1, '#7a1f16');
  ctx.beginPath();
  ctx.fillStyle = grad;
  ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
  ctx.fill();

  // seam
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, r - 1, 0.3, Math.PI - 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, r - 1, Math.PI + 0.3, Math.PI * 2 - 0.3);
  ctx.stroke();
}

function spawnParticle(text, x, y, color) {
  particles.push({ text, x, y, alpha: 1, vy: -0.6, color });
}

function drawParticles() {
  ctx.font = 'bold 20px Segoe UI, Arial';
  ctx.textAlign = 'center';
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
    p.y += p.vy;
    p.alpha -= 0.02;
    if (p.alpha <= 0) particles.splice(i, 1);
  }
}

// ---------- Game flow ----------
function startInnings() {
  runs = 0;
  wickets = 0;
  balls = 0;
  particles = [];
  updateScoreboard();
  startBtn.disabled = true;
  bannerEl.textContent = '';
  nextBall();
}

function nextBall() {
  if (wickets >= MAX_WICKETS || balls >= MAX_OVERS * 6) {
    endInnings();
    return;
  }
  state = 'run-up';
  runnerOffset = 0;
  ball = null;
  hitBtn.disabled = true;
  lastballEl.textContent = '-';

  const runUpFrames = 40;
  let f = 0;
  function runUpStep() {
    if (state !== 'run-up') return;
    f++;
    runnerOffset = (f / runUpFrames) * 70;
    if (f < runUpFrames) {
      requestAnimationFrame(runUpStep);
    } else {
      deliverBall();
    }
  }
  requestAnimationFrame(runUpStep);
}

function deliverBall() {
  state = 'delivering';
  hitBtn.disabled = false;

  const speed = 0.012 + Math.random() * 0.006 + (balls / (MAX_OVERS * 6)) * 0.004;
  ball = {
    x: bowlerX,
    y: bowlerY - 6,
    progress: 0,
    speed,
    resolved: false
  };
}

function tickBall() {
  if (!ball || ball.resolved) return;
  ball.progress += ball.speed;
  if (ball.progress > 1) ball.progress = 1;

  ball.x = bowlerX + (stumpsX - bowlerX) * ball.progress;
  ball.y = (bowlerY - 6) + Math.sin(ball.progress * Math.PI) * -14;

  if (ball.progress >= 1 && !ball.resolved) {
    resolveDelivery(null);
  }
}

function resolveDelivery(swingProgress) {
  if (!ball || ball.resolved) return;
  ball.resolved = true;
  hitBtn.disabled = true;
  balls++;

  const idealCenter = 0.90;
  const idealWindow = 0.09;

  let outcome;
  if (swingProgress === null) {
    outcome = 'noswing';
  } else {
    const diff = Math.abs(swingProgress - idealCenter);
    if (diff <= idealWindow * 0.35) outcome = 'perfect';
    else if (diff <= idealWindow) outcome = 'good';
    else if (diff <= idealWindow * 2) outcome = 'edge';
    else outcome = 'miss';
  }

  let runsScored = 0;
  let text = '';
  let color = '#1b3a1b';
  let dismissed = false;

  switch (outcome) {
    case 'perfect':
      runsScored = Math.random() < 0.45 ? 6 : 4;
      text = runsScored === 6 ? 'SIX! 🚀' : 'FOUR! 🔥';
      color = '#c0392b';
      knockBallAway(runsScored === 6 ? 1.6 : 1.15);
      break;
    case 'good':
      runsScored = [1, 2, 2, 3][Math.floor(Math.random() * 4)];
      text = `${runsScored} run${runsScored > 1 ? 's' : ''}!`;
      color = '#1b6e2f';
      knockBallAway(0.7);
      break;
    case 'edge':
      if (Math.random() < 0.5) {
        dismissed = true;
        text = 'OUT! Caught behind!';
        color = '#8e0f14';
      } else {
        runsScored = 1;
        text = 'Edged for 1!';
        color = '#7a6a1b';
        knockBallAway(0.4);
      }
      break;
    case 'miss':
    case 'noswing':
      dismissed = true;
      text = outcome === 'noswing' ? 'BOWLED! No shot played' : 'OUT! Bowled!';
      color = '#8e0f14';
      break;
  }

  runs += runsScored;
  if (dismissed) wickets++;

  spawnParticle(text, batsmanX, batsmanY - 60, color);
  setBanner(text, color);
  lastballEl.textContent = dismissed ? 'W' : (runsScored === 0 ? '•' : runsScored);
  updateScoreboard();

  setTimeout(() => {
    if (wickets >= MAX_WICKETS || balls >= MAX_OVERS * 6) {
      endInnings();
    } else {
      nextBall();
    }
  }, 1300);
}

function knockBallAway(power) {
  if (!ball) return;
  const startX = ball.x, startY = ball.y;
  let t = 0;
  function step() {
    t += 0.05;
    ball.x = startX + t * 250 * power;
    ball.y = startY - Math.sin(t * Math.PI) * 60 * power;
    if (t < 1) requestAnimationFrame(step);
  }
  step();
}

function swing() {
  if (state !== 'delivering' || !ball || ball.resolved) return;
  batSwingAnim = 1;
  resolveDelivery(ball.progress);
}

function endInnings() {
  state = 'gameover';
  startBtn.disabled = false;
  startBtn.textContent = 'Play Again';
  hitBtn.disabled = true;
  const finalText = `Innings over! ${runs}/${wickets} in ${Math.floor(balls/6)}.${balls%6} overs`;
  setBanner(finalText, '#0b3d91');
  spawnParticle(finalText, W / 2, 60, '#0b3d91');
}

// ---------- Input ----------
startBtn.addEventListener('click', startInnings);
hitBtn.addEventListener('click', swing);
canvas.addEventListener('click', swing);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    swing();
  }
});

// ---------- Main loop ----------
function loop() {
  if (state === 'delivering') tickBall();
  drawField();
  requestAnimationFrame(loop);
}

updateScoreboard();
drawField();
loop();
