import subprocess
import cv2
import numpy as np

v_filter = "crop=864:1080:430:0,scale=768:960,colorlevels=rimax=0.98:gimax=0.98:bimax=0.98"
cmd = f'ffmpeg -y -i intro.mp4 -vf "{v_filter}" -vframes 1 scratch/test_rimax_98.png'
subprocess.run(cmd, shell=True, capture_output=True)

img = cv2.imread("scratch/test_rimax_98.png")
for y in range(210, 270, 10):
    row = img[y]
    lows = np.where(np.any(row < 248, axis=1))[0]
    if len(lows) > 0:
        print(f"rimax=0.98, y={y}: min_x={lows[0]}, max_x={lows[-1]}, width={lows[-1]-lows[0]+1}")
