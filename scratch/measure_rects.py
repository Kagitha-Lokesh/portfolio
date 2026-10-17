from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto('http://localhost:3000', wait_until='networkidle')
    
    # Get bounding rects of ghost text and hero video
    info = page.evaluate('''() => {
        const span = document.querySelector('#hero span.font-black');
        const container = document.querySelector('#hero .relative.flex.items-center.justify-center.select-none');
        return {
            ghostRect: span ? span.getBoundingClientRect() : null,
            containerRect: container ? container.getBoundingClientRect() : null,
        };
    }''')
    print('Ghost rect:', info['ghostRect'])
    print('Container rect:', info['containerRect'])
    browser.close()
