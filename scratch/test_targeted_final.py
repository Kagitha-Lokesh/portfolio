from playwright.sync_api import sync_playwright
import cv2

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
            const mask = 'linear-gradient(to right, black 0%, black calc(50% - 75px), transparent calc(50% - 55px), transparent calc(50% + 115px), black calc(50% + 130px), black 100%)';
            textWrap.style.maskImage = mask;
            textWrap.style.webkitMaskImage = mask;
        }
    }""")
    
    page.wait_for_timeout(500)
    page.screenshot(path="scratch/test_refined_mask.png")
    browser.close()

img = cv2.imread("scratch/test_refined_mask.png")
crop = img[60:800, 500:1420]
cv2.imwrite("scratch/test_refined_mask_crop.png", crop)

torso = crop[250:550, 250:680]
cv2.imwrite("scratch/torso_zoom_refined.png", torso)
print("Saved refined torso zoom!")
