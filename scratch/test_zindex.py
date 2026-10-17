from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)

    # Let's inspect all elements inside hero that have z-index or create stacking context
    fix_res = page.evaluate('''() => {
        // Find all elements with z-index inside hero
        const hero = document.getElementById('hero');
        const all = hero.querySelectorAll('*');
        const modified = [];
        
        all.forEach(el => {
            const cs = window.getComputedStyle(el);
            if (cs.zIndex !== 'auto' && el.tagName !== 'BUTTON' && !el.closest('button')) {
                modified.push({ tag: el.tagName, cls: el.className, oldZ: cs.zIndex });
                el.style.zIndex = 'auto';
            }
        });
        
        return modified;
    }''')
    print('Elements with z-index reset:', fix_res)
    
    page.wait_for_timeout(1000)
    page.screenshot(path='scratch/test_no_zindex_hero.png')
    
    arr = np.array(Image.open('scratch/test_no_zindex_hero.png'))
    print('Pixel at (800, 200) inside video:', arr[200, 800, :3])
    print('Pixel at (10, 10) bg:', arr[10, 10, :3])
    
    # Also check if ghost text under video is visible:
    # Ghost text "O" and "K" are around x=750..900, y=300..400
    # Let's check a point on the ghost text stroke behind the video
    browser.close()
