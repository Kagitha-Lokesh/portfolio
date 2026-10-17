from playwright.sync_api import sync_playwright

viewports = [
    ("desktop_1920", 1920, 1080),
    ("laptop_1440", 1440, 900),
    ("tablet_768", 768, 1024),
    ("mobile_390", 390, 844)
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    for name, w, h in viewports:
        page = browser.new_page(viewport={"width": w, "height": h})
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.wait_for_timeout(500)
        
        page.evaluate("""() => {
            const contentContainer = document.querySelector('.content-container.relative.z-10');
            if (contentContainer) {
                contentContainer.classList.remove('z-10');
            }

            const canvas = document.querySelector('#hero canvas');
            if (canvas) canvas.style.display = 'none';

            const video = document.querySelector('#hero video');
            if (video) {
                video.className = 'w-full h-full object-contain select-none pointer-events-none';
                video.style.opacity = '1';
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.position = 'relative';
                video.style.mixBlendMode = 'multiply';
            }

            const textWrap = document.querySelector('#hero [aria-hidden="true"]');
            if (textWrap) {
                const mask = 'linear-gradient(to right, black 0%, black calc(50% - min(75px, 12vw)), transparent calc(50% - min(55px, 9vw)), transparent calc(50% + min(115px, 16vw)), black calc(50% + min(130px, 18vw)), black 100%)';
                textWrap.style.maskImage = mask;
                textWrap.style.webkitMaskImage = mask;
            }
        }""")
        
        page.wait_for_timeout(500)
        shot_path = f"scratch/test_refined_mask_{name}.png"
        page.screenshot(path=shot_path)
        print(f"Saved {shot_path}")
        page.close()
        
    browser.close()
