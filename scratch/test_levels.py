import subprocess
import cv2
import numpy as np

for rimax in [0.95, 0.90, 0.88, 0.86, 0.84, 0.82]:
    cmd = f'ffmpeg -y -i scratch/intro_crop_raw.png -vf "colorlevels=rimax={rimax}:gimax={rimax}:bimax={rimax}" scratch/test_level_{rimax}.png'
    subprocess.run(cmd, shell=True, capture_output=True)
    img = cv2.imread(f'scratch/test_level_{rimax}.png')
    
    # Sample background:
    bg_sample = img[0:150, 0:200]
    bg_min = np.min(bg_sample)
    bg_mean = np.mean(bg_sample)
    
    # Check shirt sample (inside person)
    shirt_sample = img[400:430, 390:420]
    shirt_mean = np.mean(shirt_sample)
    
    # Check what background sample looks like when multiplied with #f4f2ee (244, 242, 238)
    paper = np.array([238, 242, 244]) # BGR for #f4f2ee
    multiplied_bg = (bg_sample.astype(float) / 255.0) * paper
    diff_from_paper = np.max(np.abs(multiplied_bg - paper))
    
    print(f'rimax={rimax}: bg_min={bg_min}, bg_mean={bg_mean:.2f}, shirt_mean={shirt_mean:.2f}, max_diff_from_paper={diff_from_paper:.2f}')
