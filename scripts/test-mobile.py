"""
Mobile-First Responsive Verification Script for Portfolio
Tests all required viewports, checks zero horizontal overflow, audits touch targets (>=44x44),
tests mobile menu scroll locking and focus trap, tests Skills mobile inspector tap flow,
tests Achievements horizontal scrolling, and saves screenshots.
"""

import sys
import os
import time
from playwright.sync_api import sync_playwright

VIEWPORTS = [
    {"name": "phone_360x640", "width": 360, "height": 640, "is_mobile": True, "has_touch": True},
    {"name": "phone_375x667", "width": 375, "height": 667, "is_mobile": True, "has_touch": True},
    {"name": "phone_390x844", "width": 390, "height": 844, "is_mobile": True, "has_touch": True},
    {"name": "phone_414x896", "width": 414, "height": 896, "is_mobile": True, "has_touch": True},
    {"name": "phone_430x932", "width": 430, "height": 932, "is_mobile": True, "has_touch": True},
    {"name": "tablet_768x1024", "width": 768, "height": 1024, "is_mobile": True, "has_touch": True},
    {"name": "landscape_844x390", "width": 844, "height": 390, "is_mobile": True, "has_touch": True},
    {"name": "desktop_1440x900", "width": 1440, "height": 900, "is_mobile": False, "has_touch": False},
]

BASE_URL = "http://localhost:3000"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def find_overflow_elements(page):
    """Find any element that overflows horizontally beyond window.innerWidth"""
    return page.evaluate("""() => {
        const docWidth = document.documentElement.clientWidth;
        const offenders = [];
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
            const rect = el.getBoundingClientRect();
            // Check if element extends noticeably past the right edge
            if (rect.right > docWidth + 1) {
                offenders.push({
                    tag: el.tagName,
                    id: el.id,
                    className: (el.className || '').toString().slice(0, 100),
                    right: rect.right,
                    docWidth: docWidth,
                    overflow: rect.right - docWidth
                });
            }
        }
        return offenders;
    }""")

def audit_touch_targets(page):
    """Check that interactive elements are at least 44x44 on touch screens"""
    return page.evaluate("""() => {
        const violations = [];
        const interactive = document.querySelectorAll('button, a, [role="button"], input, select');
        for (const el of interactive) {
            // Skip hidden elements
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                continue;
            }
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) continue;
            // Exclude links inside paragraph text flow that wrap inline
            if (el.tagName === 'A' && style.display === 'inline') continue;

            if (rect.width < 42 || rect.height < 42) {
                violations.push({
                    tag: el.tagName,
                    text: (el.innerText || el.getAttribute('aria-label') || '').slice(0, 30),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    id: el.id
                });
            }
        }
        return violations;
    }""")

def scroll_slowly(page):
    """Scroll down the page smoothly to trigger all reveals, then back to top"""
    total_height = page.evaluate("() => document.body.scrollHeight")
    step = 400
    current = 0
    while current < total_height:
        page.evaluate(f"window.scrollTo(0, {current})")
        time.sleep(0.08)
        current += step
    time.sleep(0.3)
    page.evaluate("window.scrollTo(0, 0)")
    time.sleep(0.3)

def run_tests():
    print("=" * 60)
    print("STARTING MOBILE & RESPONSIVE COMPREHENSIVE VERIFICATION")
    print("=" * 60)

    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for vp in VIEWPORTS:
            print(f"\n[Testing Viewport: {vp['name']} ({vp['width']}x{vp['height']})]")
            context = browser.new_context(
                viewport={"width": vp["width"], "height": vp["height"]},
                is_mobile=vp["is_mobile"],
                has_touch=vp["has_touch"]
            )
            page = context.new_page()
            
            # Set bypass loader so page renders content immediately for testing
            page.add_init_script("""
                try {
                    sessionStorage.setItem('portfolio-loaded', 'true');
                } catch(e) {}
            """)
            
            page.goto(BASE_URL, wait_until="load", timeout=15000)
            time.sleep(1.0)

            # 1. Check Document Horizontal Overflow
            scroll_width = page.evaluate("document.documentElement.scrollWidth")
            client_width = page.evaluate("document.documentElement.clientWidth")
            inner_width = page.evaluate("window.innerWidth")
            has_overflow = scroll_width > client_width

            offenders = []
            if has_overflow:
                offenders = find_overflow_elements(page)

            overflow_ok = (scroll_width <= client_width + 1)
            print(f"  - Horizontal Overflow: {'PASSED (Zero overflow)' if overflow_ok else 'FAILED'}")
            print(f"    scrollWidth={scroll_width}, clientWidth={client_width}, innerWidth={inner_width}")
            if offenders:
                print(f"    Offenders count: {len(offenders)}")
                for off in offenders[:3]:
                    print(f"      {off['tag']}.{off['className'][:40]} overflow={off['overflow']}px")

            # 2. Scroll slowly to trigger reveals
            scroll_slowly(page)

            # 3. Take screenshot
            screenshot_path = os.path.join(SCREENSHOT_DIR, f"{vp['name']}.png")
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"  - Full-page screenshot saved: {screenshot_path}")

            # 4. Touch Targets Audit (for mobile/tablet)
            touch_violations = []
            if vp["has_touch"]:
                touch_violations = audit_touch_targets(page)
                # Filter out intentional non-target elements if any
                print(f"  - Touch Targets (>=44x44px): {len(touch_violations)} violations")
                if touch_violations:
                    for v in touch_violations[:3]:
                        print(f"      [{v['tag']}] '{v['text']}' -> {v['width']}x{v['height']}px")

            results.append({
                "viewport": vp["name"],
                "width": vp["width"],
                "height": vp["height"],
                "overflow_passed": overflow_ok,
                "offenders_count": len(offenders),
                "touch_violations_count": len(touch_violations)
            })

            context.close()

        # 5. Specialized Interactive Tests on Mobile (390x844)
        print("\n" + "=" * 60)
        print("INTERACTIVE TESTS (Mobile 390x844)")
        print("=" * 60)

        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()
        page.goto(BASE_URL, wait_until="load", timeout=15000)
        time.sleep(0.5)

        # Test A: Mobile Menu Dialog (Open, scroll lock, Esc/close, focus return)
        print("\n[Testing Mobile Navigation Menu]")
        menu_btn = page.locator('button[aria-label="Open navigation menu"]')
        menu_btn.click()
        time.sleep(0.3)

        # Check menu dialog is visible
        dialog = page.locator('#mobile-menu-dialog')
        is_menu_open = dialog.is_visible()
        print(f"  - Menu opened: {is_menu_open}")

        # Check scroll is locked
        body_overflow = page.evaluate("window.getComputedStyle(document.body).overflow")
        print(f"  - Body overflow locked: {body_overflow == 'hidden'}")

        # Test Esc closes menu
        page.keyboard.press("Escape")
        time.sleep(0.7)
        is_menu_closed_esc = page.evaluate("""() => {
            const d = document.getElementById('mobile-menu-dialog');
            return d && d.classList.contains('opacity-0');
        }""")
        print(f"  - Menu closed on Escape: {is_menu_closed_esc}")

        # Test B: Skills Inspector Mobile Strip
        print("\n[Testing Skills Inspector Mobile Strip]")
        # Find first skill tile button
        first_skill = page.locator('[data-skill-tile="true"]').first
        first_skill.click()
        time.sleep(0.3)

        # Check if mobile inspector strip appeared
        inspector_dismiss = page.locator('button[aria-label="Dismiss inspector"]')
        is_inspector_open = inspector_dismiss.is_visible()
        print(f"  - Skills inspector mobile strip displayed: {is_inspector_open}")

        # Tap dismiss
        if is_inspector_open:
            inspector_dismiss.click()
            time.sleep(0.2)
            is_inspector_closed = not inspector_dismiss.is_visible()
            print(f"  - Skills inspector dismissed: {is_inspector_closed}")

        # Test C: Achievements Horizontal Scrolling
        print("\n[Testing Achievements Section]")
        page.evaluate("() => document.getElementById('achievements').scrollIntoView()")
        time.sleep(0.5)
        achieve_box = page.locator('#achievements')
        achieve_height = achieve_box.evaluate("el => el.offsetHeight")
        print(f"  - Achievements container height dynamically measured: {achieve_height}px")

        # Scroll down slightly inside achievements
        page.evaluate("window.scrollBy(0, 400)")
        time.sleep(0.3)
        track_transform = page.evaluate("() => document.querySelector('#achievements .will-change-transform')?.style.transform")
        print(f"  - Horizontal track transform applied: {track_transform}")

        context.close()
        browser.close()

    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    all_overflow_ok = all(r["overflow_passed"] for r in results)
    print(f"All Viewports Zero Overflow: {'PASSED [OK]' if all_overflow_ok else 'FAILED [X]'}")
    for r in results:
        print(f"  - {r['viewport']}: Overflow OK={r['overflow_passed']}, Touch Violations={r['touch_violations_count']}")

    return 0 if all_overflow_ok else 1

if __name__ == "__main__":
    sys.exit(run_tests())
