import os
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np

vid_path = os.path.abspath("public/hero/hero.mp4").replace("\\", "/")

html = f"""
<!DOCTYPE html>
<html>
<head>
<style>
  body {{
    background-color: #f4f2ee;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }}
  .wrap {{
    width: 384px;
    height: 480px;
    position: relative;
    background: transparent;
  }}
  canvas {{
    width: 100%;
    height: 100%;
    object-fit: contain;
  }}
</style>
</head>
<body>
  <div class="wrap">
    <video id="v" src="file:///{vid_path}" autoplay muted loop playsinline style="position:absolute; opacity:0; pointer-events:none;"></video>
    <canvas id="c" width="768" height="960"></canvas>
  </div>
  <script>
    const v = document.getElementById('v');
    const c = document.getElementById('c');
    const ctx = c.getContext('2d', {{ willReadFrequently: true }});
    
    function draw() {{
      if (v.readyState >= 2) {{
        ctx.drawImage(v, 0, 0, 768, 960);
        const imgData = ctx.getImageData(0, 0, 768, 960);
        const data = imgData.data;
        const len = data.length;
        
        for (let i = 0; i < len; i += 4) {{
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const minVal = Math.min(r, g, b);
          
          if (minVal >= 246) {{
            data[i + 3] = 0;
          }} else if (minVal >= 232) {{
            // Smooth feathering
            const factor = (246 - minVal) / 14;
            data[i + 3] = Math.round(data[i + 3] * factor);
          }}
        }}
        ctx.putImageData(imgData, 0, 0);
      }}
      requestAnimationFrame(draw);
    }}
    v.addEventListener('play', () => draw());
    draw();
  </script>
</body>
</html>
"""

test_path = os.path.abspath("scratch/test_luma.html")
with open(test_path, "w") as f:
    f.write(html)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 800, "height": 600})
    page.goto(f"file:///{test_path.replace(chr(92), '/')}")
    page.wait_for_timeout(1500)
    page.screenshot(path="scratch/luma_result.png")
    browser.close()

arr = np.array(Image.open("scratch/luma_result.png"))
print("Background at (10, 10):", arr[10, 10, :3])
print("Inside canvas top corner at (x=250, y=200):", arr[200, 250, :3])
print("Inside canvas right corner at (x=500, y=200):", arr[200, 500, :3])
