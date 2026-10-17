from playwright.sync_api import sync_playwright
import cv2

masks = [
    ("nomask", "none"),
    ("tight_30", "linear-gradient(to right, black 0%, black calc(50% - 30px), transparent calc(50% - 15px), transparent calc(50% + 20px), black calc(50% + 35px), black 100%)"),
    ("tight_50", "linear-gradient(to right, black 0%, black calc(50% - 40px), transparent calc(50% - 25px), transparent calc(50% + 35px), black calc(50% + 50px), black 100%)"),
    ("tight_70", "linear-gradient(to right, black 0%, black calc(50% - 50px), transparent calc(50% - 35px), transparent calc(50% + 50px), black calc(50% + 65px), black 100%)"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    page.goto("http://localhost:3000", wait_until="networkidle")
    page.wait_for_timeout(500)
    
    for name, mask_val in masks:
        page.evaluate(f"""() => {{
            const textWrap = document.querySelector('#hero [aria-hidden="true"]');
            if (textWrap) {{
                textWrap.style.maskImage = '{mask_val}';
                textWrap.style.webkitMaskImage = '{mask_val}';
            }}
        }}""")
        page.wait_for_timeout(300)
        shot = f"scratch/mask_eval_{name}.png"
        page.screenshot(path=shot)
        
        img = cv2.imread(shot)
        crop = img[60:800, 500:1420]
        cv2.imwrite(f"scratch/crop_eval_{name}.png", crop)
        print(f"Saved scratch/crop_eval_{name}.png")
        
    browser.close()
