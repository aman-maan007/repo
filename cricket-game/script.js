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
function drawField() {
  ctx.clearRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#8fd18a');
  grad.addColorStop(1, '#6cb85f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#d9c48a';
  ctx.fillRect(bowlerX - 40, bowlerY - 22, (stumpsX - bowlerX) + 80, 44);

  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bowlerX + 10, bowlerY - 22);
  ctx.lineTo(bowlerX + 10, bowlerY + 22);
  ctx.moveTo(stumpsX - 40, bowlerY - 22);
  ctx.lineTo(stumpsX - 40, bowlerY + 22);
  ctx.stroke();

  drawStumps(bowlerX - 15, bowlerY, 0.6);
  drawStumps(stumpsX, stumpsY, 1);
  drawBowler();
  drawBatsman();

  if (ball) drawBall();

  drawParticles();
}

function drawStumps(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#f4e3c1';
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 1;
  for (let i = -8; i <= 8; i += 8) {
    ctx.fillRect(i - 2, -34, 4, 34);
    ctx.strokeRect(i - 2, -34, 4, 34);
  }
  ctx.fillRect(-9, -36, 8, 3);
  ctx.fillRect(1, -36, 8, 3);
  ctx.restore();
}

function drawBowler() {
  const runUp = state === 'run-up' ? runnerOffset : 0;
  const x = bowlerX - 90 + runUp;
  const y = bowlerY;

  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#1b1b2f';
  ctx.fillStyle = '#2b4fb0';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  const legSwing = state === 'run-up' ? Math.sin(runnerOffset * 0.4) * 12 : 0;

  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(-6 + legSwing, 34);
  ctx.moveTo(0, 10);
  ctx.lineTo(6 - legSwing, 34);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(0, 10);
  ctx.stroke();

  const armUp = state === 'delivering' ? -30 : -6;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(14, armUp);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(-12, 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -20, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

let batSwingAnim = 0;

function drawBatsman() {
  ctx.save();
  ctx.translate(batsmanX, batsmanY);
  ctx.strokeStyle = '#1b1b2f';
  ctx.fillStyle = '#c0392b';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(-8, 34);
  ctx.moveTo(0, 10);
  ctx.lineTo(8, 34);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(0, 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -20, 6, 0, Math.PI * 2);
  ctx.fill();

  const swingAngle = -0.3 + batSwingAnim * -1.6;
  ctx.save();
  ctx.translate(-6, -6);
  ctx.rotate(swingAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 22);
  ctx.stroke();
  ctx.fillStyle = '#e8c07d';
  ctx.fillRect(-4, 20, 8, 20);
  ctx.strokeRect(-4, 20, 8, 20);
  ctx.restore();

  ctx.restore();

  if (batSwingAnim > 0) {
    batSwingAnim -= 0.06;
    if (batSwingAnim < 0) batSwingAnim = 0;
  }
}

function drawBall() {
  ctx.beginPath();
  ctx.fillStyle = '#c0392b';
  ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a1f16';
  ctx.lineWidth = 1;
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
