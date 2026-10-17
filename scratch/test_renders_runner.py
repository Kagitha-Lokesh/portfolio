import os
import subprocess
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np

# 1. Render test clip with rimax=0.86
crop_filter = (
    "crop=800:1000:504:0,scale=768:960,"
    "colorlevels=rimax=0.86:gimax=0.86:bimax=0.86"
)
test_vid_mp4 = os.path.abspath("scratch/test_vid_86.mp4").replace("\\", "/")
cmd_mp4 = f'ffmpeg -y -t 2 -i intro.mp4 -vf "{crop_filter}" -c:v libx264 -crf 20 -preset fast -pix_fmt yuv420p "{test_vid_mp4}"'
subprocess.run(cmd_mp4, shell=True, capture_output=True)

# Also test yuvj420p (full range YUV 0-255)
test_vid_full = os.path.abspath("scratch/test_vid_full.mp4").replace("\\", "/")
cmd_full = f'ffmpeg -y -t 2 -i intro.mp4 -vf "{crop_filter}" -c:v libx264 -crf 20 -preset fast -pix_fmt yuvj420p "{test_vid_full}"'
subprocess.run(cmd_full, shell=True, capture_output=True)

# Also test canvas drawing
html = f"""
<!DOCTYPE html>
<html>
<head>
<style>
  body {{
    background-color: #f4f2ee;
    margin: 0;
    padding: 40px;
  }}
  .row {{
    display: flex;
    gap: 30px;
  }}
  .box {{
    width: 250px;
    height: 312px;
  }}
  video, canvas {{
    width: 100%;
    height: 100%;
    object-fit: contain;
    mix-blend-mode: multiply;
  }}
</style>
</head>
<body>
  <div class="row">
    <div class="box">
      <h4>Video Limited (yuv420p)</h4>
      <video id="v1" src="file:///{test_vid_mp4}" autoplay muted loop playsinline></video>
    </div>
    <div class="box">
      <h4>Video Full (yuvj420p)</h4>
      <video id="v2" src="file:///{test_vid_full}" autoplay muted loop playsinline></video>
    </div>
    <div class="box">
      <h4>Canvas Multiply</h4>
      <canvas id="cv" width="768" height="960"></canvas>
    </div>
  </div>
  <script>
    const v = document.getElementById('v1');
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');
    function draw() {{
      if (v.readyState >= 2) {{
        ctx.drawImage(v, 0, 0, 768, 960);
      }}
      requestAnimationFrame(draw);
    }}
    draw();
  </script>
</body>
</html>
"""

html_path = os.path.abspath("scratch/test_renders.html")
with open(html_path, "w") as f:
    f.write(html)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1000, "height": 600})
    page.goto(f"file:///{html_path.replace(chr(92), '/')}")
    page.wait_for_timeout(2000)
    page.screenshot(path="scratch/test_renders_snap.png")
    browser.close()

img = Image.open("scratch/test_renders_snap.png")
arr = np.array(img)
print("Page background [10, 10]:", arr[10, 10, :3])

# Check box 1 (Video yuv420p) background area at (x=100, y=150)
print("Box 1 (Video Limited) at (100, 150):", arr[150, 100, :3])

# Check box 2 (Video yuvj420p) background area at (x=380, y=150)
print("Box 2 (Video Full) at (380, 150):", arr[150, 380, :3])

# Check box 3 (Canvas Multiply) background area at (x=660, y=150)
print("Box 3 (Canvas Multiply) at (660, 150):", arr[150, 660, :3])
