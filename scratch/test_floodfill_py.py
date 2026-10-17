import cv2
import numpy as np
from collections import deque
from PIL import Image

def test_floodfill(frame, threshold=246):
    h, w, _ = frame.shape
    # RGBA
    buf = np.zeros((h, w, 4), dtype=np.uint8)
    buf[:, :, :3] = frame
    buf[:, :, 3] = 255 # all opaque initially
    
    # Visited / background mask
    is_bg = np.zeros((h, w), dtype=bool)
    
    # Initialize queue with border pixels that are >= threshold
    queue = deque()
    
    # Top and bottom borders
    for x in range(w):
        if np.all(frame[0, x] >= threshold):
            is_bg[0, x] = True
            queue.append((0, x))
        if np.all(frame[h - 1, x] >= threshold):
            is_bg[h - 1, x] = True
            queue.append((h - 1, x))
            
    # Left and right borders
    for y in range(h):
        if np.all(frame[y, 0] >= threshold):
            is_bg[y, 0] = True
            queue.append((y, 0))
        if np.all(frame[y, w - 1] >= threshold):
            is_bg[y, w - 1] = True
            queue.append((y, w - 1))
            
    # BFS
    while queue:
        y, x = queue.popleft()
        buf[y, x, 3] = 0 # set transparent
        
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not is_bg[ny, nx]:
                if np.all(frame[ny, nx] >= threshold):
                    is_bg[ny, nx] = True
                    queue.append((ny, nx))
                    
    return buf

cap = cv2.VideoCapture("public/hero/hero.mp4")

# Test on frame 0 (the frame that had 1718 cut pixels previously!)
ret, frame0 = cap.read()
buf0 = test_floodfill(frame0, threshold=246)

# Check shirt center (y: 260..440, x: 350..430)
shirt0 = buf0[260:440, 350:430, 3]
zeros_in_shirt = np.sum(shirt0 == 0)

# Check background margin (x < 150)
margin0 = buf0[:, :150, 3]
nonzeros_in_margin = np.sum(margin0 > 0)

print(f"Frame 0 Flood-fill results: zeros_in_shirt = {zeros_in_shirt}, nonzeros_in_margin = {nonzeros_in_margin}")

# Save the composited result over #f4f2ee paper
paper = np.array([238, 242, 244]) # BGR for #f4f2ee
comp = np.full_like(frame0, paper)
alpha = (buf0[:, :, 3:] / 255.0)
comp = (buf0[:, :, :3] * alpha + comp * (1 - alpha)).astype(np.uint8)

cv2.imwrite("scratch/floodfill_frame0_comp.png", comp)
print("Saved scratch/floodfill_frame0_comp.png")

# Also test frame 50, 100, 150, 200
for f_idx in [50, 100, 150, 200]:
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, frame = cap.read()
    if not ret: continue
    buf = test_floodfill(frame, threshold=246)
    s = buf[260:440, 350:430, 3]
    m = buf[:, :150, 3]
    print(f"Frame {f_idx:3d}: zeros_in_shirt = {np.sum(s == 0)}, nonzeros_in_margin = {np.sum(m > 0)}")

cap.release()
