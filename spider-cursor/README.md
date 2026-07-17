# Spider Web Cursor

A ready-to-use custom cursor effect: a spider glyph crawls dot-to-dot toward
your real mouse position, leaving a fading web-line trail behind it. Clicking
fires a small radial "web shot" burst.

## Files
- `index.html` — demo page
- `style.css` — cursor + trail styling
- `script.js` — cursor movement & trail logic

## How to use
1. Open `index.html` in any browser to see it working right away.
2. To add it to your own site, copy `style.css` and `script.js` into your
   project, then add this to your HTML `<body>`:

```html
<div id="spider-cursor">
  <svg viewBox="0 0 64 64" width="36" height="36">
    <g stroke="#111" stroke-width="2.5" fill="#111" stroke-linecap="round">
      <ellipse cx="32" cy="30" rx="7" ry="9" />
      <ellipse cx="32" cy="18" rx="4.5" ry="5" />
      <path d="M26 24 C16 18, 8 18, 4 12" fill="none"/>
      <path d="M25 30 C14 28, 6 28, 2 26" fill="none"/>
      <path d="M25 36 C14 36, 6 40, 3 44" fill="none"/>
      <path d="M27 41 C18 46, 12 50, 8 56" fill="none"/>
      <path d="M38 24 C48 18, 56 18, 60 12" fill="none"/>
      <path d="M39 30 C50 28, 58 28, 62 26" fill="none"/>
      <path d="M39 36 C50 36, 58 40, 61 44" fill="none"/>
      <path d="M37 41 C46 46, 52 50, 56 56" fill="none"/>
    </g>
  </svg>
</div>
<canvas id="web-canvas"></canvas>
```

3. Link the two files:
```html
<link rel="stylesheet" href="style.css">
<script src="script.js"></script>
```

## Customize
- **Speed / smoothness**: change `ease` in `script.js` (smaller = slower/laggier crawl).
- **Trail length**: change `MAX_TRAIL`.
- **Trail density**: change `DOT_SPACING`.
- **Colors**: edit the `rgba(...)` values inside `draw()` in `script.js`.

## Note
This uses a generic spider illustration (not the copyrighted Marvel
Spider-Man character/suit design), so it's safe to use freely in your own
projects.
