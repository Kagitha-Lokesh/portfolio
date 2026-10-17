from playwright.sync_api import sync_playwright
import cv2

viewports = [
    ("desktop_1920", 1920, 1080),
    ("laptop_1440", 1440, 900),
    ("tablet_768", 768, 1024),
    ("mobile_390", 390, 844)
]

mask_css = "linear-gradient(to right, black 0%, black calc(50% - 30px), transparent calc(50% - 15px), transparent calc(50% + 20px), black calc(50% + 35px), black 100%)"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    for name, w, h in viewports:
        page = browser.new_page(viewport={"width": w, "height": h})
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.wait_for_timeout(500)
        
        page.evaluate(f"""() => {{
            const textWrap = document.querySelector('#hero [aria-hidden="true"]');
            if (textWrap) {{
                textWrap.style.maskImage = '{mask_css}';
                textWrap.style.webkitMaskImage = '{mask_css}';
            }}
        }}""")
        page.wait_for_timeout(400)
        shot = f"scratch/tight_verified_{name}.png"
        page.screenshot(path=shot)
        print(f"Saved {shot}")
        page.close()
        
    browser.close()
