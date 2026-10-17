import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

width = 1920
height = 1080
paper_color = (244, 242, 238)
bg_img = Image.new("RGB", (width, height), paper_color)

draw = ImageDraw.Draw(bg_img)
try:
    font = ImageFont.truetype("arial.ttf", 320)
except:
    font = ImageFont.load_default()

text = "LOKESH"
bbox = draw.textbbox((0, 0), text, font=font)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
tx = (width - tw) // 2
ty = (height - th) // 2 - 30

stroke_blended = (216, 215, 211)
for dx in [-1, 0, 1]:
    for dy in [-1, 0, 1]:
        if dx != 0 or dy != 0:
            draw.text((tx + dx, ty + dy), text, fill=stroke_blended, font=font)
draw.text((tx, ty), text, fill=paper_color, font=font)

# Now use test_vid_98_full.mp4!
cap = cv2.VideoCapture("scratch/test_vid_98_full.mp4")
ret, frame = cap.read() # frame 0
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

person_rgb = cv2.cvtColor(buf[:, :, :3], cv2.COLOR_BGR2RGB).astype(float)
paper_f = np.array([244.0, 242.0, 238.0]) / 255.0
person_warm = np.clip(person_rgb * paper_f, 0, 255).astype(np.uint8)

person_rgba = np.zeros((h, w, 4), dtype=np.uint8)
person_rgba[:, :, :3] = person_warm
person_rgba[:, :, 3] = buf[:, :, 3]

person_pil = Image.fromarray(person_rgba).resize((544, 680), Image.Resampling.LANCZOS)
bg_img.paste(person_pil, (688, 99), mask=person_pil.split()[3])

hero_crop = bg_img.crop((500, 60, 1420, 800))
hero_crop.save("scratch/test_98_composited_crop.png")
print("Saved scratch/test_98_composited_crop.png")
cap.release()
