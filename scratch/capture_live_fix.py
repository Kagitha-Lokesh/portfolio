from playwright.sync_api import sync_playwright
from PIL import Image

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(3000)
    page.screenshot(path='scratch/live_test_after_fix.png')
    
    # Also crop hero
    img = Image.open('scratch/live_test_after_fix.png')
    hero_crop = img.crop((500, 60, 1420, 800))
    hero_crop.save('scratch/hero_after_fix_crop.png')
    browser.close()

print('Saved scratch/live_test_after_fix.png and scratch/hero_after_fix_crop.png')
