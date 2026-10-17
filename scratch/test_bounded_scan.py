import cv2
import numpy as np

cap = cv2.VideoCapture("public/hero/hero.mp4")
ret, frame = cap.read() # frame 0

h, w, _ = frame.shape
# RGBA
buf = np.zeros((h, w, 4), dtype=np.uint8)
buf[:, :, :3] = frame
buf[:, :, 3] = 255

threshold = 246

# 1. Horizontal scan
for y in range(h):
    # from left
    for x in range(w):
        p = buf[y, x]
        if p[0] >= threshold and p[1] >= threshold and p[2] >= threshold:
            buf[y, x, 3] = 0
        else:
            break
    # from right
    for x in range(w - 1, -1, -1):
        p = buf[y, x]
        if p[0] >= threshold and p[1] >= threshold and p[2] >= threshold:
            buf[y, x, 3] = 0
        else:
            break

# 2. Vertical scan from top (capped at y=230 in body columns)
for x in range(w):
    maxY = 230 if (310 <= x <= 600) else h
    for y in range(maxY):
        p = buf[y, x]
        if p[3] == 0 or (p[0] >= threshold and p[1] >= threshold and p[2] >= threshold):
            buf[y, x, 3] = 0
        else:
            break

# 3. Vertical scan from bottom (capped at y=910 in body columns)
for x in range(w):
    minY = 910 if (310 <= x <= 600) else 0
    for y in range(h - 1, minY - 1, -1):
        p = buf[y, x]
        if p[3] == 0 or (p[0] >= threshold and p[1] >= threshold and p[2] >= threshold):
            buf[y, x, 3] = 0
        else:
            break

# Composite over #f4f2ee with mix-blend-mode: multiply!
paper = np.array([238, 242, 244], dtype=float) # BGR for #f4f2ee
result = np.full((h, w, 3), paper, dtype=float)

# Where alpha > 0, apply multiply: (canvas * paper) / 255.0
alpha = buf[:, :, 3] / 255.0
for c in range(3):
    mult = (buf[:, :, c].astype(float) * paper[c]) / 255.0
    result[:, :, c] = mult * alpha + paper[c] * (1.0 - alpha)

result = np.clip(result, 0, 255).astype(np.uint8)
cv2.imwrite("scratch/test_scan_perfect_f0.png", result)
print("Saved scratch/test_scan_perfect_f0.png")

# Also crop his chest (y: 200..450, x: 300..500)
chest = result[200:450, 300:500]
cv2.imwrite("scratch/test_scan_perfect_f0_chest.png", chest)
print("Saved scratch/test_scan_perfect_f0_chest.png")
cap.release()
