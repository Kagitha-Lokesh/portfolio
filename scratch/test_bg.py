from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.eval_on_selector('canvas', 'c => c.style.display = "none"')
    page.screenshot(path='scratch/bg_without_canvas.png')
    browser.close()

print('Saved scratch/bg_without_canvas.png')
