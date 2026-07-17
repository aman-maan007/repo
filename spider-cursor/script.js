/* ==========================================================
   Spider Web Cursor
   - Spider glyph "steps" dot-to-dot toward the real mouse
     position (instead of snapping instantly), giving a
     crawling feel.
   - A faint web-line trail is drawn behind it on canvas,
     fading over time.
   - Click = quick radial "web shot" burst.
   ========================================================== */

const spider = document.getElementById('spider-cursor');
const canvas = document.getElementById('web-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Real mouse position
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

// Spider's current (eased) position — this is what actually moves dot-to-dot
let spiderX = mouseX;
let spiderY = mouseY;

// Trail of recent dots the spider has passed through
const trail = [];
const MAX_TRAIL = 40;
const DOT_SPACING = 14; // min distance before a new trail dot is recorded

// Web-shot bursts on click
const bursts = [];

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

document.addEventListener('click', (e) => {
  const lines = 8;
  for (let i = 0; i < lines; i++) {
    const angle = (Math.PI * 2 * i) / lines;
    bursts.push({
      x: e.clientX,
      y: e.clientY,
      angle,
      dist: 0,
      maxDist: 60 + Math.random() * 20,
      alpha: 1
    });
  }
});

function lastTrailPoint() {
  return trail.length ? trail[trail.length - 1] : null;
}

function update() {
  // Ease spider position toward mouse (dot-to-dot crawl feel)
  const ease = 0.15;
  spiderX += (mouseX - spiderX) * ease;
  spiderY += (mouseY - spiderY) * ease;

  // Rotate spider to face movement direction
  const dx = mouseX - spiderX;
  const dy = mouseY - spiderY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

  spider.style.transform =
    `translate(-50%, -50%) translate(${spiderX}px, ${spiderY}px) rotate(${angle}deg)`;

  // Record a new trail dot if the spider moved far enough from the last one
  const last = lastTrailPoint();
  if (!last || Math.hypot(spiderX - last.x, spiderY - last.y) > DOT_SPACING) {
    trail.push({ x: spiderX, y: spiderY, alpha: 1 });
    if (trail.length > MAX_TRAIL) trail.shift();
  }

  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw connecting web lines dot-to-dot
  ctx.lineWidth = 1;
  for (let i = 1; i < trail.length; i++) {
    const p1 = trail[i - 1];
    const p2 = trail[i];
    const alpha = (i / trail.length) * 0.5;
    ctx.strokeStyle = `rgba(220,220,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // dot marker
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw click web-shot bursts
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.dist += 4;
    b.alpha -= 0.04;

    if (b.alpha <= 0 || b.dist >= b.maxDist) {
      bursts.splice(i, 1);
      continue;
    }

    const x2 = b.x + Math.cos(b.angle) * b.dist;
    const y2 = b.y + Math.sin(b.angle) * b.dist;

    ctx.strokeStyle = `rgba(255,255,255,${b.alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

update();
