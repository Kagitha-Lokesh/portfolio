from playwright.sync_api import sync_playwright
import os

viewports = [
    ("desktop_1920", 1920, 1080),
    ("laptop_1440", 1440, 900),
    ("tablet_768", 768, 1024),
    ("mobile_390", 390, 844)
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    for name, w, h in viewports:
        page = browser.new_page(viewport={"width": w, "height": h})
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.wait_for_timeout(500)
        
        # Test native video + targeted mask
        page.evaluate("""() => {
            const canvas = document.querySelector('#hero canvas');
            if (canvas) canvas.style.display = 'none';

            const video = document.querySelector('#hero video');
            if (video) {
                video.className = 'w-full h-full object-contain select-none pointer-events-none';
                video.style.opacity = '1';
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.position = 'relative';
                video.style.mixBlendMode = 'multiply';
                video.style.zIndex = '1';
            }

            const textWrap = document.querySelector('#hero [aria-hidden="true"]');
            if (textWrap) {
                // Center torso mask: transparent only in the center torso (calc(50% - 50px) to calc(50% + 55px))
                // with a smooth 15px fade on either side:
                // black 0% -> black calc(50% - 65px) -> transparent calc(50% - 45px) -> transparent calc(50% + 55px) -> black calc(50% + 75px) -> black 100%
                const mask = 'linear-gradient(to right, black 0%, black calc(50% - 65px), transparent calc(50% - 45px), transparent calc(50% + 55px), black calc(50% + 75px), black 100%)';
                textWrap.style.maskImage = mask;
                textWrap.style.webkitMaskImage = mask;
            }
        }""")
        
        page.wait_for_timeout(500)
        shot_path = f"scratch/test_targeted_mask_{name}.png"
        page.screenshot(path=shot_path)
        print(f"Saved {shot_path}")
        page.close()
        
    browser.close()
