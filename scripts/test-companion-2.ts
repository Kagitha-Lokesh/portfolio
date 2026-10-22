import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

function runCompanionTests() {
  console.log('================================================================================');
  console.log('       LOKI COMPANION 2.0 — SVG Character & Animation Verification Suite       ');
  console.log('================================================================================');

  let passed = 0;
  let total = 0;

  function assert(desc: string, condition: boolean) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${desc}`);
      process.exitCode = 1;
    }
  }

  const widgetJsPath = path.resolve(process.cwd(), 'public/loki-widget.js');
  const widgetCode = fs.readFileSync(widgetJsPath, 'utf8');

  const dom = new JSDOM(
    `<!DOCTYPE html><html data-loaded="true"><head></head><body></body></html>`,
    {
      url: 'http://localhost:3000/',
      runScripts: 'dangerously',
      pretendToBeVisual: true,
    }
  );

  const { window } = dom;

  // Polyfills
  (window as any).requestAnimationFrame = (cb: Function) => setTimeout(() => cb(Date.now()), 16);
  (window as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  });

  const scriptEl = window.document.createElement('script');
  scriptEl.textContent = widgetCode;
  window.document.body.appendChild(scriptEl);

  const LokiWidget = (window as any).LokiWidget;
  assert('LokiWidget object is exposed on window with version 2.0', LokiWidget && LokiWidget.version === '2.0');
  assert('LokiWidget exposes setCompanionState API', typeof LokiWidget.setCompanionState === 'function');

  LokiWidget.init({
    owner: 'Lokesh',
    title: 'Loki',
  });

  const host = window.document.querySelector('[data-loki-widget]');
  const shadowRoot = host ? host.shadowRoot : null;
  assert('Shadow DOM root is open', !!shadowRoot);
  if (!shadowRoot) return;

  const launcherMini = shadowRoot.querySelector('#lHost') as HTMLElement;
  const svg = launcherMini?.querySelector('svg');
  assert('SVG avatar is rendered inside launcher', !!svg);

  // 1. Character Anatomy Verifications
  assert('viewBox matches compact articulated robot companion dimensions (76 54 248 312)', svg?.getAttribute('viewBox') === '76 54 248 312');
  assert('SVG contains .lk-char-root or .loki-root group', !!svg?.querySelector('.loki-root'));
  assert('SVG contains ground shadow data-r="shadow"', !!svg?.querySelector('[data-r="shadow"]'));
  assert('SVG contains legs assembly data-r="legs"', !!svg?.querySelector('[data-r="legs"]'));
  assert('SVG contains left leg data-r="legL" and right leg data-r="legR"', !!svg?.querySelector('[data-r="legL"]') && !!svg?.querySelector('[data-r="legR"]'));
  assert('SVG contains torso body data-r="body"', !!svg?.querySelector('[data-r="body"]'));
  assert('SVG contains gold core reactor data-r="core"', !!svg?.querySelector('[data-r="core"]'));
  assert('SVG contains left arm data-r="armL" and right arm data-r="armR"', !!svg?.querySelector('[data-r="armL"]') && !!svg?.querySelector('[data-r="armR"]'));
  assert('SVG contains left hand data-r="handL" and right hand data-r="handR"', !!svg?.querySelector('[data-r="handL"]') && !!svg?.querySelector('[data-r="handR"]'));
  assert('SVG contains head assembly data-r="head"', !!svg?.querySelector('[data-r="head"]'));
  assert('SVG contains horns / antenna data-r="hornL" and data-r="hornR"', !!svg?.querySelector('[data-r="hornL"]') && !!svg?.querySelector('[data-r="hornR"]'));
  assert('SVG contains facial eyes assembly data-r="eyes"', !!svg?.querySelector('[data-r="eyes"]'));

  // 2. State System Verifications
  const statesToTest = [
    'greeting', 'waving', 'curious', 'attention', 'listening',
    'thinking', 'explaining', 'celebrating', 'pointing', 'beckoning', 'surprised', 'sleeping', 'goodbye'
  ];

  statesToTest.forEach((st) => {
    LokiWidget.setCompanionState(st);
    assert(`setCompanionState('${st}') applies .lk-st-${st} class`, launcherMini.classList.contains(`lk-st-${st}`));
  });

  // Returning to idle removes state classes
  LokiWidget.setCompanionState('idle');
  const hasRemainingState = statesToTest.some((st) => launcherMini.classList.contains(`lk-st-${st}`));
  assert('setCompanionState("idle") clears all state classes', !hasRemainingState);

  // 3. Timed State Transitions
  return new Promise<void>((resolve) => {
    LokiWidget.setCompanionState('curious', 100, () => {
      assert('Timed state callback executes on completion', true);
      assert('After timer, companion cleanly returns to idle', !launcherMini.classList.contains('lk-st-curious'));

      // 4. Reduced Motion Preference
      LokiWidget.destroy();

      const domRM = new JSDOM(
        `<!DOCTYPE html><html data-loaded="true"><head></head><body></body></html>`,
        { url: 'http://localhost:3000/', runScripts: 'dangerously', pretendToBeVisual: true }
      );
      (domRM.window as any).requestAnimationFrame = (cb: Function) => setTimeout(() => cb(Date.now()), 16);
      (domRM.window as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
      (domRM.window as any).matchMedia = (query: string) => ({
        matches: query.indexOf('prefers-reduced-motion') !== -1,
        addEventListener: () => {},
        removeEventListener: () => {},
      });

      const scriptRM = domRM.window.document.createElement('script');
      scriptRM.textContent = widgetCode;
      domRM.window.document.body.appendChild(scriptRM);

      const rmWidget = (domRM.window as any).LokiWidget;
      rmWidget.init({ owner: 'Lokesh', title: 'Loki' });

      const rmHost = domRM.window.document.querySelector('[data-loki-widget]')?.shadowRoot?.querySelector('#lHost') as HTMLElement;
      rmWidget.setCompanionState('waving');
      assert('Reduced motion disables decorative state animation classes on avatar host', !rmHost.classList.contains('lk-st-waving'));

      rmWidget.destroy();

      console.log('================================================================================');
      console.log(`Loki Companion 2.0 Results: ${passed}/${total} assertions passed successfully.`);
      console.log('================================================================================');
      resolve();
    });
  });
}

runCompanionTests();
