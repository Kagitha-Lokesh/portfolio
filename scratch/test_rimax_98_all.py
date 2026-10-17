import subprocess
import cv2
import numpy as np

# Rebuild test video with rimax=0.98
v_filter = (
    "crop=864:1080:430:0,"
    "scale=768:960,"
    "colorlevels=rimax=0.98:gimax=0.98:bimax=0.98"
)
test_vid = "scratch/test_vid_98_full.mp4"
cmd = f'ffmpeg -y -i intro.mp4 -vf "{v_filter}" -c:v libx264 -crf 20 -preset fast -an {test_vid}'
subprocess.run(cmd, shell=True, capture_output=True)

cap = cv2.VideoCapture(test_vid)
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"Total frames: {frame_count}")

# Check horizontal scan on all frames with threshold=248
threshold = 248
breach_count = 0

for f_idx in range(frame_count):
    ret, frame = cap.read()
    if not ret: break
    h, w, _ = frame.shape
    
    # Horizontal scan
    # Let's see if left scan ever goes past x=340 into shirt center
    for y in range(200, 500): # torso rows
        # from left
        for x in range(w // 2):
            if np.all(frame[y, x] >= threshold):
                if x >= 350: # breached into shirt center!
                    breach_count += 1
                    break
            else:
                break

print(f"Total breaches into shirt center across all {frame_count} frames: {breach_count}")
cap.release()
