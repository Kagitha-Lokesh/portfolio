import os
from playwright.sync_api import sync_playwright

html = """
<!DOCTYPE html>
<html>
<head>
<style>
  body {
    background-color: #f4f2ee;
    margin: 0;
    overflow: hidden;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .ghost-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 320px;
    font-weight: 900;
    letter-spacing: -14px;
    -webkit-text-stroke: 1.5px rgba(13, 13, 13, 0.12);
    color: transparent;
    pointer-events: none;
    z-index: 0;
    user-select: none;
    transform: translateY(-5%);
  }
  .container {
    position: relative;
    z-index: 10;
    width: 544px;
    height: 680px;
  }
  canvas {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
</head>
<body>
  <div class="ghost-text">LOKESH</div>
  <div class="container">
    <video id="v" src="http://localhost:3000/hero/hero.mp4" autoplay muted loop playsinline style="position:absolute; opacity:0; pointer-events:none;"></video>
    <canvas id="c" width="768" height="960"></canvas>
  </div>
  <script>
    const v = document.getElementById('v');
    const c = document.getElementById('c');
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const width = 768;
    const height = 960;

    // We will test our edge-guided segmentation & blend here
    function processFrame() {
      if (v.readyState >= 2) {
        ctx.drawImage(v, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const buf = new Uint32Array(data.buffer);

        // Scan from left and right boundaries
        // Threshold for pure background
        const threshold = 248;

        for (let y = 0; y < height; y++) {
          const rowOffset = y * width;
          // From left: stop at person's left edge
          for (let x = 0; x < width; x++) {
            const idx = rowOffset + x;
            const p = buf[idx];
            // If background (R, G, B >= threshold)
            if ((p & 0xff) >= threshold && ((p >> 8) & 0xff) >= threshold && ((p >> 16) & 0xff) >= threshold) {
              buf[idx] = 0; // set alpha 0
            } else {
              // Hit person outline!
              // Don't scan into person!
              break;
            }
          }
          // From right: stop at person's right edge
          for (let x = width - 1; x >= 0; x--) {
            const idx = rowOffset + x;
            const p = buf[idx];
            if ((p & 0xff) >= threshold && ((p >> 8) & 0xff) >= threshold && ((p >> 16) & 0xff) >= threshold) {
              buf[idx] = 0;
            } else {
              break;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
      }
      requestAnimationFrame(processFrame);
    }
    v.addEventListener('play', () => processFrame());
    processFrame();
  </script>
</body>
</html>
"""

html_path = os.path.abspath("scratch/test_idea.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto(f"file:///{html_path.replace(chr(92), '/')}")
    page.wait_for_timeout(3000)
    page.screenshot(path="scratch/test_idea_snap.png")
    browser.close()

print("Screenshot captured: scratch/test_idea_snap.png")
