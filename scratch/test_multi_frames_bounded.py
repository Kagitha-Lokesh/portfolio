import cv2
import numpy as np

cap = cv2.VideoCapture("public/hero/hero.mp4")

for f_idx in [20, 50, 80, 120, 160, 200]:
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, frame = cap.read()
    if not ret: continue
    
    h, w, _ = frame.shape
    buf = np.zeros((h, w, 4), dtype=np.uint8)
    buf[:, :, :3] = frame
    buf[:, :, 3] = 255
    threshold = 246
    
    # 1. Horizontal scan
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

    # 2. Vertical scan from top
    for x in range(w):
        maxY = 230 if (310 <= x <= 600) else h
        for y in range(maxY):
            p = buf[y, x]
            if p[3] == 0 or (p[0] >= threshold and p[1] >= threshold and p[2] >= threshold):
                buf[y, x, 3] = 0
            else:
                break

    # 3. Vertical scan from bottom
    for x in range(w):
        minY = 910 if (310 <= x <= 600) else 0
        for y in range(h - 1, minY - 1, -1):
            p = buf[y, x]
            if p[3] == 0 or (p[0] >= threshold and p[1] >= threshold and p[2] >= threshold):
                buf[y, x, 3] = 0
            else:
                break

    paper = np.array([238, 242, 244], dtype=float)
    result = np.full((h, w, 3), paper, dtype=float)
    alpha = buf[:, :, 3] / 255.0
    for c in range(3):
        mult = (buf[:, :, c].astype(float) * paper[c]) / 255.0
        result[:, :, c] = mult * alpha + paper[c] * (1.0 - alpha)

    result = np.clip(result, 0, 255).astype(np.uint8)
    cv2.imwrite(f"scratch/test_scan_perfect_f{f_idx}.png", result)

print("Saved test scans for frames 20, 50, 80, 120, 160, 200.")
cap.release()
