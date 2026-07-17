# Tap-to-Hit Cricket 🏏

A ready-to-use animated cricket match game built with HTML5 Canvas, CSS, and
vanilla JavaScript — no frameworks, no build step.

## Files
- `index.html` — setup screen, live match UI, result screen
- `style.css` — visual styling
- `script.js` — match flow, simulation, animation, and scoring logic

## How to play
1. Open `index.html` in any browser.
2. On the **Match Setup** screen, choose:
   - **Your Team** and **Opponent Team** (10 countries to pick from)
   - **Toss Decision** — Bat First or Bowl First
   - **Overs per Innings** — 1 (Super Over), 2, 3, 5, or 10
3. Click **Start Match**.
4. Whichever side bats first:
   - If it's **you**, you play the interactive tap-to-hit innings right away.
   - If it's the **opponent**, their innings is simulated ball-by-ball with a
     live commentary feed, then you bat second, chasing their target.
5. **Your innings** is always the interactive one:
   - Press **Space**, click the canvas, or click **SWING!** as the ball nears
     the bat.
   - Perfect timing → four or six. Good timing → 1–3 runs. Mistimed → risky
     edge (single or caught out). Miss/no swing → bowled.
   - When chasing, a target banner shows how many runs you need from how many
     balls remaining.
6. After both innings, a result screen shows the match outcome (win by runs
   or wickets, or a tie) and lets you start a **New Match** with fresh
   settings.

## Match rules (current build)
- 3 wickets per innings (kept low so an innings doesn't drag).
- Overs are configurable per match (1–10).
- The opponent's innings is a weighted random simulation (not another
  interactive mini-game) — displayed as scrolling commentary with a
  compact scoreboard.

## Visuals
Field, players, ball, and stumps are drawn with layered gradients and
shading: a stadium crowd backdrop, mown-grass stripes, wood-grain stumps and
bat, shaded team-colored kits (drawn from whichever two countries you pick),
moving ground shadows, and a bobbing bowler run-up.

## Customize
In `script.js`:
- `COUNTRIES` — add/edit teams and their kit colors (`shirt`, `shade`, `cap`).
- `MAX_WICKETS` — wickets per innings.
- `OUTCOME_TABLE` — tune the AI opponent's batting odds (dot ball, singles,
  boundaries, wicket chance).
- `idealCenter` / `idealWindow` in `resolveDelivery()` — widen/narrow your
  own timing window for hits.
- delivery `speed` in `deliverBall()` — pace and how much it ramps up.

In `style.css`:
- Colors, panel styling, and canvas border/shadow can be restyled freely.

Everything is self-contained — just copy the three files into any project.
