from playwright.sync_api import sync_playwright
import cv2
import numpy as np

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)

    # 1. Modify DOM live to test native video + masked ghost text
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
            const mask = 'linear-gradient(to right, black 0%, black calc(50% - min(180px, 20vw)), transparent calc(50% - min(130px, 15vw)), transparent calc(50% + min(130px, 15vw)), black calc(50% + min(180px, 20vw)), black 100%)';
            textWrap.style.maskImage = mask;
            textWrap.style.webkitMaskImage = mask;
        }
    }""")

    # Capture 5 frames at 200ms intervals during live playback
    for i in range(5):
        page.wait_for_timeout(200)
        shot_path = f'scratch/test_native_frame_{i}.png'
        page.screenshot(path=shot_path)
        print(f'Captured {shot_path}')

    browser.close()
