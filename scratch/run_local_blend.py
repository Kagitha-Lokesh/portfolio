import os
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np

video_path = os.path.abspath("public/hero/hero.mp4").replace("\\", "/")

html = f"""
<!DOCTYPE html>
<html>
<head>
<style>
  body {{
    background-color: #f4f2ee;
    margin: 0;
    padding: 30px;
  }}
  .box {{
    display: flex;
    gap: 40px;
  }}
  .video-wrap {{
    width: 300px;
    height: 375px;
    background: transparent;
  }}
  video {{
    width: 100%;
    height: 100%;
    object-fit: contain;
    mix-blend-mode: multiply;
  }}
  canvas {{
    width: 300px;
    height: 375px;
    object-fit: contain;
    mix-blend-mode: multiply;
  }}
</style>
</head>
<body>
  <div class="box">
    <div class="video-wrap">
      <h3>Video mix-blend-mode</h3>
      <video id="vid" src="file:///{video_path}" autoplay muted loop playsinline></video>
    </div>
    <div class="video-wrap">
      <h3>Canvas mix-blend-mode</h3>
      <canvas id="cv" width="768" height="960"></canvas>
    </div>
  </div>
  <script>
    const v = document.getElementById('vid');
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');
    function render() {{
      if (v.readyState >= 2) {{
        ctx.drawImage(v, 0, 0, 768, 960);
      }}
      requestAnimationFrame(render);
    }}
    v.addEventListener('play', () => render());
    render();
  </script>
</body>
</html>
"""

html_path = os.path.abspath("scratch/blend_test_direct.html")
with open(html_path, "w") as f:
    f.write(html)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 800, "height": 500})
    page.goto(f"file:///{html_path.replace(chr(92), '/')}")
    page.wait_for_timeout(1500)
    page.screenshot(path="scratch/blend_test_direct.png")
    browser.close()

arr = np.array(Image.open("scratch/blend_test_direct.png"))
print("Background at (10, 10):", arr[10, 10, :3])
print("Video corner at (100, 200):", arr[200, 100, :3])
print("Canvas corner at (450, 200):", arr[200, 450, :3])
