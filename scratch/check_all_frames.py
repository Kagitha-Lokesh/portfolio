import cv2
import numpy as np

cap = cv2.VideoCapture("intro.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

print(f"Total frames: {total_frames}, FPS: {fps}")

# We will sample background at 4 corner points far from Lokesh
# in crop region: crop=864:1080:430:0
# Top-left corner: (Y=50..100, X=450..500 in full frame)
# Top-right corner: (Y=50..100, X=1200..1250 in full frame)
# Mid-left corner: (Y=500..550, X=450..500)
# Mid-right corner: (Y=500..550, X=1200..1250)

min_val = 255
frame_idx = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    # Sample corners in full frame
    c1 = frame[50:100, 450:500]
    c2 = frame[50:100, 1200:1250]
    c3 = frame[500:550, 450:500]
    c4 = frame[500:550, 1200:1250]
    
    local_min = min(np.min(c1), np.min(c2), np.min(c3), np.min(c4))
    if local_min < min_val:
        min_val = local_min
    
    frame_idx += 1

cap.release()
print(f"Lowest background pixel across all {total_frames} frames in corners: {min_val}")
print(f"Required rimax to map {min_val} to 255: {min_val / 255.0:.4f}")
