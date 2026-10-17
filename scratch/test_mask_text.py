from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)

    page.evaluate('''() => {
        const textWrapper = document.querySelector('#hero [aria-hidden="true"]');
        if (textWrapper) {
            textWrapper.style.maskImage = 'linear-gradient(to right, black 0%, black 41%, transparent 45%, transparent 55%, black 59%, black 100%)';
            textWrapper.style.webkitMaskImage = 'linear-gradient(to right, black 0%, black 41%, transparent 45%, transparent 55%, black 59%, black 100%)';
        }
    }''')
    page.wait_for_timeout(1000)
    page.screenshot(path='scratch/test_masked_text.png')
    browser.close()

print('Saved scratch/test_masked_text.png')
