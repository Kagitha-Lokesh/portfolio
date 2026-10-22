import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

function runMobileTests() {
  console.log('================================================================================');
  console.log('       LOKI COMPANION — Dedicated Mobile & Touch Verification Suite            ');
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

  // 1. Mobile Touch Environment Simulation (375x667 iPhone-like viewport)
  const domMobile = new JSDOM(
    `<!DOCTYPE html><html data-loaded="true"><head></head><body></body></html>`,
    {
      url: 'http://localhost:3000/',
      runScripts: 'dangerously',
      pretendToBeVisual: true,
    }
  );

  const { window: win } = domMobile;
  (win as any).innerWidth = 375;
  (win as any).innerHeight = 667;
  (win as any).requestAnimationFrame = (cb: Function) => setTimeout(() => cb(Date.now()), 16);
  (win as any).cancelAnimationFrame = (id: number) => clearTimeout(id);

  // MatchMedia supporting mobile pointer queries
  (win as any).matchMedia = (query: string) => {
    const isCoarse = query.includes('pointer: coarse') || query.includes('hover: none');
    const isMobileWidth = query.includes('max-width:480px') || query.includes('max-width:640px');
    return {
      matches: isCoarse || isMobileWidth,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  };

  const scriptEl = win.document.createElement('script');
  scriptEl.textContent = widgetCode;
  win.document.body.appendChild(scriptEl);

  const LokiWidget = (win as any).LokiWidget;
  assert('LokiWidget object is exposed on window in mobile environment', !!LokiWidget);

  LokiWidget.init({
    owner: 'Lokesh',
    title: 'Loki',
  });

  const host = win.document.querySelector('[data-loki-widget]');
  const shadowRoot = host ? host.shadowRoot : null;
  assert('Shadow DOM root is open and attached to mobile host', !!shadowRoot);
  if (!shadowRoot) return;

  const styleEl = shadowRoot.querySelector('style');
  const css = styleEl ? styleEl.textContent || '' : '';

  // 2. Mobile CSS and Restrained Keyframe Assertions
  assert('Mobile stylesheet includes @media (max-width:640px), (hover:none) and (pointer:coarse)', css.includes('(hover:none) and (pointer:coarse)'));
  assert('Mobile stylesheet includes restrained waving animation lkwavearm-mob', css.includes('lkwavearm-mob'));
  assert('Mobile stylesheet includes restrained celebrating animation lkcelebarmL-mob', css.includes('lkcelebarmL-mob'));
  assert('Mobile stylesheet includes restrained pointing animation lkpointarm-mob', css.includes('lkpointarm-mob'));
  assert('Mobile stylesheet includes restrained beckoning animation lkbeckonarm-mob', css.includes('lkbeckonarm-mob'));
  assert('Mobile stylesheet keeps "Ask Loki" launcher label readable with small{display:none}', css.includes('.launcher small{display:none}'));
  assert('Mobile stylesheet includes tactile touch feedback .launcher:active{transform:scale(0.97)}', css.includes('.launcher:active{transform:scale(0.97)}'));

  const bubble = shadowRoot.querySelector('#bubble') as HTMLElement;
  const bubbleText = shadowRoot.querySelector('#bubbleText') as HTMLElement;
  const launcher = shadowRoot.querySelector('#launcher') as HTMLElement;
  const panel = shadowRoot.querySelector('#panel') as HTMLElement;

  // 3. Initial Greeting on Mobile
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      assert('Initial mobile greeting bubble receives .show class', bubble.classList.contains('show'));
      assert(
        'Initial greeting text uses mobile-specific copy "Hey! Want to explore my portfolio?"',
        bubbleText.textContent === 'Hey! Want to explore my portfolio?'
      );
      assert('Chat panel remains closed while greeting is shown', !panel.classList.contains('open'));

      // 4. Touch-First Tapping Interaction
      launcher.click();
      assert('Tapping launcher opens chat immediately (.open on panel)', panel.classList.contains('open'));
      assert('Opening chat immediately hides speech bubble', !bubble.classList.contains('show'));

      // 5. Test Nav Button Auto-Close Behavior on Mobile
      const input = shadowRoot.querySelector('#q') as HTMLInputElement;
      const form = shadowRoot.querySelector('#form') as HTMLFormElement;

      input.value = 'freelance';
      form.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));

      setTimeout(() => {
        const navBtn = shadowRoot.querySelector('.lk-nav-btn') as HTMLElement;
        assert('Navigation button "View ..." is rendered in message', !!navBtn);
        if (navBtn) {
          navBtn.click();
          assert('Clicking "View ..." button automatically closes widget on mobile', !panel.classList.contains('open'));
        }

        // Test startContact hides suggestions on mobile and removes generic greeting
        LokiWidget.startContact();
        const chipsEl = shadowRoot.querySelector('#chips') as HTMLElement;
        assert('When user enters via contact/let\'s talk on mobile, suggestions chips are removed/hidden', chipsEl.hidden === true);
        const mobLogMsgs = shadowRoot.querySelectorAll('.msg.bot');
        assert(
          'When user enters via contact/let\'s talk on mobile, generic greeting is removed',
          !Array.from(mobLogMsgs).some((m) => (m.textContent || '').includes("Hi, I'm Loki, Lokesh's portfolio assistant"))
        );

        // Test Desktop behavior
        LokiWidget.destroy();

        const domDesktop = new JSDOM(
          `<!DOCTYPE html><html data-loaded="true"><head></head><body></body></html>`,
          { url: 'http://localhost:3000/', runScripts: 'dangerously', pretendToBeVisual: true }
        );
        (domDesktop.window as any).innerWidth = 1280;
        (domDesktop.window as any).innerHeight = 900;
        (domDesktop.window as any).requestAnimationFrame = (cb: Function) => setTimeout(() => cb(Date.now()), 16);
        (domDesktop.window as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
        (domDesktop.window as any).matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });

        const scriptDk = domDesktop.window.document.createElement('script');
        scriptDk.textContent = widgetCode;
        domDesktop.window.document.body.appendChild(scriptDk);

        const dkW = (domDesktop.window as any).LokiWidget;
        dkW.init({ owner: 'Lokesh', title: 'Loki' });

        // Test desktop startContact removes generic greeting
        dkW.startContact();
        const dkShadow = domDesktop.window.document.querySelector('[data-loki-widget]')?.shadowRoot;
        const dkPanel = dkShadow?.querySelector('#panel') as HTMLElement;
        const dkLogMsgs = dkShadow?.querySelectorAll('.msg.bot') || [];
        assert(
          'When user enters via contact/let\'s talk on Desktop, generic greeting is removed',
          !Array.from(dkLogMsgs).some((m) => (m.textContent || '').includes("Hi, I'm Loki, Lokesh's portfolio assistant"))
        );

        // Test desktop nav button retains open state
        const dkInput = dkShadow?.querySelector('#q') as HTMLInputElement;
        const dkForm = dkShadow?.querySelector('#form') as HTMLFormElement;

        dkInput.value = 'freelance';
        dkForm.dispatchEvent(new domDesktop.window.Event('submit', { bubbles: true, cancelable: true }));

        setTimeout(() => {
          const dkNavBtn = dkShadow?.querySelector('.lk-nav-btn') as HTMLElement;
          assert('Desktop navigation button is rendered', !!dkNavBtn);
          if (dkNavBtn) {
            dkNavBtn.click();
            assert('Clicking "View ..." button on Desktop keeps widget open (Desktop unchanged)', dkPanel.classList.contains('open'));
          }

          dkW.destroy();

          // 6. Test narrow mobile viewports: 320px
          const domNarrow = new JSDOM(
            `<!DOCTYPE html><html data-loaded="true"><head></head><body></body></html>`,
            { url: 'http://localhost:3000/', runScripts: 'dangerously', pretendToBeVisual: true }
          );
          (domNarrow.window as any).innerWidth = 320;
          (domNarrow.window as any).innerHeight = 568;
          (domNarrow.window as any).requestAnimationFrame = (cb: Function) => setTimeout(() => cb(Date.now()), 16);
          (domNarrow.window as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
          (domNarrow.window as any).matchMedia = (query: string) => ({
            matches: query.includes('pointer: coarse') || query.includes('max-width'),
            addEventListener: () => {},
            removeEventListener: () => {},
          });

          const scriptNarrow = domNarrow.window.document.createElement('script');
          scriptNarrow.textContent = widgetCode;
          domNarrow.window.document.body.appendChild(scriptNarrow);

          const narrowWidget = (domNarrow.window as any).LokiWidget;
          narrowWidget.init({ owner: 'Lokesh', title: 'Loki' });

          const narrowShadow = domNarrow.window.document.querySelector('[data-loki-widget]')?.shadowRoot;
          const narrowBubble = narrowShadow?.querySelector('#bubble') as HTMLElement;
          const narrowClose = narrowShadow?.querySelector('#bubbleClose') as HTMLElement;

          setTimeout(() => {
            assert('Narrow 320px viewport triggers mobile greeting cleanly', !!narrowBubble);

            // 7. Dismissing bubble stops unsolicited invitations
            narrowClose.click();
            assert('Clicking dismiss button hides bubble immediately', !narrowBubble.classList.contains('show'));

            narrowWidget.destroy();

            console.log('================================================================================');
            console.log(`Loki Mobile Suite Results: ${passed}/${total} assertions passed successfully.`);
            console.log('================================================================================');
            resolve();
          }, 2000);
        }, 1200);
      }, 1200);
    }, 2000);
  });
}

runMobileTests();
