import cv2
import numpy as np

cap = cv2.VideoCapture("public/hero/hero.mp4")
ret, frame = cap.read() # frame 0

threshold = 246
# Scan row 250 from left with threshold=246
breached = False
for x in range(frame.shape[1] // 2):
    p = frame[250, x]
    if p[0] >= threshold and p[1] >= threshold and p[2] >= threshold:
        pass
    else:
        print(f"Stopped at x={x}! pixel={p}")
        break

# Test across all rows y in 200..500
max_x_reached = 0
for y in range(200, 500):
    for x in range(frame.shape[1] // 2):
        p = frame[y, x]
        if p[0] >= threshold and p[1] >= threshold and p[2] >= threshold:
            pass
        else:
            max_x_reached = max(max_x_reached, x)
            break

print(f"Deepest x reached from left across all torso rows with threshold={threshold}: x={max_x_reached}")
cap.release()
