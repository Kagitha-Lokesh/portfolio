from playwright.sync_api import sync_playwright
from PIL import Image

# Let's test in a standalone HTML file that has:
# 1. Background #f4f2ee
# 2. Ghost text "LOKESH" (full text, no mask!)
# 3. Canvas running the ray-scan on our NEW hero.mp4
import os

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
    overflow: hidden;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }}
  .ghost-text {{
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 260px;
    font-weight: 900;
    font-family: sans-serif;
    letter-spacing: -8px;
    -webkit-text-stroke: 1.5px rgba(13, 13, 13, 0.12);
    color: transparent;
    pointer-events: none;
    z-index: 0;
    user-select: none;
    transform: translateY(-5%);
  }}
  .container {{
    position: relative;
    z-index: 10;
    width: 544px;
    height: 680px;
    display: flex;
    align-items: center;
    justify-content: center;
  }}
  canvas {{
    width: 100%;
    height: 100%;
    object-fit: contain;
    mix-blend-mode: multiply;
  }}
</style>
</head>
<body>
  <div class="ghost-text">LOKESH</div>
  <div class="container">
    <video id="v" src="file:///{vid_path}" autoplay muted loop playsinline style="position:absolute; opacity:0; pointer-events:none;"></video>
    <canvas id="c" width="768" height="960"></canvas>
  </div>
  <script>
    const v = document.getElementById('v');
    const c = document.getElementById('c');
    const ctx = c.getContext('2d', {{ willReadFrequently: true }});
    const width = 768;
    const height = 960;
    const threshold = 246;

    function processFrame() {{
      if (v.readyState >= 2) {{
        ctx.drawImage(v, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const buf = new Uint32Array(imgData.data.buffer);

        // Horizontal scan
        for (let y = 0; y < height; y++) {{
          const rowOffset = y * width;
          for (let x = 0; x < width; x++) {{
            const idx = rowOffset + x;
            const p = buf[idx];
            if ((p & 0xff) >= threshold && ((p >> 8) & 0xff) >= threshold && ((p >> 16) & 0xff) >= threshold) {{
              buf[idx] = 0;
            }} else {{
              break;
            }}
          }}
          for (let x = width - 1; x >= 0; x--) {{
            const idx = rowOffset + x;
            const p = buf[idx];
            if ((p & 0xff) >= threshold && ((p >> 8) & 0xff) >= threshold && ((p >> 16) & 0xff) >= threshold) {{
              buf[idx] = 0;
            }} else {{
              break;
            }}
          }}
        }}

        // Vertical scan
        for (let x = 0; x < width; x++) {{
          for (let y = 0; y < height; y++) {{
            const idx = y * width + x;
            const p = buf[idx];
            if (p === 0 || ((p & 0xff) >= threshold && ((p >> 8) & 0xff) >= threshold && ((p >> 16) & 0xff) >= threshold)) {{
              buf[idx] = 0;
            }} else {{
              break;
            }}
          }}
          for (let y = height - 1; y >= 0; y--) {{
            const idx = y * width + x;
            const p = buf[idx];
            if (p === 0 || ((p & 0xff) >= threshold && ((p >> 8) & 0xff) >= threshold && ((p >> 16) & 0xff) >= threshold)) {{
              buf[idx] = 0;
            }} else {{
              break;
            }}
          }}
        }}

        ctx.putImageData(imgData, 0, 0);
      }}
      requestAnimationFrame(processFrame);
    }}
    v.addEventListener('play', () => processFrame());
    processFrame();
  </script>
</body>
</html>
"""

html_path = os.path.abspath("scratch/test_live_perfect.html")
with open(html_path, "w") as f:
    f.write(html)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto(f"file:///{html_path.replace(chr(92), '/')}")
    page.wait_for_timeout(2500)
    page.screenshot(path="scratch/test_live_perfect_snap.png")
    browser.close()

print("Screenshot captured: scratch/test_live_perfect_snap.png")
