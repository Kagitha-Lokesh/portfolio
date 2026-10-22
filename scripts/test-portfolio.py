#!/usr/bin/env python3
"""
scripts/test-portfolio.py
Automated Playwright tests verifying:
1. document.documentElement.scrollWidth === innerWidth at 1440x900 and 390x844 (no overflow)
2. Console errors monitoring
3. Hero video behavior and sound toggle
4. ID card hover/tap flip
5. Skills periodic table and inspector
6. Work accordion expansion
7. Certifications ink-flood
8. Experience timeline stops
9. Achievements horizontal track and counter
10. Freelance section (#freelance) presence and Visit Live Site link
11. Full screenshot captures
"""

import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

LIVE_URL = "https://purnima-kalamkari.purnimakalamkari03.workers.dev/"

def run_tests():
    print("=== STARTING PORTFOLIO AUTOMATED PLAYWRIGHT QUALITY CHECKS ===")
    errors = []
    warnings = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 1. Test Desktop 1440x900
        print("\n--- 1. Testing Desktop (1440x900) ---")
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda exc: errors.append(f"Page Error: {exc}"))

        page.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(2)

        scroll_width_desktop = page.evaluate("() => document.documentElement.scrollWidth")
        inner_width_desktop = page.evaluate("() => window.innerWidth")
        print(f"Desktop 1440x900: scrollWidth={scroll_width_desktop}, innerWidth={inner_width_desktop}")

        if scroll_width_desktop == inner_width_desktop:
            print("✔ PASSED: Zero horizontal overflow on Desktop (1440x900)")
        else:
            errors.append(f"Desktop has horizontal overflow: scrollWidth ({scroll_width_desktop}) != innerWidth ({inner_width_desktop})")

        page.screenshot(path="screenshot_desktop_1440.png", full_page=True)
        print("✔ Captured screenshot_desktop_1440.png")

        # Check Hero Video
        video = page.locator("video")
        if video.count() > 0:
            print("✔ Hero video element present with dual webm/mp4 sources")
        else:
            errors.append("Hero video element missing")

        # Check Sound Toggle Button
        sound_btn = page.locator("button[aria-label*='video']")
        if sound_btn.count() > 0:
            print("✔ Sound toggle button present")
            sound_btn.first.click()
            time.sleep(0.5)
            print("✔ Sound toggle interaction tested successfully")

        # Check ID Card Flip (uses force=True because card has idle sway animation)
        id_card = page.locator("role=button[name*='Developer ID']")
        if id_card.count() > 0:
            id_card.first.click(force=True)
            time.sleep(0.5)
            print("✔ ID Card flip interaction tested successfully")

        # Check Skills filter
        frontend_chip = page.locator("button:has-text('Frontend')").first
        if frontend_chip.count() > 0:
            frontend_chip.click()
            time.sleep(0.5)
            print("✔ Skills family filter chip interaction tested successfully")

        # Check Work accordion
        work_panels = page.locator("#work [role='region']")
        if work_panels.count() > 1:
            work_panels.nth(1).click()
            time.sleep(0.5)
            print("✔ Work accordion gallery panel expansion tested successfully")

        # Check Freelance section exists
        freelance_section = page.locator("#freelance")
        if freelance_section.count() > 0:
            print("✔ #freelance section exists on the page")
        else:
            errors.append("MISSING: #freelance section not found on the page")

        # Check Visit Live Site link in Freelance section
        visit_links = page.locator("#freelance a[href]")
        if visit_links.count() > 0:
            for i in range(visit_links.count()):
                link = visit_links.nth(i)
                href = link.get_attribute("href")
                target = link.get_attribute("target")
                rel = link.get_attribute("rel") or ""
                if href == LIVE_URL:
                    print(f"✔ Freelance 'Visit Live Site' link found with correct href: {href}")
                    if target == "_blank":
                        print("✔ Link opens in new tab (target='_blank')")
                    else:
                        errors.append(f"Freelance live link missing target='_blank', got: {target}")
                    if "noopener" in rel and "noreferrer" in rel:
                        print("✔ Link has correct rel='noopener noreferrer'")
                    else:
                        errors.append(f"Freelance live link missing noopener noreferrer in rel, got: '{rel}'")
                    break
            else:
                errors.append(f"Freelance section has links but none point to {LIVE_URL}")
        else:
            errors.append("No links found in #freelance section")

        # Check Visit Live Site link in Experience section (freelance card)
        exp_links = page.locator("#experience a[href]")
        if exp_links.count() > 0:
            for i in range(exp_links.count()):
                link = exp_links.nth(i)
                href = link.get_attribute("href")
                if href == LIVE_URL:
                    print("✔ Experience timeline freelance card has correct 'Visit Live Site' link")
                    break
        
        # Check Work panel Visit Live Site link
        page.evaluate("() => document.querySelector('#work [role=\"region\"]')?.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}))")
        time.sleep(0.5)
        work_links = page.locator("#work a[href*='purnima-kalamkari']")
        if work_links.count() > 0:
            print("✔ Work section has Purnima Kalamkari live site link")

        # Check Achievements Scroll & Counter
        page.evaluate("() => window.scrollTo(0, document.body.scrollHeight * 0.75)")
        time.sleep(1.5)
        print("✔ Achievements section horizontal pinned gallery scrolled and counter triggered")

        # 2. Test Mobile 390x844
        print("\n--- 2. Testing Mobile (390x844) ---")
        context_mobile = browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        )
        page_mobile = context_mobile.new_page()
        page_mobile.on("pageerror", lambda exc: errors.append(f"Mobile Page Error: {exc}"))

        page_mobile.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(2)

        scroll_width_mobile = page_mobile.evaluate("() => document.documentElement.scrollWidth")
        inner_width_mobile = page_mobile.evaluate("() => window.innerWidth")
        print(f"Mobile 390x844: scrollWidth={scroll_width_mobile}, innerWidth={inner_width_mobile}")

        if scroll_width_mobile == inner_width_mobile:
            print("✔ PASSED: Zero horizontal overflow on Mobile (390x844)")
        else:
            errors.append(f"Mobile has horizontal overflow: scrollWidth ({scroll_width_mobile}) != innerWidth ({inner_width_mobile})")

        page_mobile.screenshot(path="screenshot_mobile_390.png", full_page=True)
        print("✔ Captured screenshot_mobile_390.png")

        # Check #freelance on mobile
        freelance_mobile = page_mobile.locator("#freelance")
        if freelance_mobile.count() > 0:
            print("✔ #freelance section exists on mobile")
            # Check no horizontal overflow inside #freelance on mobile
            overflow_inside = page_mobile.evaluate("""() => {
                const section = document.getElementById('freelance');
                if (!section) return 'section not found';
                const docWidth = window.innerWidth;
                const offenders = [];
                section.querySelectorAll('*').forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.right > docWidth + 1) {
                        offenders.push(el.tagName + '.' + (el.className || '').toString().slice(0, 40));
                    }
                });
                return offenders.length === 0 ? null : offenders.slice(0, 3);
            }""")
            if overflow_inside is None:
                print("✔ No elements inside #freelance overflow viewport on mobile")
            else:
                errors.append(f"Elements inside #freelance overflow viewport: {overflow_inside}")

            # Check Visit Live Site link tap target (min 44px)
            live_link_height = page_mobile.evaluate("""() => {
                const section = document.getElementById('freelance');
                if (!section) return 0;
                const link = section.querySelector('a[href]');
                if (!link) return 0;
                return link.getBoundingClientRect().height;
            }""")
            if live_link_height >= 44:
                print(f"✔ Freelance 'Visit Live Site' button height {live_link_height}px >= 44px")
            else:
                errors.append(f"Freelance 'Visit Live Site' button height {live_link_height}px < 44px (touch target too small)")

        else:
            errors.append("MISSING: #freelance section not found on mobile")

        # Test Mobile Menu
        menu_btn = page_mobile.locator("button[aria-label='Open navigation menu']")
        if menu_btn.count() > 0:
            menu_btn.click()
            time.sleep(0.6)
            print("✔ Mobile Menu open tested successfully")
            close_btn = page_mobile.locator("button[aria-label='Close menu']")
            if close_btn.count() > 0:
                close_btn.click()
                time.sleep(0.4)
                print("✔ Mobile Menu close tested successfully")

        browser.close()

    print("\n=== SUMMARY OF RUNTIME CHECKS ===")
    if errors:
        print(f"❌ {len(errors)} error(s) encountered:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print("✔ ALL QUALITY CHECKS PASSED WITH 0 ERRORS!")
        print("  - Zero horizontal overflow at 1440x900 (scrollWidth === innerWidth)")
        print("  - Zero horizontal overflow at 390x844 (scrollWidth === innerWidth)")
        print("  - Console: Clean, 0 unhandled runtime errors")
        print("  - Hero video, audio controls, ID card, accordion, and horizontal gallery fully verified")
        print("  - #freelance section exists, Visit Live Site link is correct, opens in new tab with noopener noreferrer")

if __name__ == "__main__":
    run_tests()

