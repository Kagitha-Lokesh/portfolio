import cv2
import numpy as np
from PIL import Image

cap = cv2.VideoCapture("public/hero/hero.mp4")
# Take frame at 2.0s
cap.set(cv2.CAP_PROP_POS_MSEC, 2000)
ret, frame = cap.read()
cap.release()

# Frame is 960x768 BGR
# Convert to RGBA
rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
h, w, _ = rgb.shape
rgba = np.dstack([rgb, np.full((h, w), 255, dtype=np.uint8)])

# Ray scan from 4 directions
threshold = 245  # In our new video, background is 255!

# Horizontal scan
for y in range(h):
    # from left
    for x in range(w):
        r, g, b = rgba[y, x, :3]
        if r >= threshold and g >= threshold and b >= threshold:
            rgba[y, x, 3] = 0
        else:
            break
    # from right
    for x in range(w - 1, -1, -1):
        r, g, b = rgba[y, x, :3]
        if r >= threshold and g >= threshold and b >= threshold:
            rgba[y, x, 3] = 0
        else:
            break

# Vertical scan
for x in range(w):
    # from top
    for y in range(h):
        if rgba[y, x, 3] == 0:
            continue
        r, g, b = rgba[y, x, :3]
        if r >= threshold and g >= threshold and b >= threshold:
            rgba[y, x, 3] = 0
        else:
            break
    # from bottom
    for y in range(h - 1, -1, -1):
        if rgba[y, x, 3] == 0:
            continue
        r, g, b = rgba[y, x, :3]
        if r >= threshold and g >= threshold and b >= threshold:
            rgba[y, x, 3] = 0
        else:
            break

# Save RGBA result
img_rgba = Image.fromarray(rgba)
img_rgba.save("scratch/test_rayscan_new_hero.png")

# Now composite over #f4f2ee with ghost text "LOKESH" behind it!
bg = Image.new("RGB", (1200, 1000), "#f4f2ee")
# Draw ghost text "LOKESH"
from PIL import ImageDraw, ImageFont
draw = ImageDraw.Draw(bg)
try:
    font = ImageFont.truetype("src/fonts/InterTight-Variable.woff2", 180)
except:
    font = ImageFont.load_default()

# Draw text stroke
text = "LOKESH"
# Center text at (600, 450)
draw.text((150, 350), text, fill=None, outline=(180, 178, 172), stroke_width=2, font=font)

# Paste our rgba frame in the center
# Target size 544x680
resized_rgba = img_rgba.resize((544, 680), Image.Resampling.BILINEAR)
bg.paste(resized_rgba, (328, 150), resized_rgba)
bg.save("scratch/test_rayscan_composited.png")
print("Saved scratch/test_rayscan_composited.png")
