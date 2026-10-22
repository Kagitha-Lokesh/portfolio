/*!
 * Loki floating assistant widget  v1.0
 * Drop-in: <script src="loki-widget.js" data-owner="Lokesh" defer></script>
 * No dependencies, no images, no external fonts. Styles live in a Shadow DOM,
 * so the host site's CSS cannot break it and it cannot break the host site.
 *
 * API (window.LokiWidget): init(opts), open(), close(), toggle(), setMood(name), destroy()
 * Options: owner, title, position ('right'|'left'), theme ('auto'|'light'|'dark'),
 *   offset (px), accent, accentInk, greeting, chips (array), answers (array of {k:[regex strings], r:reply}),
 *   onMessage (async (text) => string, plug in a real backend), idleSleepMs, zIndex
 * Script-tag data attributes: data-owner, data-title, data-position, data-theme, data-greeting, data-manual
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.LokiWidget && window.LokiWidget.__loaded) return;

  var SCRIPT = document.currentScript;
  var TAU = Math.PI * 2;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ---------------- reduced motion (live, not a one-time read) ---------------- */
  var rmq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduce = !!(rmq && rmq.matches);

  /* ---------------- geometry ---------------- */
  var HORN = 'M130 208 C104 192 98 156 108 130 C118 104 140 84 164 70 C150 92 142 108 142 128 C142 152 152 176 164 196 C154 202 142 206 130 208Z';
  var STRIPE = 'M128 104 C108 124 100 168 140 204 C122 176 122 140 128 104Z';
  var uid = 0;

  function lokiMarkup(p) {
    var hornBody = '<path d="' + HORN + '" fill="url(#' + p + 'gold)"/>' +
      '<path d="' + STRIPE + '" fill="#0f0e0c"/>' +
      '<path d="M114 130 C124 106 142 88 160 74" fill="none" stroke="#fff8dc" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>';
    var hornGlow = '<path data-r="hg" d="' + HORN + '" fill="#ffe9a8" filter="url(#' + p + 'blur)" opacity="0"/>';
    var ear = '<rect x="103" y="206" width="24" height="50" rx="12" fill="url(#' + p + 'rim)"/>' +
      '<ellipse data-r="ear" cx="110.5" cy="231" rx="5.2" ry="19" fill="url(#' + p + 'earg)"/>' +
      '<ellipse cx="118.5" cy="231" rx="5.6" ry="21" fill="#0d0c0b"/>';
    var eye = function (n, x) {
      return '<g data-r="' + n + '" transform="translate(' + x + ' 233)"><path d="M-16 6 Q0 -22 16 6" fill="none" stroke="#ffeec8" stroke-width="5.5" stroke-linecap="round"/><circle r="0.01" fill="#ffeec8" opacity="0"/></g>';
    };
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="88 58 224 244" aria-hidden="true" focusable="false">' +
      '<defs>' +
      '<radialGradient id="' + p + 'helm" cx=".34" cy=".26" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#f7f3ea"/><stop offset=".8" stop-color="#e4ddcb"/><stop offset="1" stop-color="#c9c0aa"/></radialGradient>' +
      '<linearGradient id="' + p + 'rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#d6cdb7"/></linearGradient>' +
      '<linearGradient id="' + p + 'gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fcf2d2"/><stop offset=".45" stop-color="#e4c98a"/><stop offset="1" stop-color="#b48d47"/></linearGradient>' +
      '<linearGradient id="' + p + 'visor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f1d1a"/><stop offset="1" stop-color="#040404"/></linearGradient>' +
      '<linearGradient id="' + p + 'gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="' + p + 'earg" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fff3d2"/><stop offset="1" stop-color="#e6cd92"/></radialGradient>' +
      /* one blur only (the original used two per frame); cheaper to re-rasterise */
      '<filter id="' + p + 'glow" x="-60%" y="-80%" width="220%" height="260%"><feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="' + p + 'blur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4"/></filter>' +
      '<clipPath id="' + p + 'clip"><rect x="134" y="190" width="132" height="82" rx="41"/></clipPath>' +
      '</defs>' +
      '<g class="lk-intro"><g data-r="float"><g data-r="head">' +
      '<ellipse cx="200" cy="217" rx="80" ry="72" fill="url(#' + p + 'helm)" stroke="rgba(13,13,13,0.12)" stroke-width="1.5"/>' +
      '<path d="M124 206 Q200 160 276 206" fill="none" stroke="#d3cab4" stroke-width="1.2" opacity=".8"/>' +
      '<g data-r="hornL">' + hornGlow + hornBody + '</g>' +
      '<g data-r="hornR"><g transform="translate(400 0) scale(-1 1)">' + hornGlow + hornBody + '</g></g>' +
      '<g>' + ear + '</g><g transform="translate(400 0) scale(-1 1)">' + ear + '</g>' +
      '<rect x="127" y="184" width="146" height="94" rx="47" fill="url(#' + p + 'rim)"/>' +
      '<rect x="134" y="190" width="132" height="82" rx="41" fill="url(#' + p + 'visor)"/>' +
      '<g clip-path="url(#' + p + 'clip)"><g data-r="gloss"><path d="M138 200 Q178 188 222 192 Q172 208 142 240Z" fill="url(#' + p + 'gloss)"/><ellipse cx="156" cy="206" rx="9" ry="3.4" transform="rotate(-18 156 206)" fill="#fff" opacity=".28"/></g></g>' +
      '<g data-r="eyes" filter="url(#' + p + 'glow)">' + eye('eyeL', 167) + eye('eyeR', 233) + '</g>' +
      '<path d="M200 150 C203 168 214 180 219 187 C210 190 204 196 200 204 C196 196 190 190 181 187 C186 180 197 168 200 150Z" fill="url(#' + p + 'gold)"/>' +
      '<path d="M200 172 L205 184 L200 197 L195 184Z" fill="#0f0e0c"/>' +
      '</g></g></g></svg>';
  }

  /* ---------------- moods ---------------- */
  function E(c, w, dot, pr, ex, ey) { return { c: c, w: w, dot: dot, pr: pr, ex: ex, ey: ey }; }
  var A = E(-12, 16, 0, 6, 0, 0);
  var MOODS = {
    happy:     { L: A, R: A, ear: .75, tilt: 0, gaze: 1, hg: 0, glow: 1, talk: 0 },
    listening: { L: E(-12, 16, 1, 8.5, 0, 0), R: E(-12, 16, 1, 8.5, 0, 0), ear: 1, tilt: -3, gaze: 1.2, hg: 0, glow: 1, talk: 0 },
    thinking:  { L: E(-12, 16, 1, 6, 9, -9), R: E(-12, 16, 1, 6, 9, -9), ear: .5, tilt: -5, gaze: .3, hg: 0, glow: 1, talk: 0 },
    speaking:  { L: A, R: A, ear: 1, tilt: 0, gaze: .8, hg: 0, glow: 1, talk: 1 },
    mischief:  { L: A, R: E(0, 15, 0, 6, 0, 1), ear: .8, tilt: 6, gaze: .8, hg: 1, glow: 1, talk: 0 },
    sleepy:    { L: E(7, 15, 0, 6, 0, 3), R: E(7, 15, 0, 6, 0, 3), ear: .2, tilt: 7, gaze: 0, hg: 0, glow: .55, talk: 0 }
  };
  function flat(m) {
    var o = { ear: m.ear, tilt: m.tilt, gaze: m.gaze, hg: m.hg, glow: m.glow, talk: m.talk };
    ['L', 'R'].forEach(function (k) { var e = m[k]; for (var n in e) o[k + n] = e[n]; });
    return o;
  }

  /* ---------------- formatting & security helpers ---------------- */
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function stripInternalMarkers(raw) {
    if (!raw) return '';
    return raw
      .replace(/\[\[CONTACT_DRAFT\]\][\s\S]*?(?=(\[\[NAV_ACTION|$))/g, '')
      .replace(/\[\[NAV_ACTION\]\][\s\S]*?(?=(\[\[CONTACT_DRAFT|$))/g, '')
      .replace(/\[\[CONTACT_DRAFT[\s\S]*$/, '')
      .replace(/\[\[NAV_ACTION[\s\S]*$/, '')
      .trim();
  }

  function extractNavAction(raw) {
    if (!raw) return null;
    var match = raw.match(/\[\[NAV_ACTION\]\](\{[\s\S]*?\})/);
    if (!match || !match[1]) return null;
    try {
      var p = JSON.parse(match[1]);
      if (p && typeof p.section === 'string' && typeof p.label === 'string') {
        return { section: p.section.toLowerCase(), label: p.label.trim() };
      }
    } catch (e) {}
    return null;
  }

  function extractContactDraft(raw) {
    if (!raw) return null;
    var match = raw.match(/\[\[CONTACT_DRAFT\]\](\{[\s\S]*?\})/);
    if (!match || !match[1]) return null;
    try {
      var p = JSON.parse(match[1]);
      if (p && typeof p === 'object') {
        return {
          name: (p.name || '').trim(),
          email: (p.email || '').trim(),
          message: (p.message || '').trim()
        };
      }
    } catch (e) {
      var nameM = match[1].match(/"name"\s*:\s*"([^"]+)"/);
      var emailM = match[1].match(/"email"\s*:\s*"([^"]+)"/);
      var msgM = match[1].match(/"message"\s*:\s*"([\s\S]*?)"\s*}/);
      if (nameM || emailM || msgM) {
        return {
          name: nameM ? nameM[1].trim() : '',
          email: emailM ? emailM[1].trim() : '',
          message: msgM ? msgM[1].replace(/\\n/g, '\n').trim() : ''
        };
      }
    }
    return null;
  }

  function formatMarkdown(text, customRenderer) {
    if (!text) return '';
    if (typeof customRenderer === 'function') {
      return customRenderer(text);
    }
    if (typeof window !== 'undefined' && typeof window.LokiMarkdownRenderer === 'function') {
      return window.LokiMarkdownRenderer(text);
    }
    var escaped = escapeHtml(text);

    // Headings
    escaped = escaped.replace(/^### (.*$)/gim, '<strong style="display:block;margin:6px 0 2px;font-size:14px;color:var(--ink);">$1</strong>');
    
    // Bold **text**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic *text*
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Links [text](url)
    escaped = escaped.replace(/\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Bullet lists - item
    escaped = escaped.replace(/^[ \t]*[-*] (.*$)/gim, '<div class="lk-li">$1</div>');
    
    // Paragraph formatting
    var paragraphs = escaped.split(/\n\s*\n/);
    var html = paragraphs.map(function (p) {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<div class="lk-li">') || p.startsWith('<strong style="display:block')) return p;
      return '<p style="margin:0 0 6px;">' + p.replace(/\n/g, '<br>') + '</p>';
    }).filter(Boolean).join('');

    return html || escaped;
  }

  /* ---------------- CSS (Shadow DOM) ---------------- */
  var CSS = [
    '*{box-sizing:border-box}',
    '.wrap{--paper:#f4f2ee;--card:#ffffff;--ink:#0d0d0d;--ink-2:#3a3a3a;--mute:#77756f;--faint:#a9a6a0;',
    '--line:rgba(13,13,13,0.1);--line-light:rgba(13,13,13,0.07);--line-hover:rgba(13,13,13,0.22);--soft:#e9e6e0;',
    '--bubble-bot:#f4f2ee;--bubble-bot-border:rgba(13,13,13,0.08);--bubble-me:#0d0d0d;--bubble-me-ink:#ffffff;',
    '--shadow-launcher:0 4px 20px -2px rgba(13,13,13,0.08),0 2px 6px -1px rgba(13,13,13,0.04);',
    '--shadow-launcher-hover:0 8px 26px -2px rgba(13,13,13,0.14),0 3px 8px -1px rgba(13,13,13,0.06);',
    '--shadow-panel:0 24px 60px -12px rgba(13,13,13,0.15),0 8px 24px -4px rgba(13,13,13,0.06);',
    '--off:20px;--ease:cubic-bezier(0.16,1,0.3,1);',
    '--font:var(--font-inter-tight),ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
    '--font-mono:var(--font-jetbrains-mono),ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;',
    'font:14.5px/1.55 var(--font);color:var(--ink);-webkit-text-size-adjust:100%}',
    'button{font:inherit;color:inherit;cursor:pointer}',
    ':focus-visible{outline:2px solid var(--ink);outline-offset:2px}',
    '.mini{display:block;flex:none;width:38px;height:42px}',
    '.mini svg{display:block;width:100%;height:100%;overflow:visible}',

    /* Desktop launcher: warm white pill, subtle border, near-black typography, natural shadow */
    '.launcher{position:fixed;z-index:1;bottom:calc(var(--off) + env(safe-area-inset-bottom,0px));right:calc(var(--off) + env(safe-area-inset-right,0px));',
    'display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:9999px;background:var(--card);color:var(--ink);padding:5px 18px 5px 7px;',
    'box-shadow:var(--shadow-launcher);transition:box-shadow .25s var(--ease),border-color .25s var(--ease);-webkit-tap-highlight-color:transparent;cursor:pointer}',
    '.launcher:hover,.launcher:focus-visible{border-color:var(--line-hover);box-shadow:var(--shadow-launcher-hover)}',
    '.launcher:active{transform:none}',
    '.launcher .lbl{display:flex;flex-direction:column;text-align:left;line-height:1.25}',
    '.launcher strong{font-size:13.5px;font-weight:600;color:var(--ink);letter-spacing:-.01em}',
    '.launcher small{font-size:11px;font-weight:400;color:var(--mute);letter-spacing:0;margin-top:1px}',
    '.wrap[data-pos="left"] .launcher{right:auto;left:calc(var(--off) + env(safe-area-inset-left,0px))}',

    /* Invitation speech bubble: clean minimal card matching portfolio design */
    '.lk-bubble{position:fixed;z-index:2;bottom:calc(var(--off) + 54px + env(safe-area-inset-bottom,0px));right:calc(var(--off) + env(safe-area-inset-right,0px));',
    'max-width:min(270px,calc(100vw - 2 * var(--off)));display:flex;align-items:center;gap:8px;padding:8px 10px 8px 14px;',
    'background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:14px;box-shadow:0 8px 24px -4px rgba(13,13,13,0.1),0 2px 6px -1px rgba(13,13,13,0.04);',
    'font-size:12.5px;font-weight:500;line-height:1.35;letter-spacing:-.01em;opacity:0;visibility:hidden;transform:translateY(8px) scale(0.96);transform-origin:bottom right;',
    'transition:opacity .25s var(--ease),transform .25s var(--ease),visibility 0s .25s;pointer-events:none;cursor:pointer;-webkit-tap-highlight-color:transparent}',
    '.wrap[data-pos="left"] .lk-bubble{right:auto;left:calc(var(--off) + env(safe-area-inset-left,0px));transform-origin:bottom left}',
    '.lk-bubble.show{opacity:1;visibility:visible;transform:none;pointer-events:auto;transition:opacity .25s var(--ease),transform .25s var(--ease)}',
    '.lk-bubble:hover{transform:translateY(-2px);border-color:var(--line-hover);box-shadow:0 12px 30px -4px rgba(13,13,13,0.14),0 4px 10px -1px rgba(13,13,13,0.06)}',
    '.wrap.open .lk-bubble{opacity:0!important;visibility:hidden!important;pointer-events:none!important}',
    '.lk-bubble-text{flex:1;min-width:0;user-select:none;word-break:break-word}',
    '.lk-bubble-x{display:grid;place-items:center;width:20px;height:20px;padding:0;margin:0;border:0;border-radius:50%;background:transparent;color:var(--mute);cursor:pointer;flex-shrink:0;transition:color .15s ease,background .15s ease}',
    '.lk-bubble-x:hover{color:var(--ink);background:var(--paper)}',
    '.lk-bubble-x svg{width:11px;height:11px}',
    '.lk-bubble-arrow{position:absolute;bottom:-5px;right:105px;width:9px;height:9px;background:var(--card);border-right:1px solid var(--line);border-bottom:1px solid var(--line);transform:rotate(45deg)}',
    '@media (max-width:480px){.lk-bubble-arrow{right:68px}}',
    '.wrap[data-pos="left"] .lk-bubble-arrow{right:auto;left:26px}',

    /* Panel: clean white surface, thin subtle border, rounded-2xl, soft diffused shadow */
    '.panel{position:fixed;z-index:2;right:calc(var(--off) + env(safe-area-inset-right,0px));bottom:calc(var(--off) + 64px + env(safe-area-inset-bottom,0px));',
    'width:min(420px,calc(100vw - 2 * var(--off)));height:min(580px,calc(100vh - 120px));height:min(580px,calc(var(--vvh,100dvh) - 120px));',
    'display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow-panel);overflow:hidden;',
    'opacity:0;visibility:hidden;transform:translateY(12px) scale(.97);transform-origin:bottom right;transition:opacity .25s var(--ease),transform .25s var(--ease),visibility 0s .25s}',
    '.panel.open{opacity:1;visibility:visible;transform:none;transition:opacity .25s var(--ease),transform .25s var(--ease)}',
    '.wrap[data-pos="left"] .panel{right:auto;left:calc(var(--off) + env(safe-area-inset-left,0px));transform-origin:bottom left}',

    /* Clean light header: white background, subtle bottom divider, near-black title, muted subtitle */
    '.head{display:flex;align-items:center;gap:11px;padding:12px 14px 12px 16px;background:var(--card);border-bottom:1px solid var(--line-light)}',
    '.head .mini{width:38px;height:42px}',
    '.who{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.25}',
    '.who strong{font-size:15px;font-weight:600;color:var(--ink);letter-spacing:-.01em}',
    '.who span{font-size:11.5px;color:var(--mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px}',
    '.x{display:grid;place-items:center;width:32px;height:32px;border:0;border-radius:50%;background:transparent;color:var(--mute);transition:background .15s ease,color .15s ease}',
    '.x:hover{background:var(--paper);color:var(--ink)}',
    '.x svg{width:16px;height:16px;stroke-width:2}',

    /* Conversation log: light, clean background with custom smooth scroll */
    '.log{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:var(--line-hover) transparent;display:flex;flex-direction:column;gap:10px;padding:14px 14px 8px;background:var(--card)}',
    '.log:focus{outline:none}',
    '.log::-webkit-scrollbar{width:6px}',
    '.log::-webkit-scrollbar-track{background:transparent}',
    '.log::-webkit-scrollbar-thumb{background:var(--line-hover);border-radius:9999px}',
    '.log::-webkit-scrollbar-thumb:hover{background:var(--mute)}',
    '.msg{max-width:86%;padding:10px 14px;border-radius:16px;line-height:1.55;font-size:13.5px;overflow-wrap:break-word;word-break:normal}',
    '.msg strong{color:inherit;font-weight:600}',
    '.msg em{font-style:italic}',
    '.msg a{color:var(--ink);text-decoration:underline;text-underline-offset:3px;font-weight:500;transition:opacity .15s ease}',
    '.msg a:hover{opacity:.7}',
    '.msg.bot{align-self:flex-start;background:var(--bubble-bot);color:var(--ink);border:1px solid var(--bubble-bot-border);border-bottom-left-radius:4px;min-width:0}',
    '.msg.bot.lk-wide,.msg.bot:has(table),.msg.bot:has(pre){width:100%;max-width:100%}',
    '.msg.bot>*:first-child{margin-top:0!important}',
    '.msg.bot>*:last-child{margin-bottom:0!important}',
    '.msg.bot>*+*{margin-top:8px}',
    '.msg.bot p{margin:0;line-height:1.55}',
    '.msg.bot p+p{margin-top:8px}',
    '.msg.bot h1,.msg.bot h2,.msg.bot h3,.msg.bot h4,.msg.bot h5,.msg.bot h6{font-weight:600;color:var(--ink);line-height:1.3;margin:10px 0 4px}',
    '.msg.bot h1{font-size:16px}.msg.bot h2{font-size:15px}.msg.bot h3{font-size:14px}.msg.bot h4{font-size:13.5px}',
    '.msg.bot ul,.msg.bot ol{margin:6px 0;padding-left:20px}',
    '.msg.bot li{margin:3px 0;line-height:1.5}',
    '.msg.bot li>ul,.msg.bot li>ol{margin:2px 0;padding-left:18px}',
    '.msg.bot blockquote{margin:6px 0;padding:4px 12px;border-left:2px solid var(--line-hover);color:var(--mute);font-style:italic}',
    '.msg.bot hr{border:0;height:1px;background:var(--line);margin:10px 0}',
    '.msg.bot code{font-family:var(--font-mono);font-size:12px;background:var(--card);border:1px solid var(--line);border-radius:4px;padding:1px 5px;color:var(--ink)}',
    '.msg.bot pre{margin:6px 0;padding:10px 12px;background:var(--card);border:1px solid var(--line);border-radius:8px;overflow-x:auto;max-width:100%}',
    '.msg.bot pre code{background:transparent;border:0;padding:0;font-size:12px;line-height:1.45;color:var(--ink);white-space:pre}',
    '.lk-table-wrap{display:block;width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin:10px 0;border-radius:10px;border:1px solid var(--line);background:var(--card);box-shadow:0 1px 3px rgba(13,13,13,0.03)}',
    '.lk-table-wrap::-webkit-scrollbar{height:5px}',
    '.lk-table-wrap::-webkit-scrollbar-track{background:var(--paper);border-radius:9999px}',
    '.lk-table-wrap::-webkit-scrollbar-thumb{background:var(--line-hover);border-radius:9999px}',
    '.lk-table-wrap table{display:table;width:max-content;min-width:100%;border-collapse:collapse;font-size:12.5px;line-height:1.45;text-align:left;overflow-wrap:normal;word-break:normal}',
    '.lk-table-wrap th,.lk-table-wrap td{border:1px solid var(--line-light);padding:7px 11px;vertical-align:top;overflow-wrap:normal;word-break:normal}',
    '.lk-table-wrap th{font-family:var(--font-mono);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--mute);background:var(--paper);white-space:nowrap}',
    '.lk-table-wrap td{color:var(--ink);min-width:64px}',
    '.lk-table-wrap td:first-child{font-weight:600;min-width:115px;white-space:normal}',
    '.lk-table-wrap tr:nth-child(even) td{background:rgba(13,13,13,0.015)}',
    '.lk-table-wrap tr:hover td{background:rgba(13,13,13,0.035)}',
    '.msg.me{align-self:flex-end;background:var(--bubble-me);color:var(--bubble-me-ink);border:1px solid var(--bubble-me);border-bottom-right-radius:4px}',
    '.msg.dots{display:inline-flex;align-items:center;gap:5px;padding:12px 16px;background:var(--bubble-bot);border:1px solid var(--bubble-bot-border);border-bottom-left-radius:4px}',
    '.msg.dots i{width:5px;height:5px;border-radius:50%;background:var(--mute);opacity:.5;animation:lkdot 1.2s ease-in-out infinite}',
    '.msg.dots i:nth-child(2){animation-delay:.15s}.msg.dots i:nth-child(3){animation-delay:.3s}',

    /* Navigation action buttons: white pill button with subtle outline, hover ink */
    '.lk-nav-btn{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:5px 13px;font-size:11.5px;font-weight:500;border-radius:9999px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;transition:all .2s var(--ease);-webkit-tap-highlight-color:transparent}',
    '.lk-nav-btn:hover{background:var(--ink);color:var(--card);border-color:var(--ink);transform:translateY(-1px)}',
    '.lk-nav-btn svg{transition:transform .2s var(--ease)}',
    '.lk-nav-btn:hover svg{transform:translate(1px,-1px)}',

    /* In-widget Contact Card */
    '.lk-card{margin-top:8px;padding:12px 14px;border-radius:14px;background:var(--card);border:1px solid var(--line);box-shadow:0 2px 8px rgba(13,13,13,0.04);display:flex;flex-direction:column;gap:8px;font-size:13px;color:var(--ink)}',
    '.lk-card-head{font-family:var(--font-mono);font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--mute);display:flex;align-items:center;gap:6px}',
    '.lk-card-field{display:flex;flex-direction:column;gap:3px}',
    '.lk-card-field label{font-size:10.5px;color:var(--mute);font-weight:600;text-transform:uppercase;letter-spacing:.04em}',
    '.lk-card input,.lk-card textarea{width:100%;font:inherit;font-size:13px;padding:7px 10px;border-radius:8px;border:1px solid var(--line);background:var(--paper);color:var(--ink);outline:none;box-sizing:border-box;transition:border-color .15s ease,background-color .15s ease}',
    '.lk-card input:focus,.lk-card textarea:focus{border-color:var(--ink);background:var(--card)}',
    '.lk-card textarea{min-height:56px;resize:vertical}',
    '.lk-card-send{align-self:flex-start;padding:7px 16px;border:0;border-radius:9999px;background:var(--ink);color:var(--card);font-weight:500;font-size:12px;cursor:pointer;margin-top:2px;transition:opacity .15s ease,transform .15s ease}',
    '.lk-card-send:hover{opacity:.9;transform:translateY(-1px)}',
    '.lk-card-send:disabled{opacity:.45;cursor:not-allowed;transform:none}',
    '.lk-card-status{font-size:12px;line-height:1.35;margin-top:2px}',
    '.lk-card-status.error{color:#b91c1c}',
    '.lk-card-success{display:flex;align-items:flex-start;gap:8px;color:#166534;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 12px;font-size:12px}',
    '.lk-card-success svg{flex:none;margin-top:2px}',

    /* Suggested Question Chips: white pill buttons with subtle border, hover lift */
    '.chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;background:var(--card)}',
    '.chips[hidden]{display:none}',
    '.chip{display:inline-flex;align-items:center;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:9999px;padding:6px 13px;font-size:12px;font-weight:500;letter-spacing:-.01em;min-height:32px;cursor:pointer;transition:all .2s var(--ease);-webkit-tap-highlight-color:transparent}',
    '.chip:hover{background:var(--paper);border-color:var(--ink);transform:translateY(-1px)}',
    '.chip:active{transform:scale(.98)}',

    /* Input composer: warm white surface, rounded input pill, black Send button */
    '.form{display:flex;align-items:center;gap:8px;padding:10px 14px calc(12px + env(safe-area-inset-bottom,0px));background:var(--card);border-top:1px solid var(--line-light)}',
    '.form input{flex:1;min-width:0;font:inherit;font-size:13.5px;background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:9999px;padding:9px 16px;outline:none;transition:all .2s var(--ease)}',
    '.form input::placeholder{color:var(--mute)}',
    '.form input:focus{background:var(--card);border-color:var(--ink);box-shadow:0 0 0 2px rgba(13,13,13,0.05)}',
    '.send{flex:none;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:9999px;background:var(--ink);color:var(--card);padding:0 16px;font-weight:500;font-size:12.5px;min-height:38px;cursor:pointer;transition:background-color .15s ease,opacity .15s ease}',
    '.send:hover{background:var(--ink-2)}',
    '.send:disabled{opacity:.4;cursor:not-allowed}',
    '.sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}',

    /* Responsive mobile bottom sheet */
    '@media (max-width:480px){',
    '.panel{left:0;right:0;width:100%;bottom:var(--kb,0px);height:min(84dvh,calc(var(--vvh,100dvh) * .88));border-radius:22px 22px 0 0;border-left:0;border-right:0;border-bottom:0;transform-origin:bottom center}',
    '.wrap[data-pos="left"] .panel{left:0}',
    '.wrap.open .launcher{visibility:hidden}',
    '.launcher small{display:none}',
    '}',

    '.lk-intro{transform-box:fill-box;transform-origin:50% 75%;animation:lkpop .9s cubic-bezier(.2,.9,.25,1.12) both}',
    '.mini.lk-greeting{animation:lkgreet 850ms cubic-bezier(.2,.8,.25,1) both;transform-origin:50% 85%}',
    '.mini.lk-attention{animation:lkperk 700ms cubic-bezier(.2,.8,.25,1) both;transform-origin:50% 85%}',
    '.launcher:hover .mini,.launcher:focus-visible .mini{animation:lkhover 680ms cubic-bezier(.2,.8,.25,1) both;transform-origin:50% 85%}',
    '.launcher:hover .mini [data-r="eyes"],.launcher:focus-visible .mini [data-r="eyes"]{animation:lkeyehover 680ms ease-out both}',
    '.launcher:hover .mini [data-r="hornL"],.launcher:focus-visible .mini [data-r="hornL"]{animation:lkhornl 680ms ease-out both;transform-origin:140px 205px}',
    '.launcher:hover .mini [data-r="hornR"],.launcher:focus-visible .mini [data-r="hornR"]{animation:lkhornr 680ms ease-out both;transform-origin:260px 205px}',
    '@keyframes lkpop{from{opacity:0;transform:scale(.75) translateY(18px)}}',
    '@keyframes lkgreet{0%{transform:translateY(0) rotate(0deg) scale(1)}18%{transform:translateY(-8px) rotate(-8deg) scale(1.08)}40%{transform:translateY(-3px) rotate(7deg) scale(1.04)}65%{transform:translateY(-1px) rotate(-4deg) scale(1.02)}82%{transform:translateY(0) rotate(1.5deg) scale(1)}100%{transform:translateY(0) rotate(0deg) scale(1)}}',
    '@keyframes lkperk{0%{transform:translateY(0) rotate(0deg) scale(1)}25%{transform:translateY(-5px) rotate(-5deg) scale(1.05)}55%{transform:translateY(-2px) rotate(4deg) scale(1.02)}80%{transform:translateY(0) rotate(-1deg) scale(1)}100%{transform:translateY(0) rotate(0deg) scale(1)}}',
    '@keyframes lkhover{0%{transform:translateY(0) rotate(0deg) scale(1)}20%{transform:translateY(-3px) rotate(-7deg) scale(1.05)}45%{transform:translateY(-2px) rotate(6deg) scale(1.03)}70%{transform:translateY(-0.5px) rotate(-2deg) scale(1.01)}88%{transform:translateY(0) rotate(0.5deg) scale(1)}100%{transform:translateY(0) rotate(0deg) scale(1)}}',
    '@keyframes lkeyehover{0%,100%{filter:none}25%,60%{filter:brightness(1.3) drop-shadow(0 0 2px #ffeec8)}}',
    '@keyframes lkhornl{0%,100%{transform:rotate(0deg)}22%{transform:rotate(-6deg)}50%{transform:rotate(4deg)}78%{transform:rotate(-1.5deg)}}',
    '@keyframes lkhornr{0%,100%{transform:rotate(0deg)}22%{transform:rotate(6deg)}50%{transform:rotate(-4deg)}78%{transform:rotate(1.5deg)}}',
    '@keyframes lkdot{0%,100%{opacity:.35;transform:translateY(0)}50%{opacity:.9;transform:translateY(-3px)}}',
    '@media (prefers-reduced-motion:reduce){.lk-intro,.msg.dots i{animation:none!important}.panel,.panel.open,.launcher,.lk-bubble,.mini.lk-greeting,.mini.lk-attention,.launcher:hover .mini,.launcher:focus-visible .mini,.launcher:hover .mini [data-r="eyes"],.launcher:focus-visible .mini [data-r="eyes"],.launcher:hover .mini [data-r="hornL"],.launcher:focus-visible .mini [data-r="hornL"],.launcher:hover .mini [data-r="hornR"],.launcher:focus-visible .mini [data-r="hornR"]{animation:none!important;transition:none!important}}'
  ].join('');

  /* ---------------- defaults ---------------- */
  var DEFAULTS = {
    owner: 'Lokesh', title: 'Loki', position: 'right', theme: 'light', offset: 20,
    accent: null, accentInk: null,
    greeting: "Hi, I'm Loki, Lokesh's portfolio assistant. Ask me about his projects, technical skills, experience, or how to get in touch with him!",
    chips: [
      'Explore projects',
      'What technologies do you use?',
      'Tell me about your experience',
      'How can I contact Lokesh?'
    ],
    answers: null, onMessage: null, idleSleepMs: 60000, zIndex: 2147483000
  };

  var DEFAULT_ANSWERS = [
    { k: ['resume\\b', 'r\u00e9sum\u00e9', 'cv\\b'], r: "You can download Lokesh's r\u00e9sum\u00e9 directly using the button in the top navigation bar." },
    { k: ['contact\\b', 'hire\\b', 'email\\b', 'reach\\b', 'touch\\b', 'message\\b'], r: "You can get in touch with Lokesh through the Contact section below, or simply tell me your name, email, and message and I'll help you send it!" },
    { k: ['work\\b', 'project', 'portfolio\\b', 'freelance\\b'], r: "Lokesh's projects are featured in the Work section, and his client case studies are under Freelance. You can ask me about Purnima Kalamkari, JavaMentor, or Attendance Management!" },
    { k: ['skill', 'stack\\b', 'build\\b', 'tech\\b', 'code\\b', 'database\\b'], r: "The Skills section details his verified stack across JavaScript, React.js, Node.js, Express.js, MySQL, Firebase, and development tools." },
    { k: ['who\\b', 'about\\b', 'lokesh\\b'], r: "Lokesh Kagitha is a Full Stack Developer based in Andhra Pradesh, India, specializing in production-grade web systems and interactive interfaces." }
  ];

  var FALLBACK = "I can help you explore Lokesh's full-stack projects, technical skillset, work experience, education, or send him a message. What would you like to know?";

  /* ---------------- shared state ---------------- */
  var W = null;                 // the single live widget
  var pointer = { x: 0, y: 0, t: -1e9, on: false };

  /* ---------------- avatar instance ---------------- */
  function createAvatar(host, mood) {
    var id = 'lkw' + (++uid) + '_';
    host.innerHTML = lokiMarkup(id);
    var svg = host.firstElementChild;
    var q = function (n) { return svg.querySelector('[data-r="' + n + '"]'); };
    var qa = function (n) { return Array.prototype.slice.call(svg.querySelectorAll('[data-r="' + n + '"]')); };
    var eyeRef = function (n) { var g = q(n); return { g: g, p: g.querySelector('path'), d: g.querySelector('circle') }; };
    return {
      svg: svg, visible: true, rect: null, rectT: -1e9, lastT: 0,
      float: q('float'), head: q('head'), hornL: q('hornL'), hornR: q('hornR'),
      hg: qa('hg'), ear: qa('ear'), gloss: q('gloss'), eyes: q('eyes'),
      eL: eyeRef('eyeL'), eR: eyeRef('eyeR'),
      S: flat(MOODS[mood]), T: flat(MOODS[mood]),
      gx: 0, gy: 0, tx: 0, ty: 0, wanderAt: 0,
      sp: { p: 0, v: 0 }, phase: Math.random() * 6,
      blinkAt: 1.5 + Math.random() * 2, blinkStart: -9
    };
  }

  function setEye(ref, S, k, blink, bx, by, bounce) {
    var c = S[k + 'c'] * (1 - blink), w = S[k + 'w'], y0 = -c / 2, dot = clamp(S[k + 'dot'], 0, 1);
    ref.g.setAttribute('transform', 'translate(' + ((k === 'L' ? 167 : 233) + S[k + 'ex'] + bx).toFixed(2) + ' ' + (233 + S[k + 'ey'] + by + bounce).toFixed(2) + ')');
    ref.p.setAttribute('d', 'M' + (-w).toFixed(2) + ' ' + y0.toFixed(2) + ' Q0 ' + (y0 + 2 * c).toFixed(2) + ' ' + w.toFixed(2) + ' ' + y0.toFixed(2));
    ref.p.style.opacity = (1 - dot).toFixed(3);
    ref.d.setAttribute('r', Math.max(.01, S[k + 'pr'] * (1 - blink * .92)).toFixed(2));
    ref.d.style.opacity = dot.toFixed(3);
  }

  function step(I, t, dt, nowMs) {
    var S = I.S, T = I.T, k = 1 - Math.exp(-dt * 8), key, i;
    for (key in T) S[key] = lerp(S[key], T[key], k);

    if (!I.rect || nowMs - I.rectT > 400) { I.rect = I.svg.getBoundingClientRect(); I.rectT = nowMs; }
    var rect = I.rect;
    if (reduce) { I.tx = 0; I.ty = 0; }
    else if (pointer.on && nowMs - pointer.t < 4500) {
      var cx = rect.left + rect.width / 2, cy = rect.top + rect.height * .55, d = Math.max(rect.width, 320) * .9;
      I.tx = clamp((pointer.x - cx) / d, -1, 1); I.ty = clamp((pointer.y - cy) / d, -1, 1);
    } else if (t > I.wanderAt) {
      I.tx = (Math.random() - .5) * 1.2; I.ty = (Math.random() - .5) * .6;
      I.wanderAt = t + 1.8 + Math.random() * 2.6;
    }
    var gk = 1 - Math.exp(-dt * 5);
    I.gx = lerp(I.gx, I.tx * S.gaze, gk); I.gy = lerp(I.gy, I.ty * S.gaze, gk);

    I.sp.v += (-120 * I.sp.p - 9 * I.sp.v) * dt; I.sp.p += I.sp.v * dt;

    var blink = 0;
    if (!reduce) {
      if (t > I.blinkAt) { I.blinkStart = t; I.blinkAt = t + 2.6 + Math.random() * 3.6; }
      var bp = (t - I.blinkStart) / .16;
      if (bp >= 0 && bp <= 1) blink = Math.sin(bp * Math.PI);
    }
    if (S.gaze < .1) blink = 0;

    var fy = (reduce ? 0 : Math.sin(t * 1.25 + I.phase) * 2.5) + I.sp.p;
    var talkWave = reduce ? 0 : Math.sin(t * 14) * S.talk;
    I.float.setAttribute('transform', 'translate(0 ' + (fy + talkWave * 1.4).toFixed(2) + ')');

    var gx = I.gx, gy = I.gy;
    I.head.setAttribute('transform', 'translate(' + (gx * 5).toFixed(2) + ' ' + (gy * 3).toFixed(2) + ') rotate(' + (gx * 3.5 + S.tilt).toFixed(2) + ' 200 260)');
    var sway = reduce ? 0 : Math.sin(t * 1.6 + I.phase) * 1.2 + I.sp.p * .5, par = gx * 3;
    I.hornL.setAttribute('transform', 'translate(' + par.toFixed(2) + ' 0) rotate(' + (sway - gx * 2).toFixed(2) + ' 140 205)');
    I.hornR.setAttribute('transform', 'translate(' + par.toFixed(2) + ' 0) rotate(' + (-sway - gx * 2).toFixed(2) + ' 260 205)');
    var hgo = (S.hg * (reduce ? 1 : (.55 + .45 * Math.sin(t * 4)))).toFixed(3);
    for (i = 0; i < I.hg.length; i++) I.hg[i].setAttribute('opacity', hgo);
    var earO = S.ear * (1 - .3 * S.talk * (.5 + .5 * Math.sin(t * 10)));
    for (i = 0; i < I.ear.length; i++) I.ear[i].setAttribute('opacity', clamp(earO, 0, 1).toFixed(3));
    I.gloss.setAttribute('transform', 'translate(' + (-gx * 2.5).toFixed(2) + ' ' + (-gy * 1.5).toFixed(2) + ')');
    I.eyes.setAttribute('opacity', clamp(S.glow, 0, 1).toFixed(3));
    var bx = gx * 6.5, by = gy * 4;
    setEye(I.eL, S, 'L', blink, bx, by, talkWave * 1.2);
    setEye(I.eR, S, 'R', blink, bx, by, talkWave * 1.2);
  }

  /* ---------------- the widget ---------------- */
  function buildWidget(cfg) {
    // Avoid creating duplicate host elements
    var existingHost = document.querySelector('[data-loki-widget]');
    if (existingHost && existingHost.parentNode) {
      existingHost.parentNode.removeChild(existingHost);
    }

    var timers = [], listeners = [];
    var insts = [], current = 'happy', isOpen = false, busy = false, autoSlept = false;
    var rafId = 0, wakeUntil = 0, last = performance.now(), lastActive = performance.now();

    function on(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); listeners.push([target, ev, fn, opt]); }
    function later(fn, ms) { var id = setTimeout(function () { var i = timers.indexOf(id); if (i > -1) timers.splice(i, 1); fn(); }, ms); timers.push(id); return id; }

    /* DOM */
    var host = document.createElement('div');
    host.setAttribute('data-loki-widget', '');
    host.setAttribute('data-lenis-prevent', 'true');
    host.style.cssText = 'all:initial;position:fixed;z-index:' + cfg.zIndex + ';';
    var root = host.attachShadow({ mode: 'open' });
    root.innerHTML =
      '<style>' + CSS + '</style>' +
      '<div class="wrap" data-lenis-prevent="true" data-pos="' + (cfg.position === 'left' ? 'left' : 'right') + '" data-theme="' + (cfg.theme === 'dark' || cfg.theme === 'light' ? cfg.theme : 'auto') + '">' +
      '<section class="panel" id="panel" data-lenis-prevent="true" role="dialog" aria-labelledby="ttl">' +
        '<header class="head"><span class="mini" id="hHost"></span><div class="who"><strong id="ttl"></strong><span id="sub"></span></div>' +
        '<button class="x" id="close" type="button" aria-label="Close chat"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16"/></svg></button></header>' +
        '<div class="log" id="log" data-lenis-prevent="true" role="log" aria-live="off" aria-label="Conversation" tabindex="0"></div>' +
        '<div class="chips" id="chips"></div>' +
        '<form class="form" id="form"><input type="text" id="q" autocomplete="off" enterkeyhint="send" aria-label="Message"><button class="send" type="submit">Send</button></form>' +
      '</section>' +
      '<div class="lk-bubble" id="bubble" role="status" aria-live="polite">' +
        '<span class="lk-bubble-text" id="bubbleText"></span>' +
        '<button type="button" class="lk-bubble-x" id="bubbleClose" aria-label="Dismiss greeting">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4L4 12"/></svg>' +
        '</button>' +
        '<div class="lk-bubble-arrow" aria-hidden="true"></div>' +
      '</div>' +
      '<button class="launcher" id="launcher" type="button" aria-expanded="false" aria-controls="panel"><span class="mini" id="lHost"></span><span class="lbl"><strong id="lTitle"></strong><small id="lSub"></small></span></button>' +
      '<div class="sr" id="live" role="status" aria-live="polite"></div>' +
      '</div>';

    var $ = function (id) { return root.getElementById ? root.getElementById(id) : root.querySelector('#' + id); };
    var wrap = root.querySelector('.wrap'), panel = $('panel'), launcher = $('launcher'), log = $('log'),
        input = $('q'), chips = $('chips'), live = $('live'),
        bubble = $('bubble'), bubbleText = $('bubbleText'), bubbleClose = $('bubbleClose');

    wrap.style.setProperty('--off', cfg.offset + 'px');
    if (cfg.accent) wrap.style.setProperty('--accent', cfg.accent);
    if (cfg.accentInk) wrap.style.setProperty('--accent-ink', cfg.accentInk);
    $('ttl').textContent = cfg.title;
    $('sub').textContent = cfg.owner + "'s portfolio assistant";
    $('lTitle').textContent = 'Ask ' + cfg.title;
    $('lSub').textContent = 'Portfolio assistant';
    input.placeholder = "Ask " + cfg.title + " about " + cfg.owner + "'s work...";
    launcher.setAttribute('aria-label', 'Ask ' + cfg.title + ', ' + cfg.owner + "'s portfolio assistant");

    // Intro loader coordination: hide launcher until site loader finishes
    var isLoaded = typeof document !== 'undefined' && document.documentElement.getAttribute('data-loaded') === 'true';
    if (!isLoaded) {
      wrap.style.opacity = '0';
      wrap.style.pointerEvents = 'none';
      wrap.style.transition = 'opacity .4s ease-out';
      var onLoaderDone = function () {
        wrap.style.opacity = '';
        wrap.style.pointerEvents = '';
      };
      on(window, 'intro-loader-complete', onLoaderDone);
    }

    document.body.appendChild(host);

    /* avatars (one in the launcher, one in the header; only visible ones are animated) */
    var launchAv = createAvatar($('lHost'), current);
    var headAv = createAvatar($('hHost'), current);
    insts.push(launchAv, headAv);
    headAv.visible = false;

    /* answers */
    var rules = (cfg.answers || DEFAULT_ANSWERS).map(function (a) {
      return { re: new RegExp('\\b(?:' + a.k.join('|') + ')', 'i'), r: a.r };
    });
    function localAnswer(text) {
      for (var i = 0; i < rules.length; i++) if (rules[i].re.test(text)) return rules[i].r;
      return FALLBACK;
    }

    /* animation loop */
    function schedule() { if (!rafId) rafId = requestAnimationFrame(frame); }
    function wake(ms) { wakeUntil = Math.max(wakeUntil, performance.now() + (ms || 900)); schedule(); }
    function frame(now) {
      rafId = 0;
      for (var i = 0; i < insts.length; i++) {
        var I = insts[i];
        if (!I.visible) continue;
        var ddt = (now - I.lastT) / 1000;
        if (ddt < .032) continue; // ~30fps is plenty at 40px
        I.lastT = now;
        step(I, now / 1000, Math.min(.05, ddt), now);
      }
      if (!document.hidden && (!reduce || now < wakeUntil)) schedule();
    }
    on(document, 'visibilitychange', function () { if (!document.hidden) { last = performance.now(); schedule(); } });

    function setMood(name) {
      if (!MOODS[name]) return;
      current = name;
      var T = flat(MOODS[name]);
      insts.forEach(function (I) { I.T = T; });
      wake(900);
    }

    /* pointer / idle */
    on(window, 'pointermove', function (e) {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = performance.now(); pointer.on = true;
      lastActive = pointer.t;
      if (autoSlept) { autoSlept = false; setMood(isOpen ? 'listening' : 'happy'); }
    }, { passive: true });
    on(window, 'keydown', function () { lastActive = performance.now(); if (autoSlept) { autoSlept = false; setMood('happy'); } }, { passive: true });
    var idleTimer = setInterval(function () {
      if (!isOpen && !busy && current !== 'sleepy' && performance.now() - lastActive > cfg.idleSleepMs) { autoSlept = true; setMood('sleepy'); }
    }, 5000);

    /* viewport fitting: keeps the sheet above the on-screen keyboard on phones */
    var mq = window.matchMedia ? window.matchMedia('(max-width:480px)') : null;
    function fitViewport() {
      var vv = window.visualViewport;
      var h = vv ? vv.height : window.innerHeight;
      panel.style.setProperty('--vvh', h + 'px');
      var kb = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
      panel.style.setProperty('--kb', ((mq && mq.matches) ? kb : 0) + 'px');
      insts.forEach(function (I) { I.rect = null; });
      if (isOpen) log.scrollTop = log.scrollHeight;
    }
    if (window.visualViewport) { on(window.visualViewport, 'resize', fitViewport); on(window.visualViewport, 'scroll', fitViewport); }
    on(window, 'resize', fitViewport);
    fitViewport();

    /* reduced motion */
    if (rmq) {
      var rmHandler = function (e) { reduce = e.matches; wake(900); };
      if (rmq.addEventListener) rmq.addEventListener('change', rmHandler); else if (rmq.addListener) rmq.addListener(rmHandler);
      listeners.push([rmq, 'change', rmHandler, null, true]);
    }

    /* contact card generator */
    function createContactCard(draft) {
      var card = document.createElement('div');
      card.className = 'lk-card';
      card.innerHTML =
        '<div class="lk-card-head">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>' +
          '<span>Send Message to Lokesh</span>' +
        '</div>' +
        '<div class="lk-card-field">' +
          '<label>Your Name</label>' +
          '<input type="text" class="lk-c-name" placeholder="Your name" value="' + escapeHtml(draft.name || '') + '" />' +
        '</div>' +
        '<div class="lk-card-field">' +
          '<label>Your Email</label>' +
          '<input type="email" class="lk-c-email" placeholder="your.email@example.com" value="' + escapeHtml(draft.email || '') + '" />' +
        '</div>' +
        '<div class="lk-card-field">' +
          '<label>Message</label>' +
          '<textarea class="lk-c-msg" placeholder="Your message...">' + escapeHtml(draft.message || '') + '</textarea>' +
        '</div>' +
        '<input type="text" class="lk-c-web" style="display:none" tabindex="-1" autocomplete="off" />' +
        '<div class="lk-card-status" style="display:none"></div>' +
        '<button type="button" class="lk-card-send">Send to Lokesh</button>';

      var sendBtn = card.querySelector('.lk-card-send');
      var nameInput = card.querySelector('.lk-c-name');
      var emailInput = card.querySelector('.lk-c-email');
      var msgInput = card.querySelector('.lk-c-msg');
      var webInput = card.querySelector('.lk-c-web');
      var statusEl = card.querySelector('.lk-card-status');

      sendBtn.addEventListener('click', function () {
        var name = nameInput.value.trim();
        var email = emailInput.value.trim();
        var message = msgInput.value.trim();
        var website = webInput.value.trim();

        if (!name) {
          statusEl.className = 'lk-card-status error';
          statusEl.textContent = 'Please enter your name.';
          statusEl.style.display = 'block';
          return;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          statusEl.className = 'lk-card-status error';
          statusEl.textContent = 'Please enter a valid email address.';
          statusEl.style.display = 'block';
          return;
        }
        if (message.length < 10) {
          statusEl.className = 'lk-card-status error';
          statusEl.textContent = 'Message must be at least 10 characters long.';
          statusEl.style.display = 'block';
          return;
        }

        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
        statusEl.style.display = 'none';

        // Extract recent turns from chat log
        var turns = [];
        var msgEls = log.querySelectorAll('.msg');
        for (var j = 0; j < msgEls.length; j++) {
          var mel = msgEls[j];
          var isBot = mel.classList.contains('bot');
          var text = mel.textContent || '';
          if (text && !mel.classList.contains('dots')) {
            turns.push({ role: isBot ? 'assistant' : 'user', content: text });
          }
        }

        fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            email: email,
            message: message,
            website: website,
            recentChat: turns.slice(-6)
          })
        })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.error || 'Failed to send message.');
            return data;
          });
        })
        .then(function () {
          card.innerHTML =
            '<div class="lk-card-success">' +
              '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>' +
              '<div>' +
                '<strong>Message Delivered to Lokesh!</strong>' +
                '<p style="margin:4px 0 0;font-size:12px;opacity:.85">Thank you, ' + escapeHtml(name) + '! Lokesh has received your message and will reply to <strong>' + escapeHtml(email) + '</strong> shortly.</p>' +
              '</div>' +
            '</div>';
          setMood('happy');
          log.scrollTop = log.scrollHeight;
        })
        .catch(function (err) {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send to Lokesh';
          statusEl.className = 'lk-card-status error';
          statusEl.textContent = err.message || 'Unable to send right now. Please email kagithalokesh8@gmail.com directly.';
          statusEl.style.display = 'block';
          log.scrollTop = log.scrollHeight;
        });
      });

      return card;
    }

    /* chat */
    function addMsg(text, cls) {
      var d = document.createElement('div'); d.className = 'msg ' + cls; d.textContent = text; log.appendChild(d);
      // Cap log nodes to prevent unbounded memory growth
      while (log.children.length > 50) {
        log.removeChild(log.firstElementChild);
      }
      log.scrollTop = log.scrollHeight; return d;
    }

    function announce(text) { live.textContent = ''; later(function () { live.textContent = text; }, 60); }

    function finishSpeaking() {
      later(function () {
        busy = false;
        setMood(isOpen && root.activeElement === input ? 'listening' : 'happy');
      }, 400);
    }

    function speak(reply) {
      var navAction = extractNavAction(reply);
      var contactDraft = extractContactDraft(reply);
      var cleanText = stripInternalMarkers(reply);

      var el = addMsg('', 'bot');
      if (cleanText.indexOf('<table') !== -1 || cleanText.indexOf('|') !== -1 || cleanText.indexOf('```') !== -1) {
        el.classList.add('lk-wide');
      }
      announce(cleanText);
      setMood('speaking');

      // Render the complete Markdown response in one operation
      el.innerHTML = formatMarkdown(cleanText, cfg.renderMarkdown);
      if (el.querySelector('table, pre, .lk-table-wrap')) {
        el.classList.add('lk-wide');
      }

      if (navAction) {
        var navBtn = document.createElement('button');
        navBtn.type = 'button';
        navBtn.className = 'lk-nav-btn';
        navBtn.setAttribute('aria-label', 'Navigate to ' + navAction.label);
        navBtn.innerHTML = '<span>' + escapeHtml(navAction.label) + '</span> <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12L12 4M5 4h7v7"/></svg>';
        navBtn.addEventListener('click', function () {
          var target = document.getElementById(navAction.section);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        });
        el.appendChild(navBtn);
      }

      if (contactDraft) {
        var card = createContactCard(contactDraft);
        el.appendChild(card);
      }

      // Short fade-in of approx 250ms (disabled for prefers-reduced-motion)
      if (!reduce) {
        el.style.opacity = '0';
        el.style.transition = 'opacity 250ms ease-out';
        requestAnimationFrame(function () {
          el.style.opacity = '1';
        });
      }

      // Scroll so the top of the new response is visible in the chat viewport
      var targetScroll = el.offsetTop - 12;
      log.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: reduce ? 'auto' : 'smooth'
      });

      finishSpeaking();
    }

    function ask(text) {
      text = (text || '').trim(); if (!text || busy) return;
      engaged = true;
      hideBubble();
      if (greetingTimer) { clearTimeout(greetingTimer); greetingTimer = null; }
      if (invitationTimer) { clearTimeout(invitationTimer); invitationTimer = null; }
      busy = true; addMsg(text, 'me'); input.value = ''; chips.hidden = true;
      setMood('thinking');
      var dots = addMsg('', 'bot dots'); dots.setAttribute('aria-hidden', 'true'); dots.innerHTML = '<i></i><i></i><i></i>';
      var started = Date.now(), p;

      var timeoutPromise = new Promise(function (_, reject) {
        later(function () { reject(new Error('Request timed out.')); }, 25000);
      });

      try {
        var queryPromise = cfg.onMessage ? Promise.resolve(cfg.onMessage(text)) : Promise.resolve(localAnswer(text));
        p = Promise.race([queryPromise, timeoutPromise]);
      } catch (e) {
        p = Promise.reject(e);
      }

      p.then(function (r) {
        r = r == null ? '' : String(r);
        return r || FALLBACK;
      }, function () {
        return "Sorry, I couldn't get an answer just now. Please try again or reach Lokesh directly using the contact section.";
      })
      .then(function (reply) {
        var min = reduce ? 0 : (cfg.onMessage ? 400 : 900);
        later(function () {
          dots.remove();
          speak(reply);
        }, Math.max(0, min - (Date.now() - started)));
      });
    }

    var greeting = cfg.greeting || ("Hi, I'm " + cfg.title + ", " + cfg.owner + "'s assistant. Ask about his work, his skills, or how to reach him.");
    addMsg(greeting, 'bot');
    (cfg.chips || []).forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = c;
      b.addEventListener('click', function () { ask(c); });
      chips.appendChild(b);
    });
    if (!(cfg.chips && cfg.chips.length)) chips.hidden = true;

    on($('form'), 'submit', function (e) { e.preventDefault(); ask(input.value); });
    on(input, 'focus', function () { if (!busy) setMood('listening'); });
    on(input, 'input', function () { if (!busy && current !== 'listening') setMood('listening'); });
    on(input, 'blur', function () { if (!busy && current === 'listening') setMood('happy'); });

    /* open / close */
    function open() {
      if (isOpen) return;
      isOpen = true; autoSlept = false; engaged = true;
      hideBubble();
      if (greetingTimer) { clearTimeout(greetingTimer); greetingTimer = null; }
      if (invitationTimer) { clearTimeout(invitationTimer); invitationTimer = null; }
      panel.classList.add('open'); wrap.classList.add('open');
      launcher.setAttribute('aria-expanded', 'true');
      headAv.visible = true;
      launchAv.visible = !(mq && mq.matches); // hidden behind the sheet on phones
      fitViewport();
      if (current === 'sleepy') setMood('happy');
      wake(900);
      later(function () { log.scrollTop = log.scrollHeight; input.focus({ preventScroll: true }); }, 30);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      panel.classList.remove('open'); wrap.classList.remove('open');
      launcher.setAttribute('aria-expanded', 'false');
      headAv.visible = false; launchAv.visible = true;
      lastActive = performance.now();
      if (!busy) setMood('happy');
      launcher.focus({ preventScroll: true });
    }

    function startContact(customPrompt) {
      if (!isOpen) open();

      // Check if there is already an active contact card
      var hasCard = log.querySelector('.lk-contact-card');
      if (hasCard) {
        hasCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        var firstInput = hasCard.querySelector('input');
        if (firstInput) firstInput.focus();
        return;
      }

      // Check if the last bot message already asks for contact details
      var lastMsg = log.querySelector('.msg.bot:last-of-type');
      if (lastMsg && lastMsg.textContent && (
        lastMsg.textContent.indexOf('email address') !== -1 ||
        lastMsg.textContent.indexOf('help you get in touch') !== -1 ||
        lastMsg.textContent.indexOf('connect with Lokesh') !== -1
      )) {
        later(function () {
          input.focus({ preventScroll: true });
        }, 100);
        return;
      }

      var promptText = customPrompt || (
        "Hi there! I'd be glad to help you get in touch with Lokesh Kagitha.\n\n" +
        "Could you please share your **name**, **email address**, and a brief note about what you'd like to discuss? " +
        "I will set up an editable draft for you to review and send directly to him."
      );

      speak(promptText);
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('loki-assistant-spoke', {
            detail: { text: promptText }
          }));
        } catch (e) {}
      }
      input.placeholder = "Your name, email, and message...";
      later(function () {
        input.focus({ preventScroll: true });
      }, 150);
    }

    on(launcher, 'click', function () { isOpen ? close() : open(); });
    on($('close'), 'click', close);
    on(root, 'keydown', function (e) { if (e.key === 'Escape' && isOpen) { e.stopPropagation(); close(); } });
    on(launcher, 'pointerenter', function () { if (current === 'sleepy') setMood('happy'); wake(900); });
    on(launchAv.svg, 'click', function () { launchAv.sp.v = -90; });

    // Isolate scrolling so smooth-scroll libraries (Lenis, etc.) never hijack or block widget scrolling
    on(panel, 'wheel', function (e) { e.stopPropagation(); }, { passive: true });
    on(panel, 'touchmove', function (e) { e.stopPropagation(); }, { passive: true });

    // Listen for custom triggers from Contact & Start Conversation buttons
    on(window, 'open-loki-contact', function (e) {
      var p = e && e.detail && e.detail.prompt ? e.detail.prompt : null;
      startContact(p);
    });

    on(window, 'open-agent-widget', function (e) {
      var isContact = e && e.detail && e.detail.contact;
      if (isContact) {
        startContact(e.detail && e.detail.prompt ? e.detail.prompt : null);
      } else {
        open();
      }
    });

    /* ---------------- Greeting & Attention Invitation System ---------------- */
    var bubbleHideTimer = null, invitationTimer = null, greetingTimer = null;
    var hasGreeted = false, sessionDismissed = false, engaged = false;
    var invitationCount = 0;
    var maxInvitations = 3;
    var invitationIndex = 0;
    var INVITATIONS = [
      'Want to talk?',
      'Any questions about my work?',
      'Curious about a project? Ask me!',
      "I'm here if you need anything."
    ];

    function perkGreeting() {
      if (reduce) return;
      var hostEl = $('lHost');
      if (hostEl) {
        hostEl.classList.remove('lk-greeting', 'lk-attention');
        void hostEl.offsetWidth; // force reflow so animation runs fresh
        hostEl.classList.add('lk-greeting');
        later(function () {
          if (hostEl) hostEl.classList.remove('lk-greeting');
        }, 900);
      }
      setMood('mischief'); // playful wink & gold horn glow
      later(function () {
        if (!busy && current === 'mischief') setMood('happy');
      }, 550);
      wake(1600);
    }

    function perkInvitation() {
      if (reduce) return;
      var hostEl = $('lHost');
      if (hostEl) {
        hostEl.classList.remove('lk-greeting', 'lk-attention');
        void hostEl.offsetWidth;
        hostEl.classList.add('lk-attention');
        later(function () {
          if (hostEl) hostEl.classList.remove('lk-attention');
        }, 750);
      }
      setMood('happy');
      wake(1200);
    }

    function showBubble(text, durationMs) {
      if (!bubble || isOpen || sessionDismissed || engaged || document.hidden) return;
      if (bubbleText) bubbleText.textContent = text;
      bubble.classList.add('show');
      if (bubbleHideTimer) { clearTimeout(bubbleHideTimer); bubbleHideTimer = null; }
      bubbleHideTimer = later(function () {
        hideBubble();
      }, durationMs || 5000);
    }

    function hideBubble() {
      if (bubbleHideTimer) { clearTimeout(bubbleHideTimer); bubbleHideTimer = null; }
      if (bubble) bubble.classList.remove('show');
    }

    // Dismissal button on the speech bubble
    if (bubbleClose) {
      on(bubbleClose, 'click', function (e) {
        e.stopPropagation();
        sessionDismissed = true;
        hideBubble();
        if (invitationTimer) { clearTimeout(invitationTimer); invitationTimer = null; }
      });
    }

    // Clicking the bubble opens the chat
    if (bubble) {
      on(bubble, 'click', function (e) {
        if (e.target === bubbleClose || (bubbleClose && bubbleClose.contains(e.target))) return;
        hideBubble();
        open();
      });
    }

    function scheduleNextInvitation(delayMs) {
      if (invitationTimer) { clearTimeout(invitationTimer); invitationTimer = null; }
      if (sessionDismissed || engaged || invitationCount >= maxInvitations) return;

      invitationTimer = later(function () {
        if (sessionDismissed || engaged || isOpen || document.hidden || root.activeElement === input) {
          // If busy or tab is hidden, retry in 45s
          scheduleNextInvitation(45000);
          return;
        }

        var msg = INVITATIONS[invitationIndex % INVITATIONS.length];
        invitationIndex++;
        invitationCount++;
        perkInvitation();
        showBubble(msg, 6000);

        if (invitationCount < maxInvitations) {
          scheduleNextInvitation(140000 + Math.floor(Math.random() * 40000));
        }
      }, delayMs);
    }

    function triggerInitialGreeting() {
      if (hasGreeted || sessionDismissed || engaged || isOpen) return;
      hasGreeted = true;
      perkGreeting();
      showBubble("Hi there! Need a hand?", 5500);
      scheduleNextInvitation(26000);
    }

    // Coordinate initial greeting with loader
    if (!isLoaded) {
      on(window, 'intro-loader-complete', function () {
        greetingTimer = later(triggerInitialGreeting, 1200);
      });
    } else {
      greetingTimer = later(triggerInitialGreeting, 1800);
    }

    wake(1200);

    return {
      open: open,
      close: close,
      toggle: function () { isOpen ? close() : open(); },
      startContact: startContact,
      setMood: setMood,
      destroy: function () {
        clearInterval(idleTimer);
        if (bubbleHideTimer) clearTimeout(bubbleHideTimer);
        if (invitationTimer) clearTimeout(invitationTimer);
        if (greetingTimer) clearTimeout(greetingTimer);
        timers.forEach(clearTimeout); timers = [];
        if (rafId) cancelAnimationFrame(rafId);
        listeners.forEach(function (l) {
          if (l[4]) {
            if (l[0].removeEventListener) l[0].removeEventListener(l[1], l[2]);
            else if (l[0].removeListener) l[0].removeListener(l[2]);
          } else {
            l[0].removeEventListener(l[1], l[2], l[3]);
          }
        });
        listeners = []; insts = [];
        if (host.parentNode) host.parentNode.removeChild(host);
      }
    };
  }

  /* ---------------- public API ---------------- */
  function init(opts) {
    if (W) return api;
    var cfg = {};
    for (var k in DEFAULTS) cfg[k] = DEFAULTS[k];
    if (opts) for (var j in opts) if (opts[j] !== undefined) cfg[j] = opts[j];
    var go = function () {
      if (!W) {
        W = buildWidget(cfg);
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(new CustomEvent('loki-ready'));
          } catch (e) {}
        }
      }
    };
    if (document.body) go(); else document.addEventListener('DOMContentLoaded', go, { once: true });
    return api;
  }

  var api = {
    __loaded: true,
    version: '1.0',
    init: init,
    open: function () { W && W.open(); },
    close: function () { W && W.close(); },
    toggle: function () { W && W.toggle(); },
    startContact: function (p) {
      if (W) {
        W.startContact(p);
      } else {
        window.addEventListener('loki-ready', function () {
          if (W) W.startContact(p);
        }, { once: true });
      }
    },
    setMood: function (m) { W && W.setMood(m); },
    destroy: function () { if (W) { W.destroy(); W = null; } }
  };

  window.LokiWidget = api;

  /* auto-init from the script tag unless data-manual is set */
  if (SCRIPT && !SCRIPT.hasAttribute('data-manual')) {
    var ds = SCRIPT.dataset || {};
    init({
      owner: ds.owner,
      title: ds.title,
      position: ds.position,
      theme: ds.theme,
      greeting: ds.greeting,
      accent: ds.accent,
      accentInk: ds.accentInk
    });
  }
})();
