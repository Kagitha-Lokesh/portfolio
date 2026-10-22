import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

function runAvatarTests() {
  console.log('================================================================================');
  console.log('          LOKI Avatar Animation & Greeting System Verification Suite          ');
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

  // Set up JSDOM environment with data-loaded on documentElement
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
  (window as any).matchMedia = () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  });

  // Execute widget code in JSDOM
  const scriptEl = window.document.createElement('script');
  scriptEl.textContent = widgetCode;
  window.document.body.appendChild(scriptEl);

  const LokiWidget = (window as any).LokiWidget;
  assert('LokiWidget object is exposed on window', !!LokiWidget);

  LokiWidget.init({
    owner: 'Lokesh',
    title: 'Loki',
  });

  const host = window.document.querySelector('[data-loki-widget]');
  assert('Host element [data-loki-widget] is created in document', !!host);

  const shadowRoot = host ? host.shadowRoot : null;
  assert('Shadow DOM root is open and attached to host', !!shadowRoot);

  if (!shadowRoot) {
    console.error('Shadow root not found, aborting further checks');
    return;
  }

  // Check bubble elements in Shadow DOM
  const bubble = shadowRoot.querySelector('#bubble') as HTMLElement | null;
  const bubbleText = shadowRoot.querySelector('#bubbleText') as HTMLElement | null;
  const bubbleClose = shadowRoot.querySelector('#bubbleClose') as HTMLElement | null;
  const bubbleArrow = shadowRoot.querySelector('.lk-bubble-arrow') as HTMLElement | null;
  const launcher = shadowRoot.querySelector('#launcher') as HTMLElement | null;
  const panel = shadowRoot.querySelector('#panel') as HTMLElement | null;

  assert('Speech bubble element #bubble exists in Shadow DOM', !!bubble);
  assert('Speech bubble text #bubbleText exists', !!bubbleText);
  assert('Speech bubble close button #bubbleClose exists', !!bubbleClose);
  assert('Speech bubble arrow .lk-bubble-arrow exists', !!bubbleArrow);
  assert('Launcher #launcher exists', !!launcher);
  assert('Panel #panel exists', !!panel);

  // Verify speech bubble accessibility attributes
  assert('Bubble has role="status"', bubble?.getAttribute('role') === 'status');
  assert('Bubble has aria-live="polite"', bubble?.getAttribute('aria-live') === 'polite');
  assert('Close button has aria-label="Dismiss greeting"', bubbleClose?.getAttribute('aria-label') === 'Dismiss greeting');

  // Verify initial state: bubble is initially not visible (.show not present)
  assert('Bubble initially does not have class "show"', !bubble?.classList.contains('show'));

  // Test SVG avatar structure
  const launcherMini = shadowRoot.querySelector('#lHost');
  assert('Launcher avatar host #lHost exists', !!launcherMini);

  const launcherSvg = launcherMini?.querySelector('svg');
  assert('Loki robot SVG is rendered inside launcher', !!launcherSvg);
  assert('SVG has named float group data-r="float"', !!launcherSvg?.querySelector('[data-r="float"]'));
  assert('SVG has named head group data-r="head"', !!launcherSvg?.querySelector('[data-r="head"]'));
  assert('SVG has named horn groups data-r="hornL" and data-r="hornR"', !!launcherSvg?.querySelector('[data-r="hornL"]') && !!launcherSvg?.querySelector('[data-r="hornR"]'));
  assert('SVG has eyes group data-r="eyes"', !!launcherSvg?.querySelector('[data-r="eyes"]'));
  assert('SVG has left eye data-r="eyeL" and right eye data-r="eyeR"', !!launcherSvg?.querySelector('[data-r="eyeL"]') && !!launcherSvg?.querySelector('[data-r="eyeR"]'));

  // Wait for initial greeting timer (1800ms) to fire
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      assert('After initial delay, speech bubble receives .show class', bubble?.classList.contains('show') === true);
      assert('Speech bubble displays initial greeting text', bubbleText?.textContent === "Hi there! Need a hand?");

      // Test clicking the speech bubble opens the assistant
      bubble?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

      assert('Clicking bubble opens chat panel (.open class on panel)', panel?.classList.contains('open') === true);
      assert('Clicking bubble hides speech bubble (.show removed)', !bubble?.classList.contains('show'));

      // Test close button
      const closeBtn = shadowRoot.querySelector('#close') as HTMLElement | null;
      closeBtn?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      assert('Clicking close button closes chat panel', !panel?.classList.contains('open'));

      // Test Destroy and cleanup
      LokiWidget.destroy();
      assert('LokiWidget.destroy() cleanly removes host element', !window.document.querySelector('[data-loki-widget]'));

      // Test Scenario 2: Explicit dismissal via close button (×)
      LokiWidget.init({ owner: 'Lokesh', title: 'Loki' });
      const host2 = window.document.querySelector('[data-loki-widget]')!;
      const root2 = host2.shadowRoot!;
      const bubble2 = root2.querySelector('#bubble') as HTMLElement;
      const bubbleClose2 = root2.querySelector('#bubbleClose') as HTMLElement;

      setTimeout(() => {
        assert('Second instance triggers greeting', bubble2.classList.contains('show'));
        bubbleClose2.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        assert('Clicking × dismisses the bubble immediately', !bubble2.classList.contains('show'));

        LokiWidget.destroy();
        assert('Second instance destroy clean', !window.document.querySelector('[data-loki-widget]'));

        console.log('================================================================================');
        console.log(`Verification Results: ${passed}/${total} assertions passed successfully.`);
        console.log('================================================================================');
        resolve();
      }, 2000);
    }, 2000);
  });
}

runAvatarTests();
