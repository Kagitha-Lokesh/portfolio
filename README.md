# Lokesh Kagitha — Personal Portfolio Website

A clean, quiet, Awwwards "Site of the Day" aesthetic personal portfolio website for **Lokesh Kagitha**, Full Stack Developer. Built strictly using white, black, and grays with official brand logos, seamless looping hero video with sample-accurate audio crossfade, hanging lanyard ID card, periodic table of skills, expanding work accordion, ink-flood certifications, scroll-drawn career trajectory, and pinned horizontal achievements gallery.

All content is 100% sourced and verified against `resume.pdf`.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (tested on Node v26)
- Python 3.10+ (for hero video processing script)
- FFmpeg (for video pipeline)

### 1. Installation
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```
- First-load JS: **~126 kB** (well under the 130 kB target).
- Zero external image CDNs or runtime script dependencies.
- Self-hosted variable and serif fonts in `src/fonts/`.

---

## 📋 Sections Overview

| Section | Component | Order | Key Motion & Interactive Feature |
| :--- | :--- | :---: | :--- |
| **Navigation** | `src/components/Navigation.tsx` | Global | 2px scroll progress bar, 360° spinning initials badge, frosted glass pill with sliding ink active indicator, full-screen clip-path mobile menu. |
| **Hero** | `src/components/hero/Hero.tsx` | 00 | Seamless looping 9.5s hero video (`hero.webm` + `hero.mp4`), `mix-blend-mode: multiply` background blend, giant outlined ghost typography, icon-only sound toggle button (▶/❚❚), auto-pause when <35% visible. |
| **About** | `src/components/sections/About.tsx` | 01 | 3-column layout with a realistic hanging lanyard ID card in center. Spring-damped pendulum swing physics, idle sway, and 3D flip on hover/tap/keyboard (`rotateY`). Verbatim résumé summary and quick facts. |
| **Skills** | `src/components/sections/Skills.tsx` | 02 | "The periodic table of my stack": 8-column elemental grid with atomic numbers and 2-letter symbols. Family filter chips, diagonal wave reveal, and sticky 320px inspector panel displaying official 150px logos with soft brand glows. |
| **Work** | `src/components/sections/Work.tsx` | 03 | Expanding horizontal accordion gallery (`flex: 8` active, slim spines with rotating `+` icon when folded). Left features & tech chips, right custom illustrative mini-UIs built in pure CSS/JSX (grayscale). |
| **Certifications** | `src/components/sections/Certifications.tsx` | 04 | Ink-flood index on a white band. Left sticky counter, right numbered rows that flood with solid ink (`scaleX 0→1`) while text turns white and `↗` arrow slides in. |
| **Experience** | `src/components/sections/Experience.tsx` | 05 | Unified trajectory combining education and enterprise internship. Central spine draws downward proportionally with scroll progress, illuminating each stop as reached. Concludes with dashed "Next — Your team?" card. |
| **Achievements** | `src/components/sections/Achievements.tsx` | 06 | Pinned horizontal gallery (`position: sticky; 100svh`). Sideways track traversal driven by vertical scroll, 1.4s `easeOutQuart` counter animations, and center-card lift with soft brand shadow. |
| **Contact** | `src/components/sections/Contact.tsx` | 07 | Giant interactive bouncing letters heading (`hover:-translateY-3`), underlined email with clipboard copy chip (`aria-live`), verified phone/social links, and continuous spinning circular "say hello" text badge. |

---

## 🎥 Hero Video Pipeline (`scripts/build-hero-assets.py`)

The hero clip is generated from `intro.mp4` using Python, FFmpeg, and NumPy:

```bash
python scripts/build-hero-assets.py
```

### What the script executes:
1. **Centering & Tight Crop**:
   Detects the subject and crops at `crop=800:1000:504:30`, scaling to `scale=768:960` (4:5 aspect ratio) so Lokesh is centered head-to-toe.
2. **Background Whitening**:
   Applies `colorlevels=rimax=0.98:gimax=0.98:bimax=0.98` to bring the light background to pure white `#ffffff`, allowing seamless `mix-blend-mode: multiply` into `--paper` (#f4f2ee).
3. **Seamless Video Cross-Fade**:
   Trims initial 10s into a 9.5s continuous loop using FFmpeg `xfade=transition=fade:duration=0.5:offset=9.0`.
4. **Sample-Accurate Audio Cross-Fade (NumPy)**:
   Extracts 48kHz audio and crossfades the trailing 0.5s into the leading 0.5s using equal-power sine/cosine weights. Zero audio click, zero dropped frames, and 100% lip synchronization.
5. **Dual Export**:
   - `public/hero/hero.mp4`: H.264 YUV420p (CRF 24, `-preset slow`), AAC 96 kbps, `+faststart`.
   - `public/hero/hero.webm`: VP9 (CRF 36), Opus 80 kbps.
6. **Portrait & OG Export**:
   - `public/portrait-bust.webp`: 480×600 head-to-shirt crop at 2.0s frame for the ID badge and avatar.
   - `public/og.jpg`: 1200×630 OpenGraph social preview card.

---

## 🎨 Design System & Tokens

Defined in `src/app/globals.css`:
```css
--paper: #f4f2ee;   /* Page background (warm off-white) */
--card: #ffffff;    /* Card surfaces */
--ink: #0d0d0d;     /* Primary text, buttons, active states */
--ink-2: #3a3a3a;   /* Slightly softened dark text */
--mute: #77756f;    /* Secondary metadata, subtitles */
--faint: #a9a6a0;   /* Borders, placeholders, numbering */
--line: rgba(13, 13, 13, 0.1); /* Hairline dividers */
--soft: #e9e6e0;    /* Muted element fills */
--ease: cubic-bezier(0.16, 1, 0.3, 1); /* Universal transition curve */
--gutter: clamp(18px, 4vw, 64px);
--content-max: 1320px;
```

### Self-Hosted Fonts (`src/fonts/`)
- **Inter Tight (Variable)**: Primary display and body typography.
- **Instrument Serif (Regular & Italic)**: Editorial italic accent words on every section heading.
- **JetBrains Mono (Variable)**: Numeric indices, tags, badges, and code snippets.

---

## ⏳ Intro Loader ("Ink on paper")

The site features an editorial, high-performance intro loading animation adhering strictly to the "ink on paper" aesthetic:

### How It Works
1. **Real Signal Tracking**: Progress is computed as a weighted average of genuine browser signals—not a fake timer:
   - **30%**: `document.fonts.ready` resolution
   - **50%**: Hero video reaching `readyState >= 3` (`canplay` / `canplaythrough`) or poster still
   - **20%**: `window` load event
2. **Smooth rAF Interpolation**: A requestAnimationFrame loop eases toward the target progress so the counter (`000` → `100`) and the 1px hairline progress bar never jump backward.
3. **Pacing & Safety**: Minimum display time is 1.2s (600ms for `prefers-reduced-motion`) so it is never a jarring flash. A hard cap of 3.5s guarantees that slow network conditions or video buffering never block the visitor.
4. **Visual Elements**:
   - Center initials mark (`LK`) drawn with SVG `stroke-dashoffset` (~1.1s, `var(--ease)`), followed by sequential letter fade-ins.
   - Padded tabular-nums counter and 1px ink hairline progress bar.
   - Masked line reveals (`.rv-mask`) for "Lokesh Kagitha / Full Stack Developer" (bottom-left) and "Loading" (bottom-right).
   - Once complete, counter/bar fade out and the overlay lifts away via `clip-path: inset(0 0 100% 0)` over 0.9s `var(--ease)`, seamlessly revealing the hero underneath while hero typography rises in.
5. **Scroll & Motion Safety**: Scroll is locked (`html overflow hidden`, `lenis.stop()`) while visible and unlocked immediately on exit (`lenis.start()`). Focus transitions smoothly to the hero heading.
6. **Runs on Reload**: The loading animation triggers on initial visit and whenever the visitor reloads the page.
7. **No-JS Fallback**: Client-rendered only; with JavaScript disabled, the loader markup is omitted entirely.

### How to Disable the Loader
To disable the intro loader globally across the entire project, set `SHOW_LOADER = false` in `src/lib/data.ts`:

```ts
// src/lib/data.ts
export const SHOW_LOADER = false;
```

---

## 🛡️ Credits & Licenses

All brand logos and assets adhere to official open-source licenses:

- **Simple Icons**: [CC0 1.0 Universal License](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md)
  - JavaScript, HTML5, CSS3, MySQL, Java, React, Node.js, Express, Firebase, Git, GitHub, VS Code, Postman, Claude AI, ChatGPT, GSAP, LinkedIn.
- **Devicon**: [MIT License](https://github.com/devicons/devicon/blob/master/LICENSE)
  - VS Code, LinkedIn, CSS3 original vectors.
- **Lenis Smooth Scroll**: [MIT License](https://github.com/darkroomengineering/lenis/blob/main/LICENSE)
- **Source Résumé & Media**: Provided by Lokesh Kagitha (`resume.pdf`, `intro.mp4`).

---

## 📱 Mobile QA & Responsive Verification

The entire portfolio is engineered mobile-first and rigorously tested for zero horizontal overflow, touch target ergonomics (minimum 44×44px hit areas), safe-area insets, dynamic viewport units (`100svh`/`100dvh`), and hardware-accelerated animations.

### Tested Viewports

| Device Profile | Dimensions | Aspect Ratio | Horizontal Overflow | Touch Violations |
| :--- | :---: | :---: | :---: | :---: |
| **Compact Phone** | 360 × 640 | 9:16 | **0px (PASSED)** | **0 violations** |
| **iPhone SE / Small Phone** | 375 × 667 | 9:16 | **0px (PASSED)** | **0 violations** |
| **iPhone 12 / 13 / 14 / 15** | 390 × 844 | ~19.5:9 | **0px (PASSED)** | **0 violations** |
| **iPhone Plus / Max** | 414 × 896 | ~19.5:9 | **0px (PASSED)** | **0 violations** |
| **iPhone 14 / 15 Pro Max** | 430 × 932 | ~19.5:9 | **0px (PASSED)** | **0 violations** |
| **Small Tablet / iPad** | 768 × 1024 | 3:4 | **0px (PASSED)** | **0 violations** |
| **Landscape Phone** | 844 × 390 | ~2:1 | **0px (PASSED)** | **0 violations** |
| **Desktop Baseline (Regression)** | 1440 × 900 | 16:10 | **0px (PASSED)** | **0 violations** |

### Automated QA Test Script

An automated Playwright test suite validates all responsive constraints:
```bash
python scripts/test-mobile.py
```

### Verified Behaviors
1. **Zero Horizontal Overflow**: `html, body { overflow-x: clip; }` across all viewports (`document.documentElement.scrollWidth === window.innerWidth`).
2. **Touch Target Compliance**: All interactive buttons, chips, links, and switches are ≥ 44×44px on coarse pointer devices with safe padding.
3. **Mobile Fullscreen Navigation**: Traps keyboard focus, locks page scroll (`html, body { overflow: hidden; }` + `lenis.stop()`), scales typography to fit 360×640 without scrolling, and closes on Escape or link selection.
4. **Skills Mobile Strip**: Inspects element on tap under filter chips with 72px brand logo, dismissible on re-tap or outside tap.
5. **Horizontal Achievements Gallery**: Dynamically derived container height using `track.scrollWidth - viewportWidth + 100svh` measured via ResizeObserver. Direct DOM transform via rAF scroll handler. Fluid card sizing and reduced-motion vertical list fallback.
6. **Grayscale Fidelity & Performance**: 100% white/black/grays (no colored comments/borders). CLS = 0 with explicit media aspect ratios.

