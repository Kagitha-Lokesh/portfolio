import subprocess
import cv2
import numpy as np

# Let's test re-encoding a test video with rimax=0.94
test_vid = "scratch/test_vid_pipeline.mp4"
v_filter = (
    "crop=864:1080:430:0,"
    "scale=768:960,"
    "colorlevels=rimax=0.94:gimax=0.94:bimax=0.94"
)
cmd = f'ffmpeg -y -i intro.mp4 -vf "{v_filter}" -c:v libx264 -crf 20 -preset fast -an {test_vid}'
subprocess.run(cmd, shell=True, capture_output=True)

cap = cv2.VideoCapture(test_vid)
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"Total frames in test video: {frame_count}")

# Check all frames with ray-scan
threshold = 244
shirt_cut_count = 0
unblended_bg_count = 0

for i in range(frame_count):
    ret, frame = cap.read()
    if not ret: break
    h, w, _ = frame.shape
    
    # Check background outside person (x < 240, x > 630)
    bg_left = frame[:, :240]
    bg_right = frame[:, 630:]
    min_bg = min(np.min(bg_left), np.min(bg_right))
    if min_bg < 254:
        unblended_bg_count += 1
        
    # Check shirt center (y: 260..440, x: 350..430)
    shirt_center = frame[260:440, 350:430]
    # In shirt center, how many pixels are >= threshold?
    shirt_over_thresh = np.sum(shirt_center >= threshold)
    if shirt_over_thresh > 0:
        shirt_cut_count += 1

print(f"Frames with unblended background (< 254): {unblended_bg_count} / {frame_count}")
print(f"Frames where shirt exceeds threshold {threshold}: {shirt_cut_count} / {frame_count}")
cap.release()
