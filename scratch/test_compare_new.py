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
    padding: 40px;
    display: flex;
    gap: 40px;
  }}
  .box {{
    width: 384px;
    height: 480px;
    position: relative;
    background-color: #f4f2ee;
  }}
  .ghost-text {{
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 80px;
    font-weight: 900;
    -webkit-text-stroke: 1.5px rgba(13, 13, 13, 0.2);
    color: transparent;
    pointer-events: none;
    z-index: 1;
  }}
  video, canvas {{
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    object-fit: contain;
    mix-blend-mode: multiply;
  }}
</style>
</head>
<body>
  <div class="box">
    <div class="ghost-text">LOKESH</div>
    <video id="v1" src="file:///{vid_path}" autoplay muted loop playsinline></video>
  </div>
  <div class="box">
    <div class="ghost-text">LOKESH</div>
    <canvas id="cv" width="768" height="960"></canvas>
  </div>
  <script>
    const v1 = document.getElementById('v1');
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');
    function draw() {{
      if (v1.readyState >= 2) {{
        ctx.drawImage(v1, 0, 0, 768, 960);
      }}
      requestAnimationFrame(draw);
    }}
    draw();
  </script>
</body>
</html>
"""

html_path = os.path.abspath("scratch/test_compare_new.html")
with open(html_path, "w") as f:
    f.write(html)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1000, "height": 600})
    page.goto(f"file:///{html_path.replace(chr(92), '/')}")
    page.wait_for_timeout(2000)
    page.screenshot(path="scratch/test_compare_snap.png")
    browser.close()

img = Image.open("scratch/test_compare_snap.png")
arr = np.array(img)
paper = np.array([244, 242, 238])

# Box 1: Video at (x=40..424, y=40..520)
# Check background at top-left corner of video: (x=60, y=60)
print("Box 1 (Video) corner (60, 60):", arr[60, 60, :3], "Expected:", paper)

# Box 2: Canvas at (x=464..848, y=40..520)
# Check background at top-left corner of canvas: (x=484, y=60)
print("Box 2 (Canvas) corner (484, 60):", arr[60, 484, :3], "Expected:", paper)

# Check for any diff in background outside the ghost text and person
# Box 1 outer edge: (x=60, y=100)
print("Box 1 (Video) outer edge (60, 100):", arr[100, 60, :3])
print("Box 2 (Canvas) outer edge (484, 100):", arr[100, 484, :3])
