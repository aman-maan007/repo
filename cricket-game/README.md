# Tap-to-Hit Cricket 🏏

A ready-to-use animated cricket mini-game built with HTML5 Canvas, CSS, and
vanilla JavaScript — no frameworks, no build step.

## Files
- `index.html` — game page & scoreboard UI
- `style.css` — visual styling
- `script.js` — game loop, animation, and scoring logic

## How to play
1. Open `index.html` in any browser.
2. Click **Start Innings**.
3. Watch the bowler run up and release the ball.
4. Swing at the right moment by:
   - Pressing **Space**, or
   - Clicking the canvas, or
   - Clicking the **SWING!** button
5. Timing determines the outcome:
   - **Perfect timing** → four or six
   - **Good timing** → 1–3 runs
   - **Edge** → risky: single or caught out
   - **Miss / no swing** → bowled (wicket)
6. Innings ends after **3 wickets** or **5 overs** (30 balls). Click
   **Play Again** to restart.

## Customize
In `script.js`:
- `MAX_WICKETS`, `MAX_OVERS` — change innings length/difficulty.
- `idealCenter`, `idealWindow` in `resolveDelivery()` — widen/narrow the
  timing window for hits.
- `speed` in `deliverBall()` — adjust how fast deliveries come in (and how
  much they speed up over the innings).

In `style.css`:
- Colors, scoreboard styling, and canvas border can all be restyled freely.

Everything is self-contained — just copy the three files into any project.
