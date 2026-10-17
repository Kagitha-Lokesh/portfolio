from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3007", wait_until="networkidle")
    
    # Inject canvas renderer over the hero video
    res = page.evaluate("""() => {
        const v = document.querySelector('video');
        if (!v) return false;
        
        // Hide the video element's visual rendering
        v.style.opacity = '0';
        v.style.pointerEvents = 'none';
        
        // Create canvas inside parent
        const parent = v.parentElement;
        const canvas = document.createElement('canvas');
        canvas.id = 'hero-canvas-render';
        canvas.width = 768;
        canvas.height = 960;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'contain';
        canvas.style.mixBlendMode = 'multiply';
        canvas.style.pointerEvents = 'none';
        
        parent.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        
        // Draw poster first
        const img = new Image();
        img.src = '/portrait-bust.webp';
        
        function render() {
            if (v.readyState >= 2) {
                ctx.drawImage(v, 0, 0, 768, 960);
            }
            requestAnimationFrame(render);
        }
        render();
        return true;
    }""")
    
    page.wait_for_timeout(1000)
    page.screenshot(path="scratch/canvas_hero_result.png")
    browser.close()

img = Image.open("scratch/canvas_hero_result.png")
arr = np.array(img)
print("Page background at (50, 50):", arr[50, 50, :3])
print("Canvas corner at (550, 200):", arr[200, 550, :3])
print("Canvas corner at (500, 300):", arr[300, 500, :3])
