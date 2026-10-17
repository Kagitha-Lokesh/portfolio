from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(2000)
    
    # Remove mix-blend-mode from canvas
    page.eval_on_selector('canvas', 'c => c.style.mixBlendMode = "normal"')
    page.wait_for_timeout(1000)
    page.screenshot(path='scratch/test_normal_blend.png')
    browser.close()

print('Saved scratch/test_normal_blend.png')
