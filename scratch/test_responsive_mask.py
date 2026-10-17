from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    viewports = [
        ('desktop_1920', 1920, 1080),
        ('laptop_1440', 1440, 900),
        ('tablet_768', 768, 1024),
        ('mobile_390', 390, 844)
    ]
    
    for name, w, h in viewports:
        page = browser.new_page(viewport={'width': w, 'height': h})
        page.goto('http://localhost:3000', wait_until='networkidle')
        page.wait_for_timeout(500)
        
        page.evaluate('''() => {
            const textWrap = document.querySelector('#hero [aria-hidden="true"]');
            if (textWrap) {
                const mask = 'linear-gradient(to right, black 0%, black calc(50% - min(170px, 20vw)), transparent calc(50% - min(130px, 15vw)), transparent calc(50% + min(130px, 15vw)), black calc(50% + min(170px, 20vw)), black 100%)';
                textWrap.style.maskImage = mask;
                textWrap.style.webkitMaskImage = mask;
            }
        }''')
        page.wait_for_timeout(500)
        page.screenshot(path=f'scratch/responsive_mask_{name}.png')
        print(f'Captured scratch/responsive_mask_{name}.png')
        page.close()
        
    browser.close()
