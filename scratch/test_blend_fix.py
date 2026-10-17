import os
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np

html_code = """
<!DOCTYPE html>
<html>
<head>
<style>
  body {
    background-color: #f4f2ee;
    margin: 0;
    padding: 40px;
    font-family: sans-serif;
  }
  .grid {
    display: flex;
    gap: 30px;
  }
  .card {
    background: #f4f2ee;
    border: 1px solid #ccc;
    padding: 10px;
  }
  /* Test 1: Plain video with mix-blend-mode */
  .v1 {
    width: 200px;
    height: 250px;
    mix-blend-mode: multiply;
  }
  /* Test 2: Video in container with mix-blend-mode */
  .c2 {
    width: 200px;
    height: 250px;
    mix-blend-mode: multiply;
  }
  .c2 video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  /* Test 3: Canvas with drawImage and mix-blend-mode */
  .c3 canvas {
    width: 200px;
    height: 250px;
    object-fit: contain;
    mix-blend-mode: multiply;
  }
</style>
</head>
<body>
  <div class="grid">
    <div class="card">
      <h3>1. Video tag</h3>
      <video class="v1" src="/hero/hero.mp4" autoplay muted loop playsinline></video>
    </div>
    <div class="card">
      <h3>2. Container multiply</h3>
      <div class="c2">
        <video src="/hero/hero.mp4" autoplay muted loop playsinline></video>
      </div>
    </div>
    <div class="card">
      <h3>3. Canvas multiply</h3>
      <div class="c3">
        <canvas id="cv" width="768" height="960"></canvas>
      </div>
    </div>
  </div>
  <script>
    const v = document.querySelector('.v1');
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');
    function draw() {
      if (v.readyState >= 2) {
        ctx.drawImage(v, 0, 0, 768, 960);
      }
      requestAnimationFrame(draw);
    }
    draw();
  </script>
</body>
</html>
"""

os.makedirs("public/test", exist_ok=True)
with open("public/test/blend.html", "w") as f:
    f.write(html_code)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1200, "height": 600})
    page.goto("http://localhost:3006/test/blend.html", wait_until="networkidle")
    page.wait_for_timeout(1500)
    page.screenshot(path="scratch/blend_comparison.png")
    browser.close()

img = Image.open("scratch/blend_comparison.png")
arr = np.array(img)
# Body background color
print("Body bg:", arr[10, 10, :3])

# Sample pixel in Test 1 corner (x ~ 80, y ~ 150)
print("Test 1 video corner:", arr[150, 80, :3])

# Sample pixel in Test 2 corner (x ~ 320, y ~ 150)
print("Test 2 container corner:", arr[150, 320, :3])

# Sample pixel in Test 3 canvas corner (x ~ 560, y ~ 150)
print("Test 3 canvas corner:", arr[150, 560, :3])
