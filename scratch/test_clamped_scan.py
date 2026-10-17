import cv2
import numpy as np
from PIL import Image

cap = cv2.VideoCapture("public/hero/hero.mp4")
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

def test_scan(frame):
    h, w, _ = frame.shape
    # RGBA
    buf = np.zeros((h, w, 4), dtype=np.uint8)
    buf[:, :, :3] = frame
    buf[:, :, 3] = 255
    
    threshold = 236
    
    # 1. Horizontal scan from left and right
    for y in range(h):
        # from left (stop at center)
        for x in range(w // 2):
            p = buf[y, x]
            if p[0] >= threshold and p[1] >= threshold and p[2] >= threshold:
                buf[y, x, 3] = 0
            else:
                break
        # from right (stop at center)
        for x in range(w - 1, w // 2 - 1, -1):
            p = buf[y, x]
            if p[0] >= threshold and p[1] >= threshold and p[2] >= threshold:
                buf[y, x, 3] = 0
            else:
                break
                
    # 2. Vertical scan from top (ONLY for y < 120, above shoulders/head)
    for x in range(w):
        for y in range(min(120, h)):
            p = buf[y, x]
            if p[3] == 0 or (p[0] >= threshold and p[1] >= threshold and p[2] >= threshold):
                buf[y, x, 3] = 0
            else:
                break
                
    # 3. Vertical scan from bottom (ONLY for y > 900, below knees/shadow)
    for x in range(w):
        for y in range(h - 1, max(h - 60, 0), -1):
            p = buf[y, x]
            if p[3] == 0 or (p[0] >= threshold and p[1] >= threshold and p[2] >= threshold):
                buf[y, x, 3] = 0
            else:
                break
                
    return buf

# Check across frames:
all_clean = True
for f_idx in [0, 20, 50, 80, 100, 140, 180, 220]:
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, frame = cap.read()
    if not ret: continue
    buf = test_scan(frame)
    
    # Shirt area: y: 260..450, x: 350..420
    shirt_alpha = buf[260:450, 350:420, 3]
    zeros_in_shirt = np.sum(shirt_alpha == 0)
    
    # Background corners: y: 0..50, x: 0..100
    corner_alpha = buf[0:50, 0:100, 3]
    nonzeros_in_corner = np.sum(corner_alpha > 0)
    
    print(f"Frame {f_idx:3d}: zeros_in_shirt = {zeros_in_shirt}, nonzeros_in_corner = {nonzeros_in_corner}")
    if zeros_in_shirt > 0 or nonzeros_in_corner > 0:
        all_clean = False

print("All frames clean?", all_clean)
cap.release()
