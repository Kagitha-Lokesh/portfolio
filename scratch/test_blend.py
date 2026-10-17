import os
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3005", wait_until="networkidle")
    
    # Test 1: what is current color inside the video box?
    page.screenshot(path="scratch/current_view.png")
    
    # Test 2: Add canvas drawing video frames with mix-blend-mode: multiply
    blend_test = page.evaluate("""() => {
        const v = document.querySelector('video');
        if (!v) return null;
        
        // Let's create a canvas right over the video
        const canvas = document.createElement('canvas');
        canvas.id = 'hero-canvas';
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
        
        const ctx = canvas.getContext('2d');
        v.style.opacity = '0';
        v.style.position = 'absolute';
        v.parentElement.appendChild(canvas);
        
        function render() {
            ctx.drawImage(v, 0, 0, 768, 960);
            requestAnimationFrame(render);
        }
        render();
        return true;
    }""")
    page.wait_for_timeout(1000)
    page.screenshot(path="scratch/after_canvas.png")
    browser.close()

arr_curr = np.array(Image.open("scratch/current_view.png"))
print("Current view corner:", arr_curr[250, 500, :3])
arr_after = np.array(Image.open("scratch/after_canvas.png"))
print("After canvas corner:", arr_after[250, 500, :3])
