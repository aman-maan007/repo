/* ==========================================================
   Tap-to-Hit Cricket — full match version
   - Choose your team / opponent team (countries), toss
     decision (bat or bowl first), and overs per innings
   - Your innings is always played interactively (tap-to-hit)
   - The other side's innings is simulated ball-by-ball with
     a live commentary feed
   - Full match result (win/loss/tie by runs or wickets)
   ========================================================== */

// ---------------- Teams ----------------
const COUNTRIES = [
  { name: 'India',         shirt: '#1f4fd1', shade: '#123a99', cap: '#0d2b73' },
  { name: 'Australia',     shirt: '#f2c14e', shade: '#caa233', cap: '#1b6e2b' },
  { name: 'England',       shirt: '#1b2a4a', shade: '#101b33', cap: '#c8102e' },
  { name: 'Pakistan',      shirt: '#0b6e2b', shade: '#084d1e', cap: '#0b6e2b' },
  { name: 'South Africa',  shirt: '#1b6e2b', shade: '#0f4d1c', cap: '#e0a319' },
  { name: 'New Zealand',   shirt: '#1c1c1c', shade: '#000000', cap: '#1c1c1c' },
  { name: 'Sri Lanka',     shirt: '#0d3b66', shade: '#082745', cap: '#e0a319' },
  { name: 'West Indies',   shirt: '#7a0c0c', shade: '#520808', cap: '#7a0c0c' },
  { name: 'Bangladesh',    shirt: '#046a38', shade: '#02431f', cap: '#c8102e' },
  { name: 'Afghanistan',   shirt: '#0033a0', shade: '#00206b', cap: '#c8102e' }
];

// ---------------- DOM refs ----------------
const setupPanel = document.getElementById('setupPanel');
const matchPanel = document.getElementById('matchPanel');
const yourTeamSelect = document.getElementById('yourTeamSelect');
const oppTeamSelect = document.getElementById('oppTeamSelect');
const oversSelect = document.getElementById('oversSelect');
const startMatchBtn = document.getElementById('startMatchBtn');

const matchHeaderEl = document.getElementById('matchHeader');
const targetInfoEl = document.getElementById('targetInfo');

const simView = document.getElementById('simView');
const simRunsEl = document.getElementById('simRuns');
const simWicketsEl = document.getElementById('simWickets');
const simOversEl = document.getElementById('simOvers');
const commentaryFeed = document.getElementById('commentaryFeed');

const battingView = document.getElementById('battingView');
const runsEl = document.getElementById('runs');
const wicketsEl = document.getElementById('wickets');
const oversEl = document.getElementById('overs');
const lastballEl = document.getElementById('lastball');
const bannerEl = document.getElementById('banner');
const hitBtn = document.getElementById('hitBtn');

const resultPanel = document.getElementById('resultPanel');
const resultTitle = document.getElementById('resultTitle');
const resultDetail = document.getElementById('resultDetail');
const playAgainBtn = document.getElementById('playAgainBtn');

const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// ---------------- Populate team dropdowns ----------------
function fillTeamSelect(select, defaultIndex) {
  COUNTRIES.forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = c.name;
    if (i === defaultIndex) opt.selected = true;
    select.appendChild(opt);
  });
}
fillTeamSelect(yourTeamSelect, 0); // India
fillTeamSelect(oppTeamSelect, 1);  // Australia

// ---------------- Match state ----------------
const MAX_WICKETS = 3;

const match = {
  yourTeam: COUNTRIES[0],
  oppTeam: COUNTRIES[1],
  overs: 5,
  battingFirst: 'you' // 'you' | 'opp'
};

// Your interactive innings stats
let runs = 0, wickets = 0, balls = 0;
let target = null; // null = not chasing, number = runs needed to win

// Opponent simulated innings stats
let oppRuns = 0, oppWickets = 0, oppBalls = 0;

let state = 'idle'; // idle | run-up | delivering | gameover
let ball = null;
let runnerOffset = 0;
let bannerTimeout = null;
let particles = [];
let batSwingAnim = 0;

// Pitch geometry
const bowlerX = 120, bowlerY = 250;
const batsmanX = 660, batsmanY = 250;
const stumpsX = 705, stumpsY = 250;

// ---------------- Setup flow ----------------
startMatchBtn.addEventListener('click', () => {
  match.yourTeam = COUNTRIES[+yourTeamSelect.value];
  match.oppTeam = COUNTRIES[+oppTeamSelect.value];
  match.overs = +oversSelect.value;
  match.battingFirst = document.querySelector('input[name="toss"]:checked').value;

  if (match.yourTeam === match.oppTeam) {
    // Guard against picking identical team indices with same name accidentally
  }

  setupPanel.style.display = 'none';
  matchPanel.style.display = 'block';
  resultPanel.style.display = 'none';
  particles = [];

  matchHeaderEl.textContent =
    `${match.yourTeam.name} vs ${match.oppTeam.name} — ${match.overs} over${match.overs > 1 ? 's' : ''} a side`;
  targetInfoEl.textContent = '';

  if (match.battingFirst === 'you') {
    startYourInnings(null);
  } else {
    simulateOpponentInnings(null);
  }
});

playAgainBtn.addEventListener('click', () => {
  matchPanel.style.display = 'none';
  resultPanel.style.display = 'none';
  setupPanel.style.display = 'block';
});

// ---------------- UI helpers ----------------
function setBanner(text, color = '#b3141a') {
  bannerEl.textContent = text;
  bannerEl.style.color = color;
  clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => { bannerEl.textContent = ''; }, 1600);
}

function showBattingView() {
  battingView.style.display = 'block';
  simView.style.display = 'none';
  resultPanel.style.display = 'none';
}

function showSimView() {
  battingView.style.display = 'none';
  simView.style.display = 'block';
  resultPanel.style.display = 'none';
}

function showResultPanel() {
  battingView.style.display = 'none';
  simView.style.display = 'none';
  resultPanel.style.display = 'block';
}

function updateScoreboard() {
  runsEl.textContent = runs;
  wicketsEl.textContent = wickets;
  oversEl.textContent = `${Math.floor(balls / 6)}.${balls % 6}`;
}

function updateSimScoreboard() {
  simRunsEl.textContent = oppRuns;
  simWicketsEl.textContent = oppWickets;
  simOversEl.textContent = `${Math.floor(oppBalls / 6)}.${oppBalls % 6}`;
}

function updateTargetInfo() {
  if (target === null) {
    targetInfoEl.textContent = '';
    return;
  }
  const isYouChasing = battingView.style.display !== 'none';
  const ballsLeft = match.overs * 6 - (isYouChasing ? balls : oppBalls);
  const have = isYouChasing ? runs : oppRuns;
  const need = target - have;
  if (need <= 0) {
    targetInfoEl.textContent = 'Target reached!';
  } else {
    targetInfoEl.textContent = `Need ${need} run${need === 1 ? '' : 's'} from ${ballsLeft} ball${ballsLeft === 1 ? '' : 's'} to win`;
  }
}

function appendCommentary(text, highlight) {
  const p = document.createElement('p');
  p.textContent = text;
  if (highlight) p.style.color = '#ffd54a';
  commentaryFeed.appendChild(p);
  commentaryFeed.scrollTop = commentaryFeed.scrollHeight;
}

// ---------------- Simulated opponent innings ----------------
function simulateOpponentInnings(chaseTarget) {
  oppRuns = 0; oppWickets = 0; oppBalls = 0;
  target = chaseTarget;
  commentaryFeed.innerHTML = '';
  showSimView();
  updateSimScoreboard();
  updateTargetInfo();
  appendCommentary(
    chaseTarget === null
      ? `${match.oppTeam.name} come out to bat first.`
      : `${match.oppTeam.name} need ${chaseTarget} to win.`
  );
  simulateOneBall();
}

const OUTCOME_TABLE = [
  { runs: 0, wicket: false, weight: 34, text: 'no run, defended solidly' },
  { runs: 1, wicket: false, weight: 24, text: 'tucked away for a single' },
  { runs: 2, wicket: false, weight: 10, text: 'pushed for a couple of runs' },
  { runs: 3, wicket: false, weight: 3,  text: 'three runs, good running' },
  { runs: 4, wicket: false, weight: 14, text: 'FOUR! Cracked through the gap' },
  { runs: 6, wicket: false, weight: 7,  text: 'SIX! Launched into the stands' },
  { runs: 0, wicket: true,  weight: 8,  text: 'OUT! Wicket falls' }
];
const OUTCOME_TOTAL = OUTCOME_TABLE.reduce((s, o) => s + o.weight, 0);

function pickOutcome() {
  let r = Math.random() * OUTCOME_TOTAL;
  for (const o of OUTCOME_TABLE) {
    if (r < o.weight) return o;
    r -= o.weight;
  }
  return OUTCOME_TABLE[0];
}

function simulateOneBall() {
  const done = oppWickets >= MAX_WICKETS ||
               oppBalls >= match.overs * 6 ||
               (target !== null && oppRuns >= target);
  if (done) {
    finishOpponentInnings();
    return;
  }

  setTimeout(() => {
    const outcome = pickOutcome();
    oppBalls++;
    if (outcome.wicket) {
      oppWickets++;
    } else {
      oppRuns += outcome.runs;
    }
    const oversTag = `${Math.floor((oppBalls - 1) / 6)}.${(oppBalls - 1) % 6 + 1}`;
    appendCommentary(`Ball ${oversTag}: ${outcome.text}`, outcome.runs >= 4 || outcome.wicket);
    updateSimScoreboard();
    updateTargetInfo();
    simulateOneBall();
  }, 260);
}

function finishOpponentInnings() {
  if (target === null) {
    // Opponent batted first — set the target for your chase
    const newTarget = oppRuns + 1;
    appendCommentary(`Innings over: ${match.oppTeam.name} scored ${oppRuns}/${oppWickets}.`, true);
    appendCommentary(`${match.yourTeam.name} need ${newTarget} runs to win.`, true);
    setTimeout(() => startYourInnings(newTarget), 1700);
  } else {
    // Opponent were chasing your total — match is over
    finishMatch();
  }
}

// ---------------- Your interactive innings ----------------
function startYourInnings(chaseTarget) {
  runs = 0; wickets = 0; balls = 0;
  target = chaseTarget;
  particles = [];
  updateScoreboard();
  updateTargetInfo();
  bannerEl.textContent = '';
  showBattingView();
  nextBall();
}

function nextBall() {
  const done = wickets >= MAX_WICKETS ||
               balls >= match.overs * 6 ||
               (target !== null && runs >= target);
  if (done) {
    endYourInnings();
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
  const speed = 0.012 + Math.random() * 0.006 + (balls / (match.overs * 6)) * 0.004;
  ball = { x: bowlerX, y: bowlerY - 6, progress: 0, speed, resolved: false };
}

function tickBall() {
  if (!ball || ball.resolved) return;
  ball.progress += ball.speed;
  if (ball.progress > 1) ball.progress = 1;
  ball.x = bowlerX + (stumpsX - bowlerX) * ball.progress;
  ball.y = (bowlerY - 6) + Math.sin(ball.progress * Math.PI) * -14;
  if (ball.progress >= 1 && !ball.resolved) resolveDelivery(null);
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

  let runsScored = 0, text = '', color = '#1b3a1b', dismissed = false;

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
  lastballEl.textContent = dismissed ? 'W' : (runsScored === 0 ? '\u2022' : runsScored);
  updateScoreboard();
  updateTargetInfo();

  setTimeout(() => {
    const done = wickets >= MAX_WICKETS ||
                 balls >= match.overs * 6 ||
                 (target !== null && runs >= target);
    if (done) endYourInnings(); else nextBall();
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

function endYourInnings() {
  state = 'gameover';
  hitBtn.disabled = true;
  if (target === null) {
    // You batted first — hand over to opponent's simulated chase
    const newTarget = runs + 1;
    setBanner(`Innings over: ${runs}/${wickets}. ${match.oppTeam.name} need ${newTarget} to win.`, '#0b3d91');
    setTimeout(() => simulateOpponentInnings(newTarget), 1700);
  } else {
    // You were chasing — match is over
    finishMatch();
  }
}

// ---------------- Match result ----------------
function finishMatch() {
  const yourFinal = { runs, wickets };
  const oppFinal = { runs: oppRuns, wickets: oppWickets };

  let title, detail;
  if (yourFinal.runs === oppFinal.runs) {
    title = "It's a Tie!";
    detail = `${match.yourTeam.name} ${yourFinal.runs}/${yourFinal.wickets} — ${match.oppTeam.name} ${oppFinal.runs}/${oppFinal.wickets}`;
  } else if (yourFinal.runs > oppFinal.runs) {
    if (match.battingFirst === 'you') {
      title = `${match.yourTeam.name} win by ${yourFinal.runs - oppFinal.runs} runs!`;
    } else {
      title = `${match.yourTeam.name} win by ${MAX_WICKETS - yourFinal.wickets} wicket${MAX_WICKETS - yourFinal.wickets === 1 ? '' : 's'}!`;
    }
    detail = `${match.yourTeam.name} ${yourFinal.runs}/${yourFinal.wickets} — ${match.oppTeam.name} ${oppFinal.runs}/${oppFinal.wickets}`;
  } else {
    if (match.battingFirst === 'opp') {
      title = `${match.oppTeam.name} win by ${oppFinal.runs - yourFinal.runs} runs!`;
    } else {
      title = `${match.oppTeam.name} win by ${MAX_WICKETS - oppFinal.wickets} wicket${MAX_WICKETS - oppFinal.wickets === 1 ? '' : 's'}!`;
    }
    detail = `${match.yourTeam.name} ${yourFinal.runs}/${yourFinal.wickets} — ${match.oppTeam.name} ${oppFinal.runs}/${oppFinal.wickets}`;
  }

  resultTitle.textContent = title;
  resultDetail.textContent = detail;
  showResultPanel();
}

// ---------------- Drawing ----------------
const bgCanvas = document.createElement('canvas');
bgCanvas.width = W;
bgCanvas.height = H;
const bgCtx = bgCanvas.getContext('2d');
buildBackground();

function buildBackground() {
  const sky = bgCtx.createLinearGradient(0, 0, 0, 150);
  sky.addColorStop(0, '#bfe3f7');
  sky.addColorStop(1, '#e7f5e2');
  bgCtx.fillStyle = sky;
  bgCtx.fillRect(0, 0, W, 150);

  const sun = bgCtx.createRadialGradient(680, 40, 5, 680, 40, 70);
  sun.addColorStop(0, 'rgba(255,250,220,0.9)');
  sun.addColorStop(1, 'rgba(255,250,220,0)');
  bgCtx.fillStyle = sun;
  bgCtx.fillRect(600, -30, 160, 160);

  const stand = bgCtx.createLinearGradient(0, 60, 0, 130);
  stand.addColorStop(0, '#5b4a63');
  stand.addColorStop(1, '#3d3350');
  bgCtx.fillStyle = stand;
  bgCtx.fillRect(0, 60, W, 70);

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

  bgCtx.fillStyle = '#1c7a3e';
  bgCtx.fillRect(0, 128, W, 14);
  bgCtx.fillStyle = 'rgba(255,255,255,0.85)';
  bgCtx.font = 'bold 11px Segoe UI, Arial';
  const adText = '  CRICKET LEAGUE  \u2022  SIX HIT ZONE  \u2022  PLAY IT FORWARD  \u2022  ';
  bgCtx.fillText(adText.repeat(4), 0, 138);

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

  bgCtx.strokeStyle = 'rgba(255,255,255,0.5)';
  bgCtx.lineWidth = 3;
  bgCtx.beginPath();
  bgCtx.ellipse(W / 2, H + 60, W / 2 - 10, 140, 0, Math.PI, 2 * Math.PI);
  bgCtx.stroke();
}

function drawField() {
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(bgCanvas, 0, 0);

  const pitchGrad = ctx.createLinearGradient(0, bowlerY - 22, 0, bowlerY + 22);
  pitchGrad.addColorStop(0, '#e6d5a3');
  pitchGrad.addColorStop(0.5, '#d9c48a');
  pitchGrad.addColorStop(1, '#c9b273');
  ctx.fillStyle = pitchGrad;
  ctx.fillRect(bowlerX - 40, bowlerY - 24, (stumpsX - bowlerX) + 80, 48);

  ctx.fillStyle = 'rgba(120,95,55,0.25)';
  ctx.beginPath();
  ctx.ellipse(stumpsX - 55, bowlerY + 10, 14, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(bowlerX + 40, bowlerY - 8, 12, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();

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
  ctx.fillStyle = '#caa15c';
  ctx.fillRect(-9.5, -37, 8.5, 3.2);
  ctx.fillRect(0.8, -37, 8.5, 3.2);
  ctx.strokeStyle = 'rgba(90,60,25,0.6)';
  ctx.strokeRect(-9.5, -37, 8.5, 3.2);
  ctx.strokeRect(0.8, -37, 8.5, 3.2);

  ctx.restore();
}

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
  const team = match.oppTeam;
  const trouser = '#f4f4f4', trouserShade = '#c7c7c7';

  drawShadow(x, y + 20, 14, 5);

  ctx.save();
  ctx.translate(x, y);

  const bobbing = state === 'run-up' ? Math.sin(runnerOffset * 0.5) * 2 : 0;
  ctx.translate(0, bobbing);

  const legSwing = state === 'run-up' ? Math.sin(runnerOffset * 0.4) * 13 : 0;
  limb(0, 8, 7 - legSwing, 32, 6.5, trouserShade, trouserShade);
  limb(0, 8, -7 + legSwing, 32, 7, trouser, trouserShade);

  const lean = state === 'run-up' ? 4 : 0;
  torso(lean, -16, 0, 9, 13, team.shirt, team.shade);

  const armUp = state === 'delivering' ? -34 : -4;
  limb(0, -9, -13, 4, 5, team.shade, team.shade);
  limb(1, -10, 16, armUp, 5.5, team.shirt, team.shade);

  head(0, -22, 6.5, '#d99a5b', team.cap);

  ctx.restore();
}

function drawBatsman() {
  const team = match.yourTeam;
  const trouser = '#fbfbfb', trouserShade = '#cfcfcf';

  drawShadow(batsmanX, batsmanY + 20, 15, 5);

  ctx.save();
  ctx.translate(batsmanX, batsmanY);

  limb(0, 8, 9, 33, 7, trouserShade, trouserShade);
  limb(0, 8, -8, 33, 7.5, trouser, trouserShade);

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

  torso(0, -16, 0, 9, 13, team.shirt, team.shade);

  limb(0, -9, -13, 3, 5, team.shade, team.shade);

  const swingAngle = -0.25 + batSwingAnim * -1.55;
  ctx.save();
  ctx.translate(-4, -8);
  ctx.rotate(swingAngle);

  limb(0, 0, 0, 16, 5.5, team.shirt, team.shade);

  ctx.strokeStyle = '#5c4322';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.lineTo(0, 24);
  ctx.stroke();

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

  ctx.save();
  head(0, -22, 6.8, '#d99a5b', team.shade);
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

// ---------------- Input ----------------
hitBtn.addEventListener('click', swing);
canvas.addEventListener('click', swing);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    swing();
  }
});

// ---------------- Main loop ----------------
function loop() {
  if (state === 'delivering') tickBall();
  drawField();
  requestAnimationFrame(loop);
}

drawField();
loop();
