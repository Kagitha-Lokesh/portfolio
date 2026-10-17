from playwright.sync_api import sync_playwright
from PIL import Image

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)

    for dist in [100, 130, 160, 190]:
        page.evaluate(f'''() => {{
            const textWrap = document.querySelector('#hero [aria-hidden="true"]');
            const mask = 'linear-gradient(to right, black 0%, black calc(50% - {dist + 20}px), transparent calc(50% - {dist - 10}px), transparent calc(50% + {dist - 10}px), black calc(50% + {dist + 20}px), black 100%)';
            textWrap.style.maskImage = mask;
            textWrap.style.webkitMaskImage = mask;
        }}''')
        page.wait_for_timeout(500)
        shot = f'scratch/mask_dist_{dist}.png'
        page.screenshot(path=shot)
        print(f'Saved {shot}')

    browser.close()
