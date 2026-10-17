from playwright.sync_api import sync_playwright
import cv2
import numpy as np

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    page.goto("http://localhost:3000", wait_until="networkidle")
    page.wait_for_timeout(500)
    
    page.evaluate("""() => {
        const contentContainer = document.querySelector('.content-container.relative.z-10');
        if (contentContainer) {
            contentContainer.classList.remove('z-10');
        }

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
        }

        const textWrap = document.querySelector('#hero [aria-hidden="true"]');
        if (textWrap) {
            const mask = 'linear-gradient(to right, black 0%, black calc(50% - min(75px, 12vw)), transparent calc(50% - min(55px, 9vw)), transparent calc(50% + min(115px, 16vw)), black calc(50% + min(130px, 18vw)), black 100%)';
            textWrap.style.maskImage = mask;
            textWrap.style.webkitMaskImage = mask;
        }
    }""")
    
    crops = []
    # Capture 10 frames at 100ms intervals
    for i in range(10):
        page.wait_for_timeout(100)
        shot = f"scratch/live_frame_{i}.png"
        page.screenshot(path=shot)
        img = cv2.imread(shot)
        # Crop shoulder (his left shoulder, viewer's right: y: 200..380, x: 990..1120)
        sh = img[200:380, 990:1120]
        crops.append(sh)
        
    combined = np.hstack(crops)
    cv2.imwrite("scratch/live_10_shoulder_frames.png", combined)
    print("Saved scratch/live_10_shoulder_frames.png!")
    browser.close()
