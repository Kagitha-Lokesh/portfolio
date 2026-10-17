from playwright.sync_api import sync_playwright
import cv2

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    page.goto("http://localhost:3000", wait_until="networkidle")
    page.wait_for_timeout(500)
    
    # Remove mask from ghost text
    page.evaluate("""() => {
        const textWrap = document.querySelector('#hero [aria-hidden="true"]');
        if (textWrap) {
            textWrap.style.maskImage = 'none';
            textWrap.style.webkitMaskImage = 'none';
        }
    }""")
    
    page.wait_for_timeout(500)
    page.screenshot(path="scratch/test_zero_mask_full.png")
    browser.close()

img = cv2.imread("scratch/test_zero_mask_full.png")
crop = img[60:800, 500:1420]
cv2.imwrite("scratch/test_zero_mask_hero.png", crop)
print("Saved scratch/test_zero_mask_hero.png successfully!")
