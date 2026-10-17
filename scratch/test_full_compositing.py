import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# 1. Create 1920x1080 background with #f4f2ee
width = 1920
height = 1080
paper_color = (244, 242, 238) # RGB
bg_img = Image.new("RGB", (width, height), paper_color)

# 2. Draw ghost text "LOKESH"
draw = ImageDraw.Draw(bg_img)
try:
    font = ImageFont.truetype("arial.ttf", 320)
except:
    font = ImageFont.load_default()

# Ghost text position: centered at x=960, y=540 (with translateY -5% -> y=510)
# We want stroke only:
text = "LOKESH"
# Get text bbox
bbox = draw.textbbox((0, 0), text, font=font)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
tx = (width - tw) // 2
ty = (height - th) // 2 - 30 # slight translate -5%

# Draw stroke
stroke_color = (13, 13, 13)
# To simulate 1.5px stroke with 0.12 opacity over #f4f2ee:
# Blend 0.12 of (13, 13, 13) with #f4f2ee:
# 244 * 0.88 + 13 * 0.12 = 216
stroke_blended = (216, 215, 211)

# Outline stroke
for dx in [-1, 0, 1]:
    for dy in [-1, 0, 1]:
        if dx != 0 or dy != 0:
            draw.text((tx + dx, ty + dy), text, fill=stroke_blended, font=font)
# Inside of text is paper color:
draw.text((tx, ty), text, fill=paper_color, font=font)

# 3. Process video frame 0 through bounded ray-scan
cap = cv2.VideoCapture("public/hero/hero.mp4")
ret, frame = cap.read() # BGR 960x768
h, w, _ = frame.shape

buf = np.zeros((h, w, 4), dtype=np.uint8)
buf[:, :, :3] = frame
buf[:, :, 3] = 255
threshold = 246

# Horizontal scan
for y in range(h):
    for x in range(w):
        p = buf[y, x]
        if p[0] >= threshold and p[1] >= threshold and p[2] >= threshold:
            buf[y, x, 3] = 0
        else:
            break
    for x in range(w - 1, -1, -1):
        p = buf[y, x]
        if p[0] >= threshold and p[1] >= threshold and p[2] >= threshold:
            buf[y, x, 3] = 0
        else:
            break

# Vertical scan from top
for x in range(w):
    maxY = 230 if (310 <= x <= 600) else h
    for y in range(maxY):
        p = buf[y, x]
        if p[3] == 0 or (p[0] >= threshold and p[1] >= threshold and p[2] >= threshold):
            buf[y, x, 3] = 0
        else:
            break

# Vertical scan from bottom
for x in range(w):
    minY = 910 if (310 <= x <= 600) else 0
    for y in range(h - 1, minY - 1, -1):
        p = buf[y, x]
        if p[3] == 0 or (p[0] >= threshold and p[1] >= threshold and p[2] >= threshold):
            buf[y, x, 3] = 0
        else:
            break

# Color-grade person slightly with paper tone so white shirt matches paper
# BGR to RGB
person_rgb = cv2.cvtColor(buf[:, :, :3], cv2.COLOR_BGR2RGB).astype(float)
paper_f = np.array([244.0, 242.0, 238.0]) / 255.0
person_warm = np.clip(person_rgb * paper_f, 0, 255).astype(np.uint8)

person_rgba = np.zeros((h, w, 4), dtype=np.uint8)
person_rgba[:, :, :3] = person_warm
person_rgba[:, :, 3] = buf[:, :, 3]

# Resize person canvas to screen size: 544x680
person_pil = Image.fromarray(person_rgba).resize((544, 680), Image.Resampling.LANCZOS)

# Paste person on top of ghost text at (x=688, y=99)
bg_img.paste(person_pil, (688, 99), mask=person_pil.split()[3])

# Save full hero test
bg_img.save("scratch/test_hero_composited_full.png")

# Also crop hero region (500, 60, 1420, 800) to compare with perfect_blend_crop.png
hero_crop = bg_img.crop((500, 60, 1420, 800))
hero_crop.save("scratch/test_hero_composited_crop.png")
print("Saved scratch/test_hero_composited_crop.png successfully!")
cap.release()
